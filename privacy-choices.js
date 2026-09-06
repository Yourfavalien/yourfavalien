(function () {
  'use strict';

  if (window.YFA_PRIVACY) return;
  const STORAGE_KEY = 'yfa-privacy-choices-v1';
  const defaults = { preferences: false, xiloStorage: false, analytics: false, advertising: false };

  function read() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      return saved && saved.version === 1 ? Object.assign({}, defaults, saved.choices) : null;
    } catch (_) { return null; }
  }

  let choices = read();
  const api = window.YFA_PRIVACY = {
    allows: function (category) { return category === 'necessary' || Boolean(choices && choices[category]); },
    hasChoice: function () { return Boolean(choices); },
    getChoices: function () { return Object.assign({}, defaults, choices || {}); },
    open: function () { openSettings(); }
  };

  function save(next) {
    choices = Object.assign({}, defaults, next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, savedAt: new Date().toISOString(), choices: choices })); } catch (_) {}
    window.dispatchEvent(new CustomEvent('yfa:privacy-change', { detail: api.getChoices() }));
  }

  function addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .yfa-privacy{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;background:rgba(0,0,0,.76);padding:20px;font-family:Arial,Helvetica,sans-serif;color:#f7f2f5;backdrop-filter:blur(9px)}.yfa-privacy[hidden]{display:none}.yfa-privacy__panel{position:relative;width:min(610px,100%);max-height:calc(100vh - 40px);overflow:auto;margin:auto;border:1px solid rgba(255,255,255,.24);border-radius:12px;background:radial-gradient(circle at 90% 0,rgba(181,23,94,.24),transparent 42%),linear-gradient(145deg,#160a10,#070507 70%);box-shadow:0 34px 120px rgba(0,0,0,.8);padding:clamp(28px,5vw,46px)}.yfa-privacy__eyebrow{margin-bottom:12px;color:#4de8d8;font:800 10px/1 Arial,sans-serif;letter-spacing:.24em;text-transform:uppercase}.yfa-privacy h2{margin:0 0 14px;font:800 clamp(30px,6vw,46px)/.98 Georgia,serif;letter-spacing:-.025em;text-transform:uppercase}.yfa-privacy p{margin:0 0 24px;color:#d2c7cd;font-size:14px;line-height:1.65}.yfa-privacy a{color:#69f0df}.yfa-privacy__actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}.yfa-privacy button{min-height:48px;border:1px solid #fff;border-radius:4px;padding:12px 16px;font:800 10px/1 Arial,sans-serif;letter-spacing:.11em;text-transform:uppercase;cursor:pointer}.yfa-privacy__accept{background:#fff;color:#080608}.yfa-privacy__reject,.yfa-privacy__manage{background:transparent;color:#fff}.yfa-privacy__manage{grid-column:1/-1;border-color:rgba(255,255,255,.35)!important}.yfa-privacy__details{display:grid;gap:10px;margin:5px 0 24px}.yfa-privacy__row{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding:16px;border:1px solid rgba(255,255,255,.14);border-radius:6px;background:rgba(255,255,255,.025)}.yfa-privacy__row strong{display:block;font-size:13px}.yfa-privacy__row small{display:block;margin-top:6px;color:#b8abb2;line-height:1.45}.yfa-privacy__row input{flex:0 0 auto;width:20px;height:20px;accent-color:#4de8d8}@media(max-width:560px){.yfa-privacy{padding:12px}.yfa-privacy__panel{max-height:calc(100vh - 24px);padding:26px 20px}.yfa-privacy__actions{grid-template-columns:1fr}.yfa-privacy__manage{grid-column:auto}}
    `;
    document.head.appendChild(style);
  }

  function categoryRow(key, title, description, locked) {
    const checked = locked === 'on' || (!locked && api.allows(key));
    return '<label class="yfa-privacy__row"><span><strong>' + title + '</strong><small>' + description + '</small></span><input type="checkbox" data-category="' + key + '"' + (checked ? ' checked' : '') + (locked ? ' disabled' : '') + '></label>';
  }

  function makeDialog() {
    const overlay = document.createElement('div');
    overlay.className = 'yfa-privacy';
    overlay.hidden = true;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'yfa-privacy-title');
    document.body.appendChild(overlay);
    return overlay;
  }

  let overlay;
  function close() { overlay.hidden = true; }
  function applyAndClose(next) { save(next); close(); }

  function openSummary() {
    overlay.innerHTML = '<section class="yfa-privacy__panel"><div class="yfa-privacy__eyebrow">YourFavAlien · Privacy</div><h2 id="yfa-privacy-title">Cookies & privacy</h2><p>We use necessary technology to operate and protect the site. With your permission, we can also remember site preferences and keep Xilo chat history during your browser session. Read our <a href="/privacy.html">privacy policy</a>.</p><div class="yfa-privacy__actions"><button class="yfa-privacy__accept" data-action="accept">Accept optional</button><button class="yfa-privacy__reject" data-action="reject">Reject optional</button><button class="yfa-privacy__manage" data-action="manage">Customize choices</button></div></section>';
    overlay.hidden = false;
  }

  function openSettings() {
    overlay.innerHTML = '<section class="yfa-privacy__panel"><div class="yfa-privacy__eyebrow">YourFavAlien · Privacy</div><h2 id="yfa-privacy-title">Customize choices</h2><p>Choose which optional features may store information in this browser. Xilo still works without chat storage, but refreshing or leaving the page resets its visible history.</p><div class="yfa-privacy__details">' +
      categoryRow('necessary', 'Necessary and security', 'Required for the site, Cloudflare protection, and remembering this choice.', 'on') +
      categoryRow('preferences', 'Site preferences', 'Remembers optional interface choices such as signup-popup dismissal.', false) +
      categoryRow('xiloStorage', 'Xilo chat storage', 'Keeps recent Xilo messages and a conversation token only for this browser session.', false) +
      '</div><div class="yfa-privacy__actions"><button class="yfa-privacy__accept" data-action="save">Save choices</button><button class="yfa-privacy__reject" data-action="reject">Reject optional</button></div></section>';
    overlay.hidden = false;
  }

  function initialize() {
    addStyles();
    overlay = makeDialog();
    overlay.addEventListener('click', function (event) {
      const action = event.target.closest('[data-action]')?.dataset.action;
      if (action === 'accept') applyAndClose({ preferences: true, xiloStorage: true });
      if (action === 'reject') applyAndClose(defaults);
      if (action === 'manage') openSettings();
      if (action === 'save') {
        const next = {};
        overlay.querySelectorAll('[data-category]').forEach(function (input) { next[input.dataset.category] = input.checked; });
        applyAndClose(next);
      }
    });
    document.addEventListener('click', function (event) {
      if (event.target.closest('[data-yfa-privacy-open]')) openSettings();
    });
    if (!choices) openSummary();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
})();

