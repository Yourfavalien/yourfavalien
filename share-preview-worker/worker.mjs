const SETTINGS_URL = 'https://yourfavalien-mothership.aydenmtz54.workers.dev/assets/theme/theme.json';
const DEFAULTS = {
  title: 'YourFavAlien | Official Website',
  description: 'Explore YourFavAlien, the official creative home of Ayden: fashion, a developing modeling journey, original photography, personal style, and new projects.',
  image: 'https://yourfavalien.com/assets/share-preview.png'
};

let cachedPreview = null;
let cachedUntil = 0;

async function getSharePreview(env) {
  if (Date.now() < cachedUntil) return cachedPreview;
  try {
    const response = await env.MOTHERSHIP.fetch(SETTINGS_URL);
    if (!response.ok) {
      cachedUntil = Date.now() + 5_000;
      return cachedPreview;
    }
    const data = await response.json();
    const saved = data && data.sharePreview;
    if (!saved || typeof saved !== 'object') {
      cachedPreview = null;
      cachedUntil = Date.now() + 30_000;
      return null;
    }
    cachedPreview = {
      title: String(saved.title || '').trim().slice(0, 100) || DEFAULTS.title,
      description: String(saved.description || '').trim().slice(0, 200) || DEFAULTS.description,
      image: /^https:\/\//i.test(String(saved.image || '').trim())
        ? String(saved.image).trim().slice(0, 1000)
        : DEFAULTS.image
    };
    cachedUntil = Date.now() + 30_000;
    return cachedPreview;
  } catch (error) {
    cachedUntil = Date.now() + 5_000;
    return cachedPreview;
  }
}

export default {
  async fetch(request, env, ctx) {
    ctx.passThroughOnException();
    if (request.method !== 'GET') return fetch(request);

    // The route is the bare homepage URL. Remove origin validators because
    // GitHub Pages' ETag does not change when Mothership's share settings do.
    const headers = new Headers(request.headers);
    headers.delete('if-none-match');
    headers.delete('if-modified-since');
    const originRequest = new Request(request, { headers });
    const [response, preview] = await Promise.all([fetch(originRequest), getSharePreview(env)]);
    if (!response.ok || !/text\/html/i.test(response.headers.get('content-type') || '')) return response;
    if (!preview) return response;

    const imageType = /\.webp(?:[?#]|$)/i.test(preview.image) ? 'image/webp'
      : /\.jpe?g(?:[?#]|$)/i.test(preview.image) ? 'image/jpeg' : 'image/png';
    const outgoingHeaders = new Headers(response.headers);
    outgoingHeaders.delete('content-length');
    outgoingHeaders.delete('etag');
    outgoingHeaders.delete('last-modified');
    outgoingHeaders.set('cache-control', 'public, max-age=30');
    const page = new Response(response.body, { status: response.status, statusText: response.statusText, headers: outgoingHeaders });

    return new HTMLRewriter()
      .on('title', { element(element) { element.setInnerContent(preview.title); } })
      .on('meta', {
        element(element) {
          const key = element.getAttribute('property') || element.getAttribute('name');
          if (key === 'description' || key === 'og:description' || key === 'twitter:description') {
            element.setAttribute('content', preview.description);
          } else if (key === 'og:title' || key === 'twitter:title') {
            element.setAttribute('content', preview.title);
          } else if (key === 'og:image' || key === 'og:image:secure_url' || key === 'twitter:image') {
            element.setAttribute('content', preview.image);
          } else if (key === 'og:image:type') {
            element.setAttribute('content', imageType);
          } else if (key === 'og:image:alt' || key === 'twitter:image:alt') {
            element.setAttribute('content', `${preview.title} share preview`);
          } else if (key === 'og:image:width' || key === 'og:image:height') {
            element.remove();
          }
        }
      })
      .transform(page);
  }
};
