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
          // Elegant solid color card with typography
          <div className="w-full h-full bg-sage/20 flex items-center justify-center p-6">
            <p className="font-display text-xl md:text-2xl font-semibold text-sage text-center capitalize leading-tight">
              {item.type}
            </p>
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
