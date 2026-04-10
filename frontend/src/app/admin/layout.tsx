'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Truck,
  BarChart3,
  Menu,
  X,
  ArrowLeft,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import clsx from 'clsx';

const NAV_ITEMS = [
  { href: '/admin', icon: LayoutDashboard, labelKey: 'admin.dashboard' },
  { href: '/admin/pedidos', icon: Package, labelKey: 'admin.orders' },
  { href: '/admin/logistica', icon: Truck, labelKey: 'admin.logistics' },
  { href: '/admin/analiticas', icon: BarChart3, labelKey: 'admin.analytics' },
] as const;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <div className="flex min-h-[calc(100vh-5rem)]">
      {/* Mobile sidebar toggle */}
      <button
        type="button"
        onClick={() => setIsSidebarOpen(true)}
        className="fixed bottom-4 left-4 z-30 lg:hidden w-12 h-12 bg-brand-charcoal text-white rounded-full shadow-lg flex items-center justify-center"
        aria-label="Abrir menú"
      >
        <Menu size={20} />
      </button>

      {/* Sidebar backdrop (mobile) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed lg:sticky top-0 left-0 z-40 lg:z-auto h-full lg:h-auto w-64 bg-brand-charcoal text-white flex-shrink-0 transition-transform duration-300 lg:translate-x-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="p-6">
          {/* Mobile close button */}
          <div className="flex items-center justify-between mb-8 lg:hidden">
            <span className="font-display text-lg">Admin</span>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* Logo / title */}
          <div className="hidden lg:block mb-8">
            <Link href="/admin" className="font-display text-xl text-white">
              Beauty <span className="text-brand-rose-gold-light">Admin</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors',
                    isActive(item.href)
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:bg-white/5 hover:text-gray-200',
                  )}
                >
                  <Icon size={18} />
                  {t(item.labelKey as Parameters<typeof t>[0])}
                </Link>
              );
            })}
          </nav>

          {/* Back to store */}
          <div className="mt-12 pt-6 border-t border-white/10">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
              Volver a la tienda
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 bg-gray-50">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </div>
    </div>
  );
}
