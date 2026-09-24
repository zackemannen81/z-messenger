import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';

const root = fileURLToPath(new URL('.', import.meta.url));
const publicDir = join(root, 'public');
const usernamePattern = /^[\p{L}\p{N}][\p{L}\p{N} _.-]{1,23}$/u;
const mimeTypes = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml' };

function frame(type, payload) { return { type, payload, timestamp: Date.now() }; }
const maxAttachmentBytes = 6 * 1024 * 1024;
const attachmentNamePattern = /^[^\\/:*?"<>|\u0000-\u001f]{1,120}$/;
function validText(value) { return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 2000; }
function validAttachment(value) {
  if (value === undefined) return null;
  if (!value || typeof value !== 'object' || typeof value.name !== 'string' || !attachmentNamePattern.test(value.name.trim()) || typeof value.type !== 'string' || !/^[a-z]+\/[a-z0-9.+-]+$/i.test(value.type) || typeof value.data !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(value.data)) return false;
  const data = value.data.replace(/=+$/, '');
  if (data.length === 0 || Math.floor(data.length * 3 / 4) > maxAttachmentBytes) return false;
  return { name: value.name.trim(), type: value.type.toLowerCase(), data: value.data };
}

export function createMessengerServer() {
  const sessions = new Map();
  const send = (ws, message) => { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message)); };
  const error = (ws, message) => send(ws, frame('ERROR', { message }));
  const broadcast = (message, except) => sessions.forEach((_, ws) => { if (ws !== except) send(ws, message); });
  const names = () => [...sessions.values()].sort((a, b) => a.localeCompare(b));

  const httpServer = createServer(async (req, res) => {
    if (req.method !== 'GET') { res.writeHead(405); return res.end(); }
    const pathname = req.url === '/' ? 'index.html' : decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
    const filename = normalize(join(publicDir, pathname));
    if (!filename.startsWith(publicDir)) { res.writeHead(403); return res.end(); }
    try { const content = await readFile(filename); res.writeHead(200, { 'Content-Type': mimeTypes[extname(filename)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); res.end(content); }
    catch { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Not found'); }
  });
  const wss = new WebSocketServer({ server: httpServer, maxPayload: Math.ceil(maxAttachmentBytes * 1.5) });
  wss.on('connection', (ws) => {
    ws.on('message', (raw) => {
      let data;
      try { data = JSON.parse(raw.toString()); } catch { return error(ws, 'Invalid JSON format.'); }
      if (!data || typeof data !== 'object' || typeof data.type !== 'string' || !data.payload || typeof data.payload !== 'object') return error(ws, 'Invalid message frame.');
      const user = sessions.get(ws);
      if (data.type === 'JOIN') {
        if (user) return error(ws, 'This connection has already joined.');
        const username = typeof data.payload.username === 'string' ? data.payload.username.trim() : '';
        if (!usernamePattern.test(username)) return error(ws, 'Choose 2–24 letters, numbers, spaces, dots, hyphens, or underscores.');
        if (names().some((name) => name.toLocaleLowerCase() === username.toLocaleLowerCase())) return error(ws, 'That username is already online.');
        sessions.set(ws, username);
        send(ws, frame('JOIN_ACK', { status: 'SUCCESS', username }));
        send(ws, frame('USER_LIST', { users: names() }));
        broadcast(frame('USER_JOINED', { username }), ws);
        return;
      }
      if (!user) return error(ws, 'Join before sending messages.');
      if (data.type === 'CHAT_MESSAGE') {
        const text = typeof data.payload.text === 'string' ? data.payload.text.trim() : '';
        const attachment = validAttachment(data.payload.attachment);
        const recipient = typeof data.payload.recipient === 'string' ? data.payload.recipient : 'ALL';
        if (attachment === false) return error(ws, 'Attachments must be valid files no larger than 6 MiB.');
        if (!validText(text) && !attachment) return error(ws, 'Messages must contain text or an attachment.');
        if (text && !validText(text)) return error(ws, 'Messages can contain up to 2,000 characters.');
        const message = frame('CHAT_MESSAGE', { sender: user, recipient, text, ...(attachment ? { attachment } : {}) });
        if (recipient === 'ALL') return broadcast(message);
        const target = [...sessions].find(([, name]) => name === recipient);
        if (!target) return error(ws, `${recipient} is no longer online.`);
        send(target[0], message);
        if (target[0] !== ws) send(ws, message);
        return;
      }
      if (data.type === 'NUDGE') { broadcast(frame('NUDGE', { sender: user })); return; }
      error(ws, 'Unknown action type.');
    });
    ws.on('close', () => { const username = sessions.get(ws); if (username) { sessions.delete(ws); broadcast(frame('USER_LEFT', { username })); } });
  });
  return { httpServer, wss, listen: (port = 8080) => new Promise((resolve) => httpServer.listen(port, resolve)), close: () => new Promise((resolve, reject) => { wss.clients.forEach((client) => client.terminate()); wss.close((err) => httpServer.close(() => err ? reject(err) : resolve())); }) };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const app = createMessengerServer();
  app.listen(Number(process.env.PORT) || 8080).then(() => console.log('z-messenger running at http://localhost:8080'));
}