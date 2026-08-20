// Minimal static file server for the built SPA (./dist). Used instead of
// nginx so the runtime image can be genuinely distroless — no shell, no
// package manager to install or configure a real web server with. Only
// depends on Node's built-in http/fs/path modules.
//
// Falls back to index.html for any path that isn't a real file, so
// client-side routes (React Router — e.g. /profil/12) resolve correctly
// on a hard refresh instead of 404ing.
import http from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

// fileURLToPath (not the raw .pathname) so this is a real, decoded,
// natively-separated filesystem path — a file:// URL's .pathname is
// percent-encoded and always forward-slash, which silently breaks
// path.join/startsWith comparisons on Windows and is fragile in general.
const ROOT = fileURLToPath(new URL('./dist', import.meta.url));
const PORT = process.env.PORT || 8080;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

http.createServer((req, res) => {
  const urlPath = normalize(decodeURIComponent(req.url.split('?')[0]));
  let filePath = join(ROOT, urlPath);

  // Guard against path traversal (e.g. /../../etc/passwd) escaping ROOT.
  // path.relative + checking for a leading '..' (rather than a string
  // startsWith(ROOT) check) also correctly rejects a sibling directory
  // that merely shares ROOT as a string prefix, e.g. /app/dist-evil.
  const rel = relative(ROOT, filePath);
  if (rel.startsWith('..') || isAbsolute(rel)) {
    res.writeHead(400);
    res.end('Bad request');
    return;
  }

  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    filePath = join(ROOT, 'index.html');
  }

  res.writeHead(200, { 'Content-Type': MIME_TYPES[extname(filePath)] || 'application/octet-stream' });
  createReadStream(filePath).pipe(res);
}).listen(PORT, '0.0.0.0', () => {
  console.log(`Serving ${ROOT} on port ${PORT}`);
});
