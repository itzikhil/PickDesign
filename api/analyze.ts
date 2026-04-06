import { GoogleGenerativeAI } from '@google/generative-ai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { photo } = req.body;

    if (!photo) {
      return res.status(400).json({ error: 'Photo is required' });
    }

    // Extract base64 data and media type
    const base64Data = photo.replace(/^data:image\/\w+;base64,/, '');
    const mediaTypeMatch = photo.match(/^data:(image\/\w+);base64,/);
    const mimeType = mediaTypeMatch?.[1] || 'image/jpeg';

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-04-17' });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
      { text: SPACE_ANALYSIS_PROMPT },
    ]);

    const response = result.response;
    const text = response.text();

    // Clean up response - remove markdown code blocks if present
    const cleanedText = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const analysis = JSON.parse(cleanedText);
    return res.status(200).json(analysis);
  } catch (error) {
    console.error('Analyze error:', error);
    return res.status(500).json({ error: 'Failed to analyze space' });
  }
}
