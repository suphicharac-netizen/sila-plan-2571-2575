import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, 'dist');

// Ensure production build exists
if (!fs.existsSync(path.join(distDir, 'index.html'))) {
  console.log('[Server] dist/index.html not found, running npm run build...');
  try {
    execSync('npm run build', { stdio: 'inherit', cwd: __dirname });
    console.log('[Server] Build completed successfully.');
  } catch (err) {
    console.error('[Server] Build failed:', err);
  }
}

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

function requestHandler(req: http.IncomingMessage, res: http.ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const rawUrl = req.url || '/';
  const urlPath = rawUrl.split('?')[0];

  // Health check endpoints
  if (urlPath === '/health' || urlPath === '/healthz' || urlPath === '/_health') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('OK');
    return;
  }

  let safePath = path.normalize(urlPath).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '') {
    safePath = '/index.html';
  }

  const filePath = path.join(distDir, safePath);

  if (!filePath.startsWith(distDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const isImmutable = safePath.startsWith('/assets/') || safePath.startsWith('/images/');

      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': stats.size,
        'Cache-Control': isImmutable ? 'public, max-age=31536000, immutable' : 'no-cache',
      });

      fs.createReadStream(filePath).pipe(res);
      return;
    }

    // SPA fallback: return index.html for client-side routing
    const indexPath = path.join(distDir, 'index.html');
    fs.readFile(indexPath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Error loading index.html');
        return;
      }
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache',
      });
      res.end(content);
    });
  });
}

const targetPorts = new Set<number>();
const defaultPort = parseInt(process.env.DEFAULT_APP_PORT || '3000', 10);
targetPorts.add(defaultPort);

if (process.env.PORT) {
  const envPort = parseInt(process.env.PORT, 10);
  if (!isNaN(envPort)) {
    targetPorts.add(envPort);
  }
}

for (const port of targetPorts) {
  const server = http.createServer(requestHandler);
  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`[Server] Port ${port} is already in use, skipping.`);
    } else {
      console.error(`[Server] Error on port ${port}:`, err);
    }
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`[Server] Serving production build on http://0.0.0.0:${port}`);
  });

  process.on('SIGINT', () => server.close());
  process.on('SIGTERM', () => server.close());
}
