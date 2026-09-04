(function () {
  'use strict';

  const cfg = window.YFA_MOTHERSHIP;
  const dashboard = document.getElementById('dashboard');
  const topbar = dashboard && dashboard.querySelector('.topbar');
  if (!cfg || !dashboard || !topbar || document.getElementById('yfaPopupControl')) return;

  const style = document.createElement('style');
  style.textContent = `
    #yfaPopupControl{margin:0 0 30px;padding:18px;border:1px solid rgba(255,255,255,.12);border-radius:18px;background:linear-gradient(145deg,rgba(77,232,216,.055),rgba(181,23,94,.075));}
    .yfa-popup-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap}
    .yfa-popup-head h2{margin:4px 0 5px!important}
    .yfa-popup-copy{color:var(--muted);font-size:11px;line-height:1.65;max-width:680px}
    .yfa-popup-badge{display:inline-flex;align-items:center;gap:8px;padding:8px 11px;border:1px solid var(--line);border-radius:999px;font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;white-space:nowrap}
    .yfa-popup-dot{width:8px;height:8px;border-radius:50%;background:var(--ok);box-shadow:0 0 14px var(--ok)}
    .yfa-popup-badge.off{color:#ffd8e8;border-color:rgba(255,143,159,.35);background:rgba(181,23,94,.12)}
    .yfa-popup-badge.off .yfa-popup-dot{background:var(--bad);box-shadow:0 0 14px var(--bad)}
    .yfa-popup-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:16px}
    .yfa-popup-actions .btn{min-width:190px}
    .yfa-popup-note{margin-top:12px;color:var(--muted);font-size:9px;line-height:1.6}
    @media(max-width:600px){.yfa-popup-actions .btn{width:100%}.yfa-popup-badge{width:100%;justify-content:center}}
  `;
  document.head.appendChild(style);

  const panel = document.createElement('section');
  panel.id = 'yfaPopupControl';
  panel.innerHTML = `
    <div class="yfa-popup-head">
      <div>
        <div class="eyebrow">Orbit transmission control</div>
        <h2>Orbit popup</h2>
        <div class="yfa-popup-copy">Turn the signup popup on or off for everybody. The setting is stored in Cloudflare.</div>
      </div>
      <div id="yfaPopupBadge" class="yfa-popup-badge"><span class="yfa-popup-dot"></span><span>Checking status…</span></div>
    </div>
    <div class="yfa-popup-actions"><button id="yfaPopupToggle" class="btn" type="button" disabled>Checking…</button></div>
    <div id="yfaPopupStatus" class="status" aria-live="polite"></div>
    <div class="yfa-popup-note">ON shows the popup normally. OFF hides it globally.</div>
  `;
  const statusAnchor = document.getElementById('siteStatus');
  if (statusAnchor) statusAnchor.insertAdjacentElement('afterend', panel);
  else topbar.insertAdjacentElement('afterend', panel);

  const scripts = [
    ['/mothership-cloudflare-admin.js?v=20260903-1', 'yfaCloudflareAdmin'],
    ['/mothership-power.js?v=20260830-2', 'yfaMothershipPower'],
    ['/mothership-complete-admin.js?v=20260830-2', 'yfaMothershipComplete'],
    ['/mothership-badge-admin.js?v=20260830-2', 'yfaMothershipBadge']
  ];

  scripts.forEach(([src,key]) => {
    const attr = `data-${key.replace(/[A-Z]/g,m=>'-'+m.toLowerCase())}`;
    if (document.querySelector(`script[${attr}]`)) return;
    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    script.setAttribute(attr, 'true');
    document.head.appendChild(script);
  });
})();
