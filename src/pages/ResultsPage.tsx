import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { DesignSuggestion } from '../components/DesignSuggestion';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { BeforeAfterSlider } from '../components/BeforeAfterSlider';
import { InteractivePhotoOverlay } from '../components/InteractivePhotoOverlay';
import { useApp } from '../context/AppContext';
import { generateDesignRecommendation } from '../lib/claude';
import { matchProducts } from '../lib/products';
import type { RecommendedItem, DesignIntent, FixedElement, ProductMatch, RenderedAngle } from '../lib/types';

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

function AngleCarousel({
  photos,
  renderedAngles,
  items,
}: {
  photos: string[];
  renderedAngles: RenderedAngle[];
  items: RecommendedItem[];
}) {
  const [active, setActive] = useState(0);
  const single = photos.length === 1;
  const current = renderedAngles[active] ?? { image: null, type: null };
  const currentPhoto = photos[active];

  return (
    <div>
      {!single && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Angle selector">
          {photos.map((_, i) => {
            const hasRender = !!renderedAngles[i]?.image;
            const isActive = i === active;
            return (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(i)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-teal text-white shadow-sm'
                    : 'bg-white border border-warm text-ink/70 hover:text-ink hover:border-accent'
                }`}
              >
                Angle {i + 1}{i === 0 ? ' · Hero' : ''}
                {!hasRender && (
                  <span
                    className={`ml-2 text-[10px] uppercase tracking-wide ${isActive ? 'text-white/80' : 'text-ink/40'}`}
                  >
                    render failed
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {current.image ? (
        <>
          <BeforeAfterSlider
            key={active}
            beforeImage={currentPhoto}
            afterImage={current.image}
            beforeLabel="Before"
            afterLabel="After"
          />
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-ink mb-3">
              Click to explore products{single ? '' : ` in Angle ${active + 1}`}
            </h3>
            <InteractivePhotoOverlay photoUrl={current.image} items={items} />
          </div>
        </>
      ) : (
        <>
          <div className="relative rounded-2xl overflow-hidden border border-warm">
            <img src={currentPhoto} alt={`Angle ${active + 1}`} className="w-full h-auto" />
            <div className="absolute top-4 left-4 px-3 py-1.5 bg-ink/80 text-white text-sm font-medium rounded-full backdrop-blur-sm">
              Angle {active + 1} · render unavailable
            </div>
          </div>
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-ink mb-3">
              Your space with product recommendations
            </h3>
            <InteractivePhotoOverlay photoUrl={currentPhoto} items={items} />
          </div>
        </>
      )}

      {!single && (
        <p className="mt-3 text-xs text-ink/50 text-center">
          Showing Angle {active + 1} of {photos.length}. Tap a tab to switch angles.
        </p>
      )}
    </div>
  );
}

interface RenderResponse {
  renderedAngles: RenderedAngle[];
  moodboardImage: string | null;
}

async function renderDesignVisualization(
  photos: string[],
  recommendation: { concept: string; items: RecommendedItem[]; wall_color?: { name: string; hex: string } },
  designIntent: DesignIntent,
  fixedElements: FixedElement[]
): Promise<RenderResponse> {
  const empty: RenderResponse = {
    renderedAngles: photos.map(() => ({ image: null, type: null })),
    moodboardImage: null,
  };
  try {
    const response = await fetch('/api/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photos, recommendation, designIntent, fixedElements }),
    });

    if (!response.ok) {
      console.warn('Image rendering not available');
      return empty;
    }

    const data = await response.json();
    const renders: RenderedAngle[] = Array.isArray(data.renders)
      ? data.renders.map((r: { image?: string | null; type?: 'redesign' | null }) => ({
          image: r?.image ?? null,
          type: r?.type === 'redesign' ? 'redesign' : null,
        }))
      : empty.renderedAngles;

    // Pad or trim to match photo count so index alignment is guaranteed.
    const aligned: RenderedAngle[] = photos.map((_, i) => renders[i] ?? { image: null, type: null });

    return {
      renderedAngles: aligned,
      moodboardImage: typeof data.moodboard === 'string' ? data.moodboard : null,
    };
  } catch (error) {
    console.warn('Image rendering failed:', error);
    return empty;
  }
}

export function ResultsPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const heroPhoto = state.photos[0] ?? null;

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

          // Try to generate per-angle visualizations (non-blocking)
          dispatch({ type: 'SET_RENDERING_IMAGE', payload: true });
          const renderResult = await renderDesignVisualization(
            state.photos,
            recommendation,
            state.preferences.designIntent || 'refresh',
            state.spaceAnalysis?.fixed_elements ?? []
          );
          dispatch({
            type: 'SET_RENDERED_ANGLES',
            payload: {
              renderedAngles: renderResult.renderedAngles,
              moodboardImage: renderResult.moodboardImage,
            },
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

              {/* Visualization: single slider OR multi-angle carousel */}
              <div className="mb-8">
                {state.isRenderingImage ? (
                  <div className="bg-white rounded-2xl p-8 border border-warm">
                    <LoadingSpinner
                      message={state.photos.length > 1 ? `Rendering ${state.photos.length} angles` : 'Creating preview'}
                      submessage="Bringing your new space to life..."
                    />
                  </div>
                ) : state.moodboardImage ? (
                  // All angle renders failed — fall back to a single mood board layout.
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative">
                        <span className="absolute top-4 left-4 z-10 px-3 py-1.5 bg-ink/80 text-white text-sm font-medium rounded-full backdrop-blur-sm">
                          Your Space
                        </span>
                        <img src={heroPhoto} alt="Your space" className="w-full rounded-2xl shadow-md" />
                      </div>
                      <div className="relative">
                        <span className="absolute top-4 left-4 z-10 px-3 py-1.5 bg-accent text-white text-sm font-medium rounded-full shadow-lg">
                          Design Mood Board
                        </span>
                        <img src={state.moodboardImage} alt="Design mood board" className="w-full rounded-2xl shadow-md" />
                      </div>
                    </div>
                    <p className="text-center text-sm text-ink/50">Your inspiration board</p>
                    <div>
                      <h3 className="text-lg font-semibold text-ink mb-3">
                        Click to explore products in your space
                      </h3>
                      <InteractivePhotoOverlay photoUrl={heroPhoto} items={state.designRecommendation.items} />
                    </div>
                  </div>
                ) : state.renderedAngles.some((r) => r.image) ? (
                  <AngleCarousel
                    photos={state.photos}
                    renderedAngles={state.renderedAngles}
                    items={state.designRecommendation.items}
                  />
                ) : (
                  // Fallback: show original(s) with pins
                  <div>
                    <h3 className="text-lg font-semibold text-ink mb-3">
                      Your space with product recommendations
                    </h3>
                    <InteractivePhotoOverlay photoUrl={heroPhoto} items={state.designRecommendation.items} />
                  </div>
                )}
              </div>

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
