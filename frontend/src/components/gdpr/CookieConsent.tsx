'use client';

import { useState } from 'react';
import { Shield, X } from 'lucide-react';
import { useConsent } from '@/hooks/useConsent';
import { useTranslation } from '@/lib/i18n';
import clsx from 'clsx';

export default function CookieConsent() {
  const { t } = useTranslation();
  const {
    consent,
    hasInteracted,
    acceptAll,
    acceptNecessaryOnly,
    updateConsent,
  } = useConsent();
  const [showSettings, setShowSettings] = useState(false);
  const [localAnalytics, setLocalAnalytics] = useState(false);
  const [localMarketing, setLocalMarketing] = useState(false);

  // Don't show banner if user has already interacted
  if (hasInteracted && !showSettings) return null;

  // Don't render until consent state is loaded (avoid SSR flash)
  if (!consent) return null;

  const handleSaveSettings = () => {
    updateConsent({
      analytics: localAnalytics,
      marketing: localMarketing,
    });
    setShowSettings(false);
  };

  const handleOpenSettings = () => {
    setLocalAnalytics(consent.analytics);
    setLocalMarketing(consent.marketing);
    setShowSettings(true);
  };

  return (
    <>
      {/* Main banner */}
      {!hasInteracted && !showSettings && (
        <div className="fixed bottom-0 left-0 right-0 z-[60] animate-fade-in-up">
          <div className="bg-white border-t border-brand-cream-dark shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Shield
                  size={24}
                  className="text-brand-rose-gold flex-shrink-0 mt-0.5 sm:mt-0"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-brand-charcoal">
                    {t('gdpr.banner.title')}
                  </p>
                  <p className="text-xs text-brand-warm-gray mt-1 leading-relaxed">
                    {t('gdpr.banner.message')}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto flex-shrink-0">
                  <button
                    type="button"
                    onClick={acceptAll}
                    className="px-5 py-2.5 bg-brand-rose-gold text-white text-sm font-medium rounded-xl hover:bg-brand-rose-gold-dark transition-colors"
                  >
                    {t('gdpr.acceptAll')}
                  </button>
                  <button
                    type="button"
                    onClick={acceptNecessaryOnly}
                    className="px-5 py-2.5 bg-brand-cream text-brand-charcoal text-sm font-medium rounded-xl hover:bg-brand-cream-dark transition-colors"
                  >
                    {t('gdpr.rejectAll')}
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenSettings}
                    className="px-5 py-2.5 text-brand-charcoal-light text-sm font-medium rounded-xl border border-brand-cream-dark hover:border-brand-rose-gold hover:text-brand-rose-gold transition-colors"
                  >
                    {t('gdpr.configure')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings modal */}
      {showSettings && (
        <>
          <div
            className="fixed inset-0 z-[70] bg-black/50 animate-fade-in"
            onClick={() => setShowSettings(false)}
          />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[70] max-w-lg mx-auto bg-white rounded-2xl shadow-xl animate-fade-in overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-cream-dark">
              <div className="flex items-center gap-2">
                <Shield size={20} className="text-brand-rose-gold" />
                <h3 className="text-lg font-semibold text-brand-charcoal">
                  {t('gdpr.configure')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="p-1.5 text-brand-warm-gray hover:text-brand-charcoal transition-colors"
                aria-label={t('common.close')}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
              {/* Necessary cookies - always on */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-brand-charcoal">
                    {t('gdpr.necessary')}
                  </p>
                  <p className="text-xs text-brand-warm-gray mt-1">
                    {t('gdpr.necessaryDesc')}
                  </p>
                </div>
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-10 h-6 bg-brand-rose-gold rounded-full relative cursor-not-allowed opacity-70">
                    <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm" />
                  </div>
                </div>
              </div>

              {/* Analytics cookies */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-brand-charcoal">
                    {t('gdpr.analytics')}
                  </p>
                  <p className="text-xs text-brand-warm-gray mt-1">
                    {t('gdpr.analyticsDesc')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLocalAnalytics(!localAnalytics)}
                  className={clsx(
                    'flex-shrink-0 mt-0.5 w-10 h-6 rounded-full relative transition-colors',
                    localAnalytics ? 'bg-brand-rose-gold' : 'bg-gray-200',
                  )}
                  role="switch"
                  aria-checked={localAnalytics}
                >
                  <div
                    className={clsx(
                      'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform',
                      localAnalytics
                        ? 'right-0.5 translate-x-0'
                        : 'left-0.5 translate-x-0',
                    )}
                  />
                </button>
              </div>

              {/* Marketing cookies */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-brand-charcoal">
                    {t('gdpr.marketing')}
                  </p>
                  <p className="text-xs text-brand-warm-gray mt-1">
                    {t('gdpr.marketingDesc')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLocalMarketing(!localMarketing)}
                  className={clsx(
                    'flex-shrink-0 mt-0.5 w-10 h-6 rounded-full relative transition-colors',
                    localMarketing ? 'bg-brand-rose-gold' : 'bg-gray-200',
                  )}
                  role="switch"
                  aria-checked={localMarketing}
                >
                  <div
                    className={clsx(
                      'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform',
                      localMarketing
                        ? 'right-0.5 translate-x-0'
                        : 'left-0.5 translate-x-0',
                    )}
                  />
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-brand-cream-dark flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="px-5 py-2.5 text-sm font-medium text-brand-charcoal-light hover:text-brand-charcoal transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-5 py-2.5 bg-brand-rose-gold text-white text-sm font-medium rounded-xl hover:bg-brand-rose-gold-dark transition-colors"
              >
                {t('gdpr.save')}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
