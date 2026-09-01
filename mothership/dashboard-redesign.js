(() => {
  const controlsTab = document.getElementById('controlsTab');
  const chatsTab = document.getElementById('chatsTab');
  const directory = document.querySelector('.control-directory');

  function openSection(link) {
    const selector = link.getAttribute('href');
    if (!selector || !selector.startsWith('#')) return;

    if (selector === '#chatsView') {
      chatsTab?.click();
      window.setTimeout(() => document.getElementById('chatsView')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 40);
      return;
    }

    controlsTab?.click();
    window.setTimeout(() => {
      const target = document.querySelector(selector);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (target) {
        target.classList.add('directory-target');
        window.setTimeout(() => target.classList.remove('directory-target'), 900);
      }
    }, 40);
  }

  directory?.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    event.preventDefault();
    openSection(link);
  });

  const friendlyTabNames = new Map([
    ['controlsTab', 'Website'],
    ['chatsTab', 'Xilo inbox'],
    ['powerTab', 'Pages & media'],
    ['completeTab', 'Site settings']
  ]);

  function normalizeTabs() {
    document.querySelectorAll('.dashboard-tab').forEach(tab => {
      const label = friendlyTabNames.get(tab.id);
      if (label) tab.textContent = label;
    });
  }

  normalizeTabs();
  new MutationObserver(normalizeTabs).observe(document.querySelector('.dashboard-tabs') || document.body, {
    childList: true,
    subtree: true
  });
})();
