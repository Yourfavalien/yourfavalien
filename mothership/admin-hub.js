/* Private launcher for /mothership/admin.html#hub.
   The mothership Worker already gates that pathname with a Descope session.
   The hash survives its login redirect; a new /mothership/admin* file does not,
   because that route returns 404 for every path except /mothership/admin.html. */
(function () {
  'use strict';

  var params;
  try { params = new URLSearchParams(window.location.search); }
  catch (error) { params = new URLSearchParams(); }
  if (params.get('view') !== 'hub' && window.location.hash !== '#hub') return;

  // Append a console here, then add a matching .console--id rule in admin-hub.css.
  var CONSOLES = [
    {
      id: 'mothership',
      name: 'The Mothership',
      purpose: 'Site admin console.',
      href: 'https://yourfavalien.com/mothership/admin.html',
      gate: 'Descope'
    },
    {
      id: 'support',
      name: 'Support Control Center',
      purpose: 'Help tickets.',
      href: 'https://yourfavalien.com/mothership/support/index.html',
      gate: 'Descope'
    },
    {
      id: 'xilo',
      name: 'Xilo Control Center',
      purpose: 'Train and manage Xilo and the HQ Assistant.',
      href: 'https://xilo.yourfavalien.site/',
      gate: 'Cloudflare Access · email code'
    },
    {
      id: 'headquarters',
      name: 'YourFavAlien Business Headquarters',
      purpose: 'Partner and owner portal.',
      href: 'https://partners.yourfavalien.site/',
      gate: 'Cloudflare Access · email code',
      secondary: { href: 'https://yourfavalien.site/', label: 'Public headquarters' }
    }
  ];

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function render() {
    var root = document.getElementById('mothershipHub');
    if (!root || root.dataset.ready === 'true') return;
    root.dataset.ready = 'true';
    document.title = 'Consoles — YourFavAlien';

    var frame = el('div', 'hub-frame');
    var top = el('header', 'hub-top');
    var mark = el('img', 'hub-mark');
    mark.src = '/assets/01_Primary_Chrome_Wordmark_Clean.png';
    mark.alt = 'YourFavAlien';
    mark.width = 480;
    mark.height = 320;
    var kicker = el('p', 'hub-kicker');
    kicker.append(el('span', '', 'Private launch'), el('span', '', 'Ayden'));
    var titleRow = el('div', 'hub-title-row');
    titleRow.append(el('h1', '', 'Consoles'), el('p', 'hub-count', String(CONSOLES.length).padStart(2, '0')));
    top.append(mark, kicker, titleRow, el('p', 'hub-deck', 'One door for every private console.'));

    var list = el('ol', 'hub-list');
    CONSOLES.forEach(function (consoleInfo, index) {
      var item = el('li', 'console console--' + consoleInfo.id);
      var hit = el('a', 'console-hit');
      hit.href = consoleInfo.href;
      hit.append(
        el('span', 'console-index', String(index + 1).padStart(2, '0')),
        el('span', 'console-name', consoleInfo.name),
        el('p', 'console-purpose', consoleInfo.purpose),
        el('span', 'console-gate', consoleInfo.gate)
      );
      item.append(hit);
      if (consoleInfo.secondary) {
        var side = el('a', 'console-side', consoleInfo.secondary.label);
        side.href = consoleInfo.secondary.href;
        item.append(side);
      }
      list.append(item);
    });

    frame.append(top, list);
    root.replaceChildren(frame);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else render();
})();
