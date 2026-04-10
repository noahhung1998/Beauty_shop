'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useTranslation } from '@/lib/i18n';
import clsx from 'clsx';

export default function CartDrawer() {
  const { t } = useTranslation();
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    itemCount,
    subtotalNeto,
    ivaAmount,
    total,
  } = useCartStore();

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [closeCart]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(price);

  return (
    <>
      {/* Backdrop */}
      <div
        className={clsx(
          'fixed inset-0 z-50 bg-black/40 transition-opacity duration-300',
          isOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none',
        )}
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className={clsx(
          'fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white shadow-drawer transition-transform duration-300 ease-out flex flex-col',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
        role="dialog"
        aria-modal="true"
        aria-label={t('cart.title')}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-cream-dark">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-brand-rose-gold" />
            <h2 className="text-lg font-semibold text-brand-charcoal">
              {t('cart.title')}
            </h2>
            {itemCount() > 0 && (
              <span className="text-sm text-brand-warm-gray">
                ({t('cart.itemCount', { count: itemCount() })})
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="p-2 -mr-2 text-brand-warm-gray hover:text-brand-charcoal transition-colors"
            aria-label={t('common.close')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag
                size={48}
                className="text-brand-cream-dark mb-4"
              />
              <p className="text-brand-charcoal font-medium">
                {t('cart.empty')}
              </p>
              <p className="text-sm text-brand-warm-gray mt-1">
                {t('cart.emptyMessage')}
              </p>
              <button
                type="button"
                onClick={closeCart}
                className="mt-6 px-6 py-2.5 bg-brand-rose-gold text-white text-sm font-medium rounded-xl hover:bg-brand-rose-gold-dark transition-colors"
              >
                {t('cart.continueShopping')}
              </button>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li
                  key={item.product.id}
                  className="flex gap-4 p-3 bg-brand-cream/50 rounded-xl"
                >
                  {/* Product image */}
                  <div className="relative w-20 h-20 flex-shrink-0 bg-brand-cream rounded-lg overflow-hidden">
                    {item.product.images?.[0] ? (
                      <Image
                        src={item.product.images[0].url}
                        alt={item.product.images[0].alt || item.product.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-brand-warm-gray">
                        <ShoppingBag size={24} />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-charcoal truncate">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-brand-warm-gray mt-0.5">
                      {item.product.brand}
                    </p>
                    <p className="text-sm font-semibold text-brand-rose-gold mt-1">
                      {formatPrice(item.product.price)}
                    </p>

                    {/* Quantity controls */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.product.id,
                              item.quantity - 1,
                            )
                          }
                          className="w-7 h-7 flex items-center justify-center rounded-md border border-brand-cream-dark text-brand-charcoal-light hover:border-brand-rose-gold hover:text-brand-rose-gold transition-colors"
                          aria-label="Reducir cantidad"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center text-sm font-medium text-brand-charcoal">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.product.id,
                              item.quantity + 1,
                            )
                          }
                          className="w-7 h-7 flex items-center justify-center rounded-md border border-brand-cream-dark text-brand-charcoal-light hover:border-brand-rose-gold hover:text-brand-rose-gold transition-colors"
                          aria-label="Aumentar cantidad"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.product.id)}
                        className="p-1.5 text-brand-warm-gray hover:text-red-500 transition-colors"
                        aria-label={t('cart.remove')}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer with totals */}
        {items.length > 0 && (
          <div className="border-t border-brand-cream-dark px-6 py-4 space-y-3">
            <div className="flex justify-between text-sm text-brand-charcoal-light">
              <span>{t('cart.subtotal')}</span>
              <span>{formatPrice(subtotalNeto())}</span>
            </div>
            <div className="flex justify-between text-sm text-brand-charcoal-light">
              <span>{t('cart.iva')}</span>
              <span>{formatPrice(ivaAmount())}</span>
            </div>
            <div className="flex justify-between text-base font-semibold text-brand-charcoal pt-2 border-t border-brand-cream-dark">
              <span>{t('cart.total')}</span>
              <span>{formatPrice(total())}</span>
            </div>

            <Link
              href="/checkout"
              onClick={closeCart}
              className="block w-full py-3.5 bg-brand-rose-gold text-white text-center font-medium rounded-xl hover:bg-brand-rose-gold-dark transition-colors mt-2"
            >
              {t('cart.checkout')}
            </Link>

            <button
              type="button"
              onClick={closeCart}
              className="block w-full py-2.5 text-center text-sm text-brand-charcoal-light hover:text-brand-rose-gold transition-colors"
            >
              {t('cart.continueShopping')}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
