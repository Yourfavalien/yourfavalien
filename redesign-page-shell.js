(() => {
  'use strict';
  const shell = document.documentElement.dataset.yfaRedesignShell;
  if (!shell || !document.body) return;

  const preview = new URLSearchParams(location.search).get('yfa-redesign') === 'preview';
  const routes = preview
    ? { home: '/redesign-preview.html', gallery: '/redesign-gallery.html', socials: '/socials.html?yfa-redesign=preview', contact: '/contact.html?yfa-redesign=preview', privacy: '/privacy.html?yfa-redesign=preview', help: '/help.html' }
    : { home: '/', gallery: '/redesign-gallery.html', socials: '/socials.html', contact: '/contact.html', privacy: '/privacy.html', help: '/help.html' };

  document.querySelector('body > nav')?.remove();

  const header = document.createElement('header');
  header.className = 'yfa-header';
  header.innerHTML = `<nav class="yfa-nav" aria-label="Primary navigation"><a class="yfa-nav__left" data-route="socials">Socials</a><a class="yfa-brand" data-route="home" aria-label="YourFavAlien home"><img src="/assets/01_Primary_Chrome_Wordmark_Clean.png" alt="YourFavAlien"></a><a class="yfa-nav__right" data-route="contact">Contact</a></nav>`;
  header.querySelectorAll('[data-route]').forEach(link => { link.href = routes[link.dataset.route]; });

  const footer = document.createElement('footer');
  footer.className = 'yfa-footer';
  footer.innerHTML = `<a data-route="home">Home</a><img src="/assets/06_YFA_Chrome_Monogram_Clean.png" alt="" aria-hidden="true"><div class="yfa-footer__links"><a data-route="gallery">Gallery</a><a href="https://www.yourfavalien.site/" target="_blank" rel="noopener noreferrer">Business</a><a data-route="privacy">Privacy</a><button type="button" data-yfa-privacy-open>Privacy choices</button><a data-route="help">Help</a><small class="yfa-footer__copyright">© 2026 YourFavAlien. All rights reserved.</small></div>`;
  footer.querySelectorAll('[data-route]').forEach(link => { link.href = routes[link.dataset.route]; });

  document.body.prepend(header);
  document.body.append(footer);
  const trim=()=>header.querySelectorAll('a').forEach(a=>{if(!a.hasAttribute('data-route'))a.remove();});
  new MutationObserver(trim).observe(header,{childList:true,subtree:true});

})();
