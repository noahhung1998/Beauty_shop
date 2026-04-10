'use client';

import { Globe } from 'lucide-react';
import { useTranslation, type Locale } from '@/lib/i18n';
import clsx from 'clsx';

const LOCALES: { code: Locale; label: string; short: string }[] = [
  { code: 'es', label: 'Español', short: 'ES' },
  { code: 'en', label: 'English', short: 'EN' },
];

export default function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();

  return (
    <div className="flex items-center gap-1 bg-brand-cream rounded-full px-1 py-0.5 border border-brand-cream-dark">
      <Globe size={14} className="text-brand-warm-gray ml-1" />
      {LOCALES.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLocale(l.code)}
          className={clsx(
            'px-2 py-1 text-xs font-semibold rounded-full transition-all',
            locale === l.code
              ? 'bg-brand-rose-gold text-white shadow-sm'
              : 'text-brand-charcoal-light hover:text-brand-rose-gold',
          )}
          aria-label={`Switch to ${l.label}`}
          aria-pressed={locale === l.code}
        >
          {l.short}
        </button>
      ))}
    </div>
  );
}
