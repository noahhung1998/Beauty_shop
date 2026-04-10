'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Menu, X, User, Search } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from '@/lib/i18n';
import LanguageSwitcher from './LanguageSwitcher';
import clsx from 'clsx';

export default function Header() {
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const openCart = useCartStore((s) => s.openCart);
  const itemCount = useCartStore((s) => s.itemCount);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const navLinks = [
    { href: '/', label: t('nav.home') },
    { href: '/productos', label: t('nav.products') },
    { href: '/cuenta', label: t('nav.account') },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-brand-cream-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden p-2 -ml-2 text-brand-charcoal hover:text-brand-rose-gold transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Menú"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-display text-2xl md:text-3xl tracking-tight text-brand-charcoal group-hover:text-brand-rose-gold transition-colors">
              Beauty
            </span>
            <span className="font-display text-2xl md:text-3xl tracking-tight text-brand-rose-gold">
              Shop
            </span>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-brand-charcoal-light hover:text-brand-rose-gold transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-brand-rose-gold after:transition-all hover:after:w-full"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language switcher */}
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>

            {/* Search */}
            <button
              type="button"
              className="p-2 text-brand-charcoal-light hover:text-brand-rose-gold transition-colors"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              aria-label="Search"
            >
              <Search size={20} />
            </button>

            {/* Account */}
            <Link
              href="/cuenta"
              className="hidden sm:flex p-2 text-brand-charcoal-light hover:text-brand-rose-gold transition-colors"
              aria-label={t('nav.account')}
            >
              <User size={20} />
              {isAuthenticated && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-brand-rose-gold rounded-full" />
              )}
            </Link>

            {/* Cart */}
            <button
              type="button"
              className="relative p-2 text-brand-charcoal-light hover:text-brand-rose-gold transition-colors"
              onClick={openCart}
              aria-label={t('nav.cart')}
            >
              <ShoppingBag size={20} />
              {itemCount() > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-rose-gold text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {itemCount() > 99 ? '99+' : itemCount()}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search bar */}
        {isSearchOpen && (
          <div className="pb-4 animate-fade-in">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-warm-gray"
              />
              <input
                type="search"
                placeholder={t('nav.search')}
                className="w-full pl-10 pr-4 py-2.5 bg-brand-cream rounded-xl border border-brand-cream-dark focus:outline-none focus:ring-2 focus:ring-brand-rose-gold/30 focus:border-brand-rose-gold text-sm text-brand-charcoal placeholder:text-brand-warm-gray"
                autoFocus
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-brand-cream-dark animate-fade-in">
          <nav className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-3 text-base font-medium text-brand-charcoal hover:text-brand-rose-gold hover:bg-brand-cream rounded-xl transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated && (
              <Link
                href="/admin"
                className="block px-4 py-3 text-base font-medium text-brand-warm-gray hover:text-brand-rose-gold hover:bg-brand-cream rounded-xl transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t('nav.admin')}
              </Link>
            )}
            <div className="px-4 pt-3 pb-1">
              <LanguageSwitcher />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
