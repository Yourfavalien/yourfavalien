(function () {
  'use strict';

  if (window.__XILO_CHAT_LOADED__) return;
  window.__XILO_CHAT_LOADED__ = true;

  const config = Object.assign({
    endpoint: 'https://yourfavalien-business-headquarters.aydenmtz54.workers.dev/api/chat',
    maxHistory: 10,
    timeoutMs: 30000,
    minResponseMs: 1400,
    typeSpeedMs: 14,
    pollMs: 3000
  }, window.XILO_CONFIG || {});

  const state = {
    busy: false,
    history: loadHistory(),
    conversation: loadConversation(),
    seenMessageIds: new Set(),
    pollTimer: null
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

  function loadConversation() {
    try {
      const saved = JSON.parse(sessionStorage.getItem('xilo-conversation') || 'null');
      return saved && saved.id && saved.token ? saved : null;
    } catch (_) {
      return null;
    }
  }

  function saveConversation(conversation) {
    state.conversation = conversation;
    try {
      sessionStorage.setItem('xilo-conversation', JSON.stringify(conversation));
    } catch (_) {}
  }

  function wait(ms) {
    return new Promise(function (resolve) { window.setTimeout(resolve, ms); });
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

  panel.append(header, messages, form);
  root.append(panel, launcher);
  // Mount outside the animated body so fixed positioning stays locked to the viewport.
  document.documentElement.appendChild(root);

  function addActionButtons(row, actions) {
    if (!Array.isArray(actions) || !actions.length) return;
    const actionBar = createElement('div', 'xilo-message-actions');
    actions.forEach(function (action) {
      if (!action || typeof action.url !== 'string' || !/^(https:\/\/|mailto:)/i.test(action.url)) return;
      const link = createElement('a', 'xilo-action', action.label || 'Open link');
      link.href = action.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      actionBar.appendChild(link);
    });
    if (actionBar.childElementCount) row.appendChild(actionBar);
  }

  function cleanReplyText(text) {
    return String(text || '')
      .replace(/\[([^\]]+)\]\((https:\/\/[^)]+)\)/g, '$1')
      .replace(/\*\*([^*\n]+)\*\*/g, '$1')
      .replace(/__([^_\n]+)__/g, '$1')
      .replace(/https:\/\/[^\s]+/g, '')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

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
    if (!(options && options.typing)) addActionButtons(row, options && options.actions);
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
    return row;
  }

  async function revealAssistantMessage(text, actions) {
    const cleanText = cleanReplyText(text);
    const row = addMessage('assistant', '');
    const bubble = row.querySelector('.xilo-message');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || !cleanText) {
      bubble.textContent = cleanText;
    } else {
      const duration = Math.min(2400, Math.max(500, cleanText.length * config.typeSpeedMs));
      const steps = Math.max(1, Math.ceil(duration / 32));
      for (let step = 1; step <= steps; step += 1) {
        bubble.textContent = cleanText.slice(0, Math.ceil((step / steps) * cleanText.length));
        messages.scrollTop = messages.scrollHeight;
        await wait(duration / steps);
      }
    }
    addActionButtons(row, actions);
    messages.scrollTop = messages.scrollHeight;
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

  function updateStatus(mode) {
    const status = header.querySelector('.xilo-status');
    if (!status) return;
    status.innerHTML = mode === 'human'
      ? '<span class="xilo-status-dot is-human">●</span> Ayden joined the chat'
      : '<span class="xilo-status-dot">●</span> YourFavAlien assistant';
  }

  async function pollConversation() {
    if (!state.conversation || !state.conversation.id || !state.conversation.token) return;
    try {
      const url = config.endpoint + '/' + encodeURIComponent(state.conversation.id)
        + '/messages?token=' + encodeURIComponent(state.conversation.token);
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      updateStatus(data.mode);
      (data.messages || []).forEach(function (message) {
        if (!message || state.seenMessageIds.has(String(message.id))) return;
        state.seenMessageIds.add(String(message.id));
        if (message.sender === 'ayden') {
          addMessage('assistant', message.body, { actions: message.actions || [] });
          state.history.push({ role: 'assistant', content: message.body });
          state.history = state.history.slice(-config.maxHistory);
          saveHistory();
        }
      });
    } catch (_) {}
  }

  function startPolling() {
    if (state.pollTimer) return;
    pollConversation();
    state.pollTimer = window.setInterval(pollConversation, config.pollMs);
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
    const startedAt = Date.now();
    const controller = new AbortController();
    const timeout = window.setTimeout(function () { controller.abort(); }, config.timeoutMs);

    try {
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: state.history,
          conversationId: state.conversation && state.conversation.id,
          visitorToken: state.conversation && state.conversation.token,
          pageUrl: window.location.href
        }),
        signal: controller.signal
      });
      const data = await response.json().catch(function () { return {}; });
      if (!response.ok) throw new Error(data.error || 'Xilo could not answer right now.');
      if (!data.reply || typeof data.reply !== 'string') throw new Error('Xilo returned an empty reply.');

      if (data.conversationId && data.visitorToken) {
        saveConversation({ id: data.conversationId, token: data.visitorToken });
        startPolling();
      }
      updateStatus(data.mode);
      const remainingDelay = Math.max(0, config.minResponseMs - (Date.now() - startedAt));
      if (remainingDelay) await wait(remainingDelay);
      typing.remove();
      if (data.reply) {
        await revealAssistantMessage(data.reply, data.actions || []);
        state.history.push({ role: 'assistant', content: data.reply });
        state.history = state.history.slice(-config.maxHistory);
        saveHistory();
      } else if (data.mode === 'human') {
        addMessage('assistant', 'Ayden has joined this chat. Your message was sent to him.');
      }
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
  if (state.conversation) startPolling();
})();
