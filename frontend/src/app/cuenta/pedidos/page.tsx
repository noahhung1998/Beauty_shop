'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Package,
  Truck,
  MapPin,
  Calendar,
  Check,
  Clock,
} from 'lucide-react';
import type { Order, ShipmentStatus } from '@/types';
import { ordersApi } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import { useTelemetry } from '@/hooks/useTelemetry';
import clsx from 'clsx';

const STATUS_STEPS = [
  { key: 'pending', icon: Clock },
  { key: 'confirmed', icon: Check },
  { key: 'processing', icon: Package },
  { key: 'shipped', icon: Truck },
  { key: 'in_transit', icon: Truck },
  { key: 'delivered', icon: MapPin },
] as const;

const SHIPMENT_STATUS_COLORS: Record<ShipmentStatus, string> = {
  label_created: 'bg-gray-100 text-gray-700',
  picked_up: 'bg-blue-100 text-blue-700',
  in_transit: 'bg-indigo-100 text-indigo-700',
  out_for_delivery: 'bg-amber-100 text-amber-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  exception: 'bg-red-100 text-red-700',
  returned: 'bg-orange-100 text-orange-700',
};

function PedidosPageInner() {
  const { t } = useTranslation();
  useTelemetry('Pedido Detalle');
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    setIsLoading(true);
    ordersApi
      .getById(orderId)
      .then(setOrder)
      .catch(() => setOrder(null))
      .finally(() => setIsLoading(false));
  }, [orderId]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(price);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const formatDateTime = (dateStr: string) =>
    new Date(dateStr).toLocaleString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-4 bg-brand-cream rounded w-40" />
          <div className="h-8 bg-brand-cream rounded w-64" />
          <div className="h-24 bg-brand-cream rounded-2xl" />
          <div className="h-64 bg-brand-cream rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <Package size={48} className="mx-auto text-brand-cream-dark mb-4" />
        <h1 className="text-xl font-semibold text-brand-charcoal mb-2">
          Pedido no encontrado
        </h1>
        <Link href="/cuenta" className="btn-primary text-sm mt-4">
          {t('common.back')}
        </Link>
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.findIndex(
    (s) => s.key === order.status,
  );
  const isCancelled =
    order.status === 'cancelled' || order.status === 'refunded';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Back link */}
      <Link
        href="/cuenta"
        className="inline-flex items-center gap-1.5 text-sm text-brand-warm-gray hover:text-brand-rose-gold transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        {t('account.orders')}
      </Link>

      {/* Order header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-brand-charcoal">
            {t('order.number', { number: order.orderNumber })}
          </h1>
          <p className="text-sm text-brand-warm-gray mt-1">
            {formatDate(order.createdAt)}
          </p>
        </div>
        <span
          className={clsx(
            'self-start px-3 py-1 text-sm font-medium rounded-full',
            order.status === 'delivered'
              ? 'bg-emerald-100 text-emerald-700'
              : isCancelled
                ? 'bg-red-100 text-red-700'
                : 'bg-amber-100 text-amber-700',
          )}
        >
          {t(`order.status.${order.status}` as Parameters<typeof t>[0])}
        </span>
      </div>

      {/* Status timeline */}
      {!isCancelled && (
        <div className="card p-6 sm:p-8 mb-6">
          <h2 className="text-sm font-semibold text-brand-charcoal uppercase tracking-wider mb-6">
            {t('order.status')}
          </h2>
          <div className="flex items-center justify-between relative">
            {/* Progress line */}
            <div className="absolute top-5 left-5 right-5 h-0.5 bg-brand-cream-dark">
              <div
                className="h-full bg-brand-rose-gold transition-all duration-500"
                style={{
                  width: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%`,
                }}
              />
            </div>

            {STATUS_STEPS.map((step, i) => {
              const Icon = step.icon;
              const isCompleted = i <= currentStepIndex;
              const isCurrent = i === currentStepIndex;

              return (
                <div
                  key={step.key}
                  className="relative flex flex-col items-center z-10"
                >
                  <div
                    className={clsx(
                      'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all',
                      isCompleted
                        ? 'bg-brand-rose-gold border-brand-rose-gold text-white'
                        : 'bg-white border-brand-cream-dark text-brand-warm-gray',
                      isCurrent && 'ring-4 ring-brand-rose-gold/20',
                    )}
                  >
                    <Icon size={18} />
                  </div>
                  <p
                    className={clsx(
                      'text-[10px] sm:text-xs mt-2 text-center max-w-[60px] sm:max-w-none',
                      isCompleted
                        ? 'text-brand-charcoal font-medium'
                        : 'text-brand-warm-gray',
                    )}
                  >
                    {t(`order.status.${step.key}` as Parameters<typeof t>[0])}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Shipment tracking */}
      {order.shipment && (
        <div className="card p-6 sm:p-8 mb-6">
          <h2 className="text-sm font-semibold text-brand-charcoal uppercase tracking-wider mb-4">
            {t('order.tracking')}
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Truck size={18} className="text-brand-rose-gold" />
              <div>
                <p className="text-xs text-brand-warm-gray">
                  {t('order.carrier')}
                </p>
                <p className="text-sm font-medium text-brand-charcoal">
                  {order.shipment.carrier}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Package size={18} className="text-brand-rose-gold" />
              <div>
                <p className="text-xs text-brand-warm-gray">
                  {t('order.trackingNumber')}
                </p>
                <p className="text-sm font-medium text-brand-charcoal font-mono">
                  {order.shipment.trackingNumber}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-brand-rose-gold" />
              <div>
                <p className="text-xs text-brand-warm-gray">
                  {t('order.currentLocation')}
                </p>
                <p className="text-sm font-medium text-brand-charcoal">
                  {order.shipment.currentLocation || '—'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar size={18} className="text-brand-rose-gold" />
              <div>
                <p className="text-xs text-brand-warm-gray">
                  {t('order.estimatedDelivery')}
                </p>
                <p className="text-sm font-medium text-brand-charcoal">
                  {formatDate(order.shipment.estimatedDelivery)}
                </p>
              </div>
            </div>
          </div>

          {/* Tracking history */}
          {order.shipment.trackingHistory.length > 0 && (
            <div className="border-t border-brand-cream-dark pt-4">
              <h3 className="text-sm font-medium text-brand-charcoal mb-3">
                Historial de seguimiento
              </h3>
              <div className="space-y-0">
                {order.shipment.trackingHistory.map((event, i) => (
                  <div key={i} className="flex gap-3 relative">
                    {/* Timeline line */}
                    {i < order.shipment!.trackingHistory.length - 1 && (
                      <div className="absolute left-[7px] top-5 bottom-0 w-0.5 bg-brand-cream-dark" />
                    )}
                    <div className="w-[15px] h-[15px] mt-1 flex-shrink-0 rounded-full border-2 border-brand-rose-gold bg-white z-10" />
                    <div className="pb-4">
                      <p className="text-sm font-medium text-brand-charcoal">
                        {event.description}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={clsx(
                            'px-1.5 py-0.5 text-[10px] font-medium rounded',
                            SHIPMENT_STATUS_COLORS[event.status] ||
                              'bg-gray-100 text-gray-700',
                          )}
                        >
                          {t(
                            `shipment.status.${event.status}` as Parameters<typeof t>[0],
                          )}
                        </span>
                        <span className="text-xs text-brand-warm-gray">
                          {event.location}
                        </span>
                      </div>
                      <p className="text-[10px] text-brand-warm-gray mt-0.5">
                        {formatDateTime(event.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Order items */}
      <div className="card p-6 sm:p-8">
        <h2 className="text-sm font-semibold text-brand-charcoal uppercase tracking-wider mb-4">
          {t('order.items')}
        </h2>
        <ul className="divide-y divide-brand-cream-dark">
          {order.items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
            >
              <div className="w-14 h-14 bg-brand-cream rounded-lg flex-shrink-0 flex items-center justify-center">
                <Package size={20} className="text-brand-warm-gray" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-brand-charcoal truncate">
                  {item.productName}
                </p>
                <p className="text-xs text-brand-warm-gray">
                  x{item.quantity} &middot; SKU: {item.sku}
                </p>
              </div>
              <p className="text-sm font-medium text-brand-charcoal">
                {formatPrice(item.priceWithIva * item.quantity)}
              </p>
            </li>
          ))}
        </ul>

        {/* Totals */}
        <div className="border-t border-brand-cream-dark mt-4 pt-4 space-y-2">
          <div className="flex justify-between text-sm text-brand-charcoal-light">
            <span>Subtotal (neto)</span>
            <span>{formatPrice(order.subtotalNeto)}</span>
          </div>
          <div className="flex justify-between text-sm text-brand-charcoal-light">
            <span>IVA (16%)</span>
            <span>{formatPrice(order.ivaTotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-brand-charcoal-light">
            <span>Envío</span>
            <span>
              {order.shippingCost > 0
                ? formatPrice(order.shippingCost)
                : 'Gratis'}
            </span>
          </div>
          <div className="flex justify-between text-base font-semibold text-brand-charcoal pt-2 border-t border-brand-cream-dark">
            <span>{t('order.total')}</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PedidosPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto px-4 py-12">Loading...</div>}>
      <PedidosPageInner />
    </Suspense>
  );
}
