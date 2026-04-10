'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ConsentState } from '@/types';
import { gdprApi } from '@/lib/api';

// ============================================================
// GDPR consent management hook
// ============================================================

const CONSENT_KEY = 'gdpr-consent';
const CONSENT_VERSION = '1.0';

const DEFAULT_CONSENT: ConsentState = {
  necessary: true,
  analytics: false,
  marketing: false,
  timestamp: '',
  version: CONSENT_VERSION,
};

function readConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as ConsentState;
  } catch {
    return null;
  }
}

function writeConsent(consent: ConsentState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
}

export function useConsent() {
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Load consent from localStorage on mount
  useEffect(() => {
    const stored = readConsent();
    if (stored) {
      setConsent(stored);
      setHasInteracted(true);
    } else {
      setConsent(DEFAULT_CONSENT);
      setHasInteracted(false);
    }
  }, []);

  const saveConsent = useCallback((newConsent: ConsentState) => {
    const withTimestamp: ConsentState = {
      ...newConsent,
      necessary: true, // Always true
      timestamp: new Date().toISOString(),
      version: CONSENT_VERSION,
    };
    writeConsent(withTimestamp);
    setConsent(withTimestamp);
    setHasInteracted(true);

    // Best-effort sync to backend
    gdprApi.updateConsent(withTimestamp).catch(() => {});
  }, []);

  const acceptAll = useCallback(() => {
    saveConsent({
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: '',
      version: CONSENT_VERSION,
    });
  }, [saveConsent]);

  const rejectAll = useCallback(() => {
    saveConsent({
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: '',
      version: CONSENT_VERSION,
    });
  }, [saveConsent]);

  const acceptNecessaryOnly = useCallback(() => {
    saveConsent({
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: '',
      version: CONSENT_VERSION,
    });
  }, [saveConsent]);

  const updateConsent = useCallback(
    (updates: Partial<Omit<ConsentState, 'necessary' | 'timestamp' | 'version'>>) => {
      const current = consent || DEFAULT_CONSENT;
      saveConsent({
        ...current,
        ...updates,
        necessary: true,
      });
    },
    [consent, saveConsent],
  );

  return {
    consent,
    hasInteracted,
    isAnalyticsAllowed: consent?.analytics ?? false,
    isMarketingAllowed: consent?.marketing ?? false,
    acceptAll,
    rejectAll,
    acceptNecessaryOnly,
    updateConsent,
  };
}
