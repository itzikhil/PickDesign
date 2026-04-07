import type { RecommendedItem } from '../lib/types';

interface InteractivePhotoOverlayProps {
  photoUrl: string;
  items: RecommendedItem[];
  onItemClick?: (item: RecommendedItem, index: number) => void;
}

function getAmazonUrl(item: RecommendedItem): string {
  return `https://www.amazon.de/s?k=${encodeURIComponent(item.search_query)}&tag=pickdesign-21`;
}

export function InteractivePhotoOverlay({
  photoUrl,
  items,
}: InteractivePhotoOverlayProps) {
  return (
    <div className="rounded-2xl overflow-hidden bg-ink/5">
      {/* Photo */}
      <img
        src={photoUrl}
        alt="Your space"
        className="w-full h-auto"
      />

      {/* Numbered legend bar at bottom */}
      {items.length > 0 && (
        <div className="bg-ink/95 backdrop-blur-sm px-4 py-3">
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {items.map((item, index) => (
              <a
                key={index}
                href={getAmazonUrl(item)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-white/90 hover:text-gold transition-colors"
              >
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </span>
                <span className="capitalize">{item.type}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
