(() => {
  'use strict';

  function uploadTime(item) {
    const media = item.querySelector('img[src],video[src]');
    const match = String(media?.getAttribute('src') || '').match(/\/(\d{10,})-/);
    return match ? Number(match[1]) : 0;
  }

  function sortGallery(grid) {
    const current = [...grid.children].filter(item => item.classList.contains('yfa-gallery-item'));
    if (current.length < 2) return;
    const sorted = [...current].sort((a, b) => uploadTime(b) - uploadTime(a));
    if (sorted.every((item, index) => item === current[index])) return;
    sorted.forEach(item => grid.appendChild(item));
  }

  function sortAll() {
    document.querySelectorAll('.yfa-gallery-grid').forEach(sortGallery);
  }

  const observer = new MutationObserver(sortAll);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', sortAll, { once: true });
  else sortAll();
})();
