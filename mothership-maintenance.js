(function () {
  'use strict';

  // Public client values only. No secret/service-role keys belong in this file.
  const SUPABASE_URL = 'https://qpwjfsigvoktsaeiypyy.supabase.co';
  const PUBLISHABLE_KEY = 'sb_publishable_THWa8IbRa_YTSr1bOxonhQ_GCq3J-A9';
  const BUCKET = 'mothership-images';
  const STATUS_PATH = 'system/maintenance.json';
  const MAINTENANCE_PAGE = '/maintenance.html';

  const pathname = window.location.pathname.toLowerCase();
  if (pathname.startsWith('/mothership') || pathname.endsWith('/maintenance.html')) return;

  // Hide the real page while the maintenance state is checked. This prevents
  // the new photos/colors from flashing on screen before a redirect.
  const root = document.documentElement;
  const previousVisibility = root.style.visibility;
  root.style.visibility = 'hidden';

  let finished = false;
  function reveal() {
    if (finished) return;
    finished = true;
    root.style.visibility = previousVisibility;
  }

  function goToMaintenance() {
    if (finished) return;
    finished = true;
    const current = window.location.pathname + window.location.search + window.location.hash;
    const target = `${MAINTENANCE_PAGE}?from=${encodeURIComponent(current)}`;
    window.location.replace(target);
  }

  // Fail open if the status service is unreachable so a temporary network issue
  // cannot accidentally take the whole website offline.
  const safetyTimer = window.setTimeout(reveal, 4500);

  const statusUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${STATUS_PATH}?v=${Date.now()}`;

  fetch(statusUrl, { cache: 'no-store' })
    .then(response => {
      if (!response.ok) return { enabled: false };
      return response.json();
    })
    .then(status => {
      if (!status || status.enabled !== true) {
        window.clearTimeout(safetyTimer);
        reveal();
        return;
      }

      // Maintenance is active. A valid Supabase session is the private preview pass.
      // Only load the auth SDK when maintenance mode is actually on.
      return loadSupabase()
        .then(() => {
          if (!window.supabase || !window.supabase.createClient) throw new Error('Supabase SDK unavailable');
          const client = window.supabase.createClient(SUPABASE_URL, PUBLISHABLE_KEY);
          return client.auth.getSession();
        })
        .then(({ data }) => {
          window.clearTimeout(safetyTimer);
          if (data && data.session && data.session.user) {
            reveal();
          } else {
            goToMaintenance();
          }
        })
        .catch(() => {
          // During maintenance, if auth cannot be checked, treat the visitor as public.
          window.clearTimeout(safetyTimer);
          goToMaintenance();
        });
    })
    .catch(() => {
      window.clearTimeout(safetyTimer);
      reveal();
    });

  function loadSupabase() {
    if (window.supabase && window.supabase.createClient) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-yfa-maintenance-supabase]');
      if (existing) {
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      script.async = true;
      script.dataset.yfaMaintenanceSupabase = '1';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
})();
