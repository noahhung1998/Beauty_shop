'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Check, Sparkles } from 'lucide-react';
import type { Product } from '@/types';
import { useCartStore } from '@/store/cartStore';
import { useTelemetry } from '@/hooks/useTelemetry';
import { useTranslation } from '@/lib/i18n';

interface ProductCardProps {
  product: Product;
  position?: number;
}

export default function ProductCard({ product, position }: ProductCardProps) {
  const { t } = useTranslation();
  const addItem = useCartStore((s) => s.addItem);
  const { trackItemClicked, trackAddToCart } = useTelemetry();
  const [isAdded, setIsAdded] = useState(false);

  const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
    trackAddToCart(product.id, product.name, 1, product.price);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const handleClick = () => {
    trackItemClicked(product.id, product.name, position);
  };

  return (
    <Link
      href={`/productos/${product.slug}`}
      onClick={handleClick}
      className="group block"
    >
      <div className="card overflow-hidden">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-brand-cream">
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={primaryImage.alt || product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-soft-pink to-brand-blush">
              <Sparkles
                size={32}
                className="text-brand-rose-gold/30 group-hover:scale-110 transition-transform"
              />
            </div>
          )}

          {/* Quick add button */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className={`absolute bottom-3 right-3 p-2.5 rounded-xl shadow-md transition-all duration-200 ${
              isAdded
                ? 'bg-emerald-500 text-white scale-110'
                : product.stock === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-brand-charcoal opacity-0 group-hover:opacity-100 hover:bg-brand-rose-gold hover:text-white'
            }`}
            aria-label={t('product.addToCart')}
          >
            {isAdded ? <Check size={18} /> : <ShoppingBag size={18} />}
          </button>

          {/* Out of stock overlay */}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <span className="px-3 py-1 bg-brand-charcoal text-white text-xs font-medium rounded-full">
                {t('product.outOfStock')}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <p className="text-xs text-brand-warm-gray">{product.brand}</p>
          <h3 className="text-sm font-medium text-brand-charcoal mt-0.5 line-clamp-2 group-hover:text-brand-rose-gold transition-colors">
            {product.name}
          </h3>
          <div className="mt-2">
            <p className="text-sm font-semibold text-brand-rose-gold">
              {formatPrice(product.price)}
            </p>
            <p className="text-[10px] text-brand-warm-gray">
              {t('product.ivaIncluded')}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
