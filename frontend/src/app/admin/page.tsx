'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, DollarSign, ShoppingBag, TrendingUp, ArrowRight } from 'lucide-react';
import type { AnalyticsSummary, Order } from '@/types';
import { analyticsApi, ordersApi } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import clsx from 'clsx';

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsApi.getSummary().catch(() => null),
      ordersApi.listAll({ pageSize: 5 }).catch(() => ({ data: [] })),
    ])
      .then(([summaryData, ordersData]) => {
        if (summaryData) setSummary(summaryData);
        setRecentOrders('data' in ordersData ? ordersData.data : []);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0,
    }).format(price);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('es-MX', {
      month: 'short',
      day: 'numeric',
    });

  const statCards = [
    {
      label: t('admin.totalOrders'),
      value: summary?.totalOrders ?? 0,
      icon: Package,
      color: 'bg-blue-50 text-blue-600',
      format: (v: number) => v.toLocaleString('es-MX'),
    },
    {
      label: t('admin.revenue'),
      value: summary?.totalRevenue ?? 0,
      icon: DollarSign,
      color: 'bg-emerald-50 text-emerald-600',
      format: (v: number) => formatPrice(v),
    },
    {
      label: t('admin.activeProducts'),
      value: summary?.activeProducts ?? 0,
      icon: ShoppingBag,
      color: 'bg-purple-50 text-purple-600',
      format: (v: number) => v.toLocaleString('es-MX'),
    },
    {
      label: t('admin.avgOrderValue'),
      value: summary?.averageOrderValue ?? 0,
      icon: TrendingUp,
      color: 'bg-amber-50 text-amber-600',
      format: (v: number) => formatPrice(v),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-charcoal mb-8">
        {t('admin.dashboard')}
      </h1>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-xl border border-gray-100 p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={clsx(
                    'w-10 h-10 rounded-xl flex items-center justify-center',
                    card.color,
                  )}
                >
                  <Icon size={20} />
                </div>
                <p className="text-sm text-gray-500">{card.label}</p>
              </div>
              {isLoading ? (
                <div className="h-8 bg-gray-100 rounded animate-pulse w-24" />
              ) : (
                <p className="text-2xl font-semibold text-brand-charcoal">
                  {card.format(card.value)}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-brand-charcoal uppercase tracking-wider">
              {t('admin.recentOrders')}
            </h2>
            <Link
              href="/admin/pedidos"
              className="text-xs text-brand-rose-gold hover:text-brand-rose-gold-dark flex items-center gap-1 transition-colors"
            >
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse flex gap-4">
                  <div className="h-4 bg-gray-100 rounded w-20" />
                  <div className="h-4 bg-gray-100 rounded flex-1" />
                  <div className="h-4 bg-gray-100 rounded w-16" />
                </div>
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">
              No hay pedidos recientes
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-xs font-medium text-gray-400 uppercase">
                      Pedido
                    </th>
                    <th className="text-left py-2 text-xs font-medium text-gray-400 uppercase">
                      Fecha
                    </th>
                    <th className="text-left py-2 text-xs font-medium text-gray-400 uppercase">
                      Estado
                    </th>
                    <th className="text-right py-2 text-xs font-medium text-gray-400 uppercase">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/50">
                      <td className="py-3 font-medium text-brand-charcoal">
                        #{order.orderNumber}
                      </td>
                      <td className="py-3 text-gray-500">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="py-3">
                        <span
                          className={clsx(
                            'px-2 py-0.5 text-xs font-medium rounded-full',
                            order.status === 'delivered'
                              ? 'bg-emerald-100 text-emerald-700'
                              : order.status === 'cancelled'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700',
                          )}
                        >
                          {t(`order.status.${order.status}` as Parameters<typeof t>[0])}
                        </span>
                      </td>
                      <td className="py-3 text-right font-medium text-brand-charcoal">
                        {formatPrice(order.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick stats / sales this week */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-brand-charcoal uppercase tracking-wider mb-4">
            {t('admin.salesThisWeek')}
          </h2>

          {isLoading ? (
            <div className="h-48 bg-gray-100 rounded animate-pulse" />
          ) : summary?.salesOverTime && summary.salesOverTime.length > 0 ? (
            <div className="space-y-3">
              {summary.salesOverTime.slice(-7).map((day) => (
                <div key={day.date} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-16 flex-shrink-0">
                    {new Date(day.date).toLocaleDateString('es-MX', {
                      weekday: 'short',
                    })}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-brand-rose-gold rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          (day.revenue /
                            Math.max(
                              ...summary.salesOverTime
                                .slice(-7)
                                .map((d) => d.revenue),
                              1,
                            )) *
                            100,
                          100,
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium text-brand-charcoal w-20 text-right flex-shrink-0">
                    {formatPrice(day.revenue)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-gray-400">
              Sin datos disponibles
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
