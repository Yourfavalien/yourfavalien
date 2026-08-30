(() => {
  if (window.__YFA_SITE_ENHANCEMENTS__) return;
  window.__YFA_SITE_ENHANCEMENTS__ = true;

  const cfg = window.YFA_MOTHERSHIP || {};
  const base = cfg.supabaseUrl && cfg.bucket
    ? `${cfg.supabaseUrl}/storage/v1/object/public/${cfg.bucket}/`
    : '';
  const contentUrl = base ? `${base}system/site-content.json` : '';

  const defaults = {
    navigation: { scrollBehavior: 'hide-up-show-down', customLinks: [] },
    home: { eyebrow: '', title: '', body: '', showIntro: false, sections: [] },
    pages: [],
    seo: { homeTitle: '', homeDescription: '' }
  };

  const esc = (value='') => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));

  async function loadContent() {
    if (!contentUrl) return defaults;
    try {
      const response = await fetch(`${contentUrl}?v=${Math.floor(Date.now() / 60000)}`);
      if (!response.ok) return defaults;
      const data = await response.json();
      return {
        ...defaults,
        ...data,
        navigation: { ...defaults.navigation, ...(data.navigation || {}) },
        home: { ...defaults.home, ...(data.home || {}) },
        seo: { ...defaults.seo, ...(data.seo || {}) },
        pages: Array.isArray(data.pages) ? data.pages : []
      };
    } catch (error) {
      console.warn('Mothership site content could not be loaded.', error);
      return defaults;
    }
  }

  function injectStyles() {
    if (document.getElementById('yfa-power-styles')) return;
    const style = document.createElement('style');
    style.id = 'yfa-power-styles';
    style.textContent = `
      .yfa-smart-menu{transition:transform .28s ease,opacity .28s ease!important;will-change:transform,opacity}
      .yfa-smart-menu.yfa-menu-hidden{transform:translateY(calc(-100% - 18px))!important;opacity:0!important;pointer-events:none!important}
      .yfa-home-feed{position:relative;z-index:2;background:var(--black,#0a0507);color:var(--white,#f0ece8);padding:clamp(58px,8vw,120px) clamp(18px,5vw,72px);overflow:hidden}
      .yfa-home-feed-inner{width:min(1380px,100%);margin:0 auto;display:grid;gap:clamp(70px,10vw,150px)}
      .yfa-home-intro{max-width:820px;display:grid;gap:14px}
      .yfa-home-intro .eyebrow{font:700 11px/1.2 'Space Mono',monospace;text-transform:uppercase;letter-spacing:.18em;color:var(--cyan,#4de8d8)}
      .yfa-home-intro h2{margin:0;font:400 clamp(36px,7vw,88px)/.96 'Playfair Display',serif;letter-spacing:-.04em}
      .yfa-home-intro p{margin:0;max-width:700px;font:400 clamp(13px,1.5vw,17px)/1.8 'Space Mono',monospace;opacity:.82}
      .yfa-gallery-section{display:grid;gap:22px}
      .yfa-gallery-head{display:flex;align-items:end;justify-content:space-between;gap:24px;flex-wrap:wrap}
      .yfa-gallery-head h3{margin:0;font:400 clamp(28px,5vw,58px)/1 'Playfair Display',serif}
      .yfa-gallery-head p{margin:0;max-width:520px;font:400 12px/1.7 'Space Mono',monospace;opacity:.7}
      .yfa-gallery-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:clamp(10px,1.5vw,20px)}
      .yfa-gallery-item{grid-column:span 4;min-height:260px;overflow:hidden;border-radius:2px;background:#12080d}
      .yfa-gallery-item:nth-child(5n+1){grid-column:span 7}
      .yfa-gallery-item:nth-child(5n+2){grid-column:span 5}
      .yfa-gallery-item img,.yfa-gallery-item video{display:block;width:100%;height:100%;min-height:inherit;object-fit:cover}
      .yfa-gallery-grid[data-layout="full"] .yfa-gallery-item{grid-column:1/-1;min-height:min(78vh,850px)}
      .yfa-gallery-grid[data-layout="two"] .yfa-gallery-item{grid-column:span 6;min-height:420px}
      .yfa-dynamic-page{min-height:100vh;background:var(--black,#0a0507);color:var(--white,#f0ece8);padding:clamp(110px,14vw,180px) clamp(18px,6vw,90px) 90px}
      .yfa-dynamic-page-inner{width:min(1200px,100%);margin:0 auto;display:grid;gap:42px}
      .yfa-dynamic-page h1{margin:0;font:400 clamp(48px,9vw,110px)/.92 'Playfair Display',serif;letter-spacing:-.05em}
      .yfa-dynamic-page-copy{max-width:780px;white-space:pre-wrap;font:400 clamp(13px,1.6vw,18px)/1.85 'Space Mono',monospace;opacity:.84}
      .yfa-page-back{color:inherit;text-decoration:none;font:700 11px 'Space Mono',monospace;text-transform:uppercase;letter-spacing:.15em;opacity:.7}
      @media(max-width:760px){.yfa-gallery-item,.yfa-gallery-item:nth-child(n){grid-column:1/-1;min-height:58vh}.yfa-gallery-grid[data-layout="two"] .yfa-gallery-item{grid-column:1/-1;min-height:58vh}}
      @media(prefers-reduced-motion:reduce){.yfa-smart-menu{transition:none!important}}
    `;
    document.head.appendChild(style);
  }

  function getMenuTargets() {
    const candidates = [
      ...document.querySelectorAll('body > nav, header nav, .menu-toggle, .menu-button, .ufo-menu, .ufo-menu-button, [data-menu-toggle], [aria-label*="menu" i]')
    ];
    return [...new Set(candidates)].filter(el => {
      if (!el || el.closest('#yfaDynamicPage')) return false;
      const style = getComputedStyle(el);
      return style.position === 'fixed' || style.position === 'sticky' || el.matches('.menu-toggle,.menu-button,.ufo-menu,.ufo-menu-button,[data-menu-toggle]');
    });
  }

  function setupSmartMenu(content) {
    const behavior = content.navigation?.scrollBehavior || 'hide-up-show-down';
    const targets = getMenuTargets();
    if (!targets.length || behavior === 'always') return;
    targets.forEach(el => el.classList.add('yfa-smart-menu'));
    let lastY = Math.max(0, window.scrollY);
    let ticking = false;

    const update = () => {
      const y = Math.max(0, window.scrollY);
      const delta = y - lastY;
      if (Math.abs(delta) > 7) {
        const hide = behavior === 'hide-up-show-down' ? delta < 0 && y > 40 : delta > 0 && y > 80;
        targets.forEach(el => el.classList.toggle('yfa-menu-hidden', hide));
        lastY = y;
      }
      if (y < 25) targets.forEach(el => el.classList.remove('yfa-menu-hidden'));
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
  }

  function applySeo(content) {
    const isHome = location.pathname === '/' || /\/index\.html$/i.test(location.pathname);
    if (!isHome) return;
    if (content.seo?.homeTitle) document.title = content.seo.homeTitle;
    if (content.seo?.homeDescription) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'description';
        document.head.appendChild(meta);
      }
      meta.content = content.seo.homeDescription;
    }
  }

  function addCustomMenuLinks(content) {
    const links = (content.navigation?.customLinks || []).filter(link => link && link.label && link.url && link.enabled !== false);
    if (!links.length) return;
    const nav = document.querySelector('nav');
    if (!nav || nav.querySelector('[data-yfa-custom-link]')) return;
    links.forEach(link => {
      const a = document.createElement('a');
      a.href = link.url;
      a.textContent = link.label;
      a.dataset.yfaCustomLink = '1';
      if (/^https?:\/\//i.test(link.url) && !link.url.startsWith(location.origin)) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      }
      nav.appendChild(a);
    });
  }

  function mediaMarkup(item) {
    const url = esc(item.url || '');
    const alt = esc(item.alt || 'YourFavAlien photo');
    if (!url) return '';
    if (/\.(mp4|webm|mov)(\?|$)/i.test(url)) {
      return `<div class="yfa-gallery-item"><video src="${url}" autoplay muted loop playsinline aria-label="${alt}"></video></div>`;
    }
    return `<div class="yfa-gallery-item"><img src="${url}" alt="${alt}" loading="lazy" decoding="async"></div>`;
  }

  function renderHome(content) {
    const isHome = location.pathname === '/' || /\/index\.html$/i.test(location.pathname);
    if (!isHome) return;
    const home = content.home || defaults.home;
    const sections = Array.isArray(home.sections) ? home.sections.filter(s => s && s.enabled !== false && Array.isArray(s.images) && s.images.length) : [];
    if (!home.showIntro && !sections.length) return;
    if (document.getElementById('yfaHomeFeed')) return;

    const sectionHtml = sections.map(section => `
      <section class="yfa-gallery-section">
        ${(section.title || section.caption) ? `<div class="yfa-gallery-head"><div>${section.title ? `<h3>${esc(section.title)}</h3>` : ''}</div>${section.caption ? `<p>${esc(section.caption)}</p>` : ''}</div>` : ''}
        <div class="yfa-gallery-grid" data-layout="${esc(section.layout || 'editorial')}">
          ${(section.images || []).map(mediaMarkup).join('')}
        </div>
      </section>
    `).join('');

    const feed = document.createElement('section');
    feed.id = 'yfaHomeFeed';
    feed.className = 'yfa-home-feed';
    feed.innerHTML = `<div class="yfa-home-feed-inner">
      ${home.showIntro ? `<div class="yfa-home-intro">${home.eyebrow ? `<div class="eyebrow">${esc(home.eyebrow)}</div>` : ''}${home.title ? `<h2>${esc(home.title)}</h2>` : ''}${home.body ? `<p>${esc(home.body)}</p>` : ''}</div>` : ''}
      ${sectionHtml}
    </div>`;

    const footer = document.querySelector('footer');
    if (footer) footer.parentNode.insertBefore(feed, footer);
    else document.body.appendChild(feed);
  }

  function renderDynamicPage(content) {
    const root = document.getElementById('yfaDynamicPage');
    if (!root) return;
    const slug = new URLSearchParams(location.search).get('slug') || root.dataset.slug || '';
    const page = (content.pages || []).find(p => p && p.slug === slug && p.enabled !== false);
    if (!page) {
      root.innerHTML = `<div class="yfa-dynamic-page"><div class="yfa-dynamic-page-inner"><a class="yfa-page-back" href="/">← Home</a><h1>Page not found.</h1><div class="yfa-dynamic-page-copy">This page is not currently published.</div></div></div>`;
      return;
    }
    const images = Array.isArray(page.images) ? page.images : [];
    root.innerHTML = `<main class="yfa-dynamic-page"><div class="yfa-dynamic-page-inner"><a class="yfa-page-back" href="/">← Home</a><div><h1>${esc(page.title || 'Untitled')}</h1></div>${page.body ? `<div class="yfa-dynamic-page-copy">${esc(page.body)}</div>` : ''}${images.length ? `<div class="yfa-gallery-grid" data-layout="${esc(page.layout || 'editorial')}">${images.map(mediaMarkup).join('')}</div>` : ''}</div></main>`;
    document.title = page.seoTitle || `${page.title || 'Page'} | YourFavAlien`;
    if (page.description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta); }
      meta.content = page.description;
    }
  }

  async function init() {
    injectStyles();
    const content = await loadContent();
    applySeo(content);
    addCustomMenuLinks(content);
    renderHome(content);
    renderDynamicPage(content);
    setupSmartMenu(content);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
