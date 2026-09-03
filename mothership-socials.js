(function () {
  const cfg = window.YFA_MOTHERSHIP;
  if (!cfg || !cfg.socialsPath || !document.documentElement.matches('[data-yfa-theme-page="socials"]')) return;

  const defaults = {
    header: { title: '@yourrfavalien', intro: 'Hey cutie take a peek. 👽', email: 'businessinquiry@yourfavalien.com' },
    items: {
      quickTikTok: { enabled: true, label: 'follow on TikTok', url: 'https://www.tiktok.com/@yourrfavalien' },
      quickInstagram: { enabled: true, label: 'follow on Instagram', url: 'https://www.instagram.com/yourrfavalien' },
      quickSnapchat: { enabled: true, label: 'add on Snapchat', url: 'https://www.snapchat.com/add/yourfavvalien' },
      tiktokEmbed: { enabled: true }, instagramEmbed: { enabled: true },
      snapchat: { enabled: true, label: 'Snapchat', url: 'https://www.snapchat.com/add/yourfavvalien' },
      facebook: { enabled: true, label: 'Facebook', url: 'https://www.facebook.com/share/18BmPVjQhd/?mibextid=wwXIfr' },
      mediaKit: { enabled: true, label: 'Media Kit', url: 'https://www.yourfavalien.site/' },
      subscribe: { enabled: true }
    }
  };

  function apply(settings) {
    const data = settings && typeof settings === 'object' ? settings : {};
    const header = Object.assign({}, defaults.header, data.header || {});
    const items = Object.assign({}, defaults.items, data.items || {});
    const title = document.querySelector('[data-yfa-social-header="title"]');
    const intro = document.querySelector('[data-yfa-social-header="intro"]');
    const email = document.querySelector('[data-yfa-social-header="email"]');
    if (title) title.textContent = header.title;
    if (intro) intro.textContent = header.intro;
    if (email) { email.textContent = header.email; email.href = 'mailto:' + header.email; }

    Object.keys(defaults.items).forEach(function (key) {
      const value = Object.assign({}, defaults.items[key], items[key] || {});
      const element = document.querySelector('[data-yfa-social="' + key + '"]');
      if (element) element.hidden = value.enabled === false;
      const link = document.querySelector('[data-yfa-social-link="' + key + '"]');
      if (link && value.url) link.href = value.url;
      const label = document.querySelector('[data-yfa-social-label="' + key + '"]');
      if (label && value.label) label.textContent = value.label;
    });

    const customTarget = document.getElementById('yfa-custom-socials');
    if (customTarget) {
      customTarget.textContent = '';
      const links = Array.isArray(data.customLinks) ? data.customLinks.filter(function (link) {
        return link && link.enabled !== false && String(link.label || '').trim() && /^https:\/\//i.test(String(link.url || '').trim());
      }) : [];
      const groups = new Map();
      links.forEach(function (link) {
        const category = String(link.category || '').trim();
        const group = groups.get(category) || [];
        group.push(link); groups.set(category, group);
      });
      groups.forEach(function (groupLinks, category) {
        const section = document.createElement('section'); section.className = 'custom-social-group';
        if (category) { const heading = document.createElement('h2'); heading.className = 'custom-social-category'; heading.textContent = category; section.appendChild(heading); }
        const list = document.createElement('div'); list.className = 'custom-social-links';
        groupLinks.forEach(function (link) {
          const anchor = document.createElement('a'); anchor.className = 'custom-social-link'; anchor.href = String(link.url).trim(); anchor.target = '_blank'; anchor.rel = 'noopener noreferrer'; anchor.textContent = String(link.label).trim(); list.appendChild(anchor);
        });
        section.appendChild(list); customTarget.appendChild(section);
      });
    }
  }

  const url = cfg.supabaseUrl + '/storage/v1/object/public/' + cfg.bucket + '/' + cfg.socialsPath + '?v=' + Math.floor(Date.now() / 60000);
  fetch(url).then(function (response) { return response.ok ? response.json() : null; }).then(apply).catch(function () { apply(defaults); });
})();
