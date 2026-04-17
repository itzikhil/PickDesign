import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { DesignSuggestion } from '../components/DesignSuggestion';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { BeforeAfterSlider } from '../components/BeforeAfterSlider';
import { InteractivePhotoOverlay } from '../components/InteractivePhotoOverlay';
import { useApp } from '../context/AppContext';
import { generateDesignRecommendation } from '../lib/claude';
import { matchProducts } from '../lib/products';
import type { RecommendedItem, DesignIntent, ProductMatch } from '../lib/types';

function getAmazonSearchUrl(query: string): string {
  return `https://www.amazon.de/s?k=${encodeURIComponent(query)}&tag=pickdesign-21`;
}

function ShopItem({ match, index }: { match: ProductMatch; index: number }) {
  const product = match.products[0];
  const item = match.item;

  const buyUrl = product?.affiliate_url || getAmazonSearchUrl(item.search_query);
  const alternativesUrl = getAmazonSearchUrl(item.type);

  const priceText = item.price_range_eur
    ? `€${item.price_range_eur.min} – €${item.price_range_eur.max}`
    : product?.price
    ? `€${product.price}`
    : null;

  return (
    <div className="flex items-start gap-4 py-4 border-b border-warm last:border-b-0">
      {/* Number */}
      <div className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-bold text-teal">{index + 1}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            {/* Item name as buy link */}
            <a
              href={buyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-ink hover:text-teal transition-colors capitalize"
            >
              {item.type}
              <svg className="inline-block w-4 h-4 ml-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>

            {/* Description */}
            <p className="text-sm text-ink/60 mt-0.5">
              {item.color} · {item.max_width_cm}×{item.max_depth_cm}×{item.max_height_cm}cm
            </p>

            {/* See alternatives */}
            <a
              href={alternativesUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-teal hover:underline mt-1 inline-block"
            >
              See alternatives →
            </a>
          </div>

          {/* Price */}
          {priceText && (
            <span className="text-sm font-medium text-ink/80 whitespace-nowrap">
              {priceText}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

async function renderDesignVisualization(
  heroPhoto: string,
  recommendation: { concept: string; items: RecommendedItem[]; wall_color?: { name: string; hex: string } },
  designIntent: DesignIntent
): Promise<{ image: string | null; type: 'redesign' | 'moodboard' | null }> {
  try {
    const response = await fetch('/api/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo: heroPhoto, recommendation, designIntent }),
    });

    if (!response.ok) {
      console.warn('Image rendering not available');
      return { image: null, type: null };
    }

    const data = await response.json();
    return {
      image: data.image || null,
      type: data.type || null,
    };
  } catch (error) {
    console.warn('Image rendering failed:', error);
    return { image: null, type: null };
  }
}

export function ResultsPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const heroPhoto = state.photos[0] ?? null;
  const additionalPhotos = state.photos.slice(1);

  // Redirect if missing required data
  useEffect(() => {
    if (!heroPhoto || !state.spaceAnalysis || !state.preferences.designIntent || state.preferences.spaceTypes.length === 0) {
      navigate('/');
    }
  }, [heroPhoto, state.spaceAnalysis, state.preferences.designIntent, state.preferences.spaceTypes, navigate]);

  // Generate design on mount
  useEffect(() => {
    if (
      state.photos.length > 0 &&
      state.spaceAnalysis &&
      state.preferences.designIntent &&
      state.preferences.spaceTypes.length > 0 &&
      !state.designRecommendation &&
      !state.isGeneratingDesign
    ) {
      dispatch({ type: 'SET_GENERATING_DESIGN', payload: true });

      generateDesignRecommendation(
        state.photos,
        state.spaceAnalysis,
        state.measurements,
        state.preferences
      )
        .then(async (recommendation) => {
          dispatch({ type: 'SET_DESIGN_RECOMMENDATION', payload: recommendation });

          // Match products
          dispatch({ type: 'SET_LOADING_PRODUCTS', payload: true });
          const matches = await matchProducts(recommendation.items);
          dispatch({ type: 'SET_PRODUCT_MATCHES', payload: matches });
          dispatch({ type: 'SET_LOADING_PRODUCTS', payload: false });

          // Try to generate visualization (non-blocking) — uses hero angle
          dispatch({ type: 'SET_RENDERING_IMAGE', payload: true });
          const renderResult = await renderDesignVisualization(
            state.photos[0],
            recommendation,
            state.preferences.designIntent || 'refresh'
          );
          dispatch({
            type: 'SET_RENDERED_IMAGE',
            payload: { image: renderResult.image, renderType: renderResult.type },
          });
          dispatch({ type: 'SET_RENDERING_IMAGE', payload: false });
        })
        .catch((error) => {
          console.error('Failed to generate design:', error);
          alert('Failed to generate design. Please try again.');
          navigate('/preferences');
        })
        .finally(() => {
          dispatch({ type: 'SET_GENERATING_DESIGN', payload: false });
        });
    }
  }, [
    state.photos,
    state.spaceAnalysis,
    state.measurements,
    state.preferences,
    state.designRecommendation,
    state.isGeneratingDesign,
    dispatch,
    navigate,
  ]);

  const handleBack = () => {
    navigate('/preferences');
  };

  const handleTryDifferentStyle = () => {
    // Clear only the design, keep photo and measurements
    dispatch({ type: 'CLEAR_DESIGN' });
    navigate('/preferences');
  };

  const handleStartOver = () => {
    dispatch({ type: 'RESET' });
    navigate('/');
  };


  if (!heroPhoto || !state.spaceAnalysis) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <Header showBack onBack={handleBack} />

      <main className="pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Loading state */}
          {state.isGeneratingDesign && (
            <LoadingSpinner
              message="Creating your design"
              submessage="Curating the perfect pieces for your space..."
            />
          )}

          {/* Design results */}
          {state.designRecommendation && (
            <>
              {/* Page title */}
              <div className="text-center mb-8">
                <h1 className="text-display-lg text-ink mb-2">
                  Your new space
                </h1>
                <p className="text-ink/70">
                  Designed for you
                </p>
              </div>

              {/* Multi-angle notice */}
              {additionalPhotos.length > 0 && (
                <div className="mb-4 px-4 py-3 bg-teal-light/40 border border-teal/20 rounded-xl flex items-start gap-3">
                  <svg className="w-5 h-5 text-teal flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-ink/80">
                    The before/after below shows your <span className="font-semibold">hero angle</span>. Your design accounts for all {state.photos.length} angles — see the concept below for items on walls not visible here.
                  </p>
                </div>
              )}

              {/* Hero: Before/After visualization */}
              <div className="mb-8">
                {state.isRenderingImage ? (
                  <div className="bg-white rounded-2xl p-8 border border-warm">
                    <LoadingSpinner
                      message="Creating preview"
                      submessage="Bringing your new space to life..."
                    />
                  </div>
                ) : state.renderedImage && state.renderType === 'redesign' ? (
                  // Show before/after slider for redesign images
                  <div>
                    <BeforeAfterSlider
                      beforeImage={heroPhoto}
                      afterImage={state.renderedImage}
                      beforeLabel="Before"
                      afterLabel="After"
                    />
                    {/* Product pins on after image */}
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold text-ink mb-3">
                        Click to explore products
                      </h3>
                      <InteractivePhotoOverlay
                        photoUrl={state.renderedImage}
                        items={state.designRecommendation.items}
                      />
                    </div>
                  </div>
                ) : state.renderedImage && state.renderType === 'moodboard' ? (
                  // Show mood board alongside original photo
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Original photo */}
                      <div className="relative">
                        <span className="absolute top-4 left-4 z-10 px-3 py-1.5 bg-ink/80 text-white text-sm font-medium rounded-full backdrop-blur-sm">
                          Your Space
                        </span>
                        <img
                          src={heroPhoto}
                          alt="Your space"
                          className="w-full rounded-2xl shadow-md"
                        />
                      </div>
                      {/* Mood board */}
                      <div className="relative">
                        <span className="absolute top-4 left-4 z-10 px-3 py-1.5 bg-accent text-white text-sm font-medium rounded-full shadow-lg">
                          Design Mood Board
                        </span>
                        <img
                          src={state.renderedImage}
                          alt="Design mood board"
                          className="w-full rounded-2xl shadow-md"
                        />
                      </div>
                    </div>
                    <p className="text-center text-sm text-ink/50">
                      Your inspiration board
                    </p>
                    {/* Product pins on original photo */}
                    <div>
                      <h3 className="text-lg font-semibold text-ink mb-3">
                        Click to explore products in your space
                      </h3>
                      <InteractivePhotoOverlay
                        photoUrl={heroPhoto}
                        items={state.designRecommendation.items}
                      />
                    </div>
                  </div>
                ) : (
                  // Fallback: just show original photo with pins
                  <div>
                    <h3 className="text-lg font-semibold text-ink mb-3">
                      Your space with product recommendations
                    </h3>
                    <InteractivePhotoOverlay
                      photoUrl={heroPhoto}
                      items={state.designRecommendation.items}
                    />
                  </div>
                )}
              </div>

              {/* Other angles */}
              {additionalPhotos.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-ink/70 mb-3 uppercase tracking-wide">
                    Other angles you shared
                  </h3>
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {additionalPhotos.map((photo, i) => (
                      <div key={i} className="flex-shrink-0 w-32">
                        <div className="relative aspect-square rounded-xl overflow-hidden border border-warm">
                          <img src={photo} alt={`Angle ${i + 2}`} className="w-full h-full object-cover" />
                        </div>
                        <p className="text-xs text-ink/60 mt-1.5 text-center">Angle {i + 2}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Design suggestion */}
              <DesignSuggestion recommendation={state.designRecommendation} />

              {/* Products section */}
              <div className="mt-16">
                <div className="text-center mb-8">
                  <p className="text-xs font-semibold uppercase tracking-widest text-teal mb-2">
                    Curated for you
                  </p>
                  <h2 className="font-display text-2xl md:text-3xl font-semibold text-ink">
                    Shop the look
                  </h2>
                </div>

                {state.isLoadingProducts ? (
                  <LoadingSpinner message="Finding perfect pieces..." />
                ) : (
                  <div className="bg-white rounded-2xl border border-warm p-4 md:p-6">
                    {state.productMatches.map((match, index) => (
                      <ShopItem key={index} match={match} index={index} />
                    ))}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={handleTryDifferentStyle}
                  className="px-8 py-4 bg-white border border-warm text-ink rounded-full font-semibold hover:border-accent hover:shadow-md transition-all"
                >
                  Try a different style
                </button>
                <button
                  onClick={handleStartOver}
                  className="px-8 py-4 bg-ink text-cream rounded-full font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  Design another space
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
