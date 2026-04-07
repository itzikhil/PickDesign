import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { DesignSuggestion } from '../components/DesignSuggestion';
import { ProductCard } from '../components/ProductCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { BeforeAfterSlider } from '../components/BeforeAfterSlider';
import { InteractivePhotoOverlay } from '../components/InteractivePhotoOverlay';
import { useApp } from '../context/AppContext';
import { generateDesignRecommendation } from '../lib/claude';
import { matchProducts } from '../lib/products';
import type { RecommendedItem, DesignIntent } from '../lib/types';

async function renderDesignVisualization(
  photo: string,
  recommendation: { concept: string; items: RecommendedItem[]; wall_color?: { name: string; hex: string } },
  designIntent: DesignIntent
): Promise<{ image: string | null; type: 'redesign' | 'moodboard' | null }> {
  try {
    const response = await fetch('/api/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo, recommendation, designIntent }),
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
  const productSectionRef = useRef<HTMLDivElement>(null);

  // Redirect if missing required data
  useEffect(() => {
    if (!state.photo || !state.spaceAnalysis || !state.preferences.designIntent || state.preferences.spaceTypes.length === 0) {
      navigate('/');
    }
  }, [state.photo, state.spaceAnalysis, state.preferences.designIntent, state.preferences.spaceTypes, navigate]);

  // Generate design on mount
  useEffect(() => {
    if (
      state.photo &&
      state.spaceAnalysis &&
      state.preferences.designIntent &&
      state.preferences.spaceTypes.length > 0 &&
      !state.designRecommendation &&
      !state.isGeneratingDesign
    ) {
      dispatch({ type: 'SET_GENERATING_DESIGN', payload: true });

      generateDesignRecommendation(
        state.photo,
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

          // Try to generate visualization (non-blocking)
          dispatch({ type: 'SET_RENDERING_IMAGE', payload: true });
          const renderResult = await renderDesignVisualization(
            state.photo!,
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
    state.photo,
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

  const handlePinClick = (_item: RecommendedItem, index: number) => {
    // Scroll to the item in the design suggestion
    const element = document.getElementById(`item-${index}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('ring-2', 'ring-accent');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-accent');
      }, 2000);
    }
  };

  if (!state.photo || !state.spaceAnalysis) {
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
                      beforeImage={state.photo}
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
                        onItemClick={handlePinClick}
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
                          src={state.photo}
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
                        photoUrl={state.photo}
                        items={state.designRecommendation.items}
                        onItemClick={handlePinClick}
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
                      photoUrl={state.photo}
                      items={state.designRecommendation.items}
                      onItemClick={handlePinClick}
                    />
                  </div>
                )}
              </div>

              {/* Design suggestion */}
              <DesignSuggestion recommendation={state.designRecommendation} />

              {/* Products section */}
              <div className="mt-16" ref={productSectionRef}>
                <div className="text-center mb-8">
                  <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-2">
                    Curated for you
                  </p>
                  <h2 className="font-display text-2xl md:text-3xl font-semibold text-ink">
                    Shop the look
                  </h2>
                </div>

                {state.isLoadingProducts ? (
                  <LoadingSpinner message="Finding perfect pieces..." />
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                    {state.productMatches.map((match, index) => (
                      <ProductCard
                        key={index}
                        product={match.products[0] || {
                          id: `fallback-${index}`,
                          name: match.item.type,
                          price: 0,
                          currency: 'EUR',
                          image_url: '',
                          affiliate_url: `https://www.amazon.de/s?k=${encodeURIComponent(match.item.search_query)}&tag=pickdesign-21`,
                          source: 'amazon',
                        }}
                        item={match.item}
                        featured={index === 0}
                      />
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
