import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenAI, Modality } from '@google/genai';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;
const VITE_PORT = 5173;

// Parse JSON bodies
app.use(express.json({ limit: '50mb' }));

// Shared prompts
const SPACE_ANALYSIS_PROMPT = `You are a spatial analysis assistant for interior design.
Analyze the uploaded photo and identify:
1. The type of space (corner, wall, alcove, shelf, full room)
2. Key surfaces that need measuring
3. Existing furniture or fixtures
4. Lighting conditions
5. Any constraints (windows, doors, outlets, radiators)

Return ONLY valid JSON with this exact structure (no markdown, no extra text, no code blocks):
{
  "space_type": "corner",
  "surfaces_to_measure": [
    {
      "id": "wall_left",
      "label": "Left wall width",
      "description": "Measure from the corner to the edge of the window",
      "region": "left side of image, floor to ceiling"
    }
  ],
  "existing_items": ["radiator on right wall", "window"],
  "constraints": ["radiator limits depth on right side"],
  "lighting": "natural light from window, no overhead fixture visible"
}`;

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

// Helper to get Gemini client
function getGeminiModel(modelName = 'gemini-2.5-flash') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: modelName });
}

// API: Analyze space
app.post('/api/analyze', async (req, res) => {
  try {
    const { photo } = req.body;

    if (!photo) {
      return res.status(400).json({ error: 'Photo is required in request body' });
    }

    if (typeof photo !== 'string') {
      return res.status(400).json({ error: 'Photo must be a base64 data URL string' });
    }

    const base64Data = photo.replace(/^data:image\/\w+;base64,/, '');
    const mediaTypeMatch = photo.match(/^data:(image\/\w+);base64,/);
    const mimeType = mediaTypeMatch?.[1] || 'image/jpeg';

    if (!base64Data) {
      return res.status(400).json({ error: 'Invalid photo format - could not extract base64 data' });
    }

    let model;
    try {
      model = getGeminiModel();
    } catch (configError) {
      const message = configError instanceof Error ? configError.message : String(configError);
      return res.status(500).json({ error: message });
    }

    let result;
    try {
      result = await model.generateContent([
        { inlineData: { mimeType, data: base64Data } },
        { text: SPACE_ANALYSIS_PROMPT },
      ]);
    } catch (geminiError) {
      const message = geminiError instanceof Error ? geminiError.message : String(geminiError);
      console.error('Gemini API error:', geminiError);
      return res.status(500).json({ error: `Gemini API error: ${message}` });
    }

    const text = result.response.text();

    if (!text) {
      return res.status(500).json({ error: 'Gemini returned empty response' });
    }

    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let analysis;
    try {
      analysis = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('JSON parse error. Raw response:', text);
      return res.status(500).json({
        error: 'Failed to parse Gemini response as JSON',
        rawResponse: cleanedText.substring(0, 500)
      });
    }

    res.json(analysis);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Analyze error:', error);
    res.status(500).json({ error: message });
  }
});

// API: Generate recommendation
app.post('/api/recommend', async (req, res) => {
  try {
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

    const base64Data = photo.replace(/^data:image\/\w+;base64,/, '');
    const mediaTypeMatch = photo.match(/^data:(image\/\w+);base64,/);
    const mimeType = mediaTypeMatch?.[1] || 'image/jpeg';

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

    let model;
    try {
      model = getGeminiModel();
    } catch (configError) {
      const message = configError instanceof Error ? configError.message : String(configError);
      return res.status(500).json({ error: message });
    }

    let result;
    try {
      result = await model.generateContent([
        { inlineData: { mimeType, data: base64Data } },
        { text: `${DESIGN_RECOMMENDATION_PROMPT}\n\nContext:\n${contextText}` },
      ]);
    } catch (geminiError) {
      const message = geminiError instanceof Error ? geminiError.message : String(geminiError);
      console.error('Gemini API error:', geminiError);
      return res.status(500).json({ error: `Gemini API error: ${message}` });
    }

    const text = result.response.text();

    if (!text) {
      return res.status(500).json({ error: 'Gemini returned empty response' });
    }

    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

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

    res.json(recommendation);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Recommend error:', error);
    res.status(500).json({ error: message });
  }
});

// Helper functions for render prompts
interface RenderItem {
  type: string;
  color: string;
  placement: string;
  max_width_cm?: number;
  max_depth_cm?: number;
  max_height_cm?: number;
}

interface RenderRecommendation {
  concept: string;
  items: RenderItem[];
  wall_color?: { name: string; hex: string };
}

function buildDetailedPrompt(recommendation: RenderRecommendation): string {
  const itemDescriptions = recommendation.items
    .map((item) => {
      const dimensions = item.max_width_cm
        ? ` (approximately ${item.max_width_cm}x${item.max_depth_cm}x${item.max_height_cm}cm)`
        : '';
      return `${item.type} in ${item.color}${dimensions} ${item.placement}`;
    })
    .join(', ');

  const wallColorText = recommendation.wall_color
    ? `Wall color: ${recommendation.wall_color.name} (${recommendation.wall_color.hex}).`
    : '';

  return `Based on this room photo, create a photorealistic interior design visualization of the same space with the following items added: [${itemDescriptions}].

Keep the same room structure, lighting, and perspective. ${wallColorText}

Design concept: ${recommendation.concept}

The result should look like a professional interior design rendering that could appear in an interior design magazine. Make the new furniture and decor look naturally integrated into the space, with realistic shadows and lighting that match the original photo.`;
}

function buildMoodBoardPrompt(recommendation: RenderRecommendation): string {
  const itemList = recommendation.items
    .map((item) => `${item.type} in ${item.color}`)
    .join(', ');

  const bgColor = recommendation.wall_color?.hex || '#F5F5F5';
  const bgColorName = recommendation.wall_color?.name || 'neutral';

  return `Create a professional interior design mood board showing these items arranged in a stylish flat-lay composition: ${itemList}.

Use ${bgColorName} (${bgColor}) as the background color.

Design concept: ${recommendation.concept}

Style the mood board like a professional interior designer's presentation: clean, elegant, with items artfully arranged. Include subtle shadows for depth. The overall aesthetic should be sophisticated and aspirational, like something from an interior design Pinterest board or magazine.`;
}

// API: Render design visualization
app.post('/api/render', async (req, res) => {
  try {
    const { photo, recommendation } = req.body;

    if (!photo) {
      return res.status(400).json({ error: 'Missing required field: photo' });
    }
    if (!recommendation) {
      return res.status(400).json({ error: 'Missing required field: recommendation' });
    }

    const base64Data = photo.replace(/^data:image\/\w+;base64,/, '');
    const mediaTypeMatch = photo.match(/^data:(image\/\w+);base64,/);
    const mimeType = mediaTypeMatch?.[1] || 'image/jpeg';

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }

    const ai = new GoogleGenAI({ apiKey });

    // First attempt: Image-to-image redesign
    const redesignPrompt = buildDetailedPrompt(recommendation);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { mimeType, data: base64Data } },
              { text: redesignPrompt },
            ],
          },
        ],
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
        },
      });

      // Extract image from response
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const imageData = part.inlineData;
            return res.status(200).json({
              image: `data:${imageData.mimeType};base64,${imageData.data}`,
              type: 'redesign',
            });
          }
        }
      }
    } catch (redesignError) {
      console.warn('Image-to-image redesign failed, falling back to mood board:', redesignError);
    }

    // Fallback: Generate a mood board instead
    try {
      const moodBoardPrompt = buildMoodBoardPrompt(recommendation);

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: [
          {
            role: 'user',
            parts: [{ text: moodBoardPrompt }],
          },
        ],
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
        },
      });

      // Extract image from response
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const imageData = part.inlineData;
            return res.status(200).json({
              image: `data:${imageData.mimeType};base64,${imageData.data}`,
              type: 'moodboard',
            });
          }
        }
      }
    } catch (moodBoardError) {
      console.error('Mood board generation also failed:', moodBoardError);
    }

    // If both approaches failed
    return res.status(500).json({
      error: 'Image generation not available',
      message: 'Could not generate visualization. This feature may not be available in your region or plan.'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Render error:', error);
    res.status(500).json({ error: message });
  }
});

// Proxy everything else to Vite dev server
app.use(
  '/',
  createProxyMiddleware({
    target: `http://localhost:${VITE_PORT}`,
    changeOrigin: true,
    ws: true, // WebSocket support for HMR
  })
);

app.listen(PORT, () => {
  console.log(`\n  API server running at http://localhost:${PORT}`);
  console.log(`  Proxying to Vite at http://localhost:${VITE_PORT}\n`);
});
