(function () {
  'use strict';

  const STATUS_URL = 'https://yourfavalien-mothership.aydenmtz54.workers.dev/api/settings/maintenance';
  const MAINTENANCE_PAGE = '/maintenance.html';
  const CAMPAIGN_PAGE = '/dont-look-away.html';

  const pathname = window.location.pathname.toLowerCase();
  if (pathname.startsWith('/mothership') || pathname.endsWith('/maintenance.html')) return;
  // Support stays reachable during a campaign, including every ticket/help route.
  const supportPages = new Set([
    '/help', '/help-article', '/help-category', '/help-contact', '/help-privacy',
    '/help-ticket', '/help-ticket-confirmation', '/help-tickets', '/status'
  ]);
  function isSupportPage(path) {
    return supportPages.has(path.toLowerCase().replace(/\/+$/, '').replace(/\.html$/, ''));
  }
  const isSupportCenterPage = isSupportPage(pathname);
  const isCampaignPage = pathname.endsWith('/dont-look-away.html');
  const campaignPreview = isCampaignPage && new URLSearchParams(window.location.search).get('mothership-preview') === '1';
  const campaignReturnIsSupport = isCampaignPage && isSupportPage(campaignReturnTarget().split(/[?#]/)[0]);
  let campaignWatcherStarted = false;

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
    const current = window.location.pathname + window.location.search + window.location.hash;
    window.location.replace(`${CAMPAIGN_PAGE}?from=${encodeURIComponent(current)}`);
  }

  function campaignReturnTarget() {
    const candidate = new URLSearchParams(window.location.search).get('from') || '/';
    if (!candidate.startsWith('/') || candidate.startsWith('//') || candidate.toLowerCase().startsWith('/mothership')) return '/';
    return candidate;
  }

  async function watchCampaignState() {
    if (!isCampaignPage || campaignPreview) return;
    try {
      const response = await fetch(`${STATUS_URL}?v=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) return;
      const status = await response.json();
      if (status && status.enabled === true && !hasLocalPreviewPass()) {
        window.location.replace(`${MAINTENANCE_PAGE}?from=${encodeURIComponent(campaignReturnTarget())}`);
        return;
      }
      if (campaignReturnIsSupport || !status || status.campaignEnabled !== true) window.location.replace(campaignReturnTarget());
    } catch (error) {
      // Stay on the campaign if the status service is temporarily unavailable.
    }
  }

  function startCampaignWatcher() {
    if (!isCampaignPage || campaignPreview || campaignWatcherStarted) return;
    campaignWatcherStarted = true;
    window.setInterval(watchCampaignState, 60000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') watchCampaignState();
    });
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
      if (isCampaignPage) {
        if (!campaignPreview && (campaignReturnIsSupport || !status || status.campaignEnabled !== true)) {
          window.location.replace(campaignReturnTarget());
          return;
        }
        reveal();
        startCampaignWatcher();
        return;
      }
      if (status && status.campaignEnabled === true && !isCampaignPage && !isSupportCenterPage && window.YFA_IS_404 !== true) {
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
