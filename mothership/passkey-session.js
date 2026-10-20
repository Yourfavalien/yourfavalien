(() => {
  const status = document.getElementById('status');
  const next = document.documentElement.dataset.next || '/mothership/admin.html';
  const message = (text, error) => { status.textContent = text; status.className = error ? 'error' : ''; };
  const component = document.querySelector('descope-wc');
  component.addEventListener('success', async event => {
    try {
      const token = event?.detail?.sessionJwt;
      if (!token) throw new Error('A secure Descope session was not returned.');
      message('Verifying Mothership access…');
      const response = await fetch('/mothership/api/auth/session', { method:'POST', credentials:'same-origin', cache:'no-store', headers:{ Authorization:`Bearer ${token}` } });
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'This account is not authorized for Mothership.');
      location.replace(next);
    } catch (error) { message(error.message || 'Could not complete sign-in.', true); }
  });
  component.addEventListener('error', () => message('Passkey authentication was not completed. Try again.', true));
})();
