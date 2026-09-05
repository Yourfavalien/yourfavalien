(function () {
  'use strict';
  if (window.YFA_KIT_SIGNUP) return;

  const endpoint = 'https://app.kit.com/forms/9884596/subscriptions';
  let ready;
  let active = false;

  // Keep Kit's transport, CAPTCHA and challenge handling separate from our UI.
  function loadKit() {
    if (ready) return ready;
    ready = new Promise((resolve, reject) => {
      const form = document.createElement('form');
      form.hidden = true;
      form.noValidate = true;
      form.action = endpoint;
      form.method = 'post';
      form.dataset.svForm = '9884596';
      form.dataset.uid = '2312073705';
      form.dataset.format = 'inline';
      form.dataset.version = '5';
      form.dataset.options = JSON.stringify({
        settings: {
          recaptcha: { enabled: true },
          return_visitor: { action: 'show' },
          after_subscribe: { action: 'message', success_message: 'You’re in ✦ Check your inbox.' }
        }
      });
      form.innerHTML = '<input name="fields[first_name]" type="text"><input name="email_address" type="email"><ul data-element="errors"></ul><div><span data-element="fields"></span></div>';
      document.body.appendChild(form);
      const script = document.createElement('script');
      script.src = 'https://f.convertkit.com/ckjs/ck.5.js';
      script.async = true;
      const timer = setTimeout(() => fail(), 15000);
      function fail() {
        clearTimeout(timer);
        script.remove();
        form.remove();
        ready = null;
        reject(new Error('Could not load the signup service. Please try again.'));
      }
      script.onerror = fail;
      script.onload = () => { clearTimeout(timer); resolve(form); };
      document.head.appendChild(script);
    });
    return ready;
  }

  async function subscribe(firstName, email) {
    if (active) throw new Error('A signup is already in progress.');
    active = true;
    try {
      const form = await loadKit();
      const name = form.querySelector('[name="fields[first_name]"]');
      const address = form.querySelector('[name="email_address"]');
      name.value = firstName;
      address.value = email;
      const errors = form.querySelector('[data-element="errors"]');
      errors.textContent = '';
      return await new Promise((resolve, reject) => {
        function cleanup() {
          observer.disconnect();
          form.removeEventListener('ckjs:submission:complete', complete);
          window.removeEventListener('ckjs:guard:failed', failed);
        }
        function complete(event) {
          if (event.detail.uid !== '2312073705') return;
          cleanup();
          resolve(event.detail);
        }
        function failed() {
          cleanup();
          reject(new Error('Could not complete signup verification. Please try again.'));
        }
        const observer = new MutationObserver(() => {
          if (!errors.textContent.trim()) return;
          const message = errors.textContent.trim();
          cleanup();
          reject(new Error(message));
        });
        observer.observe(errors, { childList: true, subtree: true, characterData: true });
        form.addEventListener('ckjs:submission:complete', complete);
        window.addEventListener('ckjs:guard:failed', failed);
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      });
    } finally { active = false; }
  }

  window.YFA_KIT_SIGNUP = { subscribe };

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
    } catch (err) { invalid(err.message || 'Something went wrong. Please try again.'); }
    finally { button.disabled = false; button.value = label; }
  });
})();
