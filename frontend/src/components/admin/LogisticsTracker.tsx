'use client';

import { useState } from 'react';
import {
  MapPin,
  Calendar,
  Truck,
  Plus,
  Loader2,
} from 'lucide-react';
import type { Shipment, ShipmentStatus } from '@/types';
import { shipmentsApi } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import clsx from 'clsx';

interface LogisticsTrackerProps {
  shipment: Shipment;
  onUpdate: (updated: Shipment) => void;
}

const STATUS_OPTIONS: { value: ShipmentStatus; color: string }[] = [
  { value: 'label_created' as ShipmentStatus, color: 'bg-gray-100 text-gray-700' },
  { value: 'picked_up' as ShipmentStatus, color: 'bg-blue-100 text-blue-700' },
  { value: 'in_transit' as ShipmentStatus, color: 'bg-indigo-100 text-indigo-700' },
  { value: 'out_for_delivery' as ShipmentStatus, color: 'bg-amber-100 text-amber-700' },
  { value: 'delivered' as ShipmentStatus, color: 'bg-emerald-100 text-emerald-700' },
  { value: 'exception' as ShipmentStatus, color: 'bg-red-100 text-red-700' },
  { value: 'returned' as ShipmentStatus, color: 'bg-orange-100 text-orange-700' },
];

export default function LogisticsTracker({
  shipment,
  onUpdate,
}: LogisticsTrackerProps) {
  const { t } = useTranslation();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);

  // Form state for updating shipment
  const [newLocation, setNewLocation] = useState(shipment.currentLocation);
  const [newStatus, setNewStatus] = useState<string>(shipment.status);
  const [newEta, setNewEta] = useState(
    shipment.estimatedDelivery.split('T')[0],
  );

  // Form state for new tracking event
  const [eventLocation, setEventLocation] = useState('');
  const [eventStatus, setEventStatus] = useState<string>(shipment.status);
  const [eventDescription, setEventDescription] = useState('');

  const handleUpdateShipment = async () => {
    setIsUpdating(true);
    try {
      const updated = await shipmentsApi.update(shipment.id, {
        currentLocation: newLocation,
        status: newStatus as ShipmentStatus,
        estimatedDelivery: newEta,
      });
      onUpdate(updated);
    } catch {
      alert('Error al actualizar el envío');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddEvent = async () => {
    if (!eventLocation || !eventDescription) return;
    setIsUpdating(true);
    try {
      const updated = await shipmentsApi.addTrackingEvent(shipment.id, {
        location: eventLocation,
        status: eventStatus,
        description: eventDescription,
      });
      onUpdate(updated);
      setEventLocation('');
      setEventDescription('');
      setShowAddEvent(false);
    } catch {
      alert('Error al agregar evento');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDateTime = (dateStr: string) =>
    new Date(dateStr).toLocaleString('es-MX', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Truck size={18} className="text-brand-rose-gold" />
          <h3 className="text-sm font-semibold text-brand-charcoal">
            {t('admin.shipmentDetails')}
          </h3>
        </div>
        <p className="text-xs text-gray-400 mt-1 font-mono">
          {shipment.trackingNumber} &middot; {shipment.carrier}
        </p>
      </div>

      {/* Update form */}
      <div className="px-5 py-4 space-y-4 border-b border-gray-100">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            {t('admin.location')}
          </label>
          <div className="relative">
            <MapPin
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-rose-gold/30 focus:border-brand-rose-gold"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Estado
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full py-2 px-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-rose-gold/30 focus:border-brand-rose-gold"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(`shipment.status.${opt.value}` as Parameters<typeof t>[0])}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              {t('admin.eta')}
            </label>
            <div className="relative">
              <Calendar
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="date"
                value={newEta}
                onChange={(e) => setNewEta(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-rose-gold/30 focus:border-brand-rose-gold"
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleUpdateShipment}
          disabled={isUpdating}
          className="w-full py-2 bg-brand-rose-gold text-white text-sm font-medium rounded-lg hover:bg-brand-rose-gold-dark disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {isUpdating ? (
            <Loader2 size={14} className="animate-spin" />
          ) : null}
          Actualizar envío
        </button>
      </div>

      {/* Add tracking event */}
      <div className="px-5 py-4 border-b border-gray-100">
        {!showAddEvent ? (
          <button
            type="button"
            onClick={() => setShowAddEvent(true)}
            className="flex items-center gap-1.5 text-sm text-brand-rose-gold hover:text-brand-rose-gold-dark transition-colors"
          >
            <Plus size={14} />
            {t('admin.addEvent')}
          </button>
        ) : (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-400 uppercase">
              Nuevo evento de seguimiento
            </h4>
            <input
              type="text"
              value={eventLocation}
              onChange={(e) => setEventLocation(e.target.value)}
              placeholder="Ubicación"
              className="w-full py-2 px-3 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-rose-gold/30"
            />
            <select
              value={eventStatus}
              onChange={(e) => setEventStatus(e.target.value)}
              className="w-full py-2 px-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-rose-gold/30"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(`shipment.status.${opt.value}` as Parameters<typeof t>[0])}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              placeholder="Descripción"
              className="w-full py-2 px-3 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-rose-gold/30"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddEvent}
                disabled={isUpdating || !eventLocation || !eventDescription}
                className="px-3 py-1.5 bg-brand-rose-gold text-white text-xs font-medium rounded-lg hover:bg-brand-rose-gold-dark disabled:opacity-50 transition-colors"
              >
                Agregar
              </button>
              <button
                type="button"
                onClick={() => setShowAddEvent(false)}
                className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tracking history timeline */}
      <div className="px-5 py-4 max-h-64 overflow-y-auto">
        <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">
          Historial
        </h4>
        {shipment.trackingHistory.length === 0 ? (
          <p className="text-xs text-gray-400">Sin eventos registrados</p>
        ) : (
          <div className="space-y-0">
            {shipment.trackingHistory.map((event, i) => {
              const statusOption = STATUS_OPTIONS.find(
                (o) => o.value === event.status,
              );
              return (
                <div key={i} className="flex gap-3 relative">
                  {i < shipment.trackingHistory.length - 1 && (
                    <div className="absolute left-[5px] top-4 bottom-0 w-0.5 bg-gray-200" />
                  )}
                  <div className="w-[11px] h-[11px] mt-1.5 flex-shrink-0 rounded-full border-2 border-brand-rose-gold bg-white z-10" />
                  <div className="pb-3">
                    <p className="text-xs font-medium text-brand-charcoal">
                      {event.description}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={clsx(
                          'px-1.5 py-0.5 text-[10px] font-medium rounded',
                          statusOption?.color || 'bg-gray-100 text-gray-700',
                        )}
                      >
                        {t(`shipment.status.${event.status}` as Parameters<typeof t>[0])}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {event.location}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {formatDateTime(event.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
