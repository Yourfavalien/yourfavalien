(function () {
  'use strict';

  const cfg = window.YFA_MOTHERSHIP;
  if (!cfg || !window.supabase || !window.supabase.createClient) return;
  if (document.getElementById('yfaPopupControl')) return;

  const dashboard = document.getElementById('dashboard');
  const topbar = dashboard && dashboard.querySelector('.topbar');
  if (!dashboard || !topbar) return;

  const popupPath = cfg.popupPath || 'system/orbit-popup.json';
  const client = window.supabase.createClient(cfg.supabaseUrl, cfg.publishableKey);
  const publicBase = `${cfg.supabaseUrl}/storage/v1/object/public/${cfg.bucket}/`;
  let state = { enabled: true };

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
        <div class="yfa-popup-copy">Turn the signup popup on or off for everybody. Turning it off hides both the automatic popup and its reopen button. Your popup design and settings stay saved.</div>
      </div>
      <div id="yfaPopupBadge" class="yfa-popup-badge"><span class="yfa-popup-dot"></span><span>Checking status…</span></div>
    </div>
    <div class="yfa-popup-actions">
      <button id="yfaPopupToggle" class="btn" type="button" disabled>Checking…</button>
    </div>
    <div id="yfaPopupStatus" class="status" aria-live="polite"></div>
    <div class="yfa-popup-note">ON means the popup behaves normally. OFF globally hides it until you switch it back on.</div>
  `;
  const statusAnchor = document.getElementById('siteStatus');
  if (statusAnchor) statusAnchor.insertAdjacentElement('afterend', panel);
  else topbar.insertAdjacentElement('afterend', panel);

  const badge = document.getElementById('yfaPopupBadge');
  const toggleBtn = document.getElementById('yfaPopupToggle');
  const statusEl = document.getElementById('yfaPopupStatus');

  function setStatus(text, type = '') { statusEl.textContent = text || ''; statusEl.className = `status ${type}`.trim(); }
  function statusUrl() { return `${publicBase}${popupPath}?v=${Date.now()}`; }
  function render() { const enabled = state.enabled !== false; badge.classList.toggle('off', !enabled); badge.querySelector('span:last-child').textContent = enabled ? 'POPUP ON' : 'POPUP OFF'; toggleBtn.textContent = enabled ? 'Turn Orbit popup OFF' : 'Turn Orbit popup ON'; toggleBtn.classList.toggle('danger', !enabled); toggleBtn.disabled = false; }

  async function loadStatus() {
    toggleBtn.disabled = true; setStatus('Checking popup status…');
    try { const response = await fetch(statusUrl(), { cache: 'no-store' }); state = response.ok ? { enabled: !((await response.json())?.enabled === false) } : { enabled: true }; render(); setStatus(state.enabled ? 'Orbit popup is ON.' : 'Orbit popup is OFF for public visitors.', state.enabled ? 'ok' : ''); }
    catch { state = { enabled: true }; render(); setStatus('Could not check the saved popup status. The safe default is ON.', 'error'); }
  }

  async function publish(enabled) {
    toggleBtn.disabled = true; setStatus(enabled ? 'Turning Orbit popup on…' : 'Turning Orbit popup off…');
    try {
      const payload = new Blob([JSON.stringify({ enabled: Boolean(enabled), updatedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
      await client.storage.from(cfg.bucket).remove([popupPath]);
      const { error } = await client.storage.from(cfg.bucket).upload(popupPath, payload, { cacheControl: '30', contentType: 'application/json', upsert: false });
      if (error) throw error;
      state = { enabled: Boolean(enabled) }; render(); setStatus(enabled ? 'Orbit popup is ON again.' : 'Orbit popup is OFF. Visitors will not see it.', 'ok');
    } catch (error) { toggleBtn.disabled = false; setStatus(error.message || 'Could not change the popup status.', 'error'); }
  }

  toggleBtn.addEventListener('click', () => { const next = !state.enabled; if (!window.confirm(next ? 'Turn the Orbit popup ON for public visitors?' : 'Turn the Orbit popup OFF? Visitors will not see the automatic popup or its reopen button.')) return; publish(next); });
  client.auth.onAuthStateChange((_event, session) => { if (session && session.user) loadStatus(); });
  client.auth.getSession().then(({ data }) => { if (data && data.session && data.session.user) loadStatus(); });
})();

(function () {
  const scripts = [
    ['/mothership-power.js?v=20260830-2', 'yfaMothershipPower'],
    ['/mothership-complete-admin.js?v=20260830-1', 'yfaMothershipComplete'],
    ['/mothership-badge-admin.js?v=20260830-1', 'yfaMothershipBadge']
  ];
  scripts.forEach(([src,key]) => {
    if (document.querySelector(`script[data-${key.replace(/[A-Z]/g,m=>'-'+m.toLowerCase())}]`)) return;
    const script=document.createElement('script');script.src=src;script.defer=true;script.dataset[key]='true';document.head.appendChild(script);
  });
})();
