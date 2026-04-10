'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { User, Package, Shield, LogOut, Download, Trash2, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useConsent } from '@/hooks/useConsent';
import { useTranslation } from '@/lib/i18n';
import { useTelemetry } from '@/hooks/useTelemetry';
import { gdprApi, ordersApi } from '@/lib/api';
import type { Order } from '@/types';
import clsx from 'clsx';

export default function CuentaPage() {
  const { t } = useTranslation();
  useTelemetry('Cuenta');

  const { user, isAuthenticated, isLoading, error, login, register, logout, clearError } =
    useAuthStore();
  const { consent, acceptAll, acceptNecessaryOnly, updateConsent } = useConsent();

  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'privacy'>('profile');
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Auth form state
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Fetch orders when on orders tab
  useEffect(() => {
    if (isAuthenticated && activeTab === 'orders') {
      setOrdersLoading(true);
      ordersApi
        .getMyOrders()
        .then(setOrders)
        .catch(() => setOrders([]))
        .finally(() => setOrdersLoading(false));
    }
  }, [isAuthenticated, activeTab]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLoginMode) {
        await login(formData.email, formData.password);
      } else {
        await register({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
        });
      }
    } catch {
      // Error is set in store
    }
  };

  const handleExportData = async () => {
    try {
      const data = await gdprApi.exportData();
      const url = window.URL.createObjectURL(new Blob([JSON.stringify(data)]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mis-datos.json';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Error al exportar datos');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await gdprApi.deleteAccount();
      logout();
    } catch {
      alert('Error al eliminar cuenta');
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(price);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  // If not authenticated, show login/register form
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 sm:py-20">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-cream rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User size={28} className="text-brand-rose-gold" />
          </div>
          <h1 className="font-display text-display-sm text-brand-charcoal">
            {isLoginMode ? t('account.login') : t('account.register')}
          </h1>
        </div>

        <form onSubmit={handleAuthSubmit} className="space-y-4">
          {!isLoginMode && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-brand-charcoal mb-1.5">
                  {t('checkout.firstName')}
                </label>
                <input
                  type="text"
                  required={!isLoginMode}
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, firstName: e.target.value }))
                  }
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-charcoal mb-1.5">
                  {t('checkout.lastName')}
                </label>
                <input
                  type="text"
                  required={!isLoginMode}
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, lastName: e.target.value }))
                  }
                  className="input-field"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-brand-charcoal mb-1.5">
              {t('account.email')}
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData((p) => ({ ...p, email: e.target.value }))
              }
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-charcoal mb-1.5">
              {t('account.password')}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, password: e.target.value }))
                }
                className="input-field pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-warm-gray hover:text-brand-charcoal"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-xl">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary disabled:opacity-60"
          >
            {isLoading
              ? t('common.loading')
              : isLoginMode
                ? t('account.login')
                : t('account.register')}
          </button>
        </form>

        <p className="text-center text-sm text-brand-warm-gray mt-6">
          {isLoginMode ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
          <button
            type="button"
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              clearError();
            }}
            className="text-brand-rose-gold hover:text-brand-rose-gold-dark font-medium transition-colors"
          >
            {isLoginMode ? t('account.register') : t('account.login')}
          </button>
        </p>
      </div>
    );
  }

  // Authenticated view
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <h1 className="font-display text-display-sm sm:text-display-md text-brand-charcoal mb-8">
        {t('account.title')}
      </h1>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar tabs */}
        <aside className="md:w-56 flex-shrink-0">
          <nav className="flex md:flex-col gap-1">
            {(
              [
                { key: 'profile', icon: User, label: t('account.profile') },
                { key: 'orders', icon: Package, label: t('account.orders') },
                { key: 'privacy', icon: Shield, label: t('account.privacy') },
              ] as const
            ).map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={clsx(
                  'flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors',
                  activeTab === key
                    ? 'bg-brand-rose-gold/10 text-brand-rose-gold'
                    : 'text-brand-charcoal-light hover:bg-brand-cream',
                )}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-brand-charcoal-light hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors mt-2"
            >
              <LogOut size={18} />
              {t('account.logout')}
            </button>
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Profile tab */}
          {activeTab === 'profile' && user && (
            <div className="card p-6 sm:p-8 space-y-6">
              <h2 className="text-lg font-semibold text-brand-charcoal">
                {t('account.profile')}
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-brand-warm-gray mb-1">
                    {t('checkout.firstName')}
                  </label>
                  <p className="text-brand-charcoal font-medium">
                    {user.firstName}
                  </p>
                </div>
                <div>
                  <label className="block text-sm text-brand-warm-gray mb-1">
                    {t('checkout.lastName')}
                  </label>
                  <p className="text-brand-charcoal font-medium">
                    {user.lastName}
                  </p>
                </div>
                <div>
                  <label className="block text-sm text-brand-warm-gray mb-1">
                    {t('account.email')}
                  </label>
                  <p className="text-brand-charcoal font-medium">
                    {user.email}
                  </p>
                </div>
                <div>
                  <label className="block text-sm text-brand-warm-gray mb-1">
                    {t('checkout.phone')}
                  </label>
                  <p className="text-brand-charcoal font-medium">
                    {user.phone || '—'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Orders tab */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-brand-charcoal">
                {t('account.orders')}
              </h2>
              {ordersLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse card p-4">
                      <div className="h-4 bg-brand-cream rounded w-1/4 mb-2" />
                      <div className="h-3 bg-brand-cream rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="card p-8 text-center">
                  <Package
                    size={40}
                    className="mx-auto text-brand-cream-dark mb-3"
                  />
                  <p className="text-brand-warm-gray">
                    {t('account.noOrders')}
                  </p>
                  <Link href="/productos" className="btn-primary mt-4 text-sm">
                    Explorar productos
                  </Link>
                </div>
              ) : (
                orders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/cuenta/pedidos?id=${order.id}`}
                    className="card p-5 block hover:shadow-card-hover transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-brand-charcoal">
                        {t('order.number', { number: order.orderNumber })}
                      </h3>
                      <span
                        className={clsx(
                          'px-2.5 py-0.5 text-xs font-medium rounded-full',
                          order.status === 'delivered'
                            ? 'bg-emerald-100 text-emerald-700'
                            : order.status === 'cancelled'
                              ? 'bg-red-100 text-red-700'
                              : order.status === 'shipped' || order.status === 'in_transit'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-amber-100 text-amber-700',
                        )}
                      >
                        {t(`order.status.${order.status}` as Parameters<typeof t>[0])}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-brand-warm-gray">
                      <span>{formatDate(order.createdAt)}</span>
                      <span className="font-medium text-brand-charcoal">
                        {formatPrice(order.total)}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

          {/* Privacy tab */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-brand-charcoal">
                {t('account.privacy')}
              </h2>

              {/* Consent management */}
              <div className="card p-6">
                <h3 className="text-sm font-semibold text-brand-charcoal mb-4">
                  {t('account.consent')}
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-brand-charcoal">
                        {t('gdpr.analytics')}
                      </p>
                      <p className="text-xs text-brand-warm-gray">
                        {t('gdpr.analyticsDesc')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateConsent({
                          analytics: !consent?.analytics,
                        })
                      }
                      className={clsx(
                        'w-10 h-6 rounded-full relative transition-colors',
                        consent?.analytics
                          ? 'bg-brand-rose-gold'
                          : 'bg-gray-200',
                      )}
                      role="switch"
                      aria-checked={consent?.analytics}
                    >
                      <div
                        className={clsx(
                          'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform',
                          consent?.analytics
                            ? 'right-0.5'
                            : 'left-0.5',
                        )}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-brand-charcoal">
                        {t('gdpr.marketing')}
                      </p>
                      <p className="text-xs text-brand-warm-gray">
                        {t('gdpr.marketingDesc')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateConsent({
                          marketing: !consent?.marketing,
                        })
                      }
                      className={clsx(
                        'w-10 h-6 rounded-full relative transition-colors',
                        consent?.marketing
                          ? 'bg-brand-rose-gold'
                          : 'bg-gray-200',
                      )}
                      role="switch"
                      aria-checked={consent?.marketing}
                    >
                      <div
                        className={clsx(
                          'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform',
                          consent?.marketing
                            ? 'right-0.5'
                            : 'left-0.5',
                        )}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Data export / deletion */}
              <div className="card p-6 space-y-4">
                <h3 className="text-sm font-semibold text-brand-charcoal mb-2">
                  Tus datos personales
                </h3>
                <button
                  type="button"
                  onClick={handleExportData}
                  className="w-full flex items-center gap-2 px-4 py-3 border border-brand-cream-dark rounded-xl text-sm text-brand-charcoal hover:border-brand-rose-gold hover:text-brand-rose-gold transition-colors"
                >
                  <Download size={16} />
                  {t('account.exportData')}
                </button>

                {!deleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(true)}
                    className="w-full flex items-center gap-2 px-4 py-3 border border-red-200 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={16} />
                    {t('account.deleteAccount')}
                  </button>
                ) : (
                  <div className="p-4 bg-red-50 rounded-xl border border-red-200 space-y-3">
                    <p className="text-sm text-red-600">
                      {t('account.deleteWarning')}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
                      >
                        {t('common.confirm')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(false)}
                        className="px-4 py-2 text-sm text-brand-charcoal-light hover:text-brand-charcoal transition-colors"
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
