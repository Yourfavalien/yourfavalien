(function () {
  'use strict';

  const cfg = window.YFA_MOTHERSHIP;
  if (!cfg || !cfg.maintenancePath) return;

  const dashboard = document.getElementById('dashboard');
  const topbar = dashboard && dashboard.querySelector('.topbar');
  if (!dashboard || !topbar || document.getElementById('yfaMaintenanceControl')) return;

  const READ_BASE = 'https://yourfavalien-mothership.aydenmtz54.workers.dev';
  const READ_URL = `${READ_BASE}/api/settings/maintenance`;
  const WRITE_URL = `${window.location.origin}/api/settings/maintenance`;
  const defaultMessage = 'Our UFO needed a few repairs. We’re fixing things up now and we’ll be back in orbit soon.';
  const legacyDefaultMessage = 'The Mothership is recalibrating this sector. New transmission incoming — check back soon.';
  let state = { enabled: false, message: defaultMessage };

  const style = document.createElement('style');
  style.textContent = `
    #yfaMaintenanceControl{margin:0 0 30px;padding:18px;border:1px solid rgba(255,255,255,.12);border-radius:18px;background:linear-gradient(145deg,rgba(181,23,94,.09),rgba(77,232,216,.035));}
    .yfa-maint-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap}
    .yfa-maint-head h2{margin:4px 0 5px!important}
    .yfa-maint-copy{color:var(--muted);font-size:11px;line-height:1.65;max-width:680px}
    .yfa-maint-badge{display:inline-flex;align-items:center;gap:8px;padding:8px 11px;border:1px solid var(--line);border-radius:999px;font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;white-space:nowrap}
    .yfa-maint-dot{width:8px;height:8px;border-radius:50%;background:var(--ok);box-shadow:0 0 14px var(--ok)}
    .yfa-maint-badge.active{color:#ffd8e8;border-color:rgba(255,143,159,.35);background:rgba(181,23,94,.12)}
    .yfa-maint-badge.active .yfa-maint-dot{background:var(--bad);box-shadow:0 0 14px var(--bad)}
    .yfa-maint-field{display:grid;gap:7px;margin-top:16px}
    .yfa-maint-field label{font-size:10px;color:var(--muted)}
    .yfa-maint-field textarea{width:100%;min-height:82px;resize:vertical;padding:12px 13px;border-radius:12px;border:1px solid var(--line);background:#090509;color:var(--ink);font:11px/1.6 'Space Mono',monospace;outline:none}
    .yfa-maint-field textarea:focus{border-color:#d65f96;box-shadow:0 0 0 3px rgba(181,23,94,.15)}
    .yfa-maint-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:13px}
    .yfa-maint-actions .btn{min-width:160px}
    .yfa-maint-warning{margin-top:12px;color:var(--muted);font-size:9px;line-height:1.6}
    @media(max-width:600px){.yfa-maint-actions .btn{width:100%}.yfa-maint-badge{width:100%;justify-content:center}}
  `;
  document.head.appendChild(style);

  const panel = document.createElement('section');
  panel.id = 'yfaMaintenanceControl';
  panel.innerHTML = `
    <div class="yfa-maint-head">
      <div>
        <div class="eyebrow">Private launch control</div>
        <h2>Maintenance mode</h2>
        <div class="yfa-maint-copy">Hide the public site while you change photos, video, and colors. This setting is stored in Cloudflare.</div>
      </div>
      <div id="yfaMaintenanceBadge" class="yfa-maint-badge"><span class="yfa-maint-dot"></span><span>Checking status…</span></div>
    </div>
    <div class="yfa-maint-field">
      <label for="yfaMaintenanceMessage">PUBLIC MAINTENANCE MESSAGE</label>
      <textarea id="yfaMaintenanceMessage" maxlength="240" placeholder="${defaultMessage}"></textarea>
    </div>
    <div class="yfa-maint-actions">
      <button id="yfaMaintenanceToggle" class="btn" type="button" disabled>Checking…</button>
      <button id="yfaMaintenancePreview" class="btn secondary" type="button">Preview website</button>
    </div>
    <div id="yfaMaintenanceStatus" class="status" aria-live="polite"></div>
    <div class="yfa-maint-warning">Preview opens a short private preview pass in this browser. Use a private/incognito window to check what public visitors see.</div>
  `;
  const statusAnchor = document.getElementById('siteStatus');
  if (statusAnchor) statusAnchor.insertAdjacentElement('afterend', panel);
  else topbar.insertAdjacentElement('afterend', panel);

  const badge = document.getElementById('yfaMaintenanceBadge');
  const messageInput = document.getElementById('yfaMaintenanceMessage');
  const toggleBtn = document.getElementById('yfaMaintenanceToggle');
  const previewBtn = document.getElementById('yfaMaintenancePreview');
  const statusEl = document.getElementById('yfaMaintenanceStatus');

  function setStatus(text, type = '') {
    statusEl.textContent = text || '';
    statusEl.className = `status ${type}`.trim();
  }

  function render() {
    const active = state.enabled === true;
    badge.classList.toggle('active', active);
    badge.querySelector('span:last-child').textContent = active ? 'MAINTENANCE ACTIVE' : 'SITE LIVE';
    toggleBtn.textContent = active ? 'Turn maintenance OFF' : 'Turn maintenance ON';
    toggleBtn.classList.toggle('danger', active);
    toggleBtn.disabled = false;
    messageInput.value = state.message || defaultMessage;
  }

  async function loadStatus() {
    toggleBtn.disabled = true;
    setStatus('Checking public site status…');
    try {
      const response = await fetch(`${READ_URL}?v=${Date.now()}`, { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        const saved = String((data && data.message) || '').trim();
        state = {
          enabled: data && data.enabled === true,
          message: String(!saved || saved === legacyDefaultMessage ? defaultMessage : saved).slice(0, 240)
        };
      } else {
        state = { enabled: false, message: defaultMessage };
      }
      render();
      setStatus(state.enabled ? 'Public visitors are seeing the maintenance page.' : 'Your website is public right now.', state.enabled ? '' : 'ok');
    } catch (error) {
      toggleBtn.disabled = false;
      setStatus('Could not check maintenance status. Try again.', 'error');
    }
  }

  async function publish(enabled) {
    const message = (messageInput.value || defaultMessage).trim().slice(0, 240) || defaultMessage;
    toggleBtn.disabled = true;
    messageInput.disabled = true;
    setStatus(enabled ? 'Activating maintenance mode…' : 'Bringing the site back online…');

    try {
      const response = await fetch(WRITE_URL, {
        method: 'PUT',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: Boolean(enabled), message, updatedAt: new Date().toISOString() }, null, 2)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `Cloudflare request failed (${response.status}).`);

      state = { enabled: Boolean(enabled), message };
      render();
      setStatus(enabled ? 'Maintenance is ON. Public visitors are hidden.' : 'Maintenance is OFF. The public website is live again.', 'ok');
    } catch (error) {
      toggleBtn.disabled = false;
      setStatus(error.message || 'Could not change maintenance mode.', 'error');
    } finally {
      messageInput.disabled = false;
    }
  }

  toggleBtn.addEventListener('click', () => {
    const next = !state.enabled;
    const copy = next ? 'Turn maintenance mode ON? Public visitors will see the maintenance screen.' : 'Turn maintenance mode OFF and make the website public again?';
    if (!window.confirm(copy)) return;
    publish(next);
  });

  previewBtn.addEventListener('click', () => {
    try { localStorage.setItem('yfa-maintenance-preview-until', String(Date.now() + 15 * 60 * 1000)); } catch (error) {}
    window.open(`/?yfa-preview=${Date.now()}`, '_blank', 'noopener');
  });

  loadStatus();
})();
