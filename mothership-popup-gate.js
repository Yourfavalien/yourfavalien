(function () {
  'use strict';

  const cfg = window.YFA_MOTHERSHIP;
  if (!cfg) return;

  // Load the Mothership-driven no-code site layer on every public page.
  if (!document.querySelector('script[data-yfa-site-enhancements]')) {
    const enhancements = document.createElement('script');
    enhancements.src = '/site-enhancements.js?v=20260830-1';
    enhancements.defer = true;
    enhancements.dataset.yfaSiteEnhancements = 'true';
    document.head.appendChild(enhancements);
  }

  const popupPath = cfg.popupPath || 'system/orbit-popup.json';
  const publicBase = `${cfg.supabaseUrl}/storage/v1/object/public/${cfg.bucket}/`;
  const statusUrl = `${publicBase}${popupPath}?v=${Date.now()}`;

  function enablePopup() {
    const path = (window.location.pathname || '/').toLowerCase();
    if (!['/', '/index.html', '/about.html', '/contact.html'].includes(path)) return;
    if (document.querySelector('script[data-yfa-orbit-component]')) return;
    const script = document.createElement('script');
    script.src = '/orbit-popup.js?v=20260825-3';
    script.defer = true;
    script.dataset.yfaOrbitComponent = 'true';
    document.head.appendChild(script);
  }

  fetch(statusUrl, { cache: 'no-store' })
    .then(response => {
      if (!response.ok) return { enabled: true };
      return response.json();
    })
   .then(data => {
  if (!data || data.enabled !== false) {
    setTimeout(enablePopup, 10000);
  }
})
.catch(() => {
  setTimeout(enablePopup, 10000);
});
})();
