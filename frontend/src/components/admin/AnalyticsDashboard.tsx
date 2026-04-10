'use client';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Clock,
  MousePointerClick,
} from 'lucide-react';
import type { AnalyticsSummary, OrderStatus } from '@/types';
import { useTranslation } from '@/lib/i18n';
import clsx from 'clsx';

interface AnalyticsDashboardProps {
  summary: AnalyticsSummary;
}

const PIE_COLORS = [
  '#B76E79', // rose-gold
  '#C9A96E', // gold
  '#6366f1', // indigo
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#f97316', // orange
];

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  processing: 'En proceso',
  shipped: 'Enviado',
  in_transit: 'En tránsito',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
};

export default function AnalyticsDashboard({
  summary,
}: AnalyticsDashboardProps) {
  const { t } = useTranslation();

  const formatPrice = (value: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0,
    }).format(value);

  const formatDwellTime = (ms: number) => {
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;
    return `${minutes}m ${remaining}s`;
  };

  // Prepare pie chart data
  const pieData = Object.entries(summary.orderStatusDistribution)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      name: ORDER_STATUS_LABELS[status] || status,
      value: count,
    }));

  // Summary stat cards
  const statCards = [
    {
      label: t('admin.revenue'),
      value: formatPrice(summary.totalRevenue),
      icon: DollarSign,
      color: 'text-emerald-600 bg-emerald-50',
      trend: '+12.5%', // Placeholder trend
      trendUp: true,
    },
    {
      label: t('admin.avgOrderValue'),
      value: formatPrice(summary.averageOrderValue),
      icon: ShoppingCart,
      color: 'text-blue-600 bg-blue-50',
      trend: '+3.2%',
      trendUp: true,
    },
    {
      label: t('admin.cartAbandonment'),
      value: `${(summary.cartAbandonmentRate * 100).toFixed(1)}%`,
      icon: MousePointerClick,
      color: 'text-amber-600 bg-amber-50',
      trend: '-2.1%',
      trendUp: false,
    },
    {
      label: t('admin.dwellTime') + ' (promedio)',
      value: formatDwellTime(
        summary.dwellTimeByProduct.length > 0
          ? summary.dwellTimeByProduct.reduce(
              (sum, d) => sum + d.avgDwellTimeMs,
              0,
            ) / summary.dwellTimeByProduct.length
          : 0,
      ),
      icon: Clock,
      color: 'text-purple-600 bg-purple-50',
      trend: '+8.7%',
      trendUp: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-xl border border-gray-100 p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={clsx(
                    'w-10 h-10 rounded-xl flex items-center justify-center',
                    card.color,
                  )}
                >
                  <Icon size={20} />
                </div>
                <span
                  className={clsx(
                    'flex items-center gap-0.5 text-xs font-medium',
                    card.trendUp ? 'text-emerald-600' : 'text-red-500',
                  )}
                >
                  {card.trendUp ? (
                    <TrendingUp size={12} />
                  ) : (
                    <TrendingDown size={12} />
                  )}
                  {card.trend}
                </span>
              </div>
              <p className="text-2xl font-semibold text-brand-charcoal">
                {card.value}
              </p>
              <p className="text-xs text-gray-500 mt-1">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales over time (Line chart) */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-brand-charcoal uppercase tracking-wider mb-4">
            Ventas en el tiempo
          </h3>
          <div className="h-64">
            {summary.salesOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={summary.salesOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) =>
                      new Date(date).toLocaleDateString('es-MX', {
                        month: 'short',
                        day: 'numeric',
                      })
                    }
                    tick={{ fontSize: 11 }}
                    stroke="#999"
                  />
                  <YAxis
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 11 }}
                    stroke="#999"
                  />
                  <Tooltip
                    formatter={(value: number) => [formatPrice(value), 'Ingreso']}
                    labelFormatter={(date) =>
                      new Date(date).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    }
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #eee',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#B76E79"
                    strokeWidth={2}
                    dot={{ fill: '#B76E79', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="#C9A96E"
                    strokeWidth={2}
                    dot={{ fill: '#C9A96E', r: 3 }}
                    yAxisId={0}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">
                Sin datos
              </div>
            )}
          </div>
        </div>

        {/* Top products (Bar chart) */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-brand-charcoal uppercase tracking-wider mb-4">
            {t('admin.topProducts')}
          </h3>
          <div className="h-64">
            {summary.topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={summary.topProducts.slice(0, 8)}
                  layout="vertical"
                  margin={{ left: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="#999" />
                  <YAxis
                    type="category"
                    dataKey="productName"
                    tick={{ fontSize: 11 }}
                    width={100}
                    stroke="#999"
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      name === 'totalSold' ? value : formatPrice(value),
                      name === 'totalSold' ? 'Vendidos' : 'Ingreso',
                    ]}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #eee',
                      fontSize: '12px',
                    }}
                  />
                  <Bar
                    dataKey="totalSold"
                    fill="#B76E79"
                    radius={[0, 4, 4, 0]}
                    barSize={16}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">
                Sin datos
              </div>
            )}
          </div>
        </div>

        {/* Order status distribution (Pie chart) */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-brand-charcoal uppercase tracking-wider mb-4">
            Distribución de estados
          </h3>
          <div className="h-64">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [value, 'Pedidos']}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #eee',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px' }}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">
                Sin datos
              </div>
            )}
          </div>
        </div>

        {/* Average dwell time per product */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-brand-charcoal uppercase tracking-wider mb-4">
            {t('admin.dwellTime')} por producto
          </h3>
          <div className="h-64 overflow-y-auto">
            {summary.dwellTimeByProduct.length > 0 ? (
              <div className="space-y-3">
                {summary.dwellTimeByProduct
                  .sort((a, b) => b.avgDwellTimeMs - a.avgDwellTimeMs)
                  .slice(0, 10)
                  .map((item) => {
                    const maxDwell = Math.max(
                      ...summary.dwellTimeByProduct.map(
                        (d) => d.avgDwellTimeMs,
                      ),
                    );
                    const percentage =
                      maxDwell > 0
                        ? (item.avgDwellTimeMs / maxDwell) * 100
                        : 0;

                    return (
                      <div key={item.productSlug}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-brand-charcoal font-medium truncate max-w-[60%]">
                            {item.productName}
                          </span>
                          <span className="text-gray-500">
                            {formatDwellTime(item.avgDwellTimeMs)} &middot;{' '}
                            {item.views} vistas
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-brand-rose-gold to-brand-gold rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">
                Sin datos de telemetría
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
