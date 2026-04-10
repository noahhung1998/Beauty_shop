'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles, Truck, ShieldCheck } from 'lucide-react';
import type { Product } from '@/types';
import { productsApi } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import { useTelemetry } from '@/hooks/useTelemetry';
import ProductCard from '@/components/product/ProductCard';

// Placeholder categories for the storefront
const CATEGORIES = [
  {
    name: 'Maquillaje',
    slug: 'maquillaje',
    image: '/images/category-makeup.jpg',
    color: 'from-pink-200 to-rose-300',
  },
  {
    name: 'Skincare',
    slug: 'skincare',
    image: '/images/category-skincare.jpg',
    color: 'from-amber-100 to-orange-200',
  },
  {
    name: 'Cabello',
    slug: 'cabello',
    image: '/images/category-hair.jpg',
    color: 'from-violet-200 to-purple-300',
  },
  {
    name: 'Fragancias',
    slug: 'fragancias',
    image: '/images/category-fragrance.jpg',
    color: 'from-sky-100 to-blue-200',
  },
];

export default function HomePage() {
  const { t } = useTranslation();
  useTelemetry('Inicio');

  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    productsApi
      .getFeatured()
      .then((products) => setFeaturedProducts(products.slice(0, 8)))
      .catch(() => {
        // Use placeholder data on API failure for development
        setFeaturedProducts([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <div>
      {/* ── Hero Banner ─────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-cream via-brand-soft-pink to-brand-blush">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/60 backdrop-blur-sm text-brand-rose-gold text-xs font-medium rounded-full mb-6">
                <Sparkles size={14} />
                Nueva Colección 2026
              </span>
              <h1 className="font-display text-display-lg sm:text-[4rem] text-brand-charcoal leading-tight">
                {t('home.hero.title')}
              </h1>
              <p className="mt-6 text-lg text-brand-charcoal-light max-w-xl mx-auto lg:mx-0 leading-relaxed">
                {t('home.hero.subtitle')}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/productos" className="btn-primary text-base gap-2">
                  {t('home.hero.cta')}
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>

            {/* Hero image placeholder */}
            <div className="relative hidden lg:block">
              <div className="aspect-[4/5] rounded-3xl bg-gradient-to-br from-brand-rose-gold-light/30 to-brand-blush overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 rounded-full bg-brand-rose-gold/10 flex items-center justify-center">
                    <Sparkles size={64} className="text-brand-rose-gold/40" />
                  </div>
                </div>
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-card p-4">
                <p className="text-xs text-brand-warm-gray">Envío gratis</p>
                <p className="text-lg font-semibold text-brand-charcoal">
                  +$999 MXN
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative dots */}
        <div className="absolute top-12 right-12 w-24 h-24 opacity-10">
          <svg viewBox="0 0 100 100" fill="currentColor" className="text-brand-rose-gold">
            {Array.from({ length: 25 }).map((_, i) => (
              <circle
                key={i}
                cx={10 + (i % 5) * 20}
                cy={10 + Math.floor(i / 5) * 20}
                r="3"
              />
            ))}
          </svg>
        </div>
      </section>

      {/* ── Trust badges ────────────────────────────────── */}
      <section className="border-b border-brand-cream-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="w-10 h-10 bg-brand-cream rounded-xl flex items-center justify-center">
                <Truck size={20} className="text-brand-rose-gold" />
              </div>
              <div>
                <p className="text-sm font-medium text-brand-charcoal">
                  Envío gratis
                </p>
                <p className="text-xs text-brand-warm-gray">
                  En compras mayores a $999
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <div className="w-10 h-10 bg-brand-cream rounded-xl flex items-center justify-center">
                <ShieldCheck size={20} className="text-brand-rose-gold" />
              </div>
              <div>
                <p className="text-sm font-medium text-brand-charcoal">
                  Pago seguro
                </p>
                <p className="text-xs text-brand-warm-gray">
                  Encriptación SSL
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-center sm:justify-end">
              <div className="w-10 h-10 bg-brand-cream rounded-xl flex items-center justify-center">
                <Sparkles size={20} className="text-brand-rose-gold" />
              </div>
              <div>
                <p className="text-sm font-medium text-brand-charcoal">
                  100% originales
                </p>
                <p className="text-xs text-brand-warm-gray">
                  Productos auténticos
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Categories ──────────────────────────────────── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-display-sm sm:text-display-md text-brand-charcoal">
              {t('home.categories')}
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/productos?category=${cat.slug}`}
                className="group relative aspect-[3/4] rounded-2xl overflow-hidden"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${cat.color} transition-transform duration-500 group-hover:scale-105`}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                  <div className="w-16 h-16 bg-white/40 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Sparkles size={28} className="text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-brand-charcoal text-center">
                    {cat.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Products ───────────────────────────── */}
      <section className="py-16 sm:py-20 bg-brand-cream/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <h2 className="font-display text-display-sm sm:text-display-md text-brand-charcoal">
              {t('home.featured')}
            </h2>
            <Link
              href="/productos"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-brand-rose-gold hover:text-brand-rose-gold-dark transition-colors"
            >
              Ver todos
              <ArrowRight size={16} />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-brand-cream rounded-2xl mb-3" />
                  <div className="h-4 bg-brand-cream rounded w-3/4 mb-2" />
                  <div className="h-3 bg-brand-cream rounded w-1/2 mb-2" />
                  <div className="h-4 bg-brand-cream rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {featuredProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  position={index}
                />
              ))}
            </div>
          ) : (
            // Development placeholder when no API
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="card overflow-hidden group">
                  <div className="aspect-square bg-gradient-to-br from-brand-soft-pink to-brand-blush flex items-center justify-center">
                    <Sparkles
                      size={32}
                      className="text-brand-rose-gold/30 group-hover:scale-110 transition-transform"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-brand-warm-gray">Marca</p>
                    <p className="text-sm font-medium text-brand-charcoal mt-0.5">
                      Producto de ejemplo {i + 1}
                    </p>
                    <p className="text-sm font-semibold text-brand-rose-gold mt-2">
                      $499.00 MXN
                    </p>
                    <p className="text-[10px] text-brand-warm-gray">
                      {t('product.ivaIncluded')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 text-center sm:hidden">
            <Link
              href="/productos"
              className="btn-outline text-sm gap-1.5"
            >
              Ver todos los productos
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Newsletter ──────────────────────────────────── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-brand-charcoal to-brand-charcoal-light rounded-3xl p-8 sm:p-12 text-center">
            <h2 className="font-display text-display-sm sm:text-display-md text-white">
              {t('home.newsletter.title')}
            </h2>
            <p className="mt-3 text-brand-rose-gold-light max-w-md mx-auto">
              {t('home.newsletter.subtitle')}
            </p>
            {subscribed ? (
              <p className="mt-6 text-brand-gold-light font-medium">
                {t('home.newsletter.success')}
              </p>
            ) : (
              <form
                onSubmit={handleNewsletterSubmit}
                className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('home.newsletter.placeholder')}
                  required
                  className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-sm placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-brand-rose-gold/50 focus:border-brand-rose-gold"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-brand-rose-gold text-white text-sm font-medium rounded-xl hover:bg-brand-rose-gold-dark transition-colors"
                >
                  {t('home.newsletter.button')}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
