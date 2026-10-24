(function () {
  'use strict';

  const STATUS_URL = 'https://yourfavalien-mothership.aydenmtz54.workers.dev/api/settings/maintenance';
  const MAINTENANCE_PAGE = '/maintenance.html';
  const CAMPAIGN_PAGE = '/dont-look-away.html';

  const pathname = window.location.pathname.toLowerCase();
  if (pathname.startsWith('/mothership') || pathname.endsWith('/maintenance.html')) return;
  const isCampaignPage = pathname.endsWith('/dont-look-away.html');

  let finished = false;
  function reveal() {
    if (finished) return;
    finished = true;
  }

  function goToMaintenance() {
    if (finished) return;
    finished = true;
    const current = window.location.pathname + window.location.search + window.location.hash;
    const target = `${MAINTENANCE_PAGE}?from=${encodeURIComponent(current)}`;
    window.location.replace(target);
  }

  function goToCampaign() {
    if (finished || isCampaignPage) return;
    finished = true;
    window.location.replace(CAMPAIGN_PAGE);
  }

  function hasLocalPreviewPass() {
    try {
      const until = Number(localStorage.getItem('yfa-maintenance-preview-until') || 0);
      return until > Date.now();
    } catch (error) {
      return false;
    }
  }

  const safetyTimer = window.setTimeout(reveal, 1500);

  // Use a unique request so Campaign and Maintenance switches take effect on
  // the next navigation instead of waiting for the public settings cache.
  fetch(`${STATUS_URL}?v=${Date.now()}`, { cache: 'no-store' })
    .then(response => response.ok ? response.json() : { enabled: false })
    .then(status => {
      window.clearTimeout(safetyTimer);
      if (status && status.enabled === true && !hasLocalPreviewPass()) {
        goToMaintenance();
        return;
      }
      if (status && status.campaignEnabled === true && !isCampaignPage && window.YFA_IS_404 !== true) {
        goToCampaign();
        return;
      }
      reveal();
    })
    .catch(() => {
      window.clearTimeout(safetyTimer);
      reveal();
    });
})();
