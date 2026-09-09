(function () {
  const cfg = window.YFA_MOTHERSHIP;
  if (!cfg || !cfg.themePath) return;

  const page = document.documentElement.dataset.yfaThemePage || '';
  const defs = (cfg.colorGroups || []).flatMap(group => group.colors || []);
  const url = `${cfg.assetBase}${cfg.themePath}?v=${Math.floor(Date.now() / 60000)}`;
  const validHex = value => /^#[0-9a-f]{6}$/i.test(String(value || '').trim());

  function apply(colors) {
    defs.forEach(def => {
      if (!(def.pages || []).includes(page)) return;
      const value = colors && validHex(colors[def.id]) ? colors[def.id] : def.default;
      if (validHex(value)) document.documentElement.style.setProperty(def.cssVar, value);
    });
  }

  function applyHomeIdentity(data) {
    if (page !== 'home') return;
    const line = document.getElementById('homeIdentityLine');
    if (!line) return;
    const saved = data && data.homeIdentity;
    const text = String(saved && saved.text || '').trim();
    line.textContent = text || 'model · main character energy · fashion';
    line.hidden = saved && saved.enabled === false;
  }

  function enableHomeIdentityScroll() {
    if (page !== 'home') return;
    const line = document.getElementById('homeIdentityLine');
    if (!line) return;
    let ticking = false;
    const update = () => {
      const progress = Math.min(Math.max(window.scrollY / 110, 0), 1);
      line.style.opacity = String(1 - progress);
      line.style.transform = `translateX(-50%) translateY(${-8 * progress}px)`;
      line.style.pointerEvents = progress > .9 ? 'none' : '';
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
    update();
  }

  // Defaults are already in each page's CSS; this only applies saved overrides.
  fetch(url)
    .then(response => {
      if (!response.ok) throw new Error('No saved Mothership theme yet.');
      return response.json();
    })
    .then(data => { apply((data && data.colors) || {}); applyHomeIdentity(data); })
    .catch(() => {});
  enableHomeIdentityScroll();
})();
