import type { DesignRecommendation } from '../lib/types';

interface DesignSuggestionProps {
  recommendation: DesignRecommendation;
}

function calculateEstimatedTotal(recommendation: DesignRecommendation): { min: number; max: number } | null {
  const itemsWithPrices = recommendation.items.filter((item) => item.price_range_eur);
  if (itemsWithPrices.length === 0) return null;

  const min = itemsWithPrices.reduce((sum, item) => sum + (item.price_range_eur?.min || 0), 0);
  const max = itemsWithPrices.reduce((sum, item) => sum + (item.price_range_eur?.max || 0), 0);

  return { min, max };
}

function generatePaintSearchUrl(colorName: string): string {
  const searchQuery = `wandfarbe ${colorName}`.replace(/\s+/g, '+');
  return `https://www.amazon.de/s?k=${encodeURIComponent(searchQuery)}&tag=pickdesign-21`;
}

export function DesignSuggestion({ recommendation }: DesignSuggestionProps) {
  const estimatedTotal = calculateEstimatedTotal(recommendation);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Estimated total cost */}
      {estimatedTotal && (
        <div className="bg-accent text-white rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Estimated Total</p>
              <p className="text-3xl font-bold">
                €{estimatedTotal.min} - €{estimatedTotal.max}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-white/70 text-sm mt-2">
            Based on {recommendation.items.filter((i) => i.price_range_eur).length} items with price estimates
          </p>
        </div>
      )}

      {/* Concept overview */}
      <div className="bg-white rounded-2xl p-6 border border-warm mb-6">
        <h3 className="font-display text-lg font-semibold text-ink mb-2">The vision</h3>
        <p className="text-ink/80 leading-relaxed">{recommendation.concept}</p>

        {recommendation.styling_tip && (
          <div className="mt-4 p-4 bg-sage-light rounded-xl">
            <p className="text-sm text-sage font-medium">
              <span className="inline-block mr-2">*</span>
              {recommendation.styling_tip}
            </p>
          </div>
        )}
      </div>

      {/* Wall color suggestion */}
      {recommendation.wall_color && (
        <div className="bg-white rounded-2xl p-6 border border-warm mb-6">
          <h3 className="font-display text-lg font-semibold text-ink mb-3">Wall color</h3>
          <div className="flex items-start gap-4">
            <div
              className="w-20 h-20 rounded-xl shadow-inner border border-black/10 flex-shrink-0"
              style={{ backgroundColor: recommendation.wall_color.hex }}
            />
            <div className="flex-1">
              <p className="font-semibold text-ink">{recommendation.wall_color.name}</p>
              <p className="text-sm text-ink/60 font-mono">{recommendation.wall_color.hex}</p>
              {recommendation.wall_color.note && (
                <p className="text-sm text-ink/70 mt-1">{recommendation.wall_color.note}</p>
              )}
              <a
                href={generatePaintSearchUrl(recommendation.wall_color.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-accent text-white text-sm font-medium rounded-full hover:bg-accent/90 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Shop this paint
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Item recommendations summary */}
      <div className="bg-white rounded-2xl p-6 border border-warm">
        <h3 className="font-display text-lg font-semibold text-ink mb-4">
          What you'll need
        </h3>
        <div className="space-y-4">
          {recommendation.items.map((item, index) => (
            <div
              key={index}
              id={`item-${index}`}
              className="flex items-start gap-4 p-4 bg-cream rounded-xl scroll-mt-24"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent-light flex items-center justify-center">
                <span className="text-accent font-semibold">{index + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
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
                  {item.price_range_eur && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent-light text-accent font-medium">
                      €{item.price_range_eur.min} - €{item.price_range_eur.max}
                    </span>
                  )}
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
