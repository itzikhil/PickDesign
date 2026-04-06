import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
      "priority": "essential"
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
function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-04-17' });
}

// API: Analyze space
app.post('/api/analyze', async (req, res) => {
  try {
    const { photo } = req.body;

    if (!photo) {
      return res.status(400).json({ error: 'Photo is required' });
    }

    const base64Data = photo.replace(/^data:image\/\w+;base64,/, '');
    const mediaTypeMatch = photo.match(/^data:(image\/\w+);base64,/);
    const mimeType = mediaTypeMatch?.[1] || 'image/jpeg';

    const model = getGeminiModel();
    const result = await model.generateContent([
      { inlineData: { mimeType, data: base64Data } },
      { text: SPACE_ANALYSIS_PROMPT },
    ]);

    const text = result.response.text();
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const analysis = JSON.parse(cleanedText);

    res.json(analysis);
  } catch (error) {
    console.error('Analyze error:', error);
    res.status(500).json({ error: 'Failed to analyze space' });
  }
});

// API: Generate recommendation
app.post('/api/recommend', async (req, res) => {
  try {
    const { photo, spaceAnalysis, measurements, preferences } = req.body;

    if (!photo || !spaceAnalysis || !measurements || !preferences) {
      return res.status(400).json({ error: 'Missing required fields' });
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

    const contextText = `
Space Analysis:
- Type: ${spaceAnalysis.space_type}
- Existing items: ${spaceAnalysis.existing_items.join(', ')}
- Constraints: ${spaceAnalysis.constraints.join(', ')}
- Lighting: ${spaceAnalysis.lighting}

Measurements:
${measurementsText}

User Preferences:
- Space type: ${preferences.spaceType || 'Not specified'}
- Goal: ${preferences.goal || 'Not specified'}
- Style: ${preferences.style || 'Not specified'}
- Budget: ${preferences.budget ? budgetMap[preferences.budget] : 'Not specified'}
- Special needs: ${preferences.specialNeeds.length > 0 ? preferences.specialNeeds.join(', ') : 'None'}
`;

    const model = getGeminiModel();
    const result = await model.generateContent([
      { inlineData: { mimeType, data: base64Data } },
      { text: `${DESIGN_RECOMMENDATION_PROMPT}\n\nContext:\n${contextText}` },
    ]);

    const text = result.response.text();
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const recommendation = JSON.parse(cleanedText);

    res.json(recommendation);
  } catch (error) {
    console.error('Recommend error:', error);
    res.status(500).json({ error: 'Failed to generate recommendation' });
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
