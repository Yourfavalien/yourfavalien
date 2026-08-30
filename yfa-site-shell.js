(function () {
  'use strict';

  const INTRO_KEY = 'yfaIntroSeenV11';
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let introSeen = false;

  try {
    introSeen = window.sessionStorage.getItem(INTRO_KEY) === '1';
  } catch (error) {
    introSeen = false;
  }

  const shouldPlayIntro = !reduceMotion && !introSeen;
  if (shouldPlayIntro) document.documentElement.classList.add('yfa-intro-pending');

  function markIntroSeen() {
    try { window.sessionStorage.setItem(INTRO_KEY, '1'); } catch (error) { /* Storage can be unavailable. */ }
  }

  function currentPage() {
    const name = window.location.pathname.split('/').pop() || 'index.html';
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
    button.innerHTML = '<img src="/assets/yfa-ufo-menu.svg?v=20260830-2" alt="" aria-hidden="true">';

    document.body.append(backdrop, button);
    positionUfo();

    let open = false;
    function setOpen(nextOpen, returnFocus) {
      open = nextOpen;
      button.setAttribute('aria-expanded', String(open));
      button.setAttribute('aria-label', open ? 'Close site navigation' : 'Open site navigation');
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
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.disablePictureInPicture = true;
    video.setAttribute('aria-hidden', 'true');
    video.src = window.matchMedia('(max-width: 767px)').matches
      ? '/assets/yfa-intro-mobile.mp4?v=20260829-1'
      : '/assets/yfa-intro-desktop.mp4?v=20260829-1';

    overlay.append(video);
    document.body.append(overlay);

    let finished = false;
    let failSafe;
    const introStartedAt = Date.now();
    const minimumIntroTime = 3000;
    function completeFinish() {
      if (finished) return;
      finished = true;
      window.clearTimeout(failSafe);
      markIntroSeen();
      menuButton.classList.add('is-ready');
      document.documentElement.classList.remove('yfa-intro-pending');
      overlay.classList.add('is-ending');
      window.setTimeout(function () { overlay.remove(); }, 220);
    }

    function finish() {
      if (finished) return;
      const remaining = minimumIntroTime - (Date.now() - introStartedAt);
      if (remaining > 0) {
        window.setTimeout(completeFinish, remaining);
        return;
      }
      completeFinish();
    }

    video.addEventListener('ended', finish, { once: true });
    video.addEventListener('error', finish, { once: true });
    const playback = video.play();
    if (playback && typeof playback.catch === 'function') playback.catch(finish);
    failSafe = window.setTimeout(finish, 4500);
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
      menuButton.classList.add('is-ready');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
    window.addEventListener('load', initialize, { once: true });
    window.setTimeout(initialize, 0);
  } else {
    initialize();
  }
})();
