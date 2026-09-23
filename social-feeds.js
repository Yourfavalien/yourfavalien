(function () {
  'use strict';

  const feed = document.getElementById('instagram-live-feed');
  if (!feed) return;

  const endpoint = feed.dataset.feedEndpoint;
  if (!endpoint) return;

  const isInstagramUrl = value => {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && /(^|\.)instagram\.com$/i.test(url.hostname);
    } catch (error) {
      return false;
    }
  };

  const render = posts => {
    const validPosts = posts
      .map(post => ({
        permalink: String(post && post.permalink || '').trim(),
        id: String(post && post.id || '').trim()
      }))
      .filter(post => post.id && isInstagramUrl(post.permalink))
      .slice(0, 6);

    if (!validPosts.length) return;

    const fragment = document.createDocumentFragment();
    validPosts.forEach((post, index) => {
      const item = document.createElement('div');
      item.className = 'instagram-post';

      const iframe = document.createElement('iframe');
      iframe.loading = 'lazy';
      iframe.scrolling = 'no';
      iframe.title = `Instagram post ${index + 1}`;
      iframe.src = post.permalink.replace(/\/$/, '') + '/embed/';
      item.appendChild(iframe);
      fragment.appendChild(item);
    });

    feed.replaceChildren(fragment);
  };

  fetch(endpoint, {
    mode: 'cors',
    credentials: 'omit',
    cache: 'no-store',
    headers: { Accept: 'application/json' }
  })
    .then(response => {
      if (!response.ok) throw new Error(`Instagram feed unavailable (${response.status})`);
      return response.json();
    })
    .then(data => render(Array.isArray(data && data.posts) ? data.posts : []))
    .catch(() => {
      // Keep the current embeds visible until the one-time Instagram connection is complete.
    });
})();
