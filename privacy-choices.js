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
      .yfa-privacy{position:fixed;inset:0;z-index:2147483000;display:grid;align-items:end;background:rgba(0,0,0,.58);padding:18px;font-family:Arial,Helvetica,sans-serif;color:#f7f2f5}.yfa-privacy[hidden]{display:none}.yfa-privacy__panel{width:min(720px,100%);margin:0 auto;border:1px solid rgba(255,255,255,.2);border-radius:22px;background:linear-gradient(145deg,#170b11,#080608);box-shadow:0 26px 90px rgba(0,0,0,.65);padding:clamp(22px,4vw,34px)}.yfa-privacy h2{margin:0 0 10px;font:800 clamp(24px,5vw,34px)/1.05 Georgia,serif;text-transform:uppercase}.yfa-privacy p{margin:0 0 18px;color:#d2c7cd;font-size:14px;line-height:1.55}.yfa-privacy a{color:#69f0df}.yfa-privacy__actions{display:flex;flex-wrap:wrap;gap:10px}.yfa-privacy button{min-height:44px;border:1px solid #fff;border-radius:999px;padding:10px 18px;font:800 11px/1 Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;cursor:pointer}.yfa-privacy__accept{background:#fff;color:#080608}.yfa-privacy__reject,.yfa-privacy__manage{background:transparent;color:#fff}.yfa-privacy__details{display:grid;gap:10px;margin:5px 0 20px}.yfa-privacy__row{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding:14px;border:1px solid rgba(255,255,255,.14);border-radius:14px}.yfa-privacy__row strong{display:block;font-size:13px}.yfa-privacy__row small{display:block;margin-top:5px;color:#b8abb2;line-height:1.4}.yfa-privacy__row input{width:20px;height:20px;accent-color:#4de8d8}.yfa-privacy-link{position:fixed;left:12px;bottom:12px;z-index:2147482000;border:1px solid rgba(255,255,255,.32);border-radius:999px;background:rgba(8,6,8,.88);color:#eee;padding:8px 11px;font:700 9px/1 Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;backdrop-filter:blur(8px)}@media(max-width:560px){.yfa-privacy{padding:10px}.yfa-privacy__panel{border-radius:18px}.yfa-privacy__actions button{flex:1 1 140px}.yfa-privacy-link{bottom:8px;left:8px}}
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
    overlay.innerHTML = '<section class="yfa-privacy__panel"><h2 id="yfa-privacy-title">Your privacy choices</h2><p>We use necessary technology to operate and protect the site. With your permission, we can also remember site preferences and keep Xilo chat history during your browser session. <a href="/privacy.html">Privacy policy</a></p><div class="yfa-privacy__actions"><button class="yfa-privacy__accept" data-action="accept">Accept optional</button><button class="yfa-privacy__reject" data-action="reject">Reject optional</button><button class="yfa-privacy__manage" data-action="manage">Manage choices</button></div></section>';
    overlay.hidden = false;
  }

  function openSettings() {
    overlay.innerHTML = '<section class="yfa-privacy__panel"><h2 id="yfa-privacy-title">Manage privacy choices</h2><p>Choose which optional features may store information in this browser. Xilo still works without chat storage, but refreshing or leaving the page resets its visible history.</p><div class="yfa-privacy__details">' +
      categoryRow('necessary', 'Necessary and security', 'Required for the site, Cloudflare protection, and remembering this choice.', 'on') +
      categoryRow('preferences', 'Site preferences', 'Remembers optional interface choices such as signup-popup dismissal.', false) +
      categoryRow('xiloStorage', 'Xilo chat storage', 'Keeps recent Xilo messages and a conversation token only for this browser session.', false) +
      categoryRow('analytics', 'Optional analytics', 'No optional analytics are currently active.', 'off') +
      categoryRow('advertising', 'Advertising', 'No advertising trackers are currently active.', 'off') +
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
    const link = document.createElement('button');
    link.type = 'button';
    link.className = 'yfa-privacy-link';
    link.textContent = 'Privacy choices';
    link.addEventListener('click', openSettings);
    document.body.appendChild(link);
    if (!choices) openSummary();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
})();

