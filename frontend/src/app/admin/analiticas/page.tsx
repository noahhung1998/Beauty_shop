'use client';

import { useEffect, useState } from 'react';
import { Download, Calendar } from 'lucide-react';
import type { AnalyticsSummary } from '@/types';
import { analyticsApi } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';

export default function AdminAnaliticasPage() {
  const { t } = useTranslation();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    setIsLoading(true);
    analyticsApi
      .getSummary({ from: dateRange.from, to: dateRange.to })
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setIsLoading(false));
  }, [dateRange]);

  const handleExportCsv = (type: 'orders' | 'products' | 'telemetry') => {
    const url = analyticsApi.exportCsv(type, {
      from: dateRange.from,
      to: dateRange.to,
    });
    window.open(url, '_blank');
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-brand-charcoal">
          {t('admin.analytics')}
        </h1>

        <div className="flex items-center gap-3">
          {/* Date range picker */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-1.5">
            <Calendar size={14} className="text-gray-400" />
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) =>
                setDateRange((p) => ({ ...p, from: e.target.value }))
              }
              className="text-sm bg-transparent text-brand-charcoal focus:outline-none"
            />
            <span className="text-gray-300">-</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) =>
                setDateRange((p) => ({ ...p, to: e.target.value }))
              }
              className="text-sm bg-transparent text-brand-charcoal focus:outline-none"
            />
          </div>

          {/* Export dropdown */}
          <div className="relative group">
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-brand-charcoal hover:border-brand-rose-gold transition-colors"
            >
              <Download size={14} />
              {t('admin.exportCsv')}
            </button>
            <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-card opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
              <button
                type="button"
                onClick={() => handleExportCsv('orders')}
                className="block w-full text-left px-4 py-2.5 text-sm text-brand-charcoal hover:bg-gray-50 rounded-t-xl"
              >
                Exportar Pedidos
              </button>
              <button
                type="button"
                onClick={() => handleExportCsv('products')}
                className="block w-full text-left px-4 py-2.5 text-sm text-brand-charcoal hover:bg-gray-50"
              >
                Exportar Productos
              </button>
              <button
                type="button"
                onClick={() => handleExportCsv('telemetry')}
                className="block w-full text-left px-4 py-2.5 text-sm text-brand-charcoal hover:bg-gray-50 rounded-b-xl"
              >
                Exportar Telemetría
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse"
            >
              <div className="h-4 bg-gray-100 rounded w-1/3 mb-4" />
              <div className="h-48 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : summary ? (
        <AnalyticsDashboard summary={summary} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400">No hay datos disponibles</p>
          <p className="text-xs text-gray-300 mt-1">
            Ajusta el rango de fechas o espera a que se generen datos
          </p>
        </div>
      )}
    </div>
  );
}
