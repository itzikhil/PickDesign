import { GoogleGenAI, Modality } from '@google/genai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

interface RecommendedItem {
  type: string;
  color: string;
  placement: string;
  max_width_cm?: number;
  max_depth_cm?: number;
  max_height_cm?: number;
}

interface WallColor {
  name: string;
  hex: string;
}

interface Recommendation {
  concept: string;
  items: RecommendedItem[];
  wall_color?: WallColor;
}

type DesignIntent = 'refresh' | 'redesign' | 'fill';

function buildDetailedPrompt(recommendation: Recommendation, designIntent: DesignIntent): string {
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

  switch (designIntent) {
    case 'redesign':
      return `Completely redesign this room. Remove all existing furniture, clutter, and items. Replace with a clean, professionally styled space with new furniture: [${itemDescriptions}].

Keep the same room structure (walls, floor, windows, doors) but everything else should be new. ${wallColorText}

Design concept: ${recommendation.concept}

Make it look like a professional interior design magazine photo. The space should feel fresh, organized, and completely transformed.`;

    case 'fill':
      return `This is an empty space. Furnish it with: [${itemDescriptions}].

${wallColorText}

Design concept: ${recommendation.concept}

Make it look lived-in and inviting. The furniture should be naturally placed and the space should feel warm and welcoming, like a professionally styled home.`;

    case 'refresh':
    default:
      return `Keep the existing layout and furniture in this room, but add: [${itemDescriptions}] and organize the space.

${wallColorText}

Design concept: ${recommendation.concept}

The result should look like a professional interior design rendering that enhances the current setup. Add the new items naturally while respecting the existing furniture placement.`;
  }
}

function buildMoodBoardPrompt(recommendation: Recommendation): string {
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is not configured' });
    }

    const { photo, recommendation, designIntent = 'refresh' } = req.body;

    if (!photo) {
      return res.status(400).json({ error: 'Missing required field: photo' });
    }
    if (!recommendation) {
      return res.status(400).json({ error: 'Missing required field: recommendation' });
    }

    // Extract base64 data and media type
    const base64Data = photo.replace(/^data:image\/\w+;base64,/, '');
    const mediaTypeMatch = photo.match(/^data:(image\/\w+);base64,/);
    const mimeType = mediaTypeMatch?.[1] || 'image/jpeg';

    const ai = new GoogleGenAI({ apiKey });

    // First attempt: Image-to-image redesign
    const redesignPrompt = buildDetailedPrompt(recommendation, designIntent);

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
    return res.status(500).json({ error: message });
  }
}
