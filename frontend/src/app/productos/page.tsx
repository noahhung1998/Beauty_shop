'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product, ProductFilters } from '@/types';
import { productsApi } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import { useTelemetry } from '@/hooks/useTelemetry';
import ProductCard from '@/components/product/ProductCard';
import clsx from 'clsx';

const SORT_OPTIONS: { value: ProductFilters['sortBy']; labelKey: string }[] = [
  { value: 'popular', labelKey: 'product.sort.popular' },
  { value: 'newest', labelKey: 'product.sort.newest' },
  { value: 'price_asc', labelKey: 'product.sort.priceAsc' },
  { value: 'price_desc', labelKey: 'product.sort.priceDesc' },
  { value: 'name', labelKey: 'product.sort.name' },
];

const CATEGORIES = [
  'Maquillaje',
  'Skincare',
  'Cabello',
  'Fragancias',
  'Uñas',
  'Accesorios',
];

const BRANDS = [
  'Maybelline',
  'L\'Oréal',
  'MAC',
  'NYX',
  'Clinique',
  'Estée Lauder',
];

const PRICE_RANGES = [
  { label: 'Menos de $200', min: 0, max: 200 },
  { label: '$200 - $500', min: 200, max: 500 },
  { label: '$500 - $1,000', min: 500, max: 1000 },
  { label: 'Más de $1,000', min: 1000, max: undefined },
];

const PAGE_SIZE = 12;

function ProductosPageInner() {
  const { t } = useTranslation();
  useTelemetry('Productos');
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const [filters, setFilters] = useState<ProductFilters>({
    category: searchParams.get('category') || undefined,
    brand: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    sortBy: 'popular',
    page: 1,
    pageSize: PAGE_SIZE,
  });

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await productsApi.list(filters);
      setProducts(response.data);
      setTotalProducts(response.total);
      setTotalPages(response.totalPages);
    } catch {
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const updateFilter = (key: keyof ProductFilters, value: unknown) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? (value as number) : 1,
    }));
  };

  const clearFilters = () => {
    setFilters({
      sortBy: 'popular',
      page: 1,
      pageSize: PAGE_SIZE,
    });
  };

  const hasActiveFilters = filters.category || filters.brand || filters.minPrice || filters.maxPrice;

  const FilterSidebar = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-brand-charcoal uppercase tracking-wider">
          {t('product.filters')}
        </h3>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs text-brand-rose-gold hover:text-brand-rose-gold-dark transition-colors"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Category */}
      <div>
        <h4 className="text-sm font-medium text-brand-charcoal mb-3">
          {t('product.category')}
        </h4>
        <div className="space-y-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() =>
                updateFilter(
                  'category',
                  filters.category === cat.toLowerCase() ? undefined : cat.toLowerCase(),
                )
              }
              className={clsx(
                'block w-full text-left px-3 py-2 text-sm rounded-lg transition-colors',
                filters.category === cat.toLowerCase()
                  ? 'bg-brand-rose-gold/10 text-brand-rose-gold font-medium'
                  : 'text-brand-charcoal-light hover:bg-brand-cream',
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Brand */}
      <div>
        <h4 className="text-sm font-medium text-brand-charcoal mb-3">
          {t('product.brand')}
        </h4>
        <div className="space-y-2">
          {BRANDS.map((brand) => (
            <button
              key={brand}
              type="button"
              onClick={() =>
                updateFilter(
                  'brand',
                  filters.brand === brand ? undefined : brand,
                )
              }
              className={clsx(
                'block w-full text-left px-3 py-2 text-sm rounded-lg transition-colors',
                filters.brand === brand
                  ? 'bg-brand-rose-gold/10 text-brand-rose-gold font-medium'
                  : 'text-brand-charcoal-light hover:bg-brand-cream',
              )}
            >
              {brand}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <h4 className="text-sm font-medium text-brand-charcoal mb-3">
          {t('product.priceRange')}
        </h4>
        <div className="space-y-2">
          {PRICE_RANGES.map((range) => (
            <button
              key={range.label}
              type="button"
              onClick={() => {
                const isActive =
                  filters.minPrice === range.min &&
                  filters.maxPrice === range.max;
                if (isActive) {
                  updateFilter('minPrice', undefined);
                  setFilters((p) => ({ ...p, maxPrice: undefined }));
                } else {
                  setFilters((p) => ({
                    ...p,
                    minPrice: range.min,
                    maxPrice: range.max,
                    page: 1,
                  }));
                }
              }}
              className={clsx(
                'block w-full text-left px-3 py-2 text-sm rounded-lg transition-colors',
                filters.minPrice === range.min &&
                  filters.maxPrice === range.max
                  ? 'bg-brand-rose-gold/10 text-brand-rose-gold font-medium'
                  : 'text-brand-charcoal-light hover:bg-brand-cream',
              )}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-display text-display-sm sm:text-display-md text-brand-charcoal">
          {t('nav.products')}
        </h1>
        {!isLoading && (
          <p className="mt-2 text-sm text-brand-warm-gray">
            {t('product.showing', { count: totalProducts })}
          </p>
        )}
      </div>

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-60 flex-shrink-0">
          <FilterSidebar />
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Top bar: sort + mobile filter toggle */}
          <div className="flex items-center justify-between mb-6 gap-4">
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2.5 border border-brand-cream-dark rounded-xl text-sm text-brand-charcoal hover:border-brand-rose-gold transition-colors"
            >
              <SlidersHorizontal size={16} />
              {t('product.filters')}
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-brand-rose-gold rounded-full" />
              )}
            </button>

            <div className="flex items-center gap-2 ml-auto">
              <label className="text-sm text-brand-warm-gray hidden sm:inline">
                {t('product.sortBy')}:
              </label>
              <select
                value={filters.sortBy || 'popular'}
                onChange={(e) =>
                  updateFilter('sortBy', e.target.value as ProductFilters['sortBy'])
                }
                className="text-sm bg-transparent border border-brand-cream-dark rounded-xl px-3 py-2 text-brand-charcoal focus:outline-none focus:ring-2 focus:ring-brand-rose-gold/30 focus:border-brand-rose-gold"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {t(opt.labelKey as Parameters<typeof t>[0])}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active filter pills */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mb-6">
              {filters.category && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-brand-rose-gold/10 text-brand-rose-gold text-sm rounded-full">
                  {filters.category}
                  <button
                    type="button"
                    onClick={() => updateFilter('category', undefined)}
                    className="hover:text-brand-rose-gold-dark"
                  >
                    <X size={14} />
                  </button>
                </span>
              )}
              {filters.brand && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-brand-rose-gold/10 text-brand-rose-gold text-sm rounded-full">
                  {filters.brand}
                  <button
                    type="button"
                    onClick={() => updateFilter('brand', undefined)}
                    className="hover:text-brand-rose-gold-dark"
                  >
                    <X size={14} />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Product grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-brand-cream rounded-2xl mb-3" />
                  <div className="h-4 bg-brand-cream rounded w-3/4 mb-2" />
                  <div className="h-3 bg-brand-cream rounded w-1/2 mb-2" />
                  <div className="h-4 bg-brand-cream rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {products.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  position={index}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-lg text-brand-warm-gray">
                {t('product.noResults')}
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 btn-outline text-sm"
              >
                Limpiar filtros
              </button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                type="button"
                disabled={(filters.page || 1) <= 1}
                onClick={() => updateFilter('page', (filters.page || 1) - 1)}
                className="p-2 border border-brand-cream-dark rounded-lg text-brand-charcoal-light hover:border-brand-rose-gold hover:text-brand-rose-gold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>

              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => updateFilter('page', page)}
                    className={clsx(
                      'w-10 h-10 rounded-lg text-sm font-medium transition-colors',
                      (filters.page || 1) === page
                        ? 'bg-brand-rose-gold text-white'
                        : 'text-brand-charcoal-light hover:bg-brand-cream',
                    )}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                type="button"
                disabled={(filters.page || 1) >= totalPages}
                onClick={() => updateFilter('page', (filters.page || 1) + 1)}
                className="p-2 border border-brand-cream-dark rounded-lg text-brand-charcoal-light hover:border-brand-rose-gold hover:text-brand-rose-gold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {isMobileFilterOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 lg:hidden"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-white shadow-drawer p-6 overflow-y-auto lg:hidden animate-slide-in-right">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-brand-charcoal">
                {t('product.filters')}
              </h3>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-2 -mr-2 text-brand-warm-gray hover:text-brand-charcoal"
              >
                <X size={20} />
              </button>
            </div>
            <FilterSidebar />
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(false)}
              className="w-full mt-8 btn-primary"
            >
              Ver resultados
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function ProductosPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-12">Loading...</div>}>
      <ProductosPageInner />
    </Suspense>
  );
}
