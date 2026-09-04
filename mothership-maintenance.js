(function () {
  'use strict';

  const STATUS_URL = 'https://yourfavalien-mothership.aydenmtz54.workers.dev/api/settings/maintenance';
  const MAINTENANCE_PAGE = '/maintenance.html';

  const pathname = window.location.pathname.toLowerCase();
  if (pathname.startsWith('/mothership') || pathname.endsWith('/maintenance.html')) return;

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

  function hasLocalPreviewPass() {
    try {
      const until = Number(localStorage.getItem('yfa-maintenance-preview-until') || 0);
      return until > Date.now();
    } catch (error) {
      return false;
    }
  }

  const safetyTimer = window.setTimeout(reveal, 4500);

  fetch(`${STATUS_URL}?v=${Math.floor(Date.now() / 60000)}`, { cache: 'no-store' })
    .then(response => response.ok ? response.json() : { enabled: false })
    .then(status => {
      window.clearTimeout(safetyTimer);
      if (!status || status.enabled !== true || hasLocalPreviewPass()) {
        reveal();
        return;
      }
      goToMaintenance();
    })
    .catch(() => {
      window.clearTimeout(safetyTimer);
      reveal();
    });
})();
