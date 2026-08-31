(function () {
  'use strict';

  const normalizedPath = window.location.pathname.replace(/\/+$/, '') || '/';
  const isHomePage = normalizedPath === '/' || normalizedPath.toLowerCase().endsWith('/index.html');
  const shouldPlayIntro = isHomePage;
  if (shouldPlayIntro) document.documentElement.classList.add('yfa-intro-pending');
  window.addEventListener('pageshow', function (event) {
    if (shouldPlayIntro && event.persisted) window.location.reload();
  }, { once: true });

  if (/\/(index|about|socials|contact|privacy)\.html$/i.test(normalizedPath) && window.history && window.history.replaceState) {
    const cleanPath = /\/index\.html$/i.test(normalizedPath) ? (normalizedPath.replace(/\/index\.html$/i, '') || '/') : normalizedPath.replace(/\.html$/i, '');
    window.history.replaceState(null, '', cleanPath + window.location.search + window.location.hash);
  }

  function currentPage() {
    let name = window.location.pathname.split('/').pop() || 'index.html';
    if (!name.includes('.')) name += '.html';
    return name.toLowerCase();
  }

  function makeFallbackNavigation() {
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Primary navigation');
    nav.innerHTML = [
      ['index.html', 'home'],
      ['socials.html', 'socials'],
      ['about.html', 'about moi'],
      ['contact.html', 'contact']
    ].map(function (item) {
      const active = currentPage() === item[0] ? ' class="active"' : '';
      return '<a href="' + item[0] + '"' + active + '>' + item[1] + '</a>';
    }).join('');
    document.body.prepend(nav);
    return nav;
  }

  function positionUfo() {
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    const source = isMobile
      ? { width: 720, height: 1280, x: 628, y: 166 }
      : { width: 1280, height: 720, x: 1105, y: 89 };
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scale = Math.max(viewportWidth / source.width, viewportHeight / source.height);
    const renderedWidth = source.width * scale;
    const renderedHeight = source.height * scale;
    const x = ((viewportWidth - renderedWidth) / 2) + (source.x * scale);
    const y = ((viewportHeight - renderedHeight) / 2) + (source.y * scale);
    const safeY = Math.max(42, Math.min(viewportHeight - 40, y));
    const menuRight = Math.max(14, viewportWidth - x - (isMobile ? 8 : 26));
    const root = document.documentElement.style;
    root.setProperty('--yfa-ufo-x', x.toFixed(2) + 'px');
    root.setProperty('--yfa-ufo-y', safeY.toFixed(2) + 'px');
    root.setProperty('--yfa-menu-right', menuRight.toFixed(2) + 'px');
  }

  function installNavigation() {
    const nav = document.querySelector('body > nav') || makeFallbackNavigation();
    nav.classList.add('yfa-menu-panel');
    nav.id = 'yfa-site-menu';
    nav.setAttribute('aria-label', nav.getAttribute('aria-label') || 'Primary navigation');
    nav.setAttribute('aria-hidden', 'true');

    const menuDefaults = { layout: 'editorial', labels: { home: 'home', socials: 'socials', about: 'about moi', contact: 'contact' } };
    const menuLinks = Array.from(nav.querySelectorAll('a')).slice(0, 4);
    function applyMenuSettings(settings) {
      const menu = settings && typeof settings === 'object' ? settings : menuDefaults;
      const allowedLayouts = ['editorial', 'centered', 'split'];
      nav.dataset.yfaMenuLayout = allowedLayouts.includes(menu.layout) ? menu.layout : menuDefaults.layout;
      const labels = menu.labels || {};
      const keys = ['home', 'socials', 'about', 'contact'];
      menuLinks.forEach(function (link, index) {
        const value = String(labels[keys[index]] || menuDefaults.labels[keys[index]]).trim();
        link.textContent = value.slice(0, 28) || menuDefaults.labels[keys[index]];
      });
    }
    applyMenuSettings(menuDefaults);

    const legal = document.createElement('div');
    legal.className = 'yfa-menu-legal';
    legal.innerHTML = '© 2026 YourFavAlien · All rights reserved · <a href="privacy.html">Privacy</a>';
    nav.appendChild(legal);
    const privacyLink = legal.querySelector('a');
    function keepPrivacyInFooter() {
      if (!privacyLink) return;
      if (privacyLink.parentElement !== legal) legal.appendChild(privacyLink);
      if (privacyLink.textContent !== 'Privacy') privacyLink.textContent = 'Privacy';
      if (privacyLink.hidden) privacyLink.hidden = false;
      if (privacyLink.style.display === 'none') privacyLink.style.removeProperty('display');
    }
    new MutationObserver(keepPrivacyInFooter).observe(nav, { childList: true, subtree: true });

    const cfg = window.YFA_MOTHERSHIP;
    if (cfg && cfg.themePath) {
      const settingsUrl = cfg.supabaseUrl + '/storage/v1/object/public/' + cfg.bucket + '/' + cfg.themePath + '?v=' + Math.floor(Date.now() / 60000);
      fetch(settingsUrl)
        .then(function (response) { return response.ok ? response.json() : null; })
        .then(function (data) { if (data && data.menu) applyMenuSettings(data.menu); })
        .catch(function () {});
    }

    const backdrop = document.createElement('button');
    backdrop.type = 'button';
    backdrop.className = 'yfa-menu-backdrop';
    backdrop.setAttribute('aria-label', 'Close site navigation');
    backdrop.tabIndex = -1;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'yfa-menu-button';
    button.setAttribute('aria-label', 'Open site navigation');
    button.setAttribute('aria-controls', nav.id);
    button.setAttribute('aria-expanded', 'false');
    button.innerHTML = '<span class="yfa-menu-mark" aria-hidden="true"><svg class="yfa-menu-ship" viewBox="0 0 54 34"><path class="yfa-ship-dome" d="M19.5 15.6c.5-6.1 3.2-9.4 7.5-9.4 4.5 0 7.1 3.4 7.6 9.4"/><path class="yfa-ship-body" d="M5.5 19.5c5.1-4.2 13-5.7 21.4-5.7 8.6 0 16.5 1.5 21.7 5.7-3.4 5.2-11.9 7.4-21.7 7.4-9.7 0-18-2.2-21.4-7.4Z"/><path class="yfa-ship-line" d="M8.7 20.2c8.7 3.5 27.3 3.5 36.7-.1"/><circle cx="17" cy="21.2" r="1.2"/><circle cx="27.2" cy="22.6" r="1.2"/><circle cx="37.4" cy="21.1" r="1.2"/><path class="yfa-ship-motion" d="M3.6 13.5 0 12m4.2 5.2-3.8.2m49.5-4.1 3.4-1.7m-2.6 5.7 3.2.3"/></svg><span class="yfa-menu-word">menu</span></span>';

    document.body.append(backdrop, button);
    positionUfo();

    let open = false;
    function setOpen(nextOpen, returnFocus) {
      open = nextOpen;
      button.setAttribute('aria-expanded', String(open));
      button.setAttribute('aria-label', open ? 'Close site navigation' : 'Open site navigation');
      const menuWord = button.querySelector('.yfa-menu-word');
      if (menuWord) menuWord.textContent = open ? 'close' : 'menu';
      nav.setAttribute('aria-hidden', String(!open));
      nav.classList.toggle('is-open', open);
      backdrop.classList.toggle('is-open', open);
      if (open) {
        const firstLink = nav.querySelector('a');
        if (firstLink) window.setTimeout(function () { firstLink.focus(); }, 180);
      } else if (returnFocus) {
        button.focus();
      }
    }

    button.addEventListener('click', function () { setOpen(!open, false); });
    backdrop.addEventListener('click', function () { setOpen(false, true); });
    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) setOpen(false, false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && open) setOpen(false, true);
    });
    window.addEventListener('resize', positionUfo, { passive: true });
    window.addEventListener('orientationchange', positionUfo, { passive: true });

    return button;
  }

  function playIntro(menuButton) {
    const overlay = document.createElement('div');
    overlay.className = 'yfa-intro';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', 'YourFavAlien introduction');

    const video = document.createElement('video');
    video.className = 'yfa-intro__video';
    video.autoplay = true;
    video.controls = false;
    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;
    video.playsInline = true;
    video.disableRemotePlayback = true;
    video.removeAttribute('controls');
    video.setAttribute('autoplay', '');
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('disableRemotePlayback', '');
    video.setAttribute('controlslist', 'nodownload nofullscreen noremoteplayback noplaybackrate');
    video.setAttribute('x-webkit-airplay', 'deny');
    video.preload = 'auto';
    video.disablePictureInPicture = true;
    video.setAttribute('aria-hidden', 'true');
    video.src = window.matchMedia('(max-width: 767px)').matches
      ? '/assets/yfa-intro-mobile.mp4?v=20260831-3'
      : '/assets/yfa-intro-desktop.mp4?v=20260831-3';

    const menuShip = menuButton.querySelector('.yfa-menu-ship');
    const flightShip = menuShip.cloneNode(true);
    flightShip.classList.add('yfa-intro__ship');
    flightShip.setAttribute('aria-hidden', 'true');

    overlay.append(video, flightShip);
    document.body.append(overlay);

    let finished = false;
    let playbackStarted = false;
    let animationFrame = 0;
    let startupTimer = 0;
    let stallTimer = 0;

    function ease(value) {
      return 1 - Math.pow(1 - value, 3);
    }

    function shipTarget() {
      const rect = menuShip.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }

    function placeFlightShip(progress) {
      const p = Math.max(0, Math.min(1, progress || 0));
      const width = flightShip.getBoundingClientRect().width || (window.innerWidth < 768 ? 39 : 44);
      const height = flightShip.getBoundingClientRect().height || (window.innerWidth < 768 ? 27 : 30);
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const target = shipTarget();
      let x;
      let y;
      let rotation;
      let scale;

      if (p < .68) {
        const orbit = p / .68;
        const angle = -2.7 + orbit * Math.PI * 3.1;
        x = centerX + Math.cos(angle) * window.innerWidth * (.27 - orbit * .08);
        y = centerY + Math.sin(angle) * window.innerHeight * (.22 - orbit * .05);
        rotation = Math.sin(angle) * 14;
        scale = .82 + orbit * .18;
      } else {
        const q = ease((p - .68) / .32);
        const angle = -2.7 + Math.PI * 3.1;
        const startX = centerX + Math.cos(angle) * window.innerWidth * .19;
        const startY = centerY + Math.sin(angle) * window.innerHeight * .17;
        const controlX = window.innerWidth * .78;
        const controlY = Math.min(startY, target.y) - window.innerHeight * .12;
        const inverse = 1 - q;
        x = inverse * inverse * startX + 2 * inverse * q * controlX + q * q * target.x;
        y = inverse * inverse * startY + 2 * inverse * q * controlY + q * q * target.y;
        rotation = (1 - q) * -11;
        scale = 1;
      }

      flightShip.style.transform = 'translate3d(' + (x - width / 2).toFixed(2) + 'px,' + (y - height / 2).toFixed(2) + 'px,0) rotate(' + rotation.toFixed(2) + 'deg) scale(' + scale.toFixed(3) + ')';
    }

    function animateFlight() {
      if (finished) return;
      const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 3.2;
      placeFlightShip(video.currentTime / duration);
      animationFrame = window.requestAnimationFrame(animateFlight);
    }

    function completeFinish() {
      if (finished) return;
      finished = true;
      window.clearTimeout(startupTimer);
      window.clearInterval(stallTimer);
      window.cancelAnimationFrame(animationFrame);
      placeFlightShip(1);
      menuButton.classList.add('is-ready', 'is-docked');
      document.documentElement.classList.remove('yfa-intro-pending');
      overlay.classList.add('is-ending');
      window.setTimeout(function () { overlay.remove(); }, 260);
    }

    video.addEventListener('ended', function () {
      placeFlightShip(1);
      window.setTimeout(completeFinish, 480);
    }, { once: true });
    video.addEventListener('error', function () {
      window.setTimeout(completeFinish, 600);
    }, { once: true });
    function enforceMobileAutoplay() {
      video.controls = false;
      video.removeAttribute('controls');
      video.muted = true;
      video.defaultMuted = true;
      video.volume = 0;
      video.playsInline = true;
    }
    function startPlayback() {
      enforceMobileAutoplay();
      const playback = video.play();
      if (playback && typeof playback.catch === 'function') {
        playback.catch(function () {
          enforceMobileAutoplay();
          window.setTimeout(function () {
            if (!finished && video.paused) video.play().catch(function () {});
          }, 180);
        });
      }
    }
    video.addEventListener('loadedmetadata', function () {
      video.currentTime = 0;
      placeFlightShip(0);
      startPlayback();
    }, { once: true });
    video.addEventListener('loadeddata', startPlayback, { once: true });
    video.addEventListener('canplay', startPlayback, { once: true });
    video.addEventListener('playing', function () {
      playbackStarted = true;
      window.clearTimeout(startupTimer);
    });
    document.addEventListener('visibilitychange', function retryVisibleIntro() {
      if (!document.hidden && !finished && video.paused) startPlayback();
    });
    window.addEventListener('pointerdown', function retryInteractiveIntro() {
      if (!finished && video.paused) startPlayback();
    }, { once: true, passive: true });
    window.addEventListener('touchstart', function retryTouchIntro() {
      if (!finished && video.paused) startPlayback();
    }, { once: true, passive: true, capture: true });
    window.addEventListener('resize', function () {
      const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 3.2;
      placeFlightShip(video.currentTime / duration);
    }, { passive: true });

    placeFlightShip(0);
    animationFrame = window.requestAnimationFrame(animateFlight);
    video.load();
    startPlayback();
    window.setTimeout(startPlayback, 120);
    window.setTimeout(startPlayback, 450);
    startupTimer = window.setTimeout(function () {
      if (!playbackStarted) completeFinish();
    }, 15000);
    stallTimer = window.setInterval(function () {
      if (!finished && playbackStarted && !document.hidden && video.paused && !video.ended) startPlayback();
    }, 1000);
  }

  let initialized = false;

  function initialize() {
    if (initialized || !document.body) return;
    initialized = true;
    const menuButton = installNavigation();
    if (shouldPlayIntro) {
      playIntro(menuButton);
    } else {
      document.documentElement.classList.remove('yfa-intro-pending');
      menuButton.classList.add('is-ready', 'is-arriving');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
    window.addEventListener('load', initialize, { once: true });
  } else {
    initialize();
  }
})();

