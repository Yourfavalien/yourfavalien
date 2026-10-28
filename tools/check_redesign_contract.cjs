const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];
const expect = (name, condition) => checks.push({ name, ok: Boolean(condition) });

const previews = ['redesign-preview.html', 'redesign-gallery.html'];
for (const file of previews) {
  const html = read(file);
  expect(`${file}: protected from indexing`, /name="robots" content="noindex,nofollow"/.test(html));
  expect(`${file}: Orbit and privacy prompts are not forced into review`, !/orbit-popup|privacy-choices/.test(html));
  expect(`${file}: Xilo remains in the corner`, /xilo-chat\.js/.test(html) && /xilo-chat\.css/.test(html));
  expect(`${file}: reads the Mothership-backed redesign renderer`, /redesign-experience\.js/.test(html));
  expect(`${file}: About Moi removed from redesigned navigation`, !/>About Moi</i.test(html));
}

const productionHome = read('index.html');
for (const integration of ['mothership-maintenance.js', 'privacy-choices.js', 'mothership-config.js', 'mothership-theme.js', 'mothership-images.js', 'xilo-chat.js']) expect(`Production integration preserved: ${integration}`, productionHome.includes(integration));

const config = read('mothership-config.js');
expect('Mothership auth remains Descope-backed', /provider:\s*'descope'/.test(config));
expect('Orbit public gate remains wired', /mothership-popup-gate\.js/.test(config));
expect('Theme, socials, maintenance, popup, and support paths remain mapped', ['themePath', 'socialsPath', 'maintenancePath', 'popupPath', 'supportPath'].every(key => config.includes(key)));

const admin = read('mothership/admin.html');
for (const module of ['mothership-maintenance-admin.js', 'mothership-campaign-admin.js']) expect(`Admin module preserved: ${module}`, admin.includes(module));
const popupAdmin = read('mothership-popup-admin.js');
for (const module of ['mothership-cloudflare-admin.js', 'mothership-power.js', 'mothership-complete-admin.js', 'mothership-badge-admin.js']) expect(`Admin module preserved: ${module}`, popupAdmin.includes(module));
expect('Support administration remains isolated and connected', read('mothership/support/index.html').includes('mothership-support-admin.js'));

const maintenance = read('mothership-maintenance.js');
expect('Campaign routing remains present', /campaignEnabled/.test(maintenance) && /dont-look-away\.html/.test(maintenance));
expect('Maintenance mode remains present', /status\.enabled/.test(maintenance) && /maintenance\.html/.test(maintenance));
expect('Mothership remains exempt from public routing', /pathname\.startsWith\('\/mothership'\)/.test(maintenance));

const power = read('mothership-power.js');
expect('Gallery stable media IDs added', /stableMediaId/.test(power) && /id:\s*item\?\.id/.test(power));
expect('Gallery visibility control added', /data-visible/.test(power) && /visible:\s*true/.test(power));
expect('Gallery ordering controls added', /data-up/.test(power) && /data-down/.test(power));
expect('Gallery replacement control added', /data-replace/.test(power));
expect('Draft and revision behavior preserved', /DRAFT_KEY/.test(power) && /revisions\/site-content/.test(power));

const enhancements = read('site-enhancements.js');
expect('Public renderer honors visibility', /item\.visible\s*!==\s*false/.test(enhancements));
expect('Public renderer keeps newest-first compatibility and supports explicit manual order', /page\.orderMode === 'manual'/.test(enhancements) && /data-order="\$\{page\.orderMode === 'manual' \? 'manual' : 'newest'\}"/.test(enhancements));
expect('Public renderer exposes stable IDs', /data-media-id/.test(enhancements));

const campaign = read('dont-look-away.html');
expect('DON’T LOOK AWAY campaign asset preserved', /dont-look-away-campaign\.jpeg/.test(campaign));
expect('Campaign reduced-motion fallback preserved', /prefers-reduced-motion:reduce/.test(campaign));

const failures = checks.filter(check => !check.ok);
for (const check of checks) console.log(`${check.ok ? 'PASS' : 'FAIL'}  ${check.name}`);
console.log(`\n${checks.length - failures.length}/${checks.length} contract checks passed.`);
if (failures.length) process.exitCode = 1;
