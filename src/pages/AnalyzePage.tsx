import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { MeasurementOverlay } from '../components/MeasurementOverlay';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useApp } from '../context/AppContext';
import { analyzeSpace } from '../lib/claude';

export function AnalyzePage() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();

  // Redirect if no photo
  useEffect(() => {
    if (!state.photo) {
      navigate('/');
    }
  }, [state.photo, navigate]);

  // Analyze space on mount
  useEffect(() => {
    if (state.photo && !state.spaceAnalysis && !state.isAnalyzing) {
      dispatch({ type: 'SET_ANALYZING', payload: true });

      analyzeSpace(state.photo)
        .then((analysis) => {
          dispatch({ type: 'SET_SPACE_ANALYSIS', payload: analysis });
        })
        .catch((error) => {
          console.error('Failed to analyze space:', error);
          alert('Failed to analyze the photo. Please try again.');
          navigate('/');
        })
        .finally(() => {
          dispatch({ type: 'SET_ANALYZING', payload: false });
        });
    }
  }, [state.photo, state.spaceAnalysis, state.isAnalyzing, dispatch, navigate]);

  const handleUpdateMeasurement = (id: string, value: number | null) => {
    dispatch({ type: 'UPDATE_MEASUREMENT', payload: { id, value } });
  };

  const handleComplete = () => {
    navigate('/preferences');
  };

  const handleBack = () => {
    dispatch({ type: 'RESET' });
    navigate('/');
  };

  if (!state.photo) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <Header showBack onBack={handleBack} />

      <main className="pt-20 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Page title */}
          <div className="text-center mb-8">
            <h1 className="font-display text-2xl font-bold text-ink mb-2">
              {state.isAnalyzing ? 'Understanding your space' : 'Add measurements'}
            </h1>
            <p className="text-ink/70">
              {state.isAnalyzing
                ? 'Identifying key areas to measure...'
                : 'Enter the dimensions for accurate recommendations'}
            </p>
          </div>

          {/* Content */}
          {state.isAnalyzing ? (
            <LoadingSpinner
              message="Looking at your space"
              submessage="Just a moment..."
            />
          ) : state.spaceAnalysis ? (
            <>
              {/* Space analysis summary */}
              <div className="bg-white rounded-2xl p-4 mb-6 border border-warm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sage-light flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-sage"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-ink">
                      Detected: {state.spaceAnalysis.space_type}
                    </p>
                    <p className="text-sm text-ink/70 mt-1">
                      {state.spaceAnalysis.existing_items.length > 0 && (
                        <>Existing items: {state.spaceAnalysis.existing_items.join(', ')}</>
                      )}
                    </p>
                    {state.spaceAnalysis.constraints.length > 0 && (
                      <p className="text-sm text-ink/60 mt-1">
                        Constraints: {state.spaceAnalysis.constraints.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Measurement overlay */}
              <MeasurementOverlay
                photoUrl={state.photo}
                surfaces={state.spaceAnalysis.surfaces_to_measure}
                measurements={state.measurements}
                onUpdateMeasurement={handleUpdateMeasurement}
                onComplete={handleComplete}
              />
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}
