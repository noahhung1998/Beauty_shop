'use client';

import { useEffect, useState, useCallback } from 'react';
import { Truck, MapPin } from 'lucide-react';
import type { Shipment } from '@/types';
import { shipmentsApi } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import LogisticsTracker from '@/components/admin/LogisticsTracker';
import clsx from 'clsx';

const STATUS_BADGE_COLORS: Record<string, string> = {
  label_created: 'bg-gray-100 text-gray-700',
  picked_up: 'bg-blue-100 text-blue-700',
  in_transit: 'bg-indigo-100 text-indigo-700',
  out_for_delivery: 'bg-amber-100 text-amber-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  exception: 'bg-red-100 text-red-700',
  returned: 'bg-orange-100 text-orange-700',
};

export default function AdminLogisticaPage() {
  const { t } = useTranslation();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const fetchShipments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await shipmentsApi.listAll({
        status: statusFilter || undefined,
      });
      setShipments(response.data);
    } catch {
      setShipments([]);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  const handleShipmentUpdated = (updated: Shipment) => {
    setShipments((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s)),
    );
    setSelectedShipment(updated);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-brand-charcoal">
          {t('admin.logistics')}
        </h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm bg-white border border-gray-200 rounded-xl px-3 py-2 text-brand-charcoal focus:outline-none focus:ring-2 focus:ring-brand-rose-gold/30"
        >
          <option value="">Todos los estados</option>
          {Object.keys(STATUS_BADGE_COLORS).map((status) => (
            <option key={status} value={status}>
              {t(`shipment.status.${status}` as Parameters<typeof t>[0])}
            </option>
          ))}
        </select>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Shipments table */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {isLoading ? (
              <div className="p-8 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="animate-pulse flex gap-4">
                    <div className="h-4 bg-gray-100 rounded w-32" />
                    <div className="h-4 bg-gray-100 rounded flex-1" />
                    <div className="h-4 bg-gray-100 rounded w-20" />
                  </div>
                ))}
              </div>
            ) : shipments.length === 0 ? (
              <div className="p-12 text-center">
                <Truck size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-400">No hay envíos</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">
                        {t('order.carrier')}
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">
                        Seguimiento
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">
                        Estado
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">
                        ETA
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {shipments.map((shipment) => (
                      <tr
                        key={shipment.id}
                        className={clsx(
                          'cursor-pointer transition-colors',
                          selectedShipment?.id === shipment.id
                            ? 'bg-brand-rose-gold/5'
                            : 'hover:bg-gray-50/50',
                        )}
                        onClick={() => setSelectedShipment(shipment)}
                      >
                        <td className="px-4 py-3 font-medium text-brand-charcoal">
                          {shipment.carrier}
                        </td>
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                          {shipment.trackingNumber}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={clsx(
                              'px-2 py-0.5 text-xs font-medium rounded-full',
                              STATUS_BADGE_COLORS[shipment.status] ||
                                'bg-gray-100 text-gray-700',
                            )}
                          >
                            {t(`shipment.status.${shipment.status}` as Parameters<typeof t>[0])}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {formatDate(shipment.estimatedDelivery)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Map placeholder */}
          <div className="mt-6 bg-white rounded-xl border border-gray-100 p-8 text-center">
            <MapPin size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-400">
              Mapa de seguimiento (integración futura)
            </p>
            <p className="text-xs text-gray-300 mt-1">
              Google Maps / Mapbox integration placeholder
            </p>
          </div>
        </div>

        {/* Shipment detail / update panel */}
        <div className="lg:col-span-2">
          {selectedShipment ? (
            <LogisticsTracker
              shipment={selectedShipment}
              onUpdate={handleShipmentUpdated}
            />
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
              <Truck size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-400">
                Selecciona un envío para ver los detalles
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
