/**
 * Dev server: serves the game and proxies the finance chat and the
 * meal/photo checks to Gemini.
 *
 * Zero dependencies, Node 20.12+. The Gemini API key lives only here (read
 * from .env), never in the browser - anything shipped to the page can be
 * read by anyone who opens DevTools.
 *
 *   node server.js            -> http://localhost:8000
 */

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { API_BASE, buildRequest, cleanHistory, extractReply, isRetryable, modelChain } from './server/gemini.js';
import { MAX_IMAGE_CHARS, buildVisionRequest, cleanVision, extractVision } from './server/vision.js';

try { process.loadEnvFile(); } catch { /* no .env: the chat reports it is not configured */ }

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)));
const PORT = Number(process.env.PORT) || 8000;
const API_KEY = process.env.GEMINI_API_KEY || '';
/** GEMINI_MODEL first, then GEMINI_FALLBACK_MODELS (comma separated) or the built-in fallbacks. */
const MODELS = modelChain(process.env.GEMINI_MODEL || undefined,
  process.env.GEMINI_FALLBACK_MODELS ? process.env.GEMINI_FALLBACK_MODELS.split(',') : undefined);
/** Per model; the whole chain still answers inside the browser's patience. */
const ATTEMPT_MS = 20_000;
/** Behind a host's proxy (Render, Railway...) every request comes from the proxy's IP. */
const TRUST_PROXY = process.env.TRUST_PROXY === '1';
/** Chat and image requests allowed per day across all players - a hard stop on API spend. */
const DAILY_LIMIT = Number(process.env.DAILY_LIMIT) || 300;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

/** Never served, even if someone asks for them by name. */
const PRIVATE = /(^|[\\/])(\.env|\.git|server\.js$|server[\\/])/;

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

async function serveStatic(req, res) {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const rel = normalize(path === '/' ? '/index.html' : path).replace(/^([\\/])+/, '');
  const file = join(ROOT, rel);
  if (!file.startsWith(ROOT) || PRIVATE.test(rel)) return send(res, 404, 'Not found', 'text/plain');
  try {
    if (!(await stat(file)).isFile()) throw new Error('not a file');
    send(res, 200, await readFile(file), TYPES[extname(file).toLowerCase()] || 'application/octet-stream');
  } catch {
    send(res, 404, 'Not found', 'text/plain');
  }
}

/** A small per-IP limit so a stuck client cannot burn the API quota. */
const hits = new Map();
function rateLimited(ip, perMinute = 15) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > perMinute;
}

function clientIp(req) {
  const forwarded = TRUST_PROXY && String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req.socket.remoteAddress;
}

let day = { date: '', count: 0 };
function dailyCapReached() {
  const today = new Date().toISOString().slice(0, 10);
  if (day.date !== today) day = { date: today, count: 0 };
  day.count += 1;
  return day.count > DAILY_LIMIT;
}

async function readJson(req, maxBytes = 32_000) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) throw new Error('Mensagem grande demais.');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

async function financeChat(req, res) {
  if (!API_KEY) {
    return send(res, 503, { error: 'A IA ainda não foi configurada. Veja docs/gemini.md.' });
  }
  if (rateLimited(clientIp(req))) {
    return send(res, 429, { error: 'Muitas perguntas seguidas. Espere um minuto.' });
  }
  if (dailyCapReached()) {
    return send(res, 429, { error: 'O chat atingiu o limite de hoje. Volte amanhã!' });
  }

  let history;
  try {
    history = cleanHistory((await readJson(req)).messages);
  } catch (err) {
    return send(res, 400, { error: err.message || 'Pedido inválido.' });
  }

  const out = await askGemini('chat', (model) => buildRequest(history, model), extractReply);
  send(res, out.status, out.value ? { reply: out.value } : { error: out.error });
}

/** Meal and photo checks: one image in, a validated JSON answer out. */
async function visionCheck(req, res) {
  if (!API_KEY) {
    return send(res, 503, { error: 'A IA ainda não foi configurada. Veja docs/gemini.md.' });
  }
  if (rateLimited(clientIp(req), 10)) {
    return send(res, 429, { error: 'Muitas fotos seguidas. Espere um minuto.' });
  }
  if (dailyCapReached()) {
    return send(res, 429, { error: 'A IA atingiu o limite de hoje. Volte amanhã!' });
  }

  let input;
  try {
    input = cleanVision(await readJson(req, MAX_IMAGE_CHARS + 1_000));
  } catch (err) {
    return send(res, 400, { error: err.message || 'Pedido inválido.' });
  }

  const out = await askGemini(input.kind, (model) => buildVisionRequest(input, model),
    (json) => extractVision(input.kind, json));
  send(res, out.status, out.value ? { result: out.value } : { error: out.error });
}

/**
 * Runs one request down the model chain: an overloaded, rate-limited or
 * slow model hands over to the next. `extract` turns the response into the
 * value to return, or null when it is unusable (that also moves on).
 *
 * @returns {Promise<{status: number, value?: unknown, error?: string}>}
 */
async function askGemini(tag, build, extract) {
  let timedOut = false;

  for (const model of MODELS) {
    const started = Date.now();
    try {
      const upstream = await fetch(`${API_BASE}/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
        body: JSON.stringify(build(model)),
        signal: AbortSignal.timeout(ATTEMPT_MS),
      });
      const json = await upstream.json().catch(() => null);
      if (!upstream.ok) {
        console.error(`[gemini] ${tag} ${model} ${upstream.status}: ${json?.error?.message}`);
        if (isRetryable(upstream.status, json?.error?.message)) continue;
        return { status: 502, error: 'A IA não respondeu agora. Tente de novo em instantes.' };
      }
      const value = extract(json);
      if (value == null) {
        console.error(`[gemini] ${tag} ${model} sem resposta válida (${json?.candidates?.[0]?.finishReason})`);
        continue;
      }
      console.log(`[gemini] ${tag} ${model} respondeu em ${Date.now() - started}ms`);
      return { status: 200, value };
    } catch (err) {
      timedOut ||= err.name === 'TimeoutError';
      console.error(`[gemini] ${tag} ${model} ${err.name} após ${Date.now() - started}ms`);
    }
  }

  return {
    status: timedOut ? 504 : 503,
    error: timedOut
      ? 'A IA demorou demais. Tente de novo.'
      : 'A IA está sobrecarregada agora. Tente de novo em alguns instantes.',
  };
}

const server = createServer((req, res) => {
  if (req.url === '/api/finance' && req.method === 'POST') return financeChat(req, res);
  if (req.url === '/api/vision' && req.method === 'POST') return visionCheck(req, res);
  if (req.method === 'GET' || req.method === 'HEAD') return serveStatic(req, res);
  send(res, 405, 'Method not allowed', 'text/plain');
});

server.on('error', (err) => {
  if (err.code !== 'EADDRINUSE') throw err;
  console.error(`[pet-tigrinho] A porta ${PORT} já está em uso (outro servidor aberto?).`);
  console.error('  Feche o outro servidor ou use outra porta, por exemplo PORT=8001 no .env.');
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`[pet-tigrinho] http://localhost:${PORT}`);
  console.log(API_KEY ? `[gemini] modelos: ${MODELS.join(' → ')}` : '[gemini] sem GEMINI_API_KEY: chat de finanças desativado');
});
