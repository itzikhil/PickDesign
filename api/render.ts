import { GoogleGenerativeAI } from '@google/generative-ai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is not configured' });
    }

    const { photo, recommendation } = req.body;

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

    // Build the redesign prompt
    const itemDescriptions = recommendation.items
      .map((item: { type: string; color: string; placement: string }) =>
        `- ${item.type} (${item.color}) ${item.placement}`
      )
      .join('\n');

    const wallColorText = recommendation.wall_color
      ? `Wall color: ${recommendation.wall_color.name} (${recommendation.wall_color.hex})`
      : '';

    const prompt = `Edit this interior space photo to show a redesigned version with the following furniture and decor:

${itemDescriptions}

${wallColorText}

Design concept: ${recommendation.concept}

Create a photorealistic interior design render that naturally incorporates these items into the existing space. Keep the room structure and lighting similar, but add the suggested furniture and decor. Make it look like a professional interior design visualization.`;

    const genAI = new GoogleGenerativeAI(apiKey);

    // Use Gemini 2.0 Flash with image generation
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        responseModalities: ['image', 'text'],
      } as Record<string, unknown>,
    });

    let result;
    try {
      result = await model.generateContent([
        {
          inlineData: {
            mimeType,
            data: base64Data,
          },
        },
        { text: prompt },
      ]);
    } catch (geminiError) {
      const message = geminiError instanceof Error ? geminiError.message : String(geminiError);
      console.error('Gemini image generation error:', geminiError);
      return res.status(500).json({ error: `Gemini API error: ${message}` });
    }

    const response = result.response;

    // Check for image in response
    const imagePart = response.candidates?.[0]?.content?.parts?.find(
      (part: Record<string, unknown>) => part.inlineData
    );

    if (imagePart && imagePart.inlineData) {
      const imageData = imagePart.inlineData as { mimeType: string; data: string };
      return res.status(200).json({
        image: `data:${imageData.mimeType};base64,${imageData.data}`,
      });
    }

    // If no image was generated, return an error
    return res.status(500).json({
      error: 'Image generation not available',
      message: 'The model did not return an image. This feature may not be available in your region or plan.'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Render error:', error);
    return res.status(500).json({ error: message });
  }
}
