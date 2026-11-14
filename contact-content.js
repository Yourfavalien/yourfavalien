/* Bind the approved Contact layout to the existing MOTHERSHIP page controls. */
(() => {
  const cfg = window.YFA_MOTHERSHIP;
  if (!cfg) return;
  const apply = data => {
    const page = data?.pages?.contact;
    if (!page) return;
    const main = document.querySelector('.studio-contact');
    if (page.enabled === false) {
      main.replaceChildren();
      const message = document.createElement('p');
      message.textContent = 'This page is currently not published.';
      main.append(message);
      return;
    }
    if (page.heading) document.getElementById('contact-title').textContent = page.heading;
    if (page.body) document.querySelector('.studio-intro p').textContent = page.body;
    const general = document.querySelector('.studio-destination');
    if (page.buttonLabel) general.querySelector('h2').textContent = page.buttonLabel;
    if (page.buttonUrl) {
      try {const url=new URL(page.buttonUrl,location.origin);if(['http:','https:','mailto:'].includes(url.protocol))general.href=url.href;}catch{}
    }
    if (page.seoTitle) {
      document.title = page.seoTitle;
      document.querySelectorAll('meta[property="og:title"],meta[name="twitter:title"]').forEach(m=>m.content=page.seoTitle);
    }
    if (page.seoDescription) document.querySelectorAll('meta[name="description"],meta[property="og:description"],meta[name="twitter:description"]').forEach(m=>m.content=page.seoDescription);
  };
  if (new URLSearchParams(location.search).get('yfa-preview') === '1') {
    try {const draft=JSON.parse(localStorage.getItem('yfa-site-advanced-draft')||'null');if(draft){apply(draft);return;}}catch{}
  }
  fetch(cfg.assetBase+'system/site-advanced.json?v='+Date.now(),{cache:'no-store'})
    .then(r=>{if(!r.ok)throw Error('Contact settings unavailable');return r.json();}).then(apply)
    .catch(()=>{/* The full static contact page remains usable without settings. */});
})();
