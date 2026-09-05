(function () {
  'use strict';

  if (document.getElementById('yfa-orbit-popup')) return;

  const host = document.createElement('div');
  host.id = 'yfa-orbit-popup-host';
  host.innerHTML = `
    <div id="yfa-orbit-popup" aria-hidden="true">
      <div class="yfa-orbit-backdrop" data-yfa-orbit-close></div>
      <section class="yfa-orbit-stage" role="dialog" aria-modal="true" aria-labelledby="yfa-orbit-title">
        <div class="yfa-orbit-visual" aria-hidden="true" data-yfa-bg-slot="home-orbit-visual">
          <div class="yfa-orbit-wordmark">YOUR F<span class="tri"></span>V ALIEN</div>
        </div>
        <div class="yfa-orbit-panel">
          <button class="yfa-orbit-close" type="button" aria-label="Close signup" data-yfa-orbit-close>×</button>
          <div class="yfa-orbit-content">
            <img class="yfa-orbit-ufo" src="/assets/yfa-popup-ufo.webp" alt="Your Fav Alien UFO" decoding="async">
            <div class="yfa-orbit-step is-active" data-yfa-orbit-step="offer">
              <h2 class="yfa-orbit-title" id="yfa-orbit-title">Join the Alien Crew 👽</h2>
              <p class="yfa-orbit-copy">Sign up to stay in the loop with updates, new content, and everything Your Fav Alien. 🛸✨</p>
              <button class="yfa-orbit-button" type="button" data-yfa-orbit-next>Stay up to date</button>
              <button class="yfa-orbit-skip" type="button" data-yfa-orbit-close>No, thanks</button>
            </div>
            <div class="yfa-orbit-step" data-yfa-orbit-step="capture">
              <h2 class="yfa-orbit-title">Join the Alien Crew 👽</h2>
              <p class="yfa-orbit-copy">Share your email to stay up-to-date.</p>
              <form class="yfa-orbit-form" id="yfa-orbit-form" novalidate>
                <input class="yfa-orbit-field" id="yfa-orbit-fname" name="FNAME" type="text" autocomplete="given-name" placeholder="First name" required>
                <input class="yfa-orbit-field" id="yfa-orbit-email" name="EMAIL" type="email" autocomplete="email" inputmode="email" placeholder="Your email address" required>
                <label class="yfa-orbit-consent"><input id="yfa-orbit-consent" type="checkbox" required><span>I agree to receive email updates from YourFavAlien. I can unsubscribe at any time.</span></label>
                <button class="yfa-orbit-button" type="submit">Continue</button>
                <div class="yfa-orbit-status" id="yfa-orbit-status" role="status" aria-live="polite"></div>
              </form>
            </div>
            <div class="yfa-orbit-step" data-yfa-orbit-step="success">
              <h2 class="yfa-orbit-title">You're In!</h2>
              <p class="yfa-orbit-copy">Stay tuned for exciting news and updates delivered straight to your inbox!</p>
              <button class="yfa-orbit-button" type="button" data-yfa-orbit-close>Back to site</button>
            </div>
          </div>
        </div>
      </section>
    </div>
    <div class="yfa-orbit-reopen" id="yfa-orbit-reopen" aria-hidden="true" hidden>
      <button class="yfa-orbit-reopen-trigger" id="yfa-orbit-reopen-trigger" type="button" aria-label="Show Alien Crew signup" aria-expanded="false">
        <span class="yfa-orbit-reopen-alien" aria-hidden="true">👽</span>
        <span class="yfa-orbit-reopen-text">Get Pulled Into Orbit</span>
      </button>
      <button class="yfa-orbit-reopen-dismiss" id="yfa-orbit-reopen-dismiss" type="button" aria-label="Dismiss signup teaser">×</button>
    </div>`;
  document.body.appendChild(host);

  const popup = document.getElementById('yfa-orbit-popup');
  const reopen = document.getElementById('yfa-orbit-reopen');
  const reopenTrigger = document.getElementById('yfa-orbit-reopen-trigger');
  const reopenDismiss = document.getElementById('yfa-orbit-reopen-dismiss');
  const form = document.getElementById('yfa-orbit-form');
  const SESSION_KEY = 'yfaOrbitPopupSeenV1';
  const DISMISSED_KEY = 'yfaOrbitTeaserDismissedV1';
  const SIGNED_UP_KEY = 'yfaOrbitSignedUpV1';
  const steps = Array.from(popup.querySelectorAll('[data-yfa-orbit-step]'));
  const emailInput = document.getElementById('yfa-orbit-email');
  const nameInput = document.getElementById('yfa-orbit-fname');
  const consentInput = document.getElementById('yfa-orbit-consent');
  const status = document.getElementById('yfa-orbit-status');
  let lastFocus = null;
  let teaserTimer = null;
  let teaserDismissed = false;
  let hasSignedUp = false;

  try { teaserDismissed = sessionStorage.getItem(DISMISSED_KEY) === '1'; } catch (error) {}
  try { hasSignedUp = localStorage.getItem(SIGNED_UP_KEY) === '1'; } catch (error) {}

  function isCompactTeaser() {
    return window.matchMedia('(max-width: 900px), (pointer: coarse)').matches;
  }
  function collapseTeaser() {
    if (teaserTimer) clearTimeout(teaserTimer);
    teaserTimer = null;
    reopen.classList.remove('is-expanded');
    reopenTrigger.setAttribute('aria-expanded', 'false');
  }
  function hideTeaser() {
    collapseTeaser();
    reopen.classList.remove('is-visible');
    reopen.setAttribute('aria-hidden', 'true');
    reopen.hidden = true;
  }
  function showTeaser() {
    if (teaserDismissed || hasSignedUp) {
      hideTeaser();
      return;
    }
    reopen.hidden = false;
    reopen.classList.add('is-visible');
    reopen.setAttribute('aria-hidden', 'false');
  }
  function dismissTeaser() {
    teaserDismissed = true;
    try { sessionStorage.setItem(DISMISSED_KEY, '1'); } catch (error) {}
    hideTeaser();
  }
  function rememberSignup() {
    hasSignedUp = true;
    try { localStorage.setItem(SIGNED_UP_KEY, '1'); } catch (error) {}
    hideTeaser();
  }

  function showStep(name) {
    steps.forEach(step => step.classList.toggle('is-active', step.dataset.yfaOrbitStep === name));
    if (name === 'capture') setTimeout(() => nameInput.focus(), 80);
  }
  function openPopup() {
    lastFocus = document.activeElement;
    popup.classList.add('is-open');
    popup.setAttribute('aria-hidden', 'false');
    document.body.classList.add('yfa-orbit-open');
    hideTeaser();
    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch (error) {}
    setTimeout(() => popup.querySelector('.yfa-orbit-close').focus(), 80);
  }
  function closePopup() {
    popup.classList.remove('is-open');
    popup.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('yfa-orbit-open');
    showTeaser();
    if (!hasSignedUp && !teaserDismissed && lastFocus && typeof lastFocus.focus === 'function') {
      setTimeout(() => lastFocus.focus(), 60);
    }
  }

  popup.querySelectorAll('[data-yfa-orbit-close]').forEach(element => element.addEventListener('click', closePopup));
  popup.querySelector('[data-yfa-orbit-next]').addEventListener('click', () => showStep('capture'));
  reopenTrigger.addEventListener('click', () => {
    if (isCompactTeaser() && !reopen.classList.contains('is-expanded')) {
      reopen.classList.add('is-expanded');
      reopenTrigger.setAttribute('aria-expanded', 'true');
      teaserTimer = setTimeout(collapseTeaser, 4500);
      return;
    }
    showStep('offer');
    openPopup();
  });
  reopenDismiss.addEventListener('click', event => {
    event.stopPropagation();
    dismissTeaser();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && popup.classList.contains('is-open')) closePopup();
    if (event.key !== 'Tab' || !popup.classList.contains('is-open')) return;
    const focusable = Array.from(popup.querySelectorAll('button:not([disabled]),input:not([disabled]),a[href]')).filter(element => element.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  let kitLoader;
  async function subscribeWithKit(firstName, email) {
    if (!window.YFA_KIT_SIGNUP) {
      if (!kitLoader) kitLoader = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = '/kit-signup.js?v=20260905-kit2';
        script.onload = resolve;
        script.onerror = () => { kitLoader = null; script.remove(); reject(new Error('Could not load the signup service. Please try again.')); };
        document.head.appendChild(script);
      });
      await kitLoader;
    }
    return window.YFA_KIT_SIGNUP.subscribe(firstName, email);
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    status.textContent = '';
    const firstName = nameInput.value.trim();
    const email = emailInput.value.trim();
    if (!firstName) { status.textContent = 'Add your first name to continue.'; nameInput.focus(); return; }
    if (!emailInput.validity.valid) { status.textContent = 'Enter a valid email address.'; emailInput.focus(); return; }
    if (!consentInput.checked) { status.textContent = 'Check the email consent box to continue.'; consentInput.focus(); return; }
    const button = form.querySelector('button[type="submit"]');
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Joining orbit…';
    try {
      await subscribeWithKit(firstName, email);
      try {
        const response = await fetch('https://yourfavalien-welcome.aydenmtz54.workers.dev/', {
          method: 'POST', mode: 'cors', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firstName, email }), keepalive: true
        });
        if (!response.ok) throw new Error('Welcome email request failed (' + response.status + ')');
      } catch (error) { console.error('Welcome email error:', error); }
      rememberSignup();
      showStep('success');
      form.reset();
    } catch (error) { status.textContent = error.message || 'Something went wrong. Please try again.'; if (window.YFA_KIT_SIGNUP) window.YFA_KIT_SIGNUP.showVerification(status, error); }
    finally { button.disabled = false; button.textContent = originalText; }
  });

  let alreadySeen = false;
  try { alreadySeen = sessionStorage.getItem(SESSION_KEY) === '1'; } catch (error) {}
  if (hasSignedUp || teaserDismissed) hideTeaser();
  else if (alreadySeen) showTeaser();
  else setTimeout(openPopup, 1200);

  if (window.YFA_MOTHERSHIP && typeof window.YFA_MOTHERSHIP.refreshImages === 'function') {
    window.YFA_MOTHERSHIP.refreshImages();
  }
})();
