// Server component wrapper for the product detail page.
// `generateStaticParams` lets Next.js prebuild one HTML file per slug
// during static export (`output: 'export'`), which is required for
// GitHub Pages hosting.

import ProductDetailClient from './ProductDetailClient';
import { MOCK_PRODUCTS } from '@/lib/mockData';

export function generateStaticParams() {
  return MOCK_PRODUCTS.map((p) => ({ slug: p.slug }));
}

// Force static generation -- the dynamic data is fetched on the client
export const dynamicParams = false;

interface PageProps {
  params: { slug: string };
}

export default function ProductPage({ params }: PageProps) {
  return <ProductDetailClient slug={params.slug} />;
}
