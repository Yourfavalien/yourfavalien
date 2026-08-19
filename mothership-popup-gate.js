(function () {
  'use strict';

  const cfg = window.YFA_MOTHERSHIP;
  if (!cfg) return;

  const popupPath = cfg.popupPath || 'system/orbit-popup.json';
  const publicBase = `${cfg.supabaseUrl}/storage/v1/object/public/${cfg.bucket}/`;
  const statusUrl = `${publicBase}${popupPath}?v=${Date.now()}`;

  // Hide it briefly while status loads so an OFF popup never flashes on-screen.
  const shield = document.createElement('style');
  shield.id = 'yfaOrbitPopupGlobalSwitch';
  shield.textContent = `
    #yfa-orbit-popup,.yfa-orbit-reopen{
      opacity:0!important;
      visibility:hidden!important;
      pointer-events:none!important;
    }
  `;
  (document.head || document.documentElement).appendChild(shield);

  function enablePopup() {
    shield.remove();
  }

  function disablePopup() {
    shield.textContent = `
      #yfa-orbit-popup,.yfa-orbit-reopen{
        display:none!important;
        opacity:0!important;
        visibility:hidden!important;
        pointer-events:none!important;
      }
      body.yfa-orbit-open{overflow:auto!important;}
    `;
    if (document.body) document.body.classList.remove('yfa-orbit-open');
  }

  fetch(statusUrl, { cache: 'no-store' })
    .then(response => {
      if (!response.ok) return { enabled: true };
      return response.json();
    })
    .then(data => {
      if (data && data.enabled === false) disablePopup();
      else enablePopup();
    })
    .catch(enablePopup);
})();
