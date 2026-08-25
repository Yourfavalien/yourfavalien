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
            <img class="yfa-orbit-ufo" src="/assets/yfa-popup-ufo.png" alt="Your Fav Alien UFO">
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
    <button class="yfa-orbit-reopen" id="yfa-orbit-reopen" type="button" aria-label="Open Alien Crew signup"><span class="yfa-orbit-reopen-mark">×</span> Get Pulled Into the Orbit 👽</button>`;
  document.body.appendChild(host);

  const popup = document.getElementById('yfa-orbit-popup');
  const reopen = document.getElementById('yfa-orbit-reopen');
  const form = document.getElementById('yfa-orbit-form');
  const SESSION_KEY = 'yfaOrbitPopupSeenV1';
  const steps = Array.from(popup.querySelectorAll('[data-yfa-orbit-step]'));
  const emailInput = document.getElementById('yfa-orbit-email');
  const nameInput = document.getElementById('yfa-orbit-fname');
  const consentInput = document.getElementById('yfa-orbit-consent');
  const status = document.getElementById('yfa-orbit-status');
  let lastFocus = null;
  let jsonpTimer = null;

  function showStep(name) {
    steps.forEach(step => step.classList.toggle('is-active', step.dataset.yfaOrbitStep === name));
    if (name === 'capture') setTimeout(() => nameInput.focus(), 80);
  }
  function openPopup() {
    lastFocus = document.activeElement;
    popup.classList.add('is-open');
    popup.setAttribute('aria-hidden', 'false');
    document.body.classList.add('yfa-orbit-open');
    reopen.classList.remove('is-visible');
    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch (error) {}
    setTimeout(() => popup.querySelector('.yfa-orbit-close').focus(), 80);
  }
  function closePopup() {
    popup.classList.remove('is-open');
    popup.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('yfa-orbit-open');
    reopen.classList.add('is-visible');
    if (lastFocus && typeof lastFocus.focus === 'function') setTimeout(() => lastFocus.focus(), 60);
  }

  popup.querySelectorAll('[data-yfa-orbit-close]').forEach(element => element.addEventListener('click', closePopup));
  popup.querySelector('[data-yfa-orbit-next]').addEventListener('click', () => showStep('capture'));
  reopen.addEventListener('click', () => { showStep('offer'); openPopup(); });
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

  function subscribeWithMailchimp(firstName, email) {
    return new Promise((resolve, reject) => {
      const callbackName = 'yfaMailchimp_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
      const script = document.createElement('script');
      const params = new URLSearchParams({ u: '8b126b5c8a6358c93812e9ad3', id: '6ad461b71d', FNAME: firstName, EMAIL: email, 'gdpr[55212]': 'Y', c: callbackName });
      function cleanup() {
        if (jsonpTimer) clearTimeout(jsonpTimer);
        try { delete window[callbackName]; } catch (error) { window[callbackName] = undefined; }
        script.remove();
      }
      window[callbackName] = result => {
        cleanup();
        if (result && result.result === 'success') resolve(result);
        else reject(new Error((result && result.msg ? result.msg : 'Something went wrong.').replace(/<[^>]*>/g, '')));
      };
      script.onerror = () => { cleanup(); reject(new Error('Could not reach the signup service. Please try again.')); };
      script.src = 'https://yourfavalien.us7.list-manage.com/subscribe/post-json?' + params.toString();
      document.head.appendChild(script);
      jsonpTimer = setTimeout(() => { cleanup(); reject(new Error('The signup took too long. Please try again.')); }, 12000);
    });
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    status.textContent = '';
    const firstName = nameInput.value.trim();
    const email = emailInput.value.trim();
    if (!firstName) { status.textContent = 'Add your first name so Mailchimp can accept the signup.'; nameInput.focus(); return; }
    if (!emailInput.validity.valid) { status.textContent = 'Enter a valid email address.'; emailInput.focus(); return; }
    if (!consentInput.checked) { status.textContent = 'Check the email consent box to continue.'; consentInput.focus(); return; }
    const button = form.querySelector('button[type="submit"]');
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Joining orbit…';
    try {
      await subscribeWithMailchimp(firstName, email);
      try {
        const response = await fetch('https://yourfavalien-welcome.aydenmtz54.workers.dev/', {
          method: 'POST', mode: 'cors', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firstName, email }), keepalive: true
        });
        if (!response.ok) throw new Error('Welcome email request failed (' + response.status + ')');
      } catch (error) { console.error('Welcome email error:', error); }
      showStep('success');
      form.reset();
    } catch (error) { status.textContent = error.message || 'Something went wrong. Please try again.'; }
    finally { button.disabled = false; button.textContent = originalText; }
  });

  let alreadySeen = false;
  try { alreadySeen = sessionStorage.getItem(SESSION_KEY) === '1'; } catch (error) {}
  if (alreadySeen) reopen.classList.add('is-visible');
  else setTimeout(openPopup, 1200);

  if (window.YFA_MOTHERSHIP && typeof window.YFA_MOTHERSHIP.refreshImages === 'function') {
    window.YFA_MOTHERSHIP.refreshImages();
  }
})();
