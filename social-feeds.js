(function () {
  'use strict';

  const providers = {
    'https://www.tiktok.com': {
      frame: document.querySelector('[data-yfa-social="tiktokEmbed"] iframe'),
      getHeight: message => typeof message.signalSource === 'string' ? message.height : undefined
    },
    'https://www.instagram.com': {
      frame: document.querySelector('[data-yfa-social="instagramEmbed"] iframe'),
      getHeight: message => message.type === 'MEASURE' ? message.details?.height : undefined
    }
  };

  window.addEventListener('message', event => {
    const provider = providers[event.origin];
    if (!provider?.frame || event.source !== provider.frame.contentWindow) return;

    let message = event.data;
    if (typeof message === 'string') {
      try {
        message = JSON.parse(message);
      } catch {
        return;
      }
    }

    if (!message || typeof message !== 'object') return;
    const height = provider.getHeight(message);
    if (!Number.isFinite(height) || height < 150) return;
    provider.frame.height = String(Math.min(Math.ceil(height), 1800));
    provider.frame.dataset.embedMeasured = "";
  });

  for (const { frame } of Object.values(providers)) {
    if (frame?.dataset.yfaSrc) frame.src = frame.dataset.yfaSrc;
  }
})();
