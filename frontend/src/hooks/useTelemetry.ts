'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { TelemetryEvent } from '@/types';
import { telemetryApi } from '@/lib/api';

// ============================================================
// Telemetry hook – tracks user interactions only with consent
// ============================================================

const BATCH_INTERVAL_MS = 5000;
const CONSENT_KEY = 'gdpr-consent';

// Shared session ID (persistent per tab)
let sessionId: string | null = null;
function getSessionId(): string {
  if (!sessionId) {
    sessionId =
      typeof window !== 'undefined'
        ? (sessionStorage.getItem('telemetry-session') ??
          (() => {
            const id = crypto.randomUUID();
            sessionStorage.setItem('telemetry-session', id);
            return id;
          })())
        : 'ssr';
  }
  return sessionId;
}

// Shared event queue across all hook instances
let eventQueue: TelemetryEvent[] = [];
let batchTimerActive = false;

function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) return false;
    const consent = JSON.parse(stored);
    return consent?.analytics === true;
  } catch {
    return false;
  }
}

function flushQueue() {
  if (eventQueue.length === 0) return;
  const batch = [...eventQueue];
  eventQueue = [];

  // Try sendBeacon first (works on unload), fall back to fetch
  const sent = telemetryApi.sendBeacon(batch);
  if (!sent) {
    telemetryApi.sendEvents(batch).catch(() => {
      // Re-add events on failure so they can be retried
      eventQueue.unshift(...batch);
    });
  }
}

function enqueueEvent(event: TelemetryEvent) {
  if (!hasAnalyticsConsent()) return;

  eventQueue.push(event);

  // Start batch timer if not already running
  if (!batchTimerActive && typeof window !== 'undefined') {
    batchTimerActive = true;
    setInterval(() => {
      flushQueue();
    }, BATCH_INTERVAL_MS);
  }
}

// Flush on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushQueue();
    }
  });
  window.addEventListener('pagehide', flushQueue);
}

/**
 * Telemetry hook that automatically tracks page_view with dwell time
 * and provides methods to track other events.
 * All tracking is gated behind GDPR analytics consent.
 */
export function useTelemetry(pageName?: string) {
  const mountTimeRef = useRef<number>(0);
  const pageUrlRef = useRef<string>('');

  // Track page_view on mount, dwell_time on unmount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    mountTimeRef.current = Date.now();
    pageUrlRef.current = window.location.href;

    // Track page_view
    enqueueEvent({
      eventType: 'page_view',
      timestamp: new Date().toISOString(),
      sessionId: getSessionId(),
      payload: { pageName: pageName || document.title },
      pageUrl: window.location.href,
      referrer: document.referrer || undefined,
      userAgent: navigator.userAgent,
    });

    return () => {
      // Calculate dwell time on unmount
      const dwellTimeMs = Date.now() - mountTimeRef.current;
      enqueueEvent({
        eventType: 'page_view',
        timestamp: new Date().toISOString(),
        sessionId: getSessionId(),
        payload: {
          pageName: pageName || document.title,
          action: 'dwell_complete',
        },
        dwellTimeMs,
        pageUrl: pageUrlRef.current,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      });
      // Flush immediately on unmount to avoid losing the dwell event
      flushQueue();
    };
  }, [pageName]);

  const trackItemClicked = useCallback(
    (productId: string, productName: string, position?: number) => {
      enqueueEvent({
        eventType: 'item_clicked',
        timestamp: new Date().toISOString(),
        sessionId: getSessionId(),
        payload: { productId, productName, position },
        pageUrl: typeof window !== 'undefined' ? window.location.href : '',
      });
    },
    [],
  );

  const trackAddToCart = useCallback(
    (productId: string, productName: string, quantity: number, price: number) => {
      enqueueEvent({
        eventType: 'add_to_cart',
        timestamp: new Date().toISOString(),
        sessionId: getSessionId(),
        payload: { productId, productName, quantity, price },
        pageUrl: typeof window !== 'undefined' ? window.location.href : '',
      });
    },
    [],
  );

  const trackCheckoutStarted = useCallback(
    (cartTotal: number, itemCount: number) => {
      enqueueEvent({
        eventType: 'checkout_started',
        timestamp: new Date().toISOString(),
        sessionId: getSessionId(),
        payload: { cartTotal, itemCount },
        pageUrl: typeof window !== 'undefined' ? window.location.href : '',
      });
    },
    [],
  );

  const trackPurchaseCompleted = useCallback(
    (orderId: string, total: number, itemCount: number) => {
      enqueueEvent({
        eventType: 'purchase_completed',
        timestamp: new Date().toISOString(),
        sessionId: getSessionId(),
        payload: { orderId, total, itemCount },
        pageUrl: typeof window !== 'undefined' ? window.location.href : '',
      });
    },
    [],
  );

  const trackCustomEvent = useCallback(
    (
      eventType: TelemetryEvent['eventType'],
      payload: Record<string, unknown>,
    ) => {
      enqueueEvent({
        eventType,
        timestamp: new Date().toISOString(),
        sessionId: getSessionId(),
        payload,
        pageUrl: typeof window !== 'undefined' ? window.location.href : '',
      });
    },
    [],
  );

  return {
    trackItemClicked,
    trackAddToCart,
    trackCheckoutStarted,
    trackPurchaseCompleted,
    trackCustomEvent,
  };
}
