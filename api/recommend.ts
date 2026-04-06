import { GoogleGenerativeAI } from '@google/generative-ai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const DESIGN_RECOMMENDATION_PROMPT = `You are an interior designer. Given the space analysis, user dimensions, and preferences, suggest a cohesive design.

Rules:
- Every item MUST fit within the provided dimensions (leave 2-3cm clearance)
- Respect constraints (don't block radiators, windows, doors)
- Stay within budget
- Suggest specific, searchable product types (not vague descriptions)
- Include wall color if relevant
- The search_query should be optimized for finding products on Amazon.de or German furniture stores
- Include realistic EUR price ranges for each item
- Include position_hint as x,y percentages (0-100) indicating where the item would be placed in the photo

Return ONLY valid JSON with this exact structure (no markdown, no extra text, no code blocks):
{
  "concept": "A cozy reading corner with warm tones...",
  "items": [
    {
      "type": "bookshelf",
      "search_query": "narrow bookshelf 40cm wide white",
      "max_width_cm": 40,
      "max_depth_cm": 30,
      "max_height_cm": 180,
      "color": "white or light oak",
      "placement": "Against left wall, flush with corner",
      "priority": "essential",
      "price_range_eur": { "min": 45, "max": 89 },
      "position_hint": { "x": 20, "y": 50 }
    }
  ],
  "wall_color": {
    "name": "Warm Linen",
    "hex": "#F5E6D3",
    "note": "Pairs well with the oak furniture"
  },
  "styling_tip": "Add a small plant on the top shelf..."
}`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is not configured' });
    }

    const { photo, spaceAnalysis, measurements, preferences } = req.body;

    if (!photo) {
      return res.status(400).json({ error: 'Missing required field: photo' });
    }
    if (!spaceAnalysis) {
      return res.status(400).json({ error: 'Missing required field: spaceAnalysis' });
    }
    if (!measurements) {
      return res.status(400).json({ error: 'Missing required field: measurements' });
    }
    if (!preferences) {
      return res.status(400).json({ error: 'Missing required field: preferences' });
    }

    // Extract base64 data and media type
    const base64Data = photo.replace(/^data:image\/\w+;base64,/, '');
    const mediaTypeMatch = photo.match(/^data:(image\/\w+);base64,/);
    const mimeType = mediaTypeMatch?.[1] || 'image/jpeg';

    // Build context
    const measurementsText = measurements
      .filter((m: { value: number | null }) => m.value !== null)
      .map((m: { label: string; value: number }) => `${m.label}: ${m.value}cm`)
      .join('\n');

    const budgetMap: Record<string, string> = {
      under_50: 'Under €50',
      '50_150': '€50-150',
      '150_500': '€150-500',
      over_500: '€500+',
    };

    // Handle both single-select (legacy) and multi-select preferences
    const spaceTypes = preferences.spaceTypes?.length > 0
      ? preferences.spaceTypes.join(', ')
      : preferences.spaceType || 'Not specified';

    const goals = preferences.goals?.length > 0
      ? preferences.goals.join(', ')
      : preferences.goal || 'Not specified';

    const styles = preferences.styles?.length > 0
      ? preferences.styles.join(', ')
      : preferences.style || 'Not specified';

    const contextText = `
Space Analysis:
- Type: ${spaceAnalysis.space_type}
- Existing items: ${spaceAnalysis.existing_items?.join(', ') || 'None'}
- Constraints: ${spaceAnalysis.constraints?.join(', ') || 'None'}
- Lighting: ${spaceAnalysis.lighting || 'Not specified'}

Measurements:
${measurementsText || 'None provided'}

User Preferences:
- Space type(s): ${spaceTypes}
- Goal(s): ${goals}
- Style(s): ${styles}
- Budget: ${preferences.budget ? budgetMap[preferences.budget] : 'Not specified'}
- Special needs: ${preferences.specialNeeds?.length > 0 ? preferences.specialNeeds.join(', ') : 'None'}
`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    let result;
    try {
      result = await model.generateContent([
        {
          inlineData: {
            mimeType,
            data: base64Data,
          },
        },
        { text: `${DESIGN_RECOMMENDATION_PROMPT}\n\nContext:\n${contextText}` },
      ]);
    } catch (geminiError) {
      const message = geminiError instanceof Error ? geminiError.message : String(geminiError);
      console.error('Gemini API error:', geminiError);
      return res.status(500).json({ error: `Gemini API error: ${message}` });
    }

    const response = result.response;
    const text = response.text();

    if (!text) {
      return res.status(500).json({ error: 'Gemini returned empty response' });
    }

    // Clean up response - remove markdown code blocks if present
    const cleanedText = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    let recommendation;
    try {
      recommendation = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('JSON parse error. Raw response:', text);
      return res.status(500).json({
        error: 'Failed to parse Gemini response as JSON',
        rawResponse: cleanedText.substring(0, 500)
      });
    }

    return res.status(200).json(recommendation);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Recommend error:', error);
    return res.status(500).json({ error: message });
  }
}
