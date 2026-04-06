import { useState } from 'react';
import type { RecommendedItem } from '../lib/types';

interface InteractivePhotoOverlayProps {
  photoUrl: string;
  items: RecommendedItem[];
  onItemClick: (item: RecommendedItem, index: number) => void;
}

interface PinTooltipProps {
  item: RecommendedItem;
  visible: boolean;
}

function PinTooltip({ item, visible }: PinTooltipProps) {
  if (!visible) return null;

  const priceText = item.price_range_eur
    ? `€${item.price_range_eur.min} - €${item.price_range_eur.max}`
    : 'Price varies';

  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 pointer-events-none">
      <div className="bg-ink text-white text-sm rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
        <p className="font-semibold capitalize">{item.type}</p>
        <p className="text-white/80 text-xs">
          {item.max_width_cm}×{item.max_depth_cm}×{item.max_height_cm}cm
        </p>
        <p className="text-accent-light font-medium">{priceText}</p>
        <p className="text-white/60 text-xs">Amazon.de</p>
      </div>
      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
        <div className="border-8 border-transparent border-t-ink" />
      </div>
    </div>
  );
}

export function InteractivePhotoOverlay({
  photoUrl,
  items,
  onItemClick,
}: InteractivePhotoOverlayProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Filter items that have position hints
  const positionedItems = items.filter((item) => item.position_hint);

  return (
    <div className="relative rounded-2xl overflow-hidden bg-ink/5">
      <img
        src={photoUrl}
        alt="Your space with product pins"
        className="w-full h-auto"
      />

      {/* Product pins overlay */}
      {positionedItems.map((item, index) => {
        const position = item.position_hint!;
        const isHovered = hoveredIndex === index;

        return (
          <div
            key={index}
            className="absolute"
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Tooltip */}
            <PinTooltip item={item} visible={isHovered} />

            {/* Pin button */}
            <button
              onClick={() => onItemClick(item, index)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onFocus={() => setHoveredIndex(index)}
              onBlur={() => setHoveredIndex(null)}
              className={`
                relative w-8 h-8 rounded-full flex items-center justify-center
                transition-all duration-200 cursor-pointer
                ${isHovered
                  ? 'bg-accent scale-125 shadow-lg'
                  : 'bg-white/90 hover:bg-accent shadow-md'
                }
              `}
              aria-label={`View ${item.type}`}
            >
              {/* Pin number */}
              <span
                className={`
                  text-sm font-bold
                  ${isHovered ? 'text-white' : 'text-accent'}
                `}
              >
                {index + 1}
              </span>

              {/* Pulse animation ring */}
              <span
                className={`
                  absolute inset-0 rounded-full border-2 border-accent
                  animate-ping opacity-75
                  ${isHovered ? 'hidden' : ''}
                `}
              />
            </button>
          </div>
        );
      })}

      {/* Legend */}
      {positionedItems.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md">
            <p className="text-xs text-ink/70">
              <span className="font-medium text-ink">Tap a pin</span> to see product details
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
