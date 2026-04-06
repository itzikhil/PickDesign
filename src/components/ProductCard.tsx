import type { Product, RecommendedItem } from '../lib/types';
import { trackProductClick } from '../lib/products';

interface ProductCardProps {
  product: Product;
  item: RecommendedItem;
}

export function ProductCard({ product, item }: ProductCardProps) {
  const handleClick = () => {
    trackProductClick(product);
    window.open(product.affiliate_url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-white rounded-2xl border border-warm overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1">
      {/* Product image placeholder */}
      <div className="aspect-square bg-cream flex items-center justify-center">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center p-6">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-accent-light flex items-center justify-center">
              <svg
                className="w-8 h-8 text-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-sm text-ink/60 capitalize">{item.type}</p>
          </div>
        )}
      </div>

      {/* Product details */}
      <div className="p-4">
        <h4 className="font-semibold text-ink capitalize mb-1">{item.type}</h4>
        <p className="text-sm text-ink/60 mb-2">{item.color}</p>

        {/* Dimensions badge */}
        {product.dimensions && (
          <div className="flex items-center gap-1 text-xs text-ink/50 mb-3">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            <span>
              Max: {item.max_width_cm}×{item.max_depth_cm}×{item.max_height_cm}cm
            </span>
          </div>
        )}

        {/* CTA Button */}
        <button
          onClick={handleClick}
          className="w-full py-3 px-4 bg-accent text-white rounded-xl font-semibold text-sm hover:bg-accent/90 transition-colors flex items-center justify-center gap-2"
        >
          <span>Search on Amazon.de</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </button>

        {/* Source badge */}
        <p className="text-center text-xs text-ink/40 mt-2">
          Affiliate link · {product.source === 'amazon' ? 'Amazon.de' : 'AWIN'}
        </p>
      </div>
    </div>
  );
}

interface ProductGridProps {
  items: RecommendedItem[];
  products: Map<string, Product[]>;
}

export function ProductGrid({ items, products }: ProductGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item, index) => {
        const itemProducts = products.get(item.type) || [];
        const product = itemProducts[0];

        if (!product) {
          // Create a fallback product for display
          const fallbackProduct: Product = {
            id: `fallback-${index}`,
            name: item.type,
            price: 0,
            currency: 'EUR',
            image_url: '',
            affiliate_url: `https://www.amazon.de/s?k=${encodeURIComponent(item.search_query)}&tag=pickdesign-21`,
            source: 'amazon',
          };
          return (
            <ProductCard
              key={index}
              product={fallbackProduct}
              item={item}
            />
          );
        }

        return (
          <ProductCard
            key={index}
            product={product}
            item={item}
          />
        );
      })}
    </div>
  );
}
