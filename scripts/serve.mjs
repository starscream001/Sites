import http from 'node:http';
import { readFile } from 'node:fs/promises';
const files = { '/': ['index.html', 'text/html'], '/index.html': ['index.html', 'text/html'], '/styles.css': ['styles.css', 'text/css'], '/app.js': ['app.js', 'text/javascript'], '/schedule.js': ['schedule.js', 'text/javascript'], '/schedule-data.js': ['schedule-data.js', 'text/javascript'], '/favicon.svg': ['favicon.svg', 'image/svg+xml'] };
http.createServer(async (req, res) => {
  const file = files[new URL(req.url, 'http://localhost').pathname];
  if (!file) { res.writeHead(404); res.end('Не найдено'); return; }
  try { const body = await readFile(file[0]); res.writeHead(200, { 'Content-Type': `${file[1]}; charset=utf-8`, 'Cache-Control': 'no-store' }); res.end(body); }
  catch { res.writeHead(500); res.end('Не удалось загрузить страницу'); }
}).listen(5173, '127.0.0.1', () => console.log('Local: http://127.0.0.1:5173'));
