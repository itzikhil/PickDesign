import { GoogleGenerativeAI } from '@google/generative-ai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const SPACE_ANALYSIS_PROMPT = `You are a spatial analysis assistant for interior design.

If multiple photos are provided, they are multiple angles of the SAME room. Analyze them together to understand the full space layout — all walls, furniture, windows, and doors. Merge observations from every angle rather than analyzing each one separately.

Identify:
1. The type of space (corner, wall, alcove, shelf, full room)
2. The 2-3 MOST IMPORTANT surfaces to measure (no more than 3!)
3. Existing furniture or fixtures (across all angles)
4. FIXED ELEMENTS that are permanently installed and CANNOT be moved or removed. Include only items from these categories that actually appear in the photos:
   - wall-mounted TVs
   - fireplaces
   - radiators
   - built-in shelving or cabinetry
   - windows
   - doors
   - ceiling lights / chandeliers
   - structural beams or columns
   For each, give a short "item" name and a "location" description ("center of main wall", "under window on right wall", etc.)
5. Lighting conditions
6. Any other constraints not covered by fixed elements
7. Suggested design intent based on the current state:
   - "redesign" if the room is cluttered, messy, or has outdated furniture that should be replaced
   - "refresh" if the room is already organized but could use some finishing touches or additional items
   - "fill" if the room is mostly empty and needs furnishing

IMPORTANT:
- Only include 2-3 surfaces maximum - focus on the most critical dimensions
- For each surface, estimate the measurement in centimeters based on typical room proportions and any visible reference objects
- Your estimates don't need to be perfect - they help users know what to expect
- fixed_elements must be an array (empty if none are visible). Only list items you can actually see.

Return ONLY valid JSON with this exact structure (no markdown, no extra text, no code blocks):
{
  "space_type": "corner",
  "surfaces_to_measure": [
    {
      "id": "wall_width",
      "label": "Wall width",
      "description": "The main wall where furniture will go",
      "region": "back wall",
      "estimated_cm": 180
    },
    {
      "id": "available_depth",
      "label": "Available depth",
      "description": "Space from wall to where you'd walk",
      "region": "floor area",
      "estimated_cm": 120
    }
  ],
  "existing_items": ["sofa", "coffee table"],
  "fixed_elements": [
    { "item": "wall-mounted TV", "location": "center of main wall" },
    { "item": "radiator", "location": "under window, right wall" }
  ],
  "constraints": ["radiator limits depth on right side"],
  "lighting": "natural light from window, no overhead fixture visible",
  "suggested_intent": "refresh"
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

    const { photo, photos } = req.body;

    // Accept either `photos: string[]` (new) or `photo: string` (legacy)
    const photoList: string[] = Array.isArray(photos)
      ? photos
      : typeof photo === 'string'
      ? [photo]
      : [];

    if (photoList.length === 0) {
      return res.status(400).json({ error: 'At least one photo is required' });
    }

    if (!photoList.every((p) => typeof p === 'string')) {
      return res.status(400).json({ error: 'Each photo must be a base64 data URL string' });
    }

    const imageParts = photoList.map((p) => {
      const base64Data = p.replace(/^data:image\/\w+;base64,/, '');
      const mediaTypeMatch = p.match(/^data:(image\/\w+);base64,/);
      const mimeType = mediaTypeMatch?.[1] || 'image/jpeg';
      return { inlineData: { mimeType, data: base64Data } };
    });

    if (imageParts.some((part) => !part.inlineData.data)) {
      return res.status(400).json({ error: 'Invalid photo format - could not extract base64 data' });
    }

    const anglePreamble = photoList.length > 1
      ? `The user uploaded ${photoList.length} angles of the same room (labeled Angle 1 through Angle ${photoList.length} in order). Analyze them together.\n\n`
      : '';

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    let result;
    try {
      result = await model.generateContent([
        ...imageParts,
        { text: `${anglePreamble}${SPACE_ANALYSIS_PROMPT}` },
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

    // Guarantee fixed_elements is always an array so downstream code can rely on it.
    if (!Array.isArray(analysis.fixed_elements)) {
      analysis.fixed_elements = [];
    }

    return res.status(200).json(analysis);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Analyze error:', error);
    return res.status(500).json({ error: message });
  }
}
