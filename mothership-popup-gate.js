(function () {
  'use strict';

  const cfg = window.YFA_MOTHERSHIP;
  if (!cfg) return;

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
      if (!data || data.enabled !== false) enablePopup();
    })
    .catch(enablePopup);
})();
