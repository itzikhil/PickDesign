import { GoogleGenerativeAI } from '@google/generative-ai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

function getDesignIntentInstructions(intent: string): string {
  switch (intent) {
    case 'redesign':
      return `DESIGN APPROACH: Complete redesign
- The user wants to start fresh with new furniture and layout
- Ignore all existing furniture in the photo - it will be removed
- Design as if the room is empty (keep only fixed elements like windows, doors, radiators)
- Suggest a complete furniture set for the space
- Be bold with the design - this is a fresh start`;
    case 'fill':
      return `DESIGN APPROACH: Furnish empty space
- The space is empty and needs furnishing from scratch
- Suggest essential furniture pieces to make the space functional and inviting
- Include both functional items and decorative elements
- Make the space feel lived-in and welcoming`;
    case 'refresh':
    default:
      return `DESIGN APPROACH: Refresh and organize
- Keep the existing layout and major furniture pieces
- Suggest items that complement what's already there
- Focus on organization, finishing touches, and accent pieces
- Add items that enhance the current setup without major changes`;
  }
}

const BASE_RECOMMENDATION_PROMPT = `You are an interior designer. Given the space analysis, user dimensions, preferences, and design approach, suggest a cohesive design.

When multiple photos are provided, they are multiple angles of the SAME room. Design for the ENTIRE space — all walls, corners, and areas visible across every angle — not just what's in one photo. Angle 1 is the "hero" angle that will be shown in the before/after visualization.

Rules:
- Every item MUST fit within the provided dimensions (leave 2-3cm clearance)
- Respect constraints (don't block radiators, windows, doors)
- Stay within budget
- Suggest specific, searchable product types (not vague descriptions)
- Include wall color if relevant
- The search_query should be optimized for finding products on Amazon.de or German furniture stores
- Include realistic EUR price ranges for each item
- Include position_hint as x,y percentages (0-100) indicating where the item would be placed in the HERO photo (Angle 1). For items on walls not visible in Angle 1, omit position_hint.
- In the "concept" field, briefly mention any items or changes that go on walls/areas NOT visible in the hero angle (Angle 1), so the user understands the full design.

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

    const { photo, photos, spaceAnalysis, measurements, preferences } = req.body;

    const photoList: string[] = Array.isArray(photos)
      ? photos
      : typeof photo === 'string'
      ? [photo]
      : [];

    if (photoList.length === 0) {
      return res.status(400).json({ error: 'Missing required field: photos' });
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

    const imageParts = photoList.map((p) => {
      const base64Data = p.replace(/^data:image\/\w+;base64,/, '');
      const mediaTypeMatch = p.match(/^data:(image\/\w+);base64,/);
      const mimeType = mediaTypeMatch?.[1] || 'image/jpeg';
      return { inlineData: { mimeType, data: base64Data } };
    });

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

    const designIntent = preferences.designIntent || 'refresh';
    const intentInstructions = getDesignIntentInstructions(designIntent);

    const anglePreamble = photoList.length > 1
      ? `The user uploaded ${photoList.length} angles of the same room (Angle 1 through Angle ${photoList.length}, in order). Angle 1 is the hero image used for the before/after render. Design for the full space seen across all angles.\n\n`
      : '';

    const fixedElements = Array.isArray(spaceAnalysis.fixed_elements)
      ? spaceAnalysis.fixed_elements
      : [];
    const fixedElementsList = fixedElements
      .map((f: { item: string; location: string }) => `- ${f.item} (${f.location})`)
      .join('\n');
    const fixedElementsBlock = fixedElements.length > 0
      ? `\nFIXED ELEMENTS — these items are permanently installed and CANNOT be moved or removed. Design around them:\n${fixedElementsList}\n`
      : '';

    const contextText = `
${anglePreamble}${intentInstructions}
${fixedElementsBlock}
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
        ...imageParts,
        { text: `${BASE_RECOMMENDATION_PROMPT}\n\nContext:\n${contextText}` },
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
