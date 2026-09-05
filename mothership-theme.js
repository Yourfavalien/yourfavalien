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

  // Defaults are already in each page's CSS; this only applies saved overrides.
  fetch(url)
    .then(response => {
      if (!response.ok) throw new Error('No saved Mothership theme yet.');
      return response.json();
    })
    .then(data => apply((data && data.colors) || {}))
    .catch(() => {});
})();
