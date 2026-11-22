// Ember Court — tiny development server (Node 22, standard library only).
//
// Serves this repo's game/ folder on http://localhost:8080 so the game can
// be played in a desktop browser with no build step:
//     node serve.ts
//     # then open http://localhost:8080
//
// Pass --port <number> to listen on a different port. Only files inside
// game/ are ever served; anything else gets a 404 (or a 403 when the path
// tries to climb out of game/). Nothing is logged, cached or transformed.

import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// The folder to serve: game/ next to this file.
const gameRoot = resolve(fileURLToPath(new URL('./game', import.meta.url)));

// Pick the port: --port N on the command line, otherwise 8080.
const cliArgs = process.argv.slice(2);
const portFlag = cliArgs.indexOf('--port');
const wanted = portFlag === -1 ? 8080 : Number(cliArgs[portFlag + 1]);
const port = Number.isInteger(wanted) && wanted > 0 && wanted < 65536 ? wanted : 8080;

// Content types a browser game needs. Anything else is served as bytes.
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

createServer((request, response) => {
  const url = new URL(request.url ?? '/', 'http://localhost');
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    response.writeHead(400).end('bad request');
    return;
  }
  if (pathname.endsWith('/')) pathname += 'index.html';

  // Resolve inside game/ and refuse anything that escapes it.
  const file = resolve(join(gameRoot, normalize(pathname)));
  if (file !== gameRoot && !file.startsWith(gameRoot + sep)) {
    response.writeHead(403).end('forbidden');
    return;
  }

  let size;
  try {
    const stats = statSync(file);
    if (!stats.isFile()) throw new Error('not a file');
    size = stats.size;
  } catch {
    response.writeHead(404).end('not found');
    return;
  }

  response.writeHead(200, {
    'content-type': MIME_TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream',
    'content-length': size,
    'cache-control': 'no-store',
  });
  createReadStream(file).pipe(response);
}).listen(port, '127.0.0.1', () => {
  console.log('Ember Court game/ is on http://localhost:' + port);
});
