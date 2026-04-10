'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Minus, Plus, ShoppingBag, ArrowLeft, Check } from 'lucide-react';
import type { Product } from '@/types';
import { productsApi } from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import { useTranslation } from '@/lib/i18n';
import { useTelemetry } from '@/hooks/useTelemetry';
import ProductGallery from '@/components/product/ProductGallery';
import ProductCard from '@/components/product/ProductCard';

export default function ProductDetailClient({ slug }: { slug: string }) {
  const { t } = useTranslation();
  const { trackAddToCart } = useTelemetry(`Producto: ${slug}`);

  const addItem = useCartStore((s) => s.addItem);

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    productsApi
      .getBySlug(slug)
      .then((p) => {
        setProduct(p);
        // Fetch related products
        productsApi
          .getRelated(p.id)
          .then((related) => setRelatedProducts(related.slice(0, 4)))
          .catch(() => setRelatedProducts([]));
      })
      .catch(() => setProduct(null))
      .finally(() => setIsLoading(false));
  }, [slug]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product, quantity);
    trackAddToCart(product.id, product.name, quantity, product.price);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="animate-pulse">
          <div className="h-4 bg-brand-cream rounded w-40 mb-8" />
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            <div className="aspect-square bg-brand-cream rounded-2xl" />
            <div className="space-y-4">
              <div className="h-3 bg-brand-cream rounded w-24" />
              <div className="h-8 bg-brand-cream rounded w-3/4" />
              <div className="h-6 bg-brand-cream rounded w-32" />
              <div className="h-20 bg-brand-cream rounded mt-6" />
              <div className="h-12 bg-brand-cream rounded-xl mt-6" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-2xl font-semibold text-brand-charcoal mb-4">
          Producto no encontrado
        </h1>
        <Link href="/productos" className="btn-primary">
          {t('common.back')} a productos
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <Link
          href="/productos"
          className="inline-flex items-center gap-1.5 text-sm text-brand-warm-gray hover:text-brand-rose-gold transition-colors"
        >
          <ArrowLeft size={16} />
          {t('nav.products')}
        </Link>
      </nav>

      {/* Product detail */}
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Gallery */}
        <ProductGallery images={product.images} productName={product.name} />

        {/* Info */}
        <div>
          <p className="text-sm text-brand-warm-gray font-medium">
            {product.brand}
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl text-brand-charcoal">
            {product.name}
          </h1>

          <div className="mt-4">
            <p className="text-2xl font-semibold text-brand-rose-gold">
              {formatPrice(product.price)}
            </p>
            <p className="text-xs text-brand-warm-gray mt-0.5">
              {t('product.ivaIncluded')}
            </p>
          </div>

          {/* Stock indicator */}
          {product.stock > 0 ? (
            <p className="mt-3 text-sm text-emerald-600 flex items-center gap-1">
              <Check size={14} />
              En stock ({product.stock} disponibles)
            </p>
          ) : (
            <p className="mt-3 text-sm text-red-500">
              {t('product.outOfStock')}
            </p>
          )}

          {/* Description */}
          <div className="mt-6 pt-6 border-t border-brand-cream-dark">
            <h3 className="text-sm font-semibold text-brand-charcoal mb-3">
              {t('product.description')}
            </h3>
            <p className="text-sm text-brand-charcoal-light leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Quantity + Add to Cart */}
          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-brand-charcoal">
                {t('product.quantity')}
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-brand-cream-dark text-brand-charcoal-light hover:border-brand-rose-gold hover:text-brand-rose-gold transition-colors"
                >
                  <Minus size={16} />
                </button>
                <span className="w-12 text-center text-base font-medium text-brand-charcoal">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity(Math.min(product.stock, quantity + 1))
                  }
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-brand-cream-dark text-brand-charcoal-light hover:border-brand-rose-gold hover:text-brand-rose-gold transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-medium transition-all duration-200 ${
                isAdded
                  ? 'bg-emerald-500 text-white'
                  : product.stock === 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-brand-rose-gold text-white hover:bg-brand-rose-gold-dark active:scale-[0.98]'
              }`}
            >
              {isAdded ? (
                <>
                  <Check size={18} />
                  {t('product.added')}
                </>
              ) : (
                <>
                  <ShoppingBag size={18} />
                  {t('product.addToCart')}
                </>
              )}
            </button>
          </div>

          {/* SKU / Tags */}
          <div className="mt-6 pt-6 border-t border-brand-cream-dark space-y-2">
            <p className="text-xs text-brand-warm-gray">
              SKU: {product.sku}
            </p>
            {product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-brand-cream text-xs text-brand-charcoal-light rounded-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <section className="mt-16 sm:mt-20">
          <h2 className="font-display text-display-sm text-brand-charcoal mb-8">
            {t('product.related')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((rp, i) => (
              <ProductCard key={rp.id} product={rp} position={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
