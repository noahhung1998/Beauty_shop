'use client';

import { useEffect, useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, Package } from 'lucide-react';
import type { Order, OrderStatus } from '@/types';
import { ordersApi } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import clsx from 'clsx';

// Valid status transitions (state machine)
const VALID_TRANSITIONS: Record<string, OrderStatus[]> = {
  pending: ['confirmed' as OrderStatus, 'cancelled' as OrderStatus],
  confirmed: ['processing' as OrderStatus, 'cancelled' as OrderStatus],
  processing: ['shipped' as OrderStatus, 'cancelled' as OrderStatus],
  shipped: ['in_transit' as OrderStatus],
  in_transit: ['delivered' as OrderStatus],
  delivered: ['refunded' as OrderStatus],
  cancelled: [],
  refunded: [],
};

const STATUS_BADGE_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-indigo-100 text-indigo-700',
  shipped: 'bg-cyan-100 text-cyan-700',
  in_transit: 'bg-sky-100 text-sky-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
  refunded: 'bg-orange-100 text-orange-700',
};

export default function AdminPedidosPage() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await ordersApi.listAll({
        status: statusFilter || undefined,
        page,
        pageSize: 15,
      });
      setOrders(response.data);
      setTotalPages(response.totalPages);
    } catch {
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const updated = await ordersApi.updateStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? updated : o)),
      );
    } catch {
      alert('Error al actualizar el estado');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(price);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-brand-charcoal">
          {t('admin.orders')}
        </h1>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="text-sm bg-white border border-gray-200 rounded-xl px-3 py-2 text-brand-charcoal focus:outline-none focus:ring-2 focus:ring-brand-rose-gold/30"
        >
          <option value="">Todos los estados</option>
          {Object.keys(STATUS_BADGE_COLORS).map((status) => (
            <option key={status} value={status}>
              {t(`order.status.${status}` as Parameters<typeof t>[0])}
            </option>
          ))}
        </select>
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse flex gap-4">
                <div className="h-4 bg-gray-100 rounded w-24" />
                <div className="h-4 bg-gray-100 rounded flex-1" />
                <div className="h-4 bg-gray-100 rounded w-20" />
                <div className="h-4 bg-gray-100 rounded w-16" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <Package size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400">No hay pedidos</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase">
                    Pedido
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase">
                    Cliente
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase">
                    Fecha
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase">
                    Estado
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-400 uppercase">
                    Total
                  </th>
                  <th className="px-5 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((order) => {
                  const isExpanded = expandedOrderId === order.id;
                  const validTransitions =
                    VALID_TRANSITIONS[order.status] || [];

                  return (
                    <>
                      <tr
                        key={order.id}
                        className="hover:bg-gray-50/50 cursor-pointer"
                        onClick={() =>
                          setExpandedOrderId(
                            isExpanded ? null : order.id,
                          )
                        }
                      >
                        <td className="px-5 py-4 font-medium text-brand-charcoal">
                          #{order.orderNumber}
                        </td>
                        <td className="px-5 py-4 text-gray-600">
                          {order.guestEmail || 'Usuario registrado'}
                        </td>
                        <td className="px-5 py-4 text-gray-500">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={clsx(
                              'px-2.5 py-0.5 text-xs font-medium rounded-full',
                              STATUS_BADGE_COLORS[order.status] ||
                                'bg-gray-100 text-gray-700',
                            )}
                          >
                            {t(`order.status.${order.status}` as Parameters<typeof t>[0])}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right font-medium text-brand-charcoal">
                          {formatPrice(order.total)}
                        </td>
                        <td className="px-5 py-4">
                          {isExpanded ? (
                            <ChevronUp size={16} className="text-gray-400" />
                          ) : (
                            <ChevronDown size={16} className="text-gray-400" />
                          )}
                        </td>
                      </tr>

                      {/* Expanded details */}
                      {isExpanded && (
                        <tr key={`${order.id}-details`}>
                          <td colSpan={6} className="px-5 py-4 bg-gray-50/50">
                            <div className="grid md:grid-cols-2 gap-6">
                              {/* Items */}
                              <div>
                                <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">
                                  Artículos
                                </h4>
                                <ul className="space-y-2">
                                  {order.items.map((item) => (
                                    <li
                                      key={item.id}
                                      className="flex items-center justify-between text-sm"
                                    >
                                      <span className="text-gray-600">
                                        {item.productName}{' '}
                                        <span className="text-gray-400">
                                          x{item.quantity}
                                        </span>
                                      </span>
                                      <span className="font-medium text-brand-charcoal">
                                        {formatPrice(
                                          item.priceWithIva * item.quantity,
                                        )}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                                <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between text-sm font-semibold text-brand-charcoal">
                                  <span>Total</span>
                                  <span>{formatPrice(order.total)}</span>
                                </div>
                              </div>

                              {/* Status update */}
                              <div>
                                <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">
                                  {t('admin.updateStatus')}
                                </h4>
                                {validTransitions.length === 0 ? (
                                  <p className="text-sm text-gray-400">
                                    No hay transiciones disponibles
                                  </p>
                                ) : (
                                  <div className="flex flex-wrap gap-2">
                                    {validTransitions.map((status) => (
                                      <button
                                        key={status}
                                        type="button"
                                        disabled={
                                          updatingOrderId === order.id
                                        }
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleStatusUpdate(
                                            order.id,
                                            status,
                                          );
                                        }}
                                        className={clsx(
                                          'px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-50',
                                          STATUS_BADGE_COLORS[status]?.replace(
                                            'bg-',
                                            'border-',
                                          ),
                                          STATUS_BADGE_COLORS[status],
                                          'hover:opacity-80',
                                        )}
                                      >
                                        {updatingOrderId === order.id
                                          ? '...'
                                          : t(
                                              `order.status.${status}` as Parameters<typeof t>[0],
                                            )}
                                      </button>
                                    ))}
                                  </div>
                                )}

                                {/* Shipping info */}
                                {order.shippingAddress && (
                                  <div className="mt-4">
                                    <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">
                                      Dirección de envío
                                    </h4>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                      {order.shippingAddress.calle}
                                      {order.shippingAddress.piso && `, ${order.shippingAddress.piso}`}
                                      <br />
                                      {order.shippingAddress.codigoPostal}{' '}
                                      {order.shippingAddress.ciudad},{' '}
                                      {order.shippingAddress.provincia}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            {t('common.previous')}
          </button>
          <span className="text-sm text-gray-500">
            {t('common.page')} {page} {t('common.of')} {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            {t('common.next')}
          </button>
        </div>
      )}
    </div>
  );
}
