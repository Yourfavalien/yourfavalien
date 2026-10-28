(() => {
  'use strict';

  const isLocalPreview = /^(127\.0\.0\.1|localhost)$/.test(location.hostname);
  const MOTHERSHIP = isLocalPreview ? '/__mothership__/assets/' : 'https://yourfavalien-mothership.aydenmtz54.workers.dev/assets/';
  const CONTENT_URL = `${MOTHERSHIP}system/site-content.json`;
  const THEME_URL = `${MOTHERSHIP}theme/theme.json`;
  const HERO_DESKTOP = `${MOTHERSHIP}slots/home-hero-media`;
  const HERO_PHONE = `${MOTHERSHIP}slots/home-hero-phone`;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const isPhone = () => window.matchMedia('(max-width: 599px)').matches;

  const safeId = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(-72);
  const isVideo = item => /\.(mp4|webm|mov)(?:\?|$)/i.test(String(item?.path || item?.url || ''));
  const visibleMedia = items => (Array.isArray(items) ? items : []).filter(item => item && item.url && item.visible !== false);
  const newestMediaFirst = items => [...items].sort((a, b) => {
    const time = item => {
      const explicit = Date.parse(item?.uploadedAt || item?.createdAt || '');
      if (Number.isFinite(explicit)) return explicit;
      const match = String(item?.path || item?.url || '').match(/\/(\d{10,})-/);
      return match ? Number(match[1]) : 0;
    };
    return time(b) - time(a);
  });

  async function getJson(url) {
    const response = await fetch(`${url}?v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    return response.json();
  }

  function pointFor(item) {
    const responsive = item?.responsive;
    if (!responsive) return { x: 50, y: 50, zoom: 1 };
    const key = innerWidth < 600 ? 'phone' : innerWidth < 1100 ? 'tablet' : 'desktop';
    return responsive[key] || responsive.desktop || { x: 50, y: 50, zoom: 1 };
  }

  function mediaNode(item, priority = false) {
    const alt = item.alt || 'YourFavAlien editorial photograph';
    if (isVideo(item)) {
      const video = document.createElement('video');
      const makeFallback = () => {
        const link = document.createElement('a');
        link.className = 'yfa-video-fallback';
        link.href = item.url;
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = 'Open original video';
        link.setAttribute('aria-label', `Open original video: ${alt}`);
        return link;
      };
      if (/\.mov(?:\?|$)/i.test(String(item.path || item.url || '')) && !video.canPlayType('video/quicktime')) return makeFallback();
      video.dataset.src = item.url;
      video.muted = true;
      video.defaultMuted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = priority ? 'metadata' : 'none';
      video.setAttribute('aria-label', alt);
      video.setAttribute('controlslist', 'nodownload noremoteplayback');
      video.addEventListener('error', () => video.replaceWith(makeFallback()), { once: true });
      return video;
    }
    const image = document.createElement('img');
    image.src = item.url;
    image.alt = alt;
    image.loading = priority ? 'eager' : 'lazy';
    image.decoding = 'async';
    if (priority) image.fetchPriority = 'high';
    return image;
  }

  function editorialItem(item, index, context = 'home') {
    const article = document.createElement('article');
    const patterns = ['is-wide', 'is-portrait-left', 'is-portrait-right', 'is-cinema'];
    article.className = `yfa-editorial-item ${context === 'home' ? patterns[index % patterns.length] : ''}`;
    article.dataset.mediaId = item.id || safeId(item.path || item.url);
    const point = pointFor(item);
    article.style.setProperty('--object-x', `${Number(point.x) || 50}%`);
    article.style.setProperty('--object-y', `${Number(point.y) || 50}%`);
    article.style.setProperty('--object-zoom', Math.max(1, Number(point.zoom) || 1.06));

    const frame = document.createElement('div');
    frame.className = 'yfa-editorial-item__frame';
    const media = mediaNode(item, index < 2);
    const setRatio = () => {
      const width = media.tagName === 'VIDEO' ? media.videoWidth : media.naturalWidth;
      const height = media.tagName === 'VIDEO' ? media.videoHeight : media.naturalHeight;
      if (width && height) article.style.setProperty('--media-ratio', Math.max(.48, Math.min(2.1, width / height)).toFixed(4));
    };
    media.addEventListener(media.tagName === 'VIDEO' ? 'loadedmetadata' : 'load', setRatio, { once: true });
    if (media.tagName === 'IMG' && media.complete) setRatio();
    frame.appendChild(media);
    const number = document.createElement('span');
    number.className = 'yfa-editorial-item__index';
    number.textContent = String(index + 1).padStart(2, '0');
    article.append(frame, number);
    return article;
  }

  function observeMedia(root) {
    const items = [...root.querySelectorAll('.yfa-editorial-item')];
    if (!('IntersectionObserver' in window) || reduceMotion.matches) {
      items.forEach(item => item.classList.add('is-visible'));
    } else {
      const reveal = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            reveal.unobserve(entry.target);
          }
        });
      }, { rootMargin: '80px 0px -8%' });
      items.forEach(item => reveal.observe(item));
    }

    const videos = [...root.querySelectorAll('video[data-src]')];
    const videoObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const video = entry.target;
        if (entry.isIntersecting) {
          if (!video.src) {
            video.src = video.dataset.src;
            video.load();
          }
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    }, { rootMargin: '260px 0px' });
    videos.forEach(video => videoObserver.observe(video));
  }

  function installParallax(root = document) {
    if (reduceMotion.matches) return;
    const frames = [...root.querySelectorAll('.yfa-editorial-item__frame')];
    if (!frames.length) return;
    let ticking = false;
    const paint = () => {
      ticking = false;
      frames.forEach(frame => {
        const rect = frame.parentElement.getBoundingClientRect();
        if (rect.bottom < -100 || rect.top > innerHeight + 100) return;
        const progress = (rect.top + rect.height / 2 - innerHeight / 2) / innerHeight;
        frame.style.setProperty('--parallax', `${Math.max(-38, Math.min(38, progress * -34)).toFixed(1)}px`);
      });
    };
    const request = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(paint);
    };
    addEventListener('scroll', request, { passive: true });
    addEventListener('resize', request, { passive: true });
    request();
  }

  function renderGallery(content) {
    const gallery = (content.pages || []).find(page => String(page.slug).toLowerCase() === 'gallery');
    if (!gallery) throw new Error('The Mothership Gallery page is not published.');
    const media = visibleMedia(gallery.images);
    if (gallery.orderMode !== 'manual') media.sort((a, b) => {
      const time = item => {
        const explicit = Date.parse(item?.uploadedAt || item?.createdAt || '');
        if (Number.isFinite(explicit)) return explicit;
        const match = String(item?.path || item?.url || '').match(/\/(\d{10,})-/);
        return match ? Number(match[1]) : 0;
      };
      return time(b) - time(a);
    });
    const home = document.querySelector('[data-home-gallery]');
    if (home) {
      const nodes = media.map((item, index) => editorialItem(item, index, 'gallery'));
      const sections = (content.home?.sections || []).filter(section => section && section.enabled !== false && Array.isArray(section.images));
      sections.forEach(section => {
        const sectionMedia = visibleMedia(section.images);
        sectionMedia.forEach((item, index) => {
          const card = editorialItem(item, nodes.length, 'gallery');
          card.dataset.homeSectionId = section.id || '';
          if (index === 0 && (section.title || section.caption)) {
            const label = document.createElement('span');
            label.className = 'yfa-editorial-item__label';
            label.textContent = [section.title, section.caption].filter(Boolean).join(' · ');
            card.appendChild(label);
          }
          nodes.push(card);
        });
      });
      home.replaceChildren(...nodes);
      const footer = document.querySelector('body > .yfa-footer');
      if (footer) home.appendChild(footer);
      observeMedia(home);
      installHorizontalGallery(home);
      renderManagedLinks(content);
    }
    const featured = document.querySelector('[data-featured-gallery]');
    if (featured) {
      featured.replaceChildren(...media.slice(0, 8).map((item, index) => editorialItem(item, index, 'home')));
      observeMedia(featured);
      installParallax(featured);
    }
    const full = document.querySelector('[data-full-gallery]');
    if (full) {
      full.replaceChildren(...media.map((item, index) => editorialItem(item, index, 'gallery')));
      const counter = document.querySelector('[data-gallery-count]');
      if (counter) counter.textContent = `${media.length} transmissions`;
      observeMedia(full);
      installParallax(full);
      document.title = `${gallery.title || 'Gallery'} — YourFavAlien`;
    }
  }

  function renderManagedLinks(content) {
    const host = document.querySelector('.yfa-footer__links');
    if (!host) return;
    const existing = new Set([...host.querySelectorAll('a[href]')].map(link => new URL(link.href, location.href).pathname.toLowerCase()));
    (content.navigation?.customLinks || []).forEach(item => {
      if (!item || item.enabled === false || !item.label || !item.url) return;
      let url = String(item.url).trim();
      if (/^\/page\.html\?slug=gallery$/i.test(url)) url = '/redesign-gallery.html';
      let parsed;
      try { parsed = new URL(url, location.href); } catch (error) { return; }
      if (!/^https?:$/.test(parsed.protocol) || parsed.origin === location.origin && existing.has(parsed.pathname.toLowerCase())) return;
      const link = document.createElement('a');
      link.href = parsed.href;
      link.textContent = item.label;
      if (parsed.origin !== location.origin) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
      host.insertBefore(link, host.querySelector('.yfa-footer__copyright') || null);
      existing.add(parsed.pathname.toLowerCase());
    });
  }

  function installHorizontalGallery(gallery) {
    window.addEventListener('wheel', event => {
      if (event.ctrlKey) return;
      const rawDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (!rawDelta) return;
      event.preventDefault();
      const unit = event.deltaMode === 1 ? 20 : event.deltaMode === 2 ? innerWidth : 1;
      gallery.scrollBy({ left: rawDelta * unit, behavior: 'auto' });
    }, { passive: false, capture: true });
    gallery.addEventListener('keydown', event => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.preventDefault();
      gallery.scrollBy({ left: (event.key === 'ArrowRight' ? 1 : -1) * innerWidth * .72, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    });
  }

  function renderGalleryError(error) {
    document.querySelectorAll('[data-featured-gallery],[data-full-gallery]').forEach(root => {
      const message = document.createElement('p');
      message.className = 'yfa-loading';
      message.textContent = 'The archive signal is unavailable. Please try again.';
      root.replaceChildren(message);
    });
    console.warn('YourFavAlien preview gallery:', error);
  }

  async function applyTheme() {
    try {
      const theme = await getJson(THEME_URL);
      const identity = document.querySelector('[data-home-identity]');
      if (identity && theme.homeIdentity?.enabled !== false && theme.homeIdentity?.text) identity.textContent = theme.homeIdentity.text;
      if (identity && theme.homeIdentity?.enabled === false) identity.hidden = true;
    } catch (error) {
      console.warn('YourFavAlien preview theme:', error);
    }
  }

  async function applyHero() {
    const host = document.querySelector('[data-home-hero]');
    const fallback = document.getElementById('heroVideo');
    if (!host || !fallback) return;
    let url = isPhone() ? HERO_PHONE : HERO_DESKTOP;
    try {
      let response = await fetch(`${url}?v=${Date.now()}`, { method: 'HEAD', cache: 'no-store' });
      if (!response.ok && url === HERO_PHONE) {
        url = HERO_DESKTOP;
        response = await fetch(`${url}?v=${Date.now()}`, { method: 'HEAD', cache: 'no-store' });
      }
      if (!response.ok) return;
      const type = String(response.headers.get('content-type') || '').toLowerCase();
      const media = type.startsWith('video/') ? document.createElement('video') : document.createElement('img');
      media.className = 'yfa-hero__managed-media';
      if (media.tagName === 'VIDEO') {
        media.muted = true;
        media.defaultMuted = true;
        media.autoplay = true;
        media.loop = true;
        media.playsInline = true;
        media.preload = 'auto';
        media.setAttribute('aria-label', 'YourFavAlien homepage film');
      } else {
        media.alt = 'YourFavAlien editorial portrait';
        media.fetchPriority = 'high';
      }
      media.addEventListener('error', () => media.remove(), { once: true });
      media.src = `${url}?v=experience-v2-preview`;
      fallback.insertAdjacentElement('afterend', media);
      fallback.style.opacity = '0';
      if (media.tagName === 'VIDEO') media.play().catch(() => {});
    } catch (error) {
      console.warn('YourFavAlien preview hero:', error);
    }
  }

  function installMenu() {
    const menu = document.querySelector('[data-menu]');
    const open = document.querySelector('[data-menu-open]');
    const close = document.querySelector('[data-menu-close]');
    if (!menu || !open || !close) return;
    let lastFocus = null;
    const openMenu = () => {
      lastFocus = document.activeElement;
      menu.hidden = false;
      document.body.classList.add('is-menu-open');
      open.setAttribute('aria-expanded', 'true');
      requestAnimationFrame(() => close.focus());
    };
    const closeMenu = () => {
      menu.hidden = true;
      document.body.classList.remove('is-menu-open');
      open.setAttribute('aria-expanded', 'false');
      (lastFocus || open).focus();
    };
    open.addEventListener('click', openMenu);
    close.addEventListener('click', closeMenu);
    menu.addEventListener('click', event => { if (event.target === menu || event.target.matches('.yfa-menu__backdrop')) closeMenu(); });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !menu.hidden) closeMenu();
      if (event.key !== 'Tab' || menu.hidden) return;
      const focusable = [...menu.querySelectorAll('a,button')];
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
  }

  function installIntro() {
    const intro = document.querySelector('[data-intro]');
    const film = document.querySelector('[data-intro-film]');
    const play = document.querySelector('[data-intro-play]');
    if (!intro || !film) return;
    const params = new URLSearchParams(location.search);
    const forced = params.get('intro') === '1';
    let seen = false;
    try { seen = sessionStorage.getItem('yfa-experience-v2-intro') === '1'; } catch (error) {}
    if (seen && !forced) { intro.hidden = true; return; }
    document.body.classList.add('is-intro-open');
    film.src = isPhone() ? 'assets/yfa-intro-mobile.mp4' : 'assets/yfa-intro-desktop.mp4';
    intro.focus();
    const finish = () => {
      if (intro.classList.contains('is-leaving')) return;
      intro.classList.add('is-leaving');
      document.body.classList.remove('is-intro-open');
      try { sessionStorage.setItem('yfa-experience-v2-intro', '1'); } catch (error) {}
      setTimeout(() => {
        intro.hidden = true;
        film.pause();
        document.querySelector('.yfa-skip')?.focus();
      }, 750);
    };
    const offerPlay = () => {
      if (!play) { finish(); return; }
      play.hidden = false;
      play.focus();
    };
    const startFilm = () => {
      if (play) play.hidden = true;
      film.play().catch(offerPlay);
    };
    play?.addEventListener('click', startFilm);
    document.addEventListener('keydown', event => {
      if (intro.hidden || intro.classList.contains('is-leaving')) return;
      if (event.key === 'Escape') { event.preventDefault(); return; }
      if (event.key !== 'Tab') return;
      const focusTarget = play && !play.hidden ? play : intro;
      if (!intro.contains(document.activeElement) || document.activeElement === focusTarget) {
        event.preventDefault();
        focusTarget.focus();
      }
    });
    film.addEventListener('ended', finish, { once: true });
    film.addEventListener('error', finish, { once: true });
    if (reduceMotion.matches) offerPlay();
    else startFilm();
  }

  function installChrome() {
    const header = document.querySelector('[data-header]');
    if (!header || header.classList.contains('is-solid')) return;
    let ticking = false;
    addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { header.classList.toggle('is-scrolled', scrollY > 40); ticking = false; });
    }, { passive: true });
  }

  function installInterlude() {
    const video = document.querySelector('[data-interlude-video]');
    if (!video) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.isIntersecting ? video.play().catch(() => {}) : video.pause());
    }, { rootMargin: '120px 0px' });
    observer.observe(video);
  }

  async function boot() {
    installMenu();
    installIntro();
    installChrome();
    installInterlude();
    applyTheme();
    applyHero();
    try { renderGallery(await getJson(CONTENT_URL)); } catch (error) { renderGalleryError(error); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
