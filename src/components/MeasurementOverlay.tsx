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

  const completedCount = measurements.filter((m) => m.value !== null && m.value > 0).length;

  const handleInputChange = (value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    if (activeSurface) {
      onUpdateMeasurement(activeSurface, numValue);
    }
  };

  const useEstimate = () => {
    if (activeSurface && currentSurface?.estimated_cm) {
      onUpdateMeasurement(activeSurface, currentSurface.estimated_cm);
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

  // Can continue if at least one measurement is provided, or skip with estimates
  const canContinue = measurements.some((m) => m.value !== null && m.value > 0);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray rounded-full overflow-hidden">
          <div
            className="h-full bg-teal transition-all duration-300"
            style={{ width: `${(completedCount / measurements.length) * 100}%` }}
          />
        </div>
        <span className="text-sm text-gray-dark">
          {completedCount}/{measurements.length}
        </span>
      </div>

      {/* Photo with overlay */}
      <div className="relative rounded-2xl overflow-hidden bg-gray-light">
        <img
          src={photoUrl}
          alt="Space to measure"
          className="w-full h-auto"
        />

        {/* Measurement guide overlay */}
        {currentSurface && (
          <div className="absolute inset-0 bg-gradient-to-b from-ink/20 to-ink/40 flex items-center justify-center">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-5 m-4 max-w-sm shadow-lg">
              <p className="text-sm text-teal font-semibold mb-1">
                Measure this:
              </p>
              <p className="text-lg font-semibold text-ink">
                {currentSurface.label}
              </p>
              <p className="text-sm text-ink/70 mt-1">
                {currentSurface.description}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Measurement input */}
      <div className="mt-6 bg-white rounded-2xl p-6 border border-gray">
        <div className="flex items-center gap-4">
          <button
            onClick={goToPrev}
            disabled={surfaces.findIndex((s) => s.id === activeSurface) === 0}
            className="p-2 rounded-full hover:bg-gray-light disabled:opacity-30 disabled:cursor-not-allowed"
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
                placeholder={currentSurface?.estimated_cm?.toString() || '0'}
                min="1"
                className="w-full text-3xl font-semibold text-center bg-gray-light rounded-xl p-4 border-2 border-transparent focus:border-teal focus:outline-none"
              />
              <span className="text-xl text-ink/60 font-medium">cm</span>
            </div>

            {/* AI estimate button */}
            {currentSurface?.estimated_cm && !currentMeasurement?.value && (
              <button
                onClick={useEstimate}
                className="mt-3 w-full py-2.5 px-4 bg-teal-light text-teal rounded-lg font-medium text-sm hover:bg-teal hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Use estimate: ~{currentSurface.estimated_cm}cm
              </button>
            )}
          </div>

          <button
            onClick={goToNext}
            disabled={surfaces.findIndex((s) => s.id === activeSurface) === surfaces.length - 1}
            className="p-2 rounded-full hover:bg-gray-light disabled:opacity-30 disabled:cursor-not-allowed"
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
                  ${isComplete ? 'bg-teal' : isActive ? 'bg-gold' : 'bg-gray'}
                `}
                title={surface.label}
              />
            );
          })}
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-6 space-y-3">
        <button
          onClick={onComplete}
          disabled={!canContinue}
          className={`
            w-full py-4 px-6 rounded-full font-semibold text-lg transition-all
            ${canContinue
              ? 'bg-teal text-white hover:bg-teal-dark hover:shadow-lg'
              : 'bg-gray text-ink/40 cursor-not-allowed'
            }
          `}
        >
          Continue to Preferences
        </button>

        {/* Skip option */}
        <button
          onClick={() => {
            // Use all estimates for unmeasured surfaces
            surfaces.forEach((surface) => {
              const measurement = measurements.find((m) => m.id === surface.id);
              if (!measurement?.value && surface.estimated_cm) {
                onUpdateMeasurement(surface.id, surface.estimated_cm);
              }
            });
            onComplete();
          }}
          className="w-full py-3 px-6 text-gray-dark hover:text-ink transition-colors text-sm font-medium"
        >
          Skip — use AI estimates for all
        </button>
      </div>
    </div>
  );
}
