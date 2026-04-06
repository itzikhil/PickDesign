import type { Product, RecommendedItem } from '../lib/types';
import { trackProductClick } from '../lib/products';

interface ProductCardProps {
  product: Product;
  item: RecommendedItem;
  featured?: boolean;
}

export function ProductCard({ product, item, featured = false }: ProductCardProps) {
  const handleClick = () => {
    trackProductClick(product);
    window.open(product.affiliate_url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      onClick={handleClick}
      className={`
        group cursor-pointer bg-white rounded-2xl overflow-hidden transition-all
        hover:shadow-xl hover:-translate-y-1
        ${featured ? 'md:col-span-2 md:row-span-2' : ''}
      `}
    >
      {/* Product image */}
      <div className={`relative ${featured ? 'aspect-[4/3]' : 'aspect-square'} bg-cream overflow-hidden`}>
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center p-4">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-warm/50 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-ink/30"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* View overlay on hover */}
        <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <span className="px-4 py-2 bg-white rounded-full text-sm font-semibold text-ink shadow-lg">
            View
          </span>
        </div>
      </div>

      {/* Product details - minimal */}
      <div className="p-4">
        <h4 className="font-semibold text-ink capitalize">{item.type}</h4>
        <p className="text-sm text-ink/60 mt-0.5">{item.color}</p>

        {/* Price if available */}
        {product.price > 0 && (
          <p className="mt-2 font-display text-lg font-semibold text-accent">
            {product.currency === 'EUR' ? '€' : product.currency}{product.price}
          </p>
        )}
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
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
      {items.map((item, index) => {
        const itemProducts = products.get(item.type) || [];
        const product = itemProducts[0];

        // Feature the first item
        const isFeatured = index === 0;

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
              featured={isFeatured}
            />
          );
        }

        return (
          <ProductCard
            key={index}
            product={product}
            item={item}
            featured={isFeatured}
          />
        );
      })}
    </div>
  );
}
