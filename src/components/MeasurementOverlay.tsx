import { useState } from 'react';
import type { Measurement, SurfaceToMeasure } from '../lib/types';

interface MeasurementOverlayProps {
  photoUrl: string;
  surfaces: SurfaceToMeasure[];
  measurements: Measurement[];
  onUpdateMeasurement: (id: string, value: number | null) => void;
  onComplete: () => void;
}

export function MeasurementOverlay({
  photoUrl,
  surfaces,
  measurements,
  onUpdateMeasurement,
  onComplete,
}: MeasurementOverlayProps) {
  const [activeSurface, setActiveSurface] = useState<string | null>(
    surfaces[0]?.id || null
  );

  const currentSurface = surfaces.find((s) => s.id === activeSurface);
  const currentMeasurement = measurements.find((m) => m.id === activeSurface);

  const allMeasured = measurements.every((m) => m.value !== null && m.value > 0);
  const completedCount = measurements.filter((m) => m.value !== null && m.value > 0).length;

  const handleInputChange = (value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    if (activeSurface) {
      onUpdateMeasurement(activeSurface, numValue);
    }
  };

  const goToNext = () => {
    const currentIndex = surfaces.findIndex((s) => s.id === activeSurface);
    if (currentIndex < surfaces.length - 1) {
      setActiveSurface(surfaces[currentIndex + 1].id);
    }
  };

  const goToPrev = () => {
    const currentIndex = surfaces.findIndex((s) => s.id === activeSurface);
    if (currentIndex > 0) {
      setActiveSurface(surfaces[currentIndex - 1].id);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex-1 h-2 bg-warm rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${(completedCount / measurements.length) * 100}%` }}
          />
        </div>
        <span className="text-sm text-ink/60">
          {completedCount}/{measurements.length}
        </span>
      </div>

      {/* Photo with overlay */}
      <div className="relative rounded-2xl overflow-hidden bg-ink/5">
        <img
          src={photoUrl}
          alt="Space to measure"
          className="w-full h-auto"
        />

        {/* Measurement guide overlay */}
        {currentSurface && (
          <div className="absolute inset-0 bg-gradient-to-b from-ink/20 to-ink/40 flex items-center justify-center">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 m-4 max-w-sm shadow-lg">
              <p className="text-sm text-accent font-semibold mb-1">
                Measure this:
              </p>
              <p className="text-lg font-semibold text-ink">
                {currentSurface.label}
              </p>
              <p className="text-sm text-ink/70 mt-1">
                {currentSurface.description}
              </p>
              <p className="text-xs text-ink/50 mt-2 italic">
                Region: {currentSurface.region}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Measurement input */}
      <div className="mt-6 bg-white rounded-2xl p-6 border border-warm">
        <div className="flex items-center gap-4">
          <button
            onClick={goToPrev}
            disabled={surfaces.findIndex((s) => s.id === activeSurface) === 0}
            className="p-2 rounded-full hover:bg-cream disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex-1">
            <label className="block text-sm font-medium text-ink/70 mb-2">
              {currentSurface?.label || 'Measurement'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={currentMeasurement?.value ?? ''}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="0"
                min="1"
                className="w-full text-3xl font-semibold text-center bg-cream rounded-xl p-4 border-2 border-transparent focus:border-accent focus:outline-none"
              />
              <span className="text-xl text-ink/60 font-medium">cm</span>
            </div>
          </div>

          <button
            onClick={goToNext}
            disabled={surfaces.findIndex((s) => s.id === activeSurface) === surfaces.length - 1}
            className="p-2 rounded-full hover:bg-cream disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Surface selector dots */}
        <div className="flex justify-center gap-2 mt-4">
          {surfaces.map((surface) => {
            const measurement = measurements.find((m) => m.id === surface.id);
            const isActive = surface.id === activeSurface;
            const isComplete = measurement?.value != null && measurement.value > 0;

            return (
              <button
                key={surface.id}
                onClick={() => setActiveSurface(surface.id)}
                className={`
                  w-3 h-3 rounded-full transition-all
                  ${isActive ? 'scale-125' : ''}
                  ${isComplete ? 'bg-sage' : isActive ? 'bg-accent' : 'bg-warm'}
                `}
                title={surface.label}
              />
            );
          })}
        </div>
      </div>

      {/* Continue button */}
      <button
        onClick={onComplete}
        disabled={!allMeasured}
        className={`
          w-full mt-6 py-4 px-6 rounded-full font-semibold text-lg transition-all
          ${allMeasured
            ? 'bg-accent text-white hover:shadow-lg hover:-translate-y-0.5'
            : 'bg-warm text-ink/40 cursor-not-allowed'
          }
        `}
      >
        {allMeasured ? 'Continue to Preferences' : `Enter all ${measurements.length} measurements`}
      </button>
    </div>
  );
}
