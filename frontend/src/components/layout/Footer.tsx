'use client';

import Link from 'next/link';
import { Instagram, Facebook, Twitter } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-brand-charcoal text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block">
              <span className="font-display text-2xl text-white">
                Beauty{' '}
                <span className="text-brand-rose-gold-light">Shop</span>
              </span>
            </Link>
            <p className="mt-4 text-sm text-gray-400 leading-relaxed">
              Tu destino favorito para productos de belleza y cosméticos de alta
              calidad. Envíos a todo México.
            </p>
            <div className="flex gap-4 mt-6">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-400 hover:text-brand-rose-gold-light transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-400 hover:text-brand-rose-gold-light transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-400 hover:text-brand-rose-gold-light transition-colors"
                aria-label="Twitter"
              >
                <Twitter size={20} />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-4">
              Tienda
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/productos"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {t('nav.products')}
                </Link>
              </li>
              <li>
                <Link
                  href="/productos?category=maquillaje"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Maquillaje
                </Link>
              </li>
              <li>
                <Link
                  href="/productos?category=skincare"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Skincare
                </Link>
              </li>
              <li>
                <Link
                  href="/productos?category=cabello"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Cabello
                </Link>
              </li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-4">
              Ayuda
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/contacto"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {t('footer.contact')}
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {t('footer.faq')}
                </Link>
              </li>
              <li>
                <Link
                  href="/devoluciones"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {t('footer.returns')}
                </Link>
              </li>
              <li>
                <Link
                  href="/cuenta"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {t('account.title')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal / GDPR */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-4">
              Legal
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/terminos"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <Link
                  href="/privacidad"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {t('gdpr.privacyPolicy')}
                </Link>
              </li>
              <li>
                <Link
                  href="/cookies"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {t('gdpr.cookiePolicy')}
                </Link>
              </li>
              <li>
                <Link
                  href="/sobre-nosotros"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {t('footer.about')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">{t('footer.rights')}</p>
          <p className="text-xs text-gray-600">
            Todos los precios incluyen IVA
          </p>
        </div>
      </div>
    </footer>
  );
}
