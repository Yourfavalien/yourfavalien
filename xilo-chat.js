(function () {
  'use strict';

  if (window.__XILO_CHAT_LOADED__) return;
  window.__XILO_CHAT_LOADED__ = true;

  const config = Object.assign({
    endpoint: 'https://xilo.yourfavalien.com/api/chat',
    contactUrl: 'https://tally.so/r/NpxlQB',
    maxHistory: 10,
    timeoutMs: 30000
  }, window.XILO_CONFIG || {});

  const state = {
    busy: false,
    history: loadHistory()
  };

  function loadHistory() {
    try {
      const saved = JSON.parse(sessionStorage.getItem('xilo-chat-history') || '[]');
      return Array.isArray(saved) ? saved.slice(-10) : [];
    } catch (_) {
      return [];
    }
  }

  function saveHistory() {
    try {
      sessionStorage.setItem('xilo-chat-history', JSON.stringify(state.history.slice(-config.maxHistory)));
    } catch (_) {}
  }

  function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (typeof text === 'string') element.textContent = text;
    return element;
  }

  const root = createElement('aside', 'xilo-chat');
  root.setAttribute('aria-label', 'Chat with Xilo');

  const launcher = createElement('button', 'xilo-launcher');
  launcher.type = 'button';
  launcher.setAttribute('aria-expanded', 'false');
  launcher.setAttribute('aria-controls', 'xilo-panel');
  launcher.innerHTML = '<span class="xilo-launcher-mark" aria-hidden="true">👽</span><span>ask xilo</span>';

  const panel = createElement('section', 'xilo-panel');
  panel.id = 'xilo-panel';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'false');
  panel.setAttribute('aria-labelledby', 'xilo-name');

  const header = createElement('header', 'xilo-header');
  header.innerHTML = '<div class="xilo-avatar" aria-hidden="true">👽</div><div class="xilo-identity"><h2 class="xilo-name" id="xilo-name">XILO</h2><p class="xilo-status"><span class="xilo-status-dot">●</span> YourFavAlien assistant</p></div>';
  const closeButton = createElement('button', 'xilo-close', '×');
  closeButton.type = 'button';
  closeButton.setAttribute('aria-label', 'Close Xilo chat');
  header.appendChild(closeButton);

  const messages = createElement('div', 'xilo-messages');
  messages.setAttribute('role', 'log');
  messages.setAttribute('aria-live', 'polite');
  messages.setAttribute('aria-relevant', 'additions');

  const quickReplies = createElement('div', 'xilo-quick-replies');
  ['What do you offer?', 'How do I collaborate?', 'Contact Ayden'].forEach(function (label) {
    const button = createElement('button', 'xilo-quick-reply', label);
    button.type = 'button';
    button.addEventListener('click', function () {
      if (label === 'Contact Ayden') {
        window.open(config.contactUrl, '_blank', 'noopener,noreferrer');
        return;
      }
      input.value = label;
      form.requestSubmit();
    });
    quickReplies.appendChild(button);
  });

  const form = createElement('form', 'xilo-form');
  const input = createElement('textarea', 'xilo-input');
  input.name = 'message';
  input.rows = 1;
  input.maxLength = 1200;
  input.placeholder = 'Ask Xilo something…';
  input.setAttribute('aria-label', 'Message Xilo');
  const sendButton = createElement('button', 'xilo-send', '➤');
  sendButton.type = 'submit';
  sendButton.setAttribute('aria-label', 'Send message');
  const disclaimer = createElement('p', 'xilo-disclaimer', 'Xilo is AI and may make mistakes. For official inquiries, use the contact form.');
  form.append(input, sendButton, disclaimer);

  panel.append(header, messages, quickReplies, form);
  root.append(panel, launcher);
  // Mount outside the animated body so fixed positioning stays locked to the viewport.
  document.documentElement.appendChild(root);

  function addMessage(role, text, options) {
    const row = createElement('div', 'xilo-message-row' + (role === 'user' ? ' is-user' : ''));
    if (options && options.typing) row.classList.add('xilo-typing');
    const bubble = createElement('div', 'xilo-message');
    if (options && options.typing) {
      bubble.innerHTML = '<span class="xilo-dots" aria-label="Xilo is typing">•••</span>';
    } else {
      bubble.textContent = text;
    }
    row.appendChild(bubble);
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
    return row;
  }

  function renderHistory() {
    if (!state.history.length) {
      addMessage('assistant', "hey, earthling 👽 i'm Xilo. Ask me about YourFavAlien, collaborations, or how to get in touch.");
      return;
    }
    state.history.forEach(function (message) {
      addMessage(message.role, message.content);
    });
  }

  function setOpen(open) {
    panel.hidden = !open;
    launcher.setAttribute('aria-expanded', String(open));
    if (open) window.setTimeout(function () { input.focus({ preventScroll: true }); }, 180);
  }

  launcher.addEventListener('click', function () { setOpen(panel.hidden); });
  closeButton.addEventListener('click', function () { setOpen(false); launcher.focus({ preventScroll: true }); });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !panel.hidden) setOpen(false);
  });

  input.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    const text = input.value.trim();
    if (!text || state.busy) return;

    state.busy = true;
    sendButton.disabled = true;
    input.value = '';
    addMessage('user', text);
    state.history.push({ role: 'user', content: text });
    state.history = state.history.slice(-config.maxHistory);
    saveHistory();

    const typing = addMessage('assistant', '', { typing: true });
    const controller = new AbortController();
    const timeout = window.setTimeout(function () { controller.abort(); }, config.timeoutMs);

    try {
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: state.history }),
        signal: controller.signal
      });
      const data = await response.json().catch(function () { return {}; });
      if (!response.ok) throw new Error(data.error || 'Xilo could not answer right now.');
      if (!data.reply || typeof data.reply !== 'string') throw new Error('Xilo returned an empty reply.');

      typing.remove();
      addMessage('assistant', data.reply);
      state.history.push({ role: 'assistant', content: data.reply });
      state.history = state.history.slice(-config.maxHistory);
      saveHistory();
    } catch (error) {
      typing.remove();
      const message = error && error.name === 'AbortError'
        ? 'my signal timed out. please try again in a moment.'
        : "i'm having trouble reaching the mothership. You can still contact Ayden using the contact button on this page.";
      addMessage('assistant', message);
    } finally {
      window.clearTimeout(timeout);
      state.busy = false;
      sendButton.disabled = false;
      input.focus({ preventScroll: true });
    }
  });

  renderHistory();
})();
