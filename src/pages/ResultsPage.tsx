import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { DesignSuggestion } from '../components/DesignSuggestion';
import { ProductCard } from '../components/ProductCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useApp } from '../context/AppContext';
import { generateDesignRecommendation } from '../lib/claude';
import { matchProducts } from '../lib/products';

export function ResultsPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();

  // Redirect if missing required data
  useEffect(() => {
    if (!state.photo || !state.spaceAnalysis || !state.preferences.spaceType) {
      navigate('/');
    }
  }, [state.photo, state.spaceAnalysis, state.preferences.spaceType, navigate]);

  // Generate design on mount
  useEffect(() => {
    if (
      state.photo &&
      state.spaceAnalysis &&
      state.preferences.spaceType &&
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

  const handleStartOver = () => {
    dispatch({ type: 'RESET' });
    navigate('/');
  };

  if (!state.photo || !state.spaceAnalysis) {
    return null;
  }

  return (
    <div className="min-h-screen bg-cream">
      <Header showBack onBack={handleBack} />

      <main className="pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Loading state */}
          {state.isGeneratingDesign && (
            <LoadingSpinner
              message="Creating your design"
              submessage="Our AI is crafting personalized recommendations..."
            />
          )}

          {/* Design results */}
          {state.designRecommendation && (
            <>
              {/* Page title */}
              <div className="text-center mb-8">
                <h1 className="font-display text-2xl font-bold text-ink mb-2">
                  Your personalized design
                </h1>
                <p className="text-ink/70">
                  Tailored recommendations for your space
                </p>
              </div>

              {/* Design suggestion */}
              <DesignSuggestion recommendation={state.designRecommendation} />

              {/* Products section */}
              <div className="mt-12">
                <h2 className="font-display text-xl font-semibold text-ink mb-6 text-center">
                  Shop the look
                </h2>

                {state.isLoadingProducts ? (
                  <LoadingSpinner message="Finding products..." />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Start over button */}
              <div className="mt-12 text-center">
                <button
                  onClick={handleStartOver}
                  className="px-8 py-3 bg-ink text-cream rounded-full font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  Design Another Space
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
