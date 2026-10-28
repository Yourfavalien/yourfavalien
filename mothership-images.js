(function () {
  const cfg = window.YFA_MOTHERSHIP;
  if (!cfg) return;

  const publicBase = cfg.assetBase;
  const slotMap = new Map((cfg.slots || []).map(slot => [slot.id, slot]));
  const pageAssetVersion = '20261016-profile-icons2';
  let positions = { slots:{} };

  function currentPoint(slotId) {
    const responsive = positions.slots?.[slotId];
    if (!responsive) return null;
    const key = innerWidth < 600 ? 'phone' : innerWidth < 1100 ? 'tablet' : 'desktop';
    return responsive[key] || responsive.desktop || null;
  }

  function applyPosition(el, slotId, background = false) {
    const p = currentPoint(slotId);
    if (!el || !p) return;
    if (background) { el.style.backgroundPosition = `${p.x}% ${p.y}%`; return; }
    el.style.objectPosition = `${p.x}% ${p.y}%`;
    el.style.transformOrigin = `${p.x}% ${p.y}%`;
    el.style.transform = `scale(${p.zoom || 1})`;
    el.dataset.yfaPositionSlot = slotId;
  }

  async function loadPositions() {
    try {
      const response = await fetch(`${publicBase}system/image-positions.json?v=${Math.floor(Date.now()/60000)}`, {cache:'no-store'});
      if (response.ok) positions = await response.json();
    } catch (error) {}
  }

  function toCloudflareUrl(value) { return String(value || ''); }

  function remoteUrl(slotId) {
    const slot = slotMap.get(slotId);
    if (!slot) return null;
    // Keep one stable URL so the browser can reuse large Mothership photos.
    // A new release version refreshes them after a site update without forcing
    // multi-megabyte profile images to download again every minute.
    return `${publicBase}${slot.path}?v=${pageAssetVersion}`;
  }

  function wireRetry(el) {
    if (!el || el.dataset.yfaRetryWired === '1') return;
    el.dataset.yfaRetryWired = '1';
    el.addEventListener('error', function retryOnce() {
      if (this.dataset.yfaRetried === '1') return;
      const current = this.currentSrc || this.src || '';
      if (!current.includes('/assets/')) return;
      this.dataset.yfaRetried = '1';
      const joiner = current.includes('?') ? '&' : '?';
      this.src = `${current}${joiner}retry=${Date.now()}`;
    });
  }

  function rewriteMedia(root) {
    const nodes = [];
    if (root && root.matches && root.matches('img[src],video[src],source[src]')) nodes.push(root);
    if (root && root.querySelectorAll) nodes.push(...root.querySelectorAll('img[src],video[src],source[src]'));
    nodes.forEach(el => {
      const raw = el.getAttribute('src') || '';
      const rewritten = toCloudflareUrl(raw);
      if (rewritten && rewritten !== raw) el.setAttribute('src', rewritten);
      if (el.tagName === 'IMG' || el.tagName === 'VIDEO') wireRetry(el);
    });
  }

  function watchLegacyMedia() {
    rewriteMedia(document);
    new MutationObserver(records => {
      records.forEach(record => {
        if (record.type === 'attributes') rewriteMedia(record.target);
        record.addedNodes && record.addedNodes.forEach(node => {
          if (node.nodeType === 1) rewriteMedia(node);
        });
      });
    }).observe(document.documentElement, { childList:true, subtree:true, attributes:true, attributeFilter:['src'] });
  }

  function applyImage(img) {
    const slotId = img.dataset.yfaImageSlot;
    const url = remoteUrl(slotId);
    if (!url) return;
    const fallback = toCloudflareUrl(img.getAttribute('src') || '');
    img.dataset.yfaFallback = fallback;
    if (/^socials-(?:tiktok|instagram|snapchat|facebook|youtube)-profile$/.test(slotId)) {
      img.loading = 'eager';
      img.fetchPriority = 'high';
    }
    wireRetry(img);
    img.onerror = function () {
      if (fallback && this.src !== fallback) {
        this.onerror = null;
        this.src = fallback;
      }
    };
    img.src = url;
    applyPosition(img, slotId);
  }

  function applyBackground(el) {
    const slotId = el.dataset.yfaBgSlot;
    const url = remoteUrl(slotId);
    if (!url) return;
    const probe = new Image();
    probe.onload = () => { el.style.backgroundImage = `url("${url}")`; applyPosition(el, slotId, true); };
    probe.onerror = () => {
      const joiner = url.includes('?') ? '&' : '?';
      const retry = new Image();
      retry.onload = () => { el.style.backgroundImage = `url("${url}${joiner}retry=${Date.now()}")`; };
      retry.src = `${url}${joiner}retry=${Date.now()}`;
    };
    probe.src = url;
  }

  async function applyHomeHeroMedia() {
    const hero = document.querySelector('#home .hero-bg');
    const original = document.getElementById('heroVideo');
    if (!slotMap.has('home-hero-media') || !hero || !original) return;
    const desktopUrl = remoteUrl('home-hero-media');
    const phoneUrl = window.matchMedia('(max-width: 599px)').matches ? remoteUrl('home-hero-phone') : null;
    let selectedUrl = phoneUrl || desktopUrl;
    const phoneSelected = Boolean(phoneUrl);
    const url = selectedUrl;
    if (!url) return;
    try {
      let response = await fetch(selectedUrl, { method: 'HEAD', cache: 'no-store' });
      if (!response.ok && phoneUrl) {
        selectedUrl = desktopUrl;
        response = await fetch(selectedUrl, { method: 'HEAD', cache: 'no-store' });
      }
      if (!response.ok) return;
      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      let replacement = null;
      if (contentType.startsWith('image/')) {
        replacement = document.createElement('img');
        replacement.alt = 'YourFavAlien homepage hero';
        replacement.src = selectedUrl;
      } else if (contentType.startsWith('video/')) {
        replacement = document.createElement('video');
        replacement.id = 'yfaHeroReplacement';
        replacement.autoplay = true;
        replacement.muted = true;
        replacement.defaultMuted = true;
        replacement.volume = 0;
        replacement.loop = true;
        replacement.playsInline = true;
        replacement.controls = false;
        replacement.preload = 'auto';
        replacement.disableRemotePlayback = true;
        replacement.disablePictureInPicture = true;
        replacement.setAttribute('autoplay', '');
        replacement.setAttribute('muted', '');
        replacement.setAttribute('playsinline', '');
        replacement.setAttribute('webkit-playsinline', '');
        replacement.setAttribute('x-webkit-airplay', 'deny');
        replacement.setAttribute('disableRemotePlayback', '');
        replacement.setAttribute('controlslist', 'nodownload nofullscreen noremoteplayback noplaybackrate');
        replacement.removeAttribute('controls');
      } else return;
      replacement.id = 'yfaHeroReplacement';
      wireRetry(replacement);
      Object.assign(replacement.style, { position:'absolute', inset:'0', width:'100%', height:'100%', maxWidth:'none', maxHeight:'none', objectFit:'cover', objectPosition:'center', zIndex:'0', pointerEvents:'none' });
      applyPosition(replacement, phoneSelected && selectedUrl === phoneUrl ? 'home-hero-phone' : 'home-hero-media');
      const existingReplacement = document.getElementById('yfaHeroReplacement');
      if (existingReplacement) {
        if (existingReplacement.src === selectedUrl) {
          if (existingReplacement.tagName === 'VIDEO' && existingReplacement.paused) {
            existingReplacement.play().catch(() => {});
          }
          return;
        }
        existingReplacement.remove();
      }
      const restoreOriginal = () => { original.style.opacity=''; original.style.visibility=''; replacement.remove(); };
      replacement.addEventListener('error', restoreOriginal, { once:true });
      original.style.opacity = '0';
      original.style.visibility = 'hidden';
      original.insertAdjacentElement('afterend', replacement);
      replacement.src = selectedUrl;
      if (replacement.tagName === 'VIDEO') {
        const enforceAutoplay = () => {
          replacement.controls = false;
          replacement.removeAttribute('controls');
          replacement.muted = true;
          replacement.defaultMuted = true;
          replacement.volume = 0;
          replacement.playsInline = true;
        };
        const startPlayback = () => {
          enforceAutoplay();
          const playback = replacement.play();
          if (playback && typeof playback.catch === 'function') {
            playback.catch(() => {});
          }
        };
        ['loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough'].forEach(evt => {
          replacement.addEventListener(evt, startPlayback, { once: true });
        });
        document.addEventListener('visibilitychange', () => {
          if (!document.hidden && replacement.paused) startPlayback();
        });
        window.addEventListener('pageshow', () => {
          if (replacement.paused) startPlayback();
        });
        const resumeOnUserTouch = () => {
          if (replacement.paused) startPlayback();
        };
        window.addEventListener('touchstart', resumeOnUserTouch, { once: true, passive: true, capture: true });
        window.addEventListener('pointerdown', resumeOnUserTouch, { once: true, passive: true });
        startPlayback();
      }
    } catch (error) {}
  }

  function loadSiteEnhancements() {
    if (document.documentElement.dataset.yfaRedesign === 'home' || document.documentElement.dataset.yfaRedesignShell) return;
    if (window.__YFA_SITE_ENHANCEMENTS__ || document.querySelector('script[data-yfa-site-enhancements]')) return;
    const script = document.createElement('script');
    script.src = '/site-enhancements.js?v=20261027-redesign-shell';
    script.defer = true;
    script.dataset.yfaSiteEnhancements = '1';
    document.head.appendChild(script);
  }

  async function boot() {
    await loadPositions();
    watchLegacyMedia();
    document.querySelectorAll('[data-yfa-image-slot]').forEach(applyImage);
    document.querySelectorAll('[data-yfa-bg-slot]').forEach(applyBackground);
    applyHomeHeroMedia();
    loadSiteEnhancements();
  }

  cfg.refreshImages = boot;
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      document.querySelectorAll('[data-yfa-position-slot]').forEach(el => applyPosition(el, el.dataset.yfaPositionSlot));
      document.querySelectorAll('[data-yfa-bg-slot]').forEach(el => applyPosition(el, el.dataset.yfaBgSlot, true));
    }, 120);
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();

