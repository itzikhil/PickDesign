import type { DesignRecommendation } from '../lib/types';

interface DesignSuggestionProps {
  recommendation: DesignRecommendation;
}

export function DesignSuggestion({ recommendation }: DesignSuggestionProps) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Concept overview */}
      <div className="bg-white rounded-2xl p-6 border border-warm mb-6">
        <h3 className="text-lg font-semibold text-ink mb-2">Design Concept</h3>
        <p className="text-ink/80 leading-relaxed">{recommendation.concept}</p>

        {recommendation.styling_tip && (
          <div className="mt-4 p-4 bg-sage-light rounded-xl">
            <p className="text-sm text-sage font-medium">
              <span className="inline-block mr-2">💡</span>
              {recommendation.styling_tip}
            </p>
          </div>
        )}
      </div>

      {/* Wall color suggestion */}
      {recommendation.wall_color && (
        <div className="bg-white rounded-2xl p-6 border border-warm mb-6">
          <h3 className="text-lg font-semibold text-ink mb-3">Suggested Wall Color</h3>
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-xl shadow-inner border border-black/10"
              style={{ backgroundColor: recommendation.wall_color.hex }}
            />
            <div>
              <p className="font-semibold text-ink">{recommendation.wall_color.name}</p>
              <p className="text-sm text-ink/60 font-mono">{recommendation.wall_color.hex}</p>
              {recommendation.wall_color.note && (
                <p className="text-sm text-ink/70 mt-1">{recommendation.wall_color.note}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Item recommendations summary */}
      <div className="bg-white rounded-2xl p-6 border border-warm">
        <h3 className="text-lg font-semibold text-ink mb-4">
          Recommended Items ({recommendation.items.length})
        </h3>
        <div className="space-y-4">
          {recommendation.items.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-4 bg-cream rounded-xl"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent-light flex items-center justify-center">
                <span className="text-accent font-semibold">{index + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-ink capitalize">{item.type}</p>
                  <span
                    className={`
                      text-xs px-2 py-0.5 rounded-full
                      ${item.priority === 'essential' ? 'bg-accent text-white' :
                        item.priority === 'recommended' ? 'bg-sage-light text-sage' :
                        'bg-warm text-ink/60'}
                    `}
                  >
                    {item.priority}
                  </span>
                </div>
                <p className="text-sm text-ink/70 mt-1">{item.placement}</p>
                <div className="flex flex-wrap gap-2 mt-2 text-xs text-ink/60">
                  <span className="bg-white px-2 py-1 rounded">
                    Max: {item.max_width_cm}×{item.max_depth_cm}×{item.max_height_cm}cm
                  </span>
                  <span className="bg-white px-2 py-1 rounded">
                    {item.color}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
