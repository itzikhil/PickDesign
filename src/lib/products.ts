import type { RecommendedItem, Product, ProductMatch } from './types';

const AMAZON_AFFILIATE_TAG = 'pickdesign-21';

/**
 * Generate an Amazon.de search URL with affiliate tag
 */
function generateAmazonSearchUrl(searchQuery: string): string {
  const encodedQuery = encodeURIComponent(searchQuery);
  return `https://www.amazon.de/s?k=${encodedQuery}&tag=${AMAZON_AFFILIATE_TAG}`;
}

/**
 * Create a placeholder product from a recommended item
 * In MVP, we generate Amazon search links directly
 * Later, this can be enhanced with AWIN product feeds
 */
function createAmazonProduct(item: RecommendedItem, index: number): Product {
  return {
    id: `amazon-${item.type}-${index}`,
    name: item.type.charAt(0).toUpperCase() + item.type.slice(1),
    price: 0, // Price unknown until user clicks through
    currency: 'EUR',
    image_url: '', // No image available without PA-API
    dimensions: {
      width: item.max_width_cm,
      depth: item.max_depth_cm,
      height: item.max_height_cm,
    },
    affiliate_url: generateAmazonSearchUrl(item.search_query),
    source: 'amazon',
  };
}

/**
 * Match products to recommended items
 * MVP: Generate Amazon search links
 * Future: Query AWIN feeds for actual products
 */
export async function matchProducts(items: RecommendedItem[]): Promise<ProductMatch[]> {
  // Simulate async operation (for future AWIN API calls)
  await new Promise((resolve) => setTimeout(resolve, 500));

  return items.map((item) => ({
    item,
    products: [
      createAmazonProduct(item, 0),
      // In future, add more products from AWIN feeds here
    ],
  }));
}

/**
 * Track a product click for analytics
 * MVP: Just log to console
 * Future: Send to analytics service
 */
export function trackProductClick(product: Product): void {
  console.log('Product clicked:', {
    id: product.id,
    name: product.name,
    source: product.source,
    url: product.affiliate_url,
    timestamp: new Date().toISOString(),
  });
}
