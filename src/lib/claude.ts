import type { SpaceAnalysis, DesignRecommendation, Measurement, UserPreferences } from './types';

export async function analyzeSpace(photos: string[]): Promise<SpaceAnalysis> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ photos }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Failed to analyze space');
  }

  return response.json();
}

export async function generateDesignRecommendation(
  photos: string[],
  spaceAnalysis: SpaceAnalysis,
  measurements: Measurement[],
  preferences: UserPreferences
): Promise<DesignRecommendation> {
  const response = await fetch('/api/recommend', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      photos,
      spaceAnalysis,
      measurements,
      preferences,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Failed to generate recommendation');
  }

  return response.json();
}
