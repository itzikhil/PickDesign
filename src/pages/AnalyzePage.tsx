import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { MeasurementOverlay } from '../components/MeasurementOverlay';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useApp } from '../context/AppContext';
import { analyzeSpace } from '../lib/claude';

export function AnalyzePage() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const [showMeasurements, setShowMeasurements] = useState(false);

  const heroPhoto = state.photos[0] ?? null;

  // Redirect if no photos
  useEffect(() => {
    if (state.photos.length === 0) {
      navigate('/');
    }
  }, [state.photos, navigate]);

  // Analyze space on mount
  useEffect(() => {
    if (state.photos.length > 0 && !state.spaceAnalysis && !state.isAnalyzing) {
      dispatch({ type: 'SET_ANALYZING', payload: true });

      analyzeSpace(state.photos)
        .then((analysis) => {
          dispatch({ type: 'SET_SPACE_ANALYSIS', payload: analysis });
        })
        .catch((error) => {
          console.error('Failed to analyze space:', error);
          alert('Failed to analyze the photos. Please try again.');
          navigate('/');
        })
        .finally(() => {
          dispatch({ type: 'SET_ANALYZING', payload: false });
        });
    }
  }, [state.photos, state.spaceAnalysis, state.isAnalyzing, dispatch, navigate]);

  const handleUpdateMeasurement = (id: string, value: number | null) => {
    dispatch({ type: 'UPDATE_MEASUREMENT', payload: { id, value } });
  };

  const handleContinueWithEstimates = () => {
    // Use AI estimates for all surfaces
    if (state.spaceAnalysis) {
      state.spaceAnalysis.surfaces_to_measure.forEach((surface) => {
        if (surface.estimated_cm) {
          dispatch({ type: 'UPDATE_MEASUREMENT', payload: { id: surface.id, value: surface.estimated_cm } });
        }
      });
    }
    navigate('/preferences');
  };

  const handleComplete = () => {
    navigate('/preferences');
  };

  const handleBack = () => {
    dispatch({ type: 'RESET' });
    navigate('/');
  };

  if (!heroPhoto) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <Header showBack onBack={handleBack} />

      <main className="pt-20 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Content */}
          {state.isAnalyzing ? (
            <>
              <div className="text-center mb-8">
                <h1 className="font-display text-2xl font-bold text-ink mb-2">
                  Understanding your space
                </h1>
                <p className="text-ink/70">
                  Just a moment...
                </p>
              </div>
              <LoadingSpinner
                message="Looking at your space"
                submessage="Just a moment..."
              />
            </>
          ) : state.spaceAnalysis ? (
            <>
              {/* Photo preview (hero angle) */}
              <div className="relative rounded-2xl overflow-hidden mb-4">
                <img
                  src={heroPhoto}
                  alt="Your space"
                  className="w-full h-auto"
                />
                {/* Detected space badge */}
                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg">
                  <p className="text-sm font-medium text-ink">
                    {state.spaceAnalysis.space_type}
                  </p>
                </div>
              </div>

              {/* Angle thumbnails */}
              {state.photos.length > 1 && (
                <div className="mb-6">
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {state.photos.map((photo, i) => (
                      <div
                        key={i}
                        className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                          i === 0 ? 'border-teal' : 'border-warm'
                        }`}
                      >
                        <img src={photo} alt={`Angle ${i + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[10px] font-semibold text-center py-0.5">
                          Angle {i + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-ink/50 mt-2">
                    Analyzing {state.photos.length} angles together
                  </p>
                </div>
              )}

              {/* Simplified flow - default skip */}
              {!showMeasurements ? (
                <div className="space-y-4">
                  {/* Main CTA - continue with estimates */}
                  <button
                    onClick={handleContinueWithEstimates}
                    className="w-full py-4 px-6 bg-teal text-white rounded-full font-semibold text-lg hover:bg-teal/90 transition-all shadow-lg hover:shadow-xl"
                  >
                    Continue
                  </button>

                  <p className="text-center text-sm text-ink/60">
                    We'll estimate dimensions from your photo
                  </p>

                  {/* Optional toggle for exact measurements */}
                  <button
                    onClick={() => setShowMeasurements(true)}
                    className="w-full py-3 px-6 text-ink/70 hover:text-ink transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                    I want to enter exact measurements
                  </button>
                </div>
              ) : (
                <>
                  {/* Page title for measurement mode */}
                  <div className="text-center mb-6">
                    <h2 className="font-display text-xl font-semibold text-ink mb-1">
                      Enter measurements
                    </h2>
                    <p className="text-sm text-ink/70">
                      For more accurate recommendations
                    </p>
                  </div>

                  {/* Measurement overlay */}
                  <MeasurementOverlay
                    photoUrl={heroPhoto}
                    surfaces={state.spaceAnalysis.surfaces_to_measure}
                    measurements={state.measurements}
                    onUpdateMeasurement={handleUpdateMeasurement}
                    onComplete={handleComplete}
                  />

                  {/* Back to skip option */}
                  <button
                    onClick={() => setShowMeasurements(false)}
                    className="w-full mt-4 py-3 px-6 text-ink/60 hover:text-ink transition-colors text-sm"
                  >
                    ← Back to automatic estimation
                  </button>
                </>
              )}
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}
