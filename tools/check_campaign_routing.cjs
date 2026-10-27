// Run with: node --test tools/check_campaign_routing.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');
const source = readFileSync(resolve(__dirname, '../mothership-maintenance.js'), 'utf8');
const supportPages = ['help', 'help-article', 'help-category', 'help-contact', 'help-privacy', 'help-ticket', 'help-ticket-confirmation', 'help-tickets', 'status'];

async function run(path, status = { campaignEnabled: true }, options = {}) {
  const url = new URL(path, 'https://yourfavalien.com');
  const redirects = [], intervals = [];
  const window = {
    location: { pathname: url.pathname, search: url.search, hash: url.hash, replace: target => redirects.push(target) },
    YFA_IS_404: options.notFound || false,
    setTimeout: () => 1, clearTimeout: () => {}, setInterval: fn => intervals.push(fn)
  };
  vm.runInNewContext(source, {
    window, URLSearchParams,
    document: { visibilityState: 'visible', addEventListener: () => {} },
    localStorage: { getItem: () => options.previewUntil || '0' },
    fetch: async () => ({ ok: true, json: async () => status })
  });
  await new Promise(setImmediate);
  return { redirects, intervals };
}

test('campaign mode leaves every Support route and URL alias reachable', async () => {
  for (const page of supportPages) {
    for (const suffix of ['', '/', '.html', '.html/']) {
      const path = `/${page}${suffix}?ticket=YFA-123#details`;
      assert.deepEqual((await run(path)).redirects, [], path);
    }
  }
  assert.deepEqual((await run('/HELP.HTML')).redirects, []);
});

test('campaign mode still redirects other public pages, preserving their URL', async () => {
  for (const path of ['/', '/about', '/about.html', '/socials', '/contact.html', '/privacy', '/page.html?id=1#section', '/welcome-email.html', '/inspiration-reader/privacy/', '/helpful', '/help-other.html']) {
    assert.deepEqual((await run(path)).redirects, [`/dont-look-away.html?from=${encodeURIComponent(path)}`], path);
  }
});

test('visitors previously redirected from Support return while the campaign stays active', async () => {
  for (const target of ['/help', '/help-ticket.html?ticket=YFA-123#details', '/status.html']) {
    assert.deepEqual((await run(`/dont-look-away.html?from=${encodeURIComponent(target)}`)).redirects, [target]);
  }
  const result = await run('/dont-look-away.html?mothership-preview=1&from=%2Fhelp');
  assert.deepEqual(result.redirects, [], 'owner campaign preview remains visible');
});

test('normal campaign visitors remain on campaign and return when it is switched off', async () => {
  const status = { campaignEnabled: true };
  const result = await run('/dont-look-away.html?from=%2Fabout', status);
  assert.deepEqual(result.redirects, []);
  assert.equal(result.intervals.length, 1);
  status.campaignEnabled = false;
  await result.intervals[0]();
  assert.deepEqual(result.redirects, ['/about']);
});

test('campaign-off, admin and not-found behavior stays unchanged', async () => {
  for (const path of ['/help', '/about', '/contact.html']) assert.deepEqual((await run(path, { campaignEnabled: false })).redirects, []);
  assert.deepEqual((await run('/mothership/admin.html')).redirects, []);
  assert.deepEqual((await run('/missing', { campaignEnabled: true }, { notFound: true })).redirects, []);
  assert.deepEqual((await run('/dont-look-away.html?from=%2F%2Fevil.example', { campaignEnabled: false })).redirects, ['/']);
});

test('maintenance remains independent of the campaign-only Support exemption', async () => {
  for (const page of supportPages) {
    const path = `/${page}.html`;
    assert.deepEqual((await run(path, { enabled: true, campaignEnabled: true })).redirects, [`/maintenance.html?from=${encodeURIComponent(path)}`]);
  }
});
