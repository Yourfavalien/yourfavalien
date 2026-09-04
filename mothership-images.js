(function () {
  const cfg = window.YFA_MOTHERSHIP;
  if (!cfg) return;

  const publicBase = 'https://yourfavalien-mothership.aydenmtz54.workers.dev/assets/';
  const legacyBase = `${cfg.supabaseUrl}/storage/v1/object/public/${cfg.bucket}/`;
  const slotMap = new Map((cfg.slots || []).map(slot => [slot.id, slot]));

  function toCloudflareUrl(value) {
    const url = String(value || '');
    return url.startsWith(legacyBase) ? `${publicBase}${url.slice(legacyBase.length)}` : url;
  }

  function remoteUrl(slotId) {
    const slot = slotMap.get(slotId);
    if (!slot) return null;
    return `${publicBase}${slot.path}?v=${Math.floor(Date.now() / 60000)}`;
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
    wireRetry(img);
    img.onerror = function () {
      if (fallback && this.src !== fallback) {
        this.onerror = null;
        this.src = fallback;
      }
    };
    img.src = url;
  }

  function applyBackground(el) {
    const slotId = el.dataset.yfaBgSlot;
    const url = remoteUrl(slotId);
    if (!url) return;
    const probe = new Image();
    probe.onload = () => { el.style.backgroundImage = `url("${url}")`; };
    probe.onerror = () => {
      const joiner = url.includes('?') ? '&' : '?';
      const retry = new Image();
      retry.onload = () => { el.style.backgroundImage = `url("${url}${joiner}retry=${Date.now()}")`; };
      retry.src = `${url}${joiner}retry=${Date.now()}`;
    };
    probe.src = url;
  }

  async function applyHomeHeroMedia() {
    const slot = slotMap.get('home-hero-media');
    const hero = document.querySelector('#home .hero-bg');
    const original = document.getElementById('heroVideo');
    if (!slot || !hero || !original) return;
    const url = remoteUrl('home-hero-media');
    if (!url) return;
    try {
      const response = await fetch(url, { method: 'HEAD', cache: 'no-store' });
      if (!response.ok) return;
      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      let replacement = null;
      if (contentType.startsWith('image/')) {
        replacement = document.createElement('img');
        replacement.alt = 'YourFavAlien homepage hero';
        replacement.src = url;
      } else if (contentType.startsWith('video/')) {
        replacement = document.createElement('video');
        replacement.src = url;
        replacement.autoplay = true;
        replacement.muted = true;
        replacement.loop = true;
        replacement.playsInline = true;
        replacement.preload = 'auto';
      } else return;
      replacement.id = 'yfaHeroReplacement';
      wireRetry(replacement);
      Object.assign(replacement.style, { position:'absolute', inset:'0', width:'100%', height:'100%', maxWidth:'none', maxHeight:'none', objectFit:'cover', objectPosition:'center', zIndex:'0', pointerEvents:'none' });
      const restoreOriginal = () => { original.style.opacity=''; original.style.visibility=''; replacement.remove(); };
      replacement.addEventListener('error', restoreOriginal, { once:true });
      original.style.opacity = '0';
      original.style.visibility = 'hidden';
      original.insertAdjacentElement('afterend', replacement);
      if (replacement.tagName === 'VIDEO') replacement.play().catch(() => {});
    } catch (error) {}
  }

  function loadSiteEnhancements() {
    if (window.__YFA_SITE_ENHANCEMENTS__ || document.querySelector('script[data-yfa-site-enhancements]')) return;
    const script = document.createElement('script');
    script.src = '/site-enhancements.js?v=20260904-1';
    script.defer = true;
    script.dataset.yfaSiteEnhancements = '1';
    document.head.appendChild(script);
  }

  function boot() {
    watchLegacyMedia();
    document.querySelectorAll('[data-yfa-image-slot]').forEach(applyImage);
    document.querySelectorAll('[data-yfa-bg-slot]').forEach(applyBackground);
    applyHomeHeroMedia();
    loadSiteEnhancements();
  }

  cfg.refreshImages = boot;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
