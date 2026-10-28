const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];
const expect = (name, condition) => checks.push({ name, ok: Boolean(condition) });

const previews = ['redesign-gallery.html'];
for (const file of previews) {
  const html = read(file);
  expect(`${file}: public Gallery is indexable`, !/name="robots" content="noindex,nofollow"/.test(html));
  expect(`${file}: Orbit popup is not forced into review`, !/orbit-popup|mothership-popup-gate/.test(html));
  expect(`${file}: privacy choices remain available`, /privacy-choices\.js/.test(html) && /data-yfa-privacy-open/.test(html));
  expect(`${file}: Xilo remains in the corner`, /xilo-chat\.js/.test(html) && /xilo-chat\.css/.test(html));
  expect(`${file}: reads the Mothership-backed redesign renderer`, /redesign-experience\.js/.test(html));
  expect(`${file}: About Moi removed from redesigned navigation`, !/>About Moi</i.test(html));
}
expect('Old preview URL forwards to the actual homepage', /location\.replace\('\/' \+ location\.search \+ location\.hash\)/.test(read('redesign-preview.html')));
const experience = read('redesign-experience.js');
expect('Intro controller ignores skip URLs and only completes on video end or failure', !/skip-intro|data-intro-skip|setTimeout\(finish/.test(experience) && /film\.addEventListener\('ended', finish/.test(experience));
expect('Intro returns focus to main without popping the visible skip link', /querySelector\('#main'\)\?\.focus/.test(experience) && /id="main" tabindex="-1"/.test(read('index.html')) && !/querySelector\('\.yfa-skip'\)\?\.focus/.test(experience));
expect('Saved Mothership advanced navigation is kept out of the redesigned header and mapped to the footer', /dataset\.yfaRedesign==='home'/.test(read('site-complete.js')) && /\.yfa-footer__links/.test(read('site-complete.js')) && /nav\(data\)/.test(read('site-complete.js')) && /trimPrimary/.test(read('site-complete.js')) && /site-complete\.js\?v=20261028-redesign-navigation-cleanup/.test(read('mothership-popup-gate.js')));
expect('Production redesign filters injected top links and retains Mothership links in the footer', /installPrimaryNavigation\(\)/.test(read('redesign-experience.js')) && /system\/site-advanced\.json/.test(read('redesign-experience.js')) && /redesign-experience\.js\?v=20261028-intro-focus-return/.test(read('index.html')));
expect('Redesign Socials, Contact, and Privacy pages use the shared shell', ['socials.html', 'contact.html', 'privacy.html'].every(file => /data-yfa-redesign-shell="interior"/.test(read(file)) && /redesign-page-shell\.js/.test(read(file))));
expect('Legacy About Moi route redirects to the homepage', /location\.replace\('\/'\)/.test(read('about.html')));
expect('Legal footer retains copyright, Privacy, choices, and Help', /© 2026 YourFavAlien/.test(read('redesign-page-shell.js')) && /data-yfa-privacy-open/.test(read('redesign-page-shell.js')) && /privacy/.test(read('redesign-page-shell.js')) && /help/.test(read('redesign-page-shell.js')));

const productionHome = read('index.html');
for (const integration of ['mothership-maintenance.js', 'privacy-choices.js', 'mothership-config.js', 'mothership-theme.js', 'mothership-images.js', 'xilo-chat.js']) expect(`Production integration preserved: ${integration}`, productionHome.includes(integration));
expect('Approved experience is the production homepage, not a preview document', /data-yfa-redesign="home"/.test(productionHome) && /<link rel="canonical" href="https:\/\/yourfavalien\.com\/"/.test(productionHome) && !/noindex/.test(productionHome));
expect('Homepage retains mandatory intro and removes About Moi navigation', /data-intro-play/.test(productionHome) && !/about\.html|About Moi/i.test(productionHome));
expect('Homepage retains 2026 legal footer and privacy controls', /© 2026 YourFavAlien/.test(productionHome) && /data-yfa-privacy-open/.test(productionHome));

const config = read('mothership-config.js');
expect('Mothership auth remains Descope-backed', /provider:\s*'descope'/.test(config));
expect('Orbit public gate remains wired', /mothership-popup-gate\.js/.test(config));
expect('Theme, socials, maintenance, popup, and support paths remain mapped', ['themePath', 'socialsPath', 'maintenancePath', 'popupPath', 'supportPath'].every(key => config.includes(key)));

const admin = read('mothership/admin.html');
for (const module of ['mothership-maintenance-admin.js', 'mothership-campaign-admin.js']) expect(`Admin module preserved: ${module}`, admin.includes(module));
const popupAdmin = read('mothership-popup-admin.js');
for (const module of ['mothership-cloudflare-admin.js', 'mothership-power.js', 'mothership-complete-admin.js', 'mothership-badge-admin.js']) expect(`Admin module preserved: ${module}`, popupAdmin.includes(module));
expect('Current Mothership gallery editor module is requested', /mothership-power\.js\?v=20261027-gallery-controls-5/.test(popupAdmin));
const dashboardShell = read('mothership/dashboard-shell.js');
expect('Mothership Gallery & uploads waits for Power Tools and opens the main Gallery record', /data-area="media">Gallery & uploads/.test(dashboardShell) && /media: showGalleryControls/.test(dashboardShell) && /YFA_MOTHERSHIP_POWER_READY/.test(dashboardShell) && /data-main-gallery/.test(dashboardShell));
expect('Read-only Mothership preview links to authenticated upload controls', /Open Gallery uploads/.test(read('mothership/editor-preview.html')));
expect('Support administration remains isolated and connected', read('mothership/support/index.html').includes('mothership-support-admin.js'));

const maintenance = read('mothership-maintenance.js');
expect('Campaign routing remains present', /campaignEnabled/.test(maintenance) && /dont-look-away\.html/.test(maintenance));
expect('Maintenance mode remains present', /status\.enabled/.test(maintenance) && /maintenance\.html/.test(maintenance));
expect('Mothership remains exempt from public routing', /pathname\.startsWith\('\/mothership'\)/.test(maintenance));

const power = read('mothership-power.js');
expect('Gallery uploader identifies and lists the main Gallery first', /data-main-gallery/.test(power) && /ordered\.forEach/.test(power));
expect('Mothership dashboard waits for Gallery controls to initialize', /YFA_MOTHERSHIP_POWER_READY/.test(power) && /resolvePowerReady\(true\)/.test(power));
expect('Gallery stable media IDs added', /stableMediaId/.test(power) && /id:\s*item\?\.id/.test(power));
expect('Gallery visibility control added', /data-visible/.test(power) && /visible:\s*true/.test(power));
expect('Gallery ordering controls added', /data-up/.test(power) && /data-down/.test(power));
expect('Gallery replacement control added', /data-replace/.test(power));
expect('Mothership gallery uploader accepts QuickTime MOV files', /video\/quicktime,\.mov/.test(power) && /mp4\|webm\|mov/.test(power));
expect('Draft and revision behavior preserved', /DRAFT_KEY/.test(power) && /revisions\/site-content/.test(power));
expect('Homepage keeps legal and privacy links at the end of the horizontal experience', /home\.appendChild\(footer\)/.test(experience) && /data-yfa-privacy-open/.test(productionHome));

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
