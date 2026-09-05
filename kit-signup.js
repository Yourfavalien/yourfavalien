(function () {
  'use strict';
  if (window.YFA_KIT_SIGNUP) return;

  const endpoint = 'https://app.kit.com/forms/9884596/subscriptions';
  // Public site key used by Kit's own form runtime, not an API credential.
  const siteKey = '6LdkIV0UAAAAABtNVAAP99TC6f_18LiETnPK6ziX';
  let ready;
  let active = false;

  function deadline(promise, ms, message) {
    let timer;
    return Promise.race([promise, new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), ms);
    })]).finally(() => clearTimeout(timer));
  }

  function loadVerification() {
    if (!ready) {
      ready = deadline(new Promise((resolve, reject) => {
        const onReady = () => window.grecaptcha.ready(resolve);
        if (window.grecaptcha && window.grecaptcha.ready) return onReady();
        const script = document.createElement('script');
        script.src = 'https://www.google.com/recaptcha/api.js?render=' + siteKey;
        script.async = true;
        script.onload = onReady;
        script.onerror = () => { script.remove(); reject(new Error('Could not load signup verification. Please try again.')); };
        document.head.appendChild(script);
      }), 15000, 'Signup verification took too long. Please try again.').catch(error => {
        ready = null;
        throw error;
      });
    }
    return ready;
  }

  async function subscribe(firstName, email) {
    if (active) throw new Error('A signup is already in progress.');
    active = true;
    try {
      await loadVerification();
      const token = await deadline(window.grecaptcha.execute(siteKey, { action: 'formsubmit' }),
        20000, 'Signup verification took too long. Please try again.');
      if (!token) throw new Error('Could not verify signup. Please try again.');
      const body = new FormData();
      body.append('fields[first_name]', firstName);
      body.append('email_address', email);
      body.append('token', token);
      body.append('referrer', document.referrer);
      body.append('host', document.location.href);
      body.append('search', document.location.search);
      body.append('ckjs_version', '6');
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);
      let response, result;
      try {
        response = await fetch(endpoint, {
          method: 'POST', body, signal: controller.signal,
          headers: { Accept: 'application/json', 'X-CKJS-Version': '6' }
        });
        result = await response.json();
      } catch (error) {
        throw new Error('Could not confirm signup. Please try again.');
      } finally { clearTimeout(timer); }
      if (response.ok && result.status === 'success' && !result.consent?.enabled) return result;
      const verificationUrl = result.status === 'quarantined' ? result.url : result.consent?.url;
      if (verificationUrl) {
        const url = new URL(verificationUrl);
        if (url.protocol === 'https:' && ['app.kit.com', 'app.convertkit.com'].includes(url.hostname)) {
          const error = new Error('Complete signup verification, then try again.');
          error.verificationUrl = url.href;
          throw error;
        }
      }
      const messages = result.errors && result.errors.messages;
      throw new Error(Array.isArray(messages) && messages.length ? messages.join(' ') :
        'The signup service could not accept this signup. Please try again.');
    } finally { active = false; }
  }

  function showVerification(container, error) {
    if (!error.verificationUrl) return;
    const link = document.createElement('a');
    link.href = error.verificationUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = ' Open secure verification';
    container.appendChild(link);
  }

  window.YFA_KIT_SIGNUP = { subscribe, showVerification };

  const socialForm = document.getElementById('mc-embedded-subscribe-form');
  if (!socialForm) return;
  socialForm.addEventListener('submit', async event => {
    event.preventDefault();
    const name = document.getElementById('mce-FNAME');
    const email = document.getElementById('mce-EMAIL');
    const consent = document.getElementById('gdpr_55212');
    const error = document.getElementById('mce-error-response');
    const success = document.getElementById('mce-success-response');
    const button = document.getElementById('mc-embedded-subscribe');
    error.textContent = '';
    error.style.display = 'none';
    success.style.display = 'none';
    function invalid(message, field) {
      error.textContent = message;
      error.style.display = 'block';
      if (field) field.focus();
    }
    if (!name.value.trim()) return invalid('Add your first name to continue.', name);
    if (!email.value.trim() || !email.validity.valid) return invalid('Enter a valid email address.', email);
    if (!consent.checked) return invalid('Check the email consent box to continue.', consent);
    if (socialForm.elements.namedItem('website').value) return;
    const label = button.value;
    button.disabled = true;
    button.value = 'Subscribing…';
    try {
      await subscribe(name.value.trim(), email.value.trim());
      success.textContent = 'You’re in ✦ Check your inbox.';
      success.style.display = 'block';
      socialForm.reset();
    } catch (err) { invalid(err.message || 'Something went wrong. Please try again.'); showVerification(error, err); }
    finally { button.disabled = false; button.value = label; }
  });
})();
