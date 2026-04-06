import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { PreferenceSelector } from '../components/PreferenceSelector';
import { useApp } from '../context/AppContext';

export function PreferencesPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();

  // Redirect if missing required data
  useEffect(() => {
    if (!state.photo || !state.spaceAnalysis) {
      navigate('/');
    }
  }, [state.photo, state.spaceAnalysis, navigate]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleComplete = () => {
    navigate('/results');
  };

  const handleBack = () => {
    navigate('/analyze');
  };

  if (!state.photo || !state.spaceAnalysis) {
    return null;
  }

  return (
    <div className="min-h-screen bg-cream">
      <Header showBack onBack={handleBack} />

      <main className="pt-20 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Page title */}
          <div className="text-center mb-8">
            <h1 className="font-display text-2xl font-bold text-ink mb-2">
              Your style
            </h1>
            <p className="text-ink/70">
              Tell us what you love
            </p>
          </div>

          {/* Preference selector */}
          <PreferenceSelector
            designIntent={state.preferences.designIntent}
            spaceTypes={state.preferences.spaceTypes}
            goals={state.preferences.goals}
            styles={state.preferences.styles}
            budget={state.preferences.budget}
            specialNeeds={state.preferences.specialNeeds}
            onDesignIntentChange={(v) => dispatch({ type: 'SET_DESIGN_INTENT', payload: v })}
            onSpaceTypeToggle={(v) => dispatch({ type: 'TOGGLE_SPACE_TYPE', payload: v })}
            onGoalToggle={(v) => dispatch({ type: 'TOGGLE_GOAL', payload: v })}
            onStyleToggle={(v) => dispatch({ type: 'TOGGLE_STYLE', payload: v })}
            onBudgetChange={(v) => dispatch({ type: 'SET_BUDGET', payload: v })}
            onSpecialNeedToggle={(v) => dispatch({ type: 'TOGGLE_SPECIAL_NEED', payload: v })}
            onComplete={handleComplete}
          />
        </div>
      </main>
    </div>
  );
}
