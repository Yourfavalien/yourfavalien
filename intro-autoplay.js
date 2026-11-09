(() => {
'use strict';
  function installIntro() {
    const intro = document.querySelector('[data-intro]');
    const film = document.querySelector('[data-intro-film]');
    if (!intro || !film) return;
    let skipIntro = false;
      try { skipIntro = localStorage.getItem('yfa-access-reduce') === '1'; } catch {}
      if (skipIntro) {
      intro.hidden = true;
      return;
    }

    const phoneScreen = matchMedia('(pointer: coarse)').matches &&
      Math.min(screen.width, screen.height) < 600;
    const phone = /iPhone|iPod|Android.*Mobile/i.test(navigator.userAgent) || matchMedia('(max-width: 599px)').matches || phoneScreen;
    film.defaultMuted = true;
    film.muted = true;
    film.playsInline = true;
    document.body.classList.add('is-intro-open');
    intro.focus();

    let attempts = 0;
    let playbackTimer;
    let retryTimer;
    const isLeaving = () => intro.hidden || intro.classList.contains('is-leaving');
    const finish = () => {
      if (isLeaving()) return;
      clearTimeout(playbackTimer);
      clearTimeout(retryTimer);
      intro.classList.add('is-leaving');
      document.body.classList.remove('is-intro-open');
      setTimeout(() => {
        intro.hidden = true;
        film.pause();
        document.querySelector('#main')?.focus({ preventScroll: true });
      }, 750);
    };
    const retry = () => {
      if (isLeaving() || retryTimer !== undefined) return;
      clearTimeout(playbackTimer);
      if (attempts >= 2) {
        finish();
        return;
      }
      retryTimer = setTimeout(() => {
        retryTimer = undefined;
        startFilm();
      }, 400);
    };
    const watchPlayback = () => {
      if (isLeaving() || retryTimer !== undefined) return;
      clearTimeout(playbackTimer);
      playbackTimer = setTimeout(retry, attempts < 2 ? 8000 : 4000);
    };
    const startFilm = () => {
      const attempt = ++attempts;
      if (attempt > 1 && (film.error || (film.currentTime === 0 && film.readyState < 2))) {
        film.load();
      }
      watchPlayback();
      film.play().catch(() => {
        // Keep the second attempt's loading window open for canplay/loadeddata.
        // A rejected play promise is not proof that loading has finished.
        if (attempt === attempts && attempts < 2) retry();
      });
    };

    document.addEventListener('keydown', event => {
      if (isLeaving()) return;
      if (event.key === 'Escape' || event.key === 'Tab') {
        event.preventDefault();
        intro.focus();
      }
    });
    film.addEventListener('playing', () => {
      clearTimeout(playbackTimer);
      clearTimeout(retryTimer);
      retryTimer = undefined;
    });
    const resumeWhenReady = () => {
      if (isLeaving() || !film.paused || document.hidden) return;
      film.muted = true;
      film.play().catch(() => {});
    };
    film.addEventListener('loadeddata', resumeWhenReady);
    film.addEventListener('canplay', resumeWhenReady);
    document.addEventListener('visibilitychange', resumeWhenReady);
    film.addEventListener('waiting', watchPlayback);
    film.addEventListener('ended', finish, { once: true });
    film.addEventListener('error', retry);
    film.src = phone ? 'assets/yfa-intro-phone-portrait-20261109.mp4' : 'assets/yfa-intro-desktop-20261109.mp4?v=12s-r2';
    startFilm();
  }


installIntro();
})();
