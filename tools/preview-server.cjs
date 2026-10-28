const http = require('node:http');
const https = require('node:https');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const port = Number(process.env.YFA_PREVIEW_PORT || 4173);
const workerHost = 'yourfavalien-mothership.aydenmtz54.workers.dev';
const mime = {
  '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.json':'application/json; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg',
  '.webp':'image/webp', '.mp4':'video/mp4', '.mov':'video/quicktime', '.ttf':'font/ttf', '.ico':'image/x-icon'
};

function proxy(request, response, pathname) {
  const targetPath = pathname.replace(/^\/__mothership__/, '') + (new URL(request.url, 'http://preview').search || '');
  const upstream = https.request({ hostname: workerHost, path: targetPath, method: 'GET', headers: { 'User-Agent':'YourFavAlien-local-preview' } }, result => {
    const headers = { ...result.headers, 'cache-control':'no-store', 'access-control-allow-origin':'http://127.0.0.1:' + port };
    delete headers['content-security-policy'];
    response.writeHead(result.statusCode || 502, headers);
    result.pipe(response);
  });
  upstream.on('error', error => { response.writeHead(502, { 'content-type':'text/plain' }); response.end(`Preview proxy unavailable: ${error.message}`); });
  upstream.end();
}

http.createServer((request, response) => {
  const url = new URL(request.url, `http://127.0.0.1:${port}`);
  if (url.pathname.startsWith('/__mothership__/')) return proxy(request, response, url.pathname);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') pathname = '/redesign-preview.html';
  const file = path.resolve(root, `.${pathname}`);
  if (!file.startsWith(root)) { response.writeHead(403); return response.end('Forbidden'); }
  fs.readFile(file, (error, data) => {
    if (error) { response.writeHead(404); return response.end('Not found'); }
    response.writeHead(200, { 'content-type': mime[path.extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control':'no-store' });
    response.end(data);
  });
}).listen(port, '127.0.0.1', () => {
  console.log(`YourFavAlien protected preview: http://127.0.0.1:${port}/redesign-preview.html?skip-intro=1`);
});
