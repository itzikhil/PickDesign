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

interface FixedElement {
  item: string;
  location: string;
}

type DesignIntent = 'refresh' | 'redesign' | 'fill';

interface RenderedAngle {
  image: string | null;
  type: 'redesign' | null;
}

function formatFixedElements(fixedElements: FixedElement[]): string {
  if (!fixedElements || fixedElements.length === 0) return '';
  const list = fixedElements.map((f) => `- ${f.item} (${f.location})`).join('\n');
  return `\n\nCRITICAL: The following elements must remain EXACTLY in their current position and appearance. Do not move, remove, or alter them. Design the room around these fixed elements:\n${list}\n`;
}

function buildDetailedPrompt(
  recommendation: Recommendation,
  designIntent: DesignIntent,
  fixedElements: FixedElement[],
  angleLabel: string
): string {
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

  const fixedBlock = formatFixedElements(fixedElements);
  const anglePreamble = angleLabel ? `This photo is ${angleLabel} of the room. ` : '';

  switch (designIntent) {
    case 'redesign':
      return `${anglePreamble}Completely redesign this room. Remove all existing furniture, clutter, and items. Replace with a clean, professionally styled space with new furniture: [${itemDescriptions}].

Keep the same room structure (walls, floor, windows, doors) but everything else should be new. ${wallColorText}

Design concept: ${recommendation.concept}${fixedBlock}

Make it look like a professional interior design magazine photo. The space should feel fresh, organized, and completely transformed.`;

    case 'fill':
      return `${anglePreamble}This is an empty space. Furnish it with: [${itemDescriptions}].

${wallColorText}

Design concept: ${recommendation.concept}${fixedBlock}

Make it look lived-in and inviting. The furniture should be naturally placed and the space should feel warm and welcoming, like a professionally styled home.`;

    case 'refresh':
    default:
      return `${anglePreamble}Keep the existing layout and furniture in this room, but add: [${itemDescriptions}] and organize the space.

${wallColorText}

Design concept: ${recommendation.concept}${fixedBlock}

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

function splitDataUrl(dataUrl: string): { mimeType: string; data: string } {
  const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  const mediaTypeMatch = dataUrl.match(/^data:(image\/\w+);base64,/);
  return {
    mimeType: mediaTypeMatch?.[1] || 'image/jpeg',
    data: base64Data,
  };
}

async function renderOneAngle(
  ai: GoogleGenAI,
  photo: string,
  recommendation: Recommendation,
  designIntent: DesignIntent,
  fixedElements: FixedElement[],
  angleLabel: string
): Promise<RenderedAngle> {
  try {
    const { mimeType, data } = splitDataUrl(photo);
    const prompt = buildDetailedPrompt(recommendation, designIntent, fixedElements, angleLabel);

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType, data } },
            { text: prompt },
          ],
        },
      ],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const imageData = part.inlineData;
          return {
            image: `data:${imageData.mimeType};base64,${imageData.data}`,
            type: 'redesign',
          };
        }
      }
    }
  } catch (err) {
    console.warn(`Redesign render failed for ${angleLabel}:`, err);
  }
  return { image: null, type: null };
}

async function renderMoodBoard(
  ai: GoogleGenAI,
  recommendation: Recommendation
): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: [
        {
          role: 'user',
          parts: [{ text: buildMoodBoardPrompt(recommendation) }],
        },
      ],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const imageData = part.inlineData;
          return `data:${imageData.mimeType};base64,${imageData.data}`;
        }
      }
    }
  } catch (err) {
    console.error('Mood board generation failed:', err);
  }
  return null;
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

    const {
      photo,
      photos,
      recommendation,
      designIntent = 'refresh',
      fixedElements,
    } = req.body;

    // Accept either `photos: string[]` (new) or `photo: string` (legacy)
    const photoList: string[] = Array.isArray(photos)
      ? photos
      : typeof photo === 'string'
      ? [photo]
      : [];

    if (photoList.length === 0) {
      return res.status(400).json({ error: 'Missing required field: photos' });
    }
    if (!recommendation) {
      return res.status(400).json({ error: 'Missing required field: recommendation' });
    }

    const fixedEls: FixedElement[] = Array.isArray(fixedElements) ? fixedElements : [];
    const ai = new GoogleGenAI({ apiKey });

    // Render every angle in parallel. Returns one result per input photo (nulls on failure).
    const renderedAngles = await Promise.all(
      photoList.map((p, i) => {
        const label = photoList.length > 1 ? `Angle ${i + 1}${i === 0 ? ' (hero)' : ''}` : '';
        return renderOneAngle(ai, p, recommendation, designIntent, fixedEls, label);
      })
    );

    const anySuccess = renderedAngles.some((r) => r.image);

    // Only fall back to a mood board if every angle's redesign failed.
    let moodboard: string | null = null;
    if (!anySuccess) {
      moodboard = await renderMoodBoard(ai, recommendation);
    }

    if (!anySuccess && !moodboard) {
      return res.status(500).json({
        error: 'Image generation not available',
        message: 'Could not generate visualization. This feature may not be available in your region or plan.',
      });
    }

    return res.status(200).json({
      renders: renderedAngles,
      moodboard,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Render error:', error);
    return res.status(500).json({ error: message });
  }
}
