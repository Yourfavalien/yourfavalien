(function () {
  'use strict';

  if (window.__YFA_CLOUDFLARE_ADMIN_BRIDGE__) return;
  window.__YFA_CLOUDFLARE_ADMIN_BRIDGE__ = true;

  const cfg = window.YFA_MOTHERSHIP || {};
  const READ_BASE = 'https://yourfavalien-mothership.aydenmtz54.workers.dev';
  const WRITE_BASE = window.location.origin;

  const assetUrl = path => `${READ_BASE}/assets/${String(path || '').replace(/^\/+/, '')}?v=${Date.now()}`;
  const settingUrl = key => `${READ_BASE}/api/settings/${encodeURIComponent(key)}?v=${Date.now()}`;
  const writeAssetUrl = path => `${WRITE_BASE}/api/assets/${String(path || '').replace(/^\/+/, '').split('/').map(encodeURIComponent).join('/')}`;
  const writeSettingUrl = key => `${WRITE_BASE}/api/settings/${encodeURIComponent(key)}`;

  async function apiFetch(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      cache: 'no-store'
    });
    const type = (response.headers.get('content-type') || '').toLowerCase();
    if (!response.ok) {
      let message = `Cloudflare request failed (${response.status}).`;
      if (type.includes('application/json')) {
        const data = await response.json().catch(() => ({}));
        if (data && data.error) message = data.error;
      }
      throw new Error(message);
    }
    return response;
  }

  function setStatus(el, text, type = '') {
    if (!el) return;
    el.textContent = text || '';
    el.className = `status ${type}`.trim();
  }

  function slotPathFromCard(card) {
    return (card && card.querySelector('.slot-path') && card.querySelector('.slot-path').textContent || '').trim();
  }

  function renderAssetPreview(card, path) {
    const preview = card && card.querySelector('.preview');
    if (!preview || !path || card.dataset.cfPreviewLoading === '1') return;
    card.dataset.cfPreviewLoading = '1';
    const url = assetUrl(path);

    fetch(url, { method: 'HEAD', cache: 'no-store' }).then(response => {
      if (!response.ok) throw new Error('missing');
      const type = (response.headers.get('content-type') || '').toLowerCase();
      preview.innerHTML = '';

      if (type.startsWith('video/')) {
        const video = document.createElement('video');
        video.src = url;
        video.muted = true;
        video.loop = true;
        video.autoplay = true;
        video.playsInline = true;
        video.controls = true;
        preview.appendChild(video);
        video.play().catch(() => {});
      } else if (type.startsWith('image/')) {
        const img = new Image();
        img.src = url;
        img.alt = card.querySelector('.slot-name')?.textContent || 'Mothership image';
        preview.appendChild(img);
      } else {
        preview.innerHTML = '<span>No Cloudflare asset found.</span>';
      }
      card.dataset.cfPreviewReady = '1';
    }).catch(() => {
      preview.innerHTML = '<span>No Cloudflare asset found.</span>';
      card.dataset.cfPreviewReady = '1';
    }).finally(() => {
      delete card.dataset.cfPreviewLoading;
    });
  }

  function refreshAllAssetPreviews(force = false) {
    document.querySelectorAll('.slot').forEach(card => {
      if (!force && card.dataset.cfPreviewReady === '1') return;
      const path = slotPathFromCard(card);
      if (path) renderAssetPreview(card, path);
    });
  }

  document.addEventListener('change', async event => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || input.type !== 'file' || !input.closest('.slot')) return;
    event.stopImmediatePropagation();
    const card = input.closest('.slot');
    const file = input.files && input.files[0];
    if (!file) return;
    const path = slotPathFromCard(card);
    const status = card.querySelector('.status');
    const deleteBtn = card.querySelector('.delete-btn');
    setStatus(status, 'Uploading to Cloudflare…');
    input.disabled = true;
    if (deleteBtn) deleteBtn.disabled = true;
    try {
      await apiFetch(writeAssetUrl(path), { method: 'PUT', headers: { 'Content-Type': file.type || 'application/octet-stream' }, body: file });
      setStatus(status, 'Updated in Cloudflare.', 'ok');
      delete card.dataset.cfPreviewReady;
      renderAssetPreview(card, path);
    } catch (error) {
      setStatus(status, error.message || 'Upload failed.', 'error');
    } finally {
      input.disabled = false;
      if (deleteBtn) deleteBtn.disabled = false;
      input.value = '';
    }
  }, true);

  document.addEventListener('click', async event => {
    const button = event.target.closest && event.target.closest('.delete-btn');
    if (!button || !button.closest('.slot')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const card = button.closest('.slot');
    const path = slotPathFromCard(card);
    if (!window.confirm('Remove this Mothership asset?')) return;
    const status = card.querySelector('.status');
    button.disabled = true;
    setStatus(status, 'Removing from Cloudflare…');
    try {
      await apiFetch(writeAssetUrl(path), { method: 'DELETE' });
      setStatus(status, 'Removed from Cloudflare.', 'ok');
      delete card.dataset.cfPreviewReady;
      renderAssetPreview(card, path);
    } catch (error) {
      setStatus(status, error.message || 'Remove failed.', 'error');
    } finally {
      button.disabled = false;
    }
  }, true);

  document.addEventListener('click', async event => {
    const button = event.target.closest && event.target.closest('#saveThemeBtn');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const status = document.getElementById('themeStatus');
    button.disabled = true;
    setStatus(status, 'Saving to Cloudflare…');
    try {
      const colors = {};
      document.querySelectorAll('.color-row').forEach(row => {
        const key = row.dataset.colorId;
        const input = row.querySelector('.hex-input');
        if (key && input) colors[key] = input.value.trim().toLowerCase();
      });
      const layout = document.querySelector('[data-menu-layout][aria-pressed="true"]')?.dataset.menuLayout || 'editorial';
      const style = document.querySelector('[data-menu-style][aria-pressed="true"]')?.dataset.menuStyle || 'obsidian';
      const labels = {
        home: document.getElementById('menuLabelHome')?.value.trim() || 'home',
        socials: document.getElementById('menuLabelSocials')?.value.trim() || 'socials',
        about: document.getElementById('menuLabelAbout')?.value.trim() || 'about moi',
        contact: document.getElementById('menuLabelContact')?.value.trim() || 'contact'
      };
      const payload = JSON.stringify({ version: 2, updatedAt: new Date().toISOString(), colors, menu: { layout, style, labels } }, null, 2);
      await apiFetch(writeSettingUrl('theme'), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: payload });
      setStatus(status, 'Menu and colors saved to Cloudflare.', 'ok');
    } catch (error) {
      setStatus(status, error.message || 'Could not save the theme.', 'error');
    } finally {
      button.disabled = false;
    }
  }, true);

  const socialKeys = ['quickTikTok','quickInstagram','quickSnapchat','tiktokEmbed','instagramEmbed','snapchat','facebook','mediaKit','subscribe'];
  document.addEventListener('submit', async event => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || form.id !== 'socialsControlForm') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const status = document.getElementById('socialsStatus');
    const save = document.getElementById('saveSocialsBtn');
    if (save) save.disabled = true;
    setStatus(status, 'Saving Socials to Cloudflare…');
    try {
      const cards = Array.from(document.querySelectorAll('#socialsEditor .social-editor-card'));
      const headerInputs = cards[0]?.querySelectorAll('input') || [];
      const header = { title: headerInputs[0]?.value || '', intro: headerInputs[1]?.value || '', email: headerInputs[2]?.value || '' };
      const items = {};
      socialKeys.forEach((key, index) => {
        const card = cards[index + 1];
        if (!card) return;
        const checkbox = card.querySelector('input[type=checkbox]');
        const textInputs = Array.from(card.querySelectorAll('input')).filter(i => i.type !== 'checkbox');
        items[key] = { enabled: checkbox ? checkbox.checked : true };
        if (textInputs[0]) items[key].label = textInputs[0].value;
        if (textInputs[1]) items[key].url = textInputs[1].value;
      });
      const customLinks = Array.from(document.querySelectorAll('#customSocialsEditor .social-editor-card')).map(card => {
        const checkbox = card.querySelector('input[type=checkbox]');
        const textInputs = Array.from(card.querySelectorAll('input')).filter(i => i.type !== 'checkbox');
        return { enabled: checkbox ? checkbox.checked : true, label: textInputs[0]?.value || '', url: textInputs[1]?.value || '', category: textInputs[2]?.value || '' };
      }).filter(link => link.label || link.url);
      const payload = JSON.stringify({ version: 2, updatedAt: new Date().toISOString(), header, items, customLinks }, null, 2);
      await apiFetch(writeAssetUrl(cfg.socialsPath || 'socials/socials.json'), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: payload });
      setStatus(status, 'Socials page saved to Cloudflare.', 'ok');
    } catch (error) {
      setStatus(status, error.message || 'Could not save Socials.', 'error');
    } finally {
      if (save) save.disabled = false;
    }
  }, true);

  function wirePopupControl() {
    const panel = document.getElementById('yfaPopupControl');
    const button = document.getElementById('yfaPopupToggle');
    const badge = document.getElementById('yfaPopupBadge');
    const status = document.getElementById('yfaPopupStatus');
    if (!panel || !button || button.dataset.cfWired === '1') return false;
    button.dataset.cfWired = '1';
    let enabled = false;
    const render = () => {
      badge?.classList.toggle('off', !enabled);
      if (badge?.querySelector('span:last-child')) badge.querySelector('span:last-child').textContent = enabled ? 'POPUP ON' : 'POPUP OFF';
      button.textContent = enabled ? 'Turn Orbit popup OFF' : 'Turn Orbit popup ON';
      button.disabled = false;
    };
    fetch(assetUrl(cfg.popupPath || 'system/orbit-popup.json'), { cache: 'no-store' })
      .then(r => r.ok ? r.json() : { enabled: false })
      .then(data => {
        enabled = data?.enabled === true;
        render();
        setStatus(status, enabled ? 'Orbit popup is ON.' : 'Orbit popup is OFF for public visitors.', 'ok');
      })
      .catch(() => {
        enabled = false;
        render();
        setStatus(status, 'Could not read popup status; keeping it OFF.', 'error');
      });
    button.addEventListener('click', async event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      const next = !enabled;
      button.disabled = true;
      setStatus(status, next ? 'Turning Orbit popup on…' : 'Turning Orbit popup off…');
      try {
        await apiFetch(writeSettingUrl('orbit-popup'), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: next, updatedAt: new Date().toISOString() }, null, 2) });
        enabled = next;
        render();
        setStatus(status, enabled ? 'Orbit popup is ON.' : 'Orbit popup is OFF.', 'ok');
      } catch (error) {
        button.disabled = false;
        setStatus(status, error.message || 'Could not change popup status.', 'error');
      }
    }, true);
    return true;
  }

  function bootCloudflareAdminBridge() {
    refreshAllAssetPreviews(true);
    if (!wirePopupControl()) {
      let attempts = 0;
      const timer = window.setInterval(() => {
        attempts += 1;
        refreshAllAssetPreviews(false);
        if (wirePopupControl() || attempts >= 20) window.clearInterval(timer);
      }, 250);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootCloudflareAdminBridge, { once: true });
  } else {
    bootCloudflareAdminBridge();
  }
})();
