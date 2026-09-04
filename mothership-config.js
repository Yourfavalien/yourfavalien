window.YFA_MOTHERSHIP = {
  supabaseUrl: 'https://qpwjfsigvoktsaeiypyy.supabase.co',
  publishableKey: 'sb_publishable_THWa8IbRa_YTSr1bOxonhQ_GCq3J-A9',
  bucket: 'mothership-images',
  themePath: 'theme/theme.json',
  socialsPath: 'socials/socials.json',
  maintenancePath: 'system/maintenance.json',
  popupPath: 'system/orbit-popup.json',
  slots: [
    { id: 'home-hero-media', group: 'Home', label: 'Homepage hero image / video', path: 'slots/home-hero-media', media: true },
    { id: 'home-orbit-visual', group: 'Home', label: 'Orbit popup photo', path: 'slots/home-orbit-visual' },
    { id: 'socials-hero', group: 'Socials', label: 'Socials hero photo', path: 'slots/socials-hero' },
    { id: 'socials-tiktok-profile', group: 'Socials', label: 'TikTok profile photo', path: 'slots/socials-tiktok-profile' },
    { id: 'socials-instagram-profile', group: 'Socials', label: 'Instagram profile photo', path: 'slots/socials-instagram-profile' },
    { id: 'socials-snapchat-profile', group: 'Socials', label: 'Snapchat profile photo', path: 'slots/socials-snapchat-profile' },
    { id: 'socials-facebook-profile', group: 'Socials', label: 'Facebook profile photo', path: 'slots/socials-facebook-profile' }
  ],
  colorGroups: [
    {
      group: 'Site Menu',
      note: 'Controls the full-screen UFO menu on every active website page.',
      colors: [
        { id:'menu-bg', label:'Menu background', cssVar:'--yfa-menu-bg', default:'#0a0507', pages:['home','about','contact','privacy','socials'] },
        { id:'menu-text', label:'Menu lettering', cssVar:'--yfa-menu-text', default:'#f0ece8', pages:['home','about','contact','privacy','socials'] },
        { id:'menu-active', label:'Current page', cssVar:'--yfa-menu-active', default:'#b5175e', pages:['home','about','contact','privacy','socials'] },
        { id:'menu-hover', label:'Hover / focus', cssVar:'--yfa-menu-hover', default:'#4de8d8', pages:['home','about','contact','privacy','socials'] }
      ]
    },
    {
      group: 'Main Site',
      note: 'These colors are shared by the main Home, About, Contact, and Privacy design.',
      colors: [
        { id:'main-bg', label:'Main background', cssVar:'--black', default:'#0a0507', pages:['home','about','contact','privacy'] },
        { id:'main-dark', label:'Dark secondary', cssVar:'--dark', default:'#12080d', pages:['home','about','contact','privacy'] },
        { id:'main-accent', label:'Main accent', cssVar:'--magenta', default:'#b5175e', pages:['home','about','contact','privacy'] },
        { id:'main-accent-hover', label:'Accent hover', cssVar:'--magenta-dark', default:'#8b1148', pages:['home','about','contact','privacy'] },
        { id:'main-cyan', label:'Cyan accent', cssVar:'--cyan', default:'#4de8d8', pages:['home','about','contact','privacy'] },
        { id:'main-yellow', label:'Yellow accent', cssVar:'--yellow', default:'#f5c518', pages:['home','about','contact','privacy'] },
        { id:'main-text', label:'Main text', cssVar:'--white', default:'#f0ece8', pages:['home','about','contact','privacy'] },
        { id:'main-light', label:'Light panel', cssVar:'--gray-light', default:'#e8e4e0', pages:['home','about','contact','privacy'] }
      ]
    },
    {
      group: 'Orbit Popup',
      note: 'Controls the cream signup popup that appears on the main-site pages.',
      colors: [
        { id:'orbit-text', label:'Orbit text / ink', cssVar:'--yfa-orbit-ink', default:'#17181c', pages:['home','about','contact'] },
        { id:'orbit-bg', label:'Orbit cream', cssVar:'--yfa-orbit-cream', default:'#f8f6ec', pages:['home','about','contact'] },
        { id:'orbit-bg-deep', label:'Orbit cream shade', cssVar:'--yfa-orbit-cream-deep', default:'#f1eedf', pages:['home','about','contact'] },
        { id:'orbit-button', label:'Orbit button', cssVar:'--yfa-orbit-button', default:'#1c2028', pages:['home','about','contact'] },
        { id:'orbit-button-hover', label:'Orbit button hover', cssVar:'--yfa-orbit-button-hover', default:'#0f1218', pages:['home','about','contact'] }
      ]
    },
    {
      group: 'Socials',
      note: 'Controls the Socials page background, cards, accents, and platform colors.',
      colors: [
        { id:'socials-bg', label:'Page background', cssVar:'--sage', default:'#bccfbc', pages:['socials'] },
        { id:'socials-accent', label:'Accent', cssVar:'--magenta', default:'#b5175e', pages:['socials'] },
        { id:'socials-accent-hover', label:'Accent hover', cssVar:'--magenta-dark', default:'#8b1148', pages:['socials'] },
        { id:'socials-text', label:'Light text', cssVar:'--white', default:'#f0ece8', pages:['socials'] },
        { id:'socials-card', label:'Card background', cssVar:'--yfa-social-card', default:'#1a1a1a', pages:['socials'] },
        { id:'socials-card-inner', label:'Card inner background', cssVar:'--yfa-social-card-inner', default:'#2a2a2a', pages:['socials'] },
        { id:'socials-facebook', label:'Facebook button', cssVar:'--yfa-social-facebook', default:'#1877f2', pages:['socials'] },
        { id:'socials-snapchat', label:'Snapchat accent', cssVar:'--yfa-social-snapchat', default:'#fffc00', pages:['socials'] },
        { id:'socials-pinterest', label:'Pinterest button', cssVar:'--yfa-social-pinterest', default:'#e60023', pages:['socials'] },
        { id:'socials-media-warm', label:'Warm tone', cssVar:'--yfa-social-media-warm', default:'#8e4e36', pages:['socials'] }
      ]
    }
  ]
};

// Compatibility bridge: any old public Supabase Storage URL in the site now reads
// the already-migrated object from Cloudflare R2 instead. This lets older modules
// keep their current URL-building code while removing Supabase from the request path.
(function () {
  if (window.__YFA_CF_STORAGE_FETCH_BRIDGE__) return;
  window.__YFA_CF_STORAGE_FETCH_BRIDGE__ = true;

  const cfg = window.YFA_MOTHERSHIP;
  const originalFetch = window.fetch.bind(window);
  const legacyPrefix = `${cfg.supabaseUrl}/storage/v1/object/public/${cfg.bucket}/`;
  const cloudflarePrefix = 'https://yourfavalien-mothership.aydenmtz54.workers.dev/assets/';

  function rewriteUrl(value) {
    const url = String(value || '');
    return url.startsWith(legacyPrefix) ? `${cloudflarePrefix}${url.slice(legacyPrefix.length)}` : url;
  }

  window.fetch = function (input, init) {
    try {
      if (typeof input === 'string' || input instanceof URL) {
        return originalFetch(rewriteUrl(input), init);
      }
      if (input instanceof Request && input.url.startsWith(legacyPrefix)) {
        const rewritten = new Request(rewriteUrl(input.url), input);
        return originalFetch(rewritten, init);
      }
    } catch (error) {}
    return originalFetch(input, init);
  };

  window.__YFA_ORIGINAL_FETCH__ = originalFetch;
})();

// On Mothership, Cloudflare Access is the authentication gate. Legacy admin modules
// still call Supabase-style storage methods, so transparently route those calls to
// the same-origin Cloudflare Worker / R2 API until the old modules are retired.
(function () {
  const isMothership = /^\/mothership(?:\/|$)/i.test(window.location.pathname || '');
  if (!isMothership || window.__YFA_CF_ACCESS_AUTH_SHIM__) return;
  if (!window.supabase || typeof window.supabase.createClient !== 'function') return;

  window.__YFA_CF_ACCESS_AUTH_SHIM__ = true;
  const cfg = window.YFA_MOTHERSHIP;
  const originalCreateClient = window.supabase.createClient.bind(window.supabase);
  const directFetch = window.__YFA_ORIGINAL_FETCH__ || window.fetch.bind(window);
  const cloudflareAssetBase = 'https://yourfavalien-mothership.aydenmtz54.workers.dev/assets/';

  const encodePath = path => String(path || '').replace(/^\/+/, '').split('/').map(encodeURIComponent).join('/');

  async function apiError(response, fallback) {
    let message = fallback || `Cloudflare request failed (${response.status}).`;
    try {
      const data = await response.json();
      if (data && data.error) message = data.error;
    } catch (error) {}
    return new Error(message);
  }

  async function getAccessSession() {
    try {
      const response = await directFetch('/cdn-cgi/access/get-identity', {
        credentials: 'same-origin',
        cache: 'no-store'
      });
      if (!response.ok) return null;
      const identity = await response.json();
      const email = identity.email || identity.user || identity.name || 'Authenticated user';
      return {
        access_token: 'cloudflare-access',
        token_type: 'bearer',
        user: {
          id: identity.user_uuid || identity.sub || email,
          email,
          app_metadata: { provider: 'cloudflare-access' },
          user_metadata: {}
        }
      };
    } catch (error) {
      return null;
    }
  }

  window.supabase.createClient = function (...args) {
    const client = originalCreateClient(...args);
    if (!client || !client.auth) return client;

    client.auth.getSession = async function () {
      const session = await getAccessSession();
      return { data: { session }, error: null };
    };

    client.auth.onAuthStateChange = function (callback) {
      let active = true;
      getAccessSession().then(session => {
        if (active && typeof callback === 'function') callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
      });
      return {
        data: {
          subscription: {
            unsubscribe() { active = false; }
          }
        }
      };
    };

    client.auth.signInWithPassword = async function () {
      const session = await getAccessSession();
      if (!session) {
        return { data: { session: null }, error: new Error('Cloudflare Access session not found.') };
      }
      return { data: { session }, error: null };
    };

    client.auth.signOut = async function () {
      window.location.assign('/cdn-cgi/access/logout');
      return { error: null };
    };

    if (client.storage && typeof client.storage.from === 'function') {
      const originalStorageFrom = client.storage.from.bind(client.storage);
      client.storage.from = function (bucketName) {
        const legacyBucket = originalStorageFrom(bucketName);
        if (bucketName !== cfg.bucket) return legacyBucket;

        return new Proxy(legacyBucket, {
          get(target, prop, receiver) {
            if (prop === 'upload') {
              return async function (path, body, options = {}) {
                try {
                  const headers = {};
                  const contentType = options.contentType || (body && body.type) || 'application/octet-stream';
                  if (contentType) headers['Content-Type'] = contentType;
                  const response = await directFetch(`/api/assets/${encodePath(path)}`, {
                    method: 'PUT',
                    headers,
                    body,
                    credentials: 'same-origin',
                    cache: 'no-store'
                  });
                  if (!response.ok) return { data: null, error: await apiError(response, 'Could not upload to Cloudflare.') };
                  return { data: { path }, error: null };
                } catch (error) {
                  return { data: null, error };
                }
              };
            }

            if (prop === 'remove') {
              return async function (paths) {
                try {
                  const list = Array.isArray(paths) ? paths : [paths];
                  for (const path of list.filter(Boolean)) {
                    const response = await directFetch(`/api/assets/${encodePath(path)}`, {
                      method: 'DELETE',
                      credentials: 'same-origin',
                      cache: 'no-store'
                    });
                    if (!response.ok && response.status !== 404) {
                      return { data: null, error: await apiError(response, 'Could not remove Cloudflare asset.') };
                    }
                  }
                  return { data: list.map(path => ({ name: path })), error: null };
                } catch (error) {
                  return { data: null, error };
                }
              };
            }

            if (prop === 'getPublicUrl') {
              return function (path) {
                return { data: { publicUrl: `${cloudflareAssetBase}${encodePath(path)}` } };
              };
            }

            const value = Reflect.get(target, prop, receiver);
            return typeof value === 'function' ? value.bind(target) : value;
          }
        });
      };
    }

    return client;
  };
})();

// Load the Orbit popup switch without changing every page again.
(function () {
  if (window.__YFA_POPUP_SWITCH_LOADER__) return;
  window.__YFA_POPUP_SWITCH_LOADER__ = true;

  const isMothership = /^\/mothership(?:\/|$)/i.test(window.location.pathname || '');
  const script = document.createElement('script');
  script.src = isMothership
    ? '/mothership-popup-admin.js?v=20260903-2'
    : '/mothership-popup-gate.js?v=20260903-2';
  script.defer = true;
  document.head.appendChild(script);
})();
