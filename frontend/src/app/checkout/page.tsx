'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Lock, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useTranslation } from '@/lib/i18n';
import { useTelemetry } from '@/hooks/useTelemetry';
import CheckoutForm from '@/components/checkout/CheckoutForm';

export default function CheckoutPage() {
  const { t } = useTranslation();
  const { trackCheckoutStarted } = useTelemetry('Checkout');
  const { items, total, itemCount } = useCartStore();

  // Track checkout started
  useEffect(() => {
    if (items.length > 0) {
      trackCheckoutStarted(total(), itemCount());
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(price);

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <ShoppingBag size={48} className="mx-auto text-brand-cream-dark mb-4" />
        <h1 className="text-2xl font-semibold text-brand-charcoal mb-2">
          {t('cart.empty')}
        </h1>
        <p className="text-brand-warm-gray mb-6">{t('cart.emptyMessage')}</p>
        <Link href="/productos" className="btn-primary">
          {t('cart.continueShopping')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/productos"
          className="inline-flex items-center gap-1.5 text-sm text-brand-warm-gray hover:text-brand-rose-gold transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          {t('cart.continueShopping')}
        </Link>
        <h1 className="font-display text-display-sm sm:text-display-md text-brand-charcoal">
          {t('checkout.title')}
        </h1>
      </div>

      <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
        {/* Checkout form */}
        <div className="lg:col-span-3">
          <CheckoutForm />
        </div>

        {/* Order summary sidebar */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 bg-brand-cream/50 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-brand-charcoal mb-4">
              {t('checkout.summary')}
            </h2>

            {/* Items */}
            <ul className="space-y-3 mb-6">
              {items.map((item) => (
                <li
                  key={item.product.id}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 bg-brand-cream rounded-lg flex-shrink-0 flex items-center justify-center">
                      <ShoppingBag
                        size={16}
                        className="text-brand-warm-gray"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-brand-charcoal truncate">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-brand-warm-gray">
                        x{item.quantity}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-brand-charcoal flex-shrink-0">
                    {formatPrice(item.product.price * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>

            {/* Totals */}
            <div className="border-t border-brand-cream-dark pt-4 space-y-2">
              <div className="flex justify-between text-sm text-brand-charcoal-light">
                <span>{t('checkout.subtotalNeto')}</span>
                <span>
                  {formatPrice(
                    items.reduce(
                      (sum, item) =>
                        sum +
                        (item.product.price / 1.16) * item.quantity,
                      0,
                    ),
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm text-brand-charcoal-light">
                <span>{t('checkout.ivaAmount')}</span>
                <span>
                  {formatPrice(
                    items.reduce(
                      (sum, item) =>
                        sum +
                        (item.product.price -
                          item.product.price / 1.16) *
                          item.quantity,
                      0,
                    ),
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm text-brand-charcoal-light">
                <span>{t('checkout.shippingCost')}</span>
                <span className="text-emerald-600">
                  {t('cart.shippingFree')}
                </span>
              </div>
              <div className="flex justify-between text-base font-semibold text-brand-charcoal pt-2 border-t border-brand-cream-dark">
                <span>{t('checkout.totalAmount')}</span>
                <span>{formatPrice(total())}</span>
              </div>
            </div>

            {/* Secure payment badge */}
            <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-brand-warm-gray">
              <Lock size={12} />
              {t('checkout.secure')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
