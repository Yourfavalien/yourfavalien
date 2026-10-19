(() => {
  'use strict';
  const waitFor = (selector, attempts = 30) => new Promise(resolve => {
    const tick = () => { const node = document.querySelector(selector); if (node || attempts-- <= 0) return resolve(node); setTimeout(tick, 100); };
    tick();
  });
  const click = id => document.getElementById(id)?.click();
  const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  function reveal(anchor, tries = 16) {
    if (document.getElementById(anchor)) return scrollTo(anchor);
    if (tries > 0) setTimeout(() => reveal(anchor, tries - 1), 120);
  }
  function showControls(anchor) { click('controlsTab'); setTimeout(() => reveal(anchor), 0); }
  async function mount() {
    const dashboard = await waitFor('#dashboard');
    if (!dashboard || document.querySelector('.yfa-app-layout')) return;
    document.body.classList.add('yfa-app-ready');
    const layout = document.createElement('div'); layout.className = 'yfa-app-layout';
    const sidebar = document.createElement('aside'); sidebar.className = 'yfa-app-sidebar';
    sidebar.innerHTML = `<div class="yfa-app-brand"><span>✦</span><div><b>MOTHERSHIP</b><small>YourFavAlien control center</small></div></div><nav class="yfa-app-nav" aria-label="Mothership navigation"><button data-area="dashboard" aria-current="page"><span>⌂</span>Dashboard</button><button data-area="editor"><span>✎</span>Website Editor</button><button data-area="pages"><span>▤</span>Pages & Navigation</button><button data-area="design"><span>◉</span>Design & Branding</button><button data-area="media"><span>▧</span>Media Library</button><button data-area="socials"><span>⌘</span>Socials & Links</button><button data-area="popup"><span>◌</span>Popups & Email</button><button data-area="maintenance"><span>⌁</span>Maintenance</button><button data-area="settings"><span>⚙</span>Settings</button></nav><div class="yfa-app-side-bottom"><a href="https://yourfavalien.com" target="_blank" rel="noopener">↗ View live site</a><small>Existing controls stay connected.</small></div>`;
    const main = document.createElement('main'); main.className = 'yfa-app-main';
    dashboard.parentNode.insertBefore(layout, dashboard); layout.append(sidebar, main); main.append(dashboard);
    const home = document.createElement('section'); home.id = 'yfaAppHome'; home.className = 'yfa-app-home';
    home.innerHTML = `<article class="yfa-app-welcome"><div class="eyebrow">YOURFAVALIEN · WEBSITE CONTROL</div><h1>Welcome back to Mothership.</h1><p>This is your real control center. Every live setting stays connected while the dashboard is organized around it.</p><div class="yfa-app-actions"><button data-jump="websiteImages">Manage media</button><button data-jump="themeColors">Edit design</button><button data-jump="yfaMaintenanceControl">Maintenance</button></div></article><article class="yfa-app-status"><div class="eyebrow">LIVE SYSTEM</div><strong>Connected controls</strong><small>Media, theme, Socials, Orbit Popup, Maintenance, support, and administrative tools remain on their existing protected data sources.</small></article>`;
    dashboard.querySelector('.topbar')?.insertAdjacentElement('afterend', home);
    home.querySelectorAll('[data-jump]').forEach(button => button.addEventListener('click', () => showControls(button.dataset.jump)));
    const actions = {
      dashboard: () => home.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      editor: () => showControls('homeHeroControlsTitle'),
      pages: () => showControls('menuEditorTitle'),
      design: () => showControls('themeColors'),
      media: () => showControls('websiteImages'),
      socials: () => { click('socialsTab'); setTimeout(() => scrollTo('socialsView'), 0); },
      popup: () => { showControls('yfaPopupControl'); setTimeout(() => reveal('yfaPopupControl'), 80); },
      maintenance: () => { click('maintenanceTab'); setTimeout(() => reveal('yfaMaintenanceControl'), 80); },
      settings: () => showControls('xiloTraining')
    };
    sidebar.querySelectorAll('[data-area]').forEach(button => button.addEventListener('click', () => {
      sidebar.querySelectorAll('[data-area]').forEach(item => item.removeAttribute('aria-current'));
      button.setAttribute('aria-current', 'page'); actions[button.dataset.area]?.();
    }));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
