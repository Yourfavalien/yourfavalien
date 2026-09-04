(function () {
  const cfg = window.YFA_MOTHERSHIP;
  if (!cfg) return;

  const publicBase = 'https://yourfavalien-mothership.aydenmtz54.workers.dev/assets/';
  const slotMap = new Map((cfg.slots || []).map(slot => [slot.id, slot]));

  function remoteUrl(slotId) {
    const slot = slotMap.get(slotId);
    if (!slot) return null;
    return `${publicBase}${slot.path}?v=${Math.floor(Date.now() / 60000)}`;
  }

  function applyImage(img) {
    const slotId = img.dataset.yfaImageSlot;
    const url = remoteUrl(slotId);
    if (!url) return;
    const fallback = img.getAttribute('src') || '';
    img.dataset.yfaFallback = fallback;
    img.onerror = function () {
      if (this.src !== fallback) {
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
      Object.assign(replacement.style, { position:'absolute', inset:'0', width:'100%', height:'100%', maxWidth:'none', maxHeight:'none', objectFit:'cover', objectPosition:'center', zIndex:'0', pointerEvents:'none' });
      const restoreOriginal = () => { original.style.opacity=''; original.style.visibility=''; replacement.remove(); };
      replacement.addEventListener('error', restoreOriginal, { once:true });
      original.style.opacity = '0';
      original.style.visibility = 'hidden';
      original.insertAdjacentElement('afterend', replacement);
      if (replacement.tagName === 'VIDEO') replacement.play().catch(() => {});
    } catch (error) {}
  }

  function boot() {
    document.querySelectorAll('[data-yfa-image-slot]').forEach(applyImage);
    document.querySelectorAll('[data-yfa-bg-slot]').forEach(applyBackground);
    applyHomeHeroMedia();
  }

  cfg.refreshImages = boot;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
