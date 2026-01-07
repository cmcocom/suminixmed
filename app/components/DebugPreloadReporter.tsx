'use client';

import apiFetch from '@/lib/fetcher';
import { useEffect } from 'react';

export default function DebugPreloadReporter() {
  useEffect(() => {
    // Sólo ejecutarse en desarrollo
    if (process.env.NODE_ENV !== 'development') return;

    try {
      const links = Array.from(document.querySelectorAll('link[rel="preload"]'));
      const preloads = links.map((l) => ({
        href: (l as HTMLLinkElement).href,
        as: l.getAttribute('as'),
        type: (l as HTMLLinkElement).type,
        crossOrigin: (l as HTMLLinkElement).crossOrigin || null,
      }));

      if (process.env.NODE_ENV !== 'development') {
        return; // Disable in production
      }

      if (preloads.length === 0) {
        console.debug('[DEBUG_PRELOADS] no preload links found');
        return;
      }

      console.debug('[DEBUG_PRELOADS] found', preloads);

      // Enviar un reporte al servidor para que quede en los logs
      apiFetch('/api/debug/preloads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: location.href,
          preloads,
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
        }),
      }).catch((err) => {
        console.warn('[DEBUG_PRELOADS] report failed', err);
      });
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[DEBUG_PRELOADS] error scanning head', err);
      }
    }
  }, []);

  return null;
}
