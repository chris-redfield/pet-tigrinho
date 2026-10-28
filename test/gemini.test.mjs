/* Run: node test/gemini.test.mjs */
import { SYSTEM_PROMPT, LIMITS, DEFAULT_MODEL, cleanHistory, buildRequest, extractReply, modelChain, isRetryable } from '../server/gemini.js';

let failed = 0;
const ok = (name, got, want) => {
  const pass = JSON.stringify(got) === JSON.stringify(want);
  if (!pass) failed++;
  console.log((pass ? 'PASS' : `FAIL got ${JSON.stringify(got)} want ${JSON.stringify(want)}`).padEnd(36), name);
};
const throws = (name, fn) => {
  let threw = false;
  try { fn(); } catch { threw = true; }
  ok(name, threw, true);
};

// --- the prompt carries the non-negotiables ---
ok('focus on Banco do Brasil', SYSTEM_PROMPT.includes('Banco do Brasil'), true);
ok('says no to bets', /cassinos online, bets e jogos de aposta NÃO são investimento/.test(SYSTEM_PROMPT), true);
ok('never recommends bets', SYSTEM_PROMPT.includes('NUNCA recomende bets'), true);
ok('points to help', SYSTEM_PROMPT.includes('188'), true);
ok('no invented rates', /NUNCA invente rentabilidades, taxas/.test(SYSTEM_PROMPT), true);

// --- history cleaning ---
throws('empty history rejected', () => cleanHistory([]));
throws('non-array rejected', () => cleanHistory('oi'));
throws('must end on user', () => cleanHistory([{ role: 'user', text: 'a' }, { role: 'model', text: 'b' }]));

const long = Array.from({ length: 30 }, (_, i) => ({ role: i % 2 ? 'model' : 'user', text: `m${i}` }));
long.push({ role: 'user', text: 'x'.repeat(5000) });
const cleaned = cleanHistory(long);
ok('keeps last N messages', cleaned.length, LIMITS.messages);
ok('caps message length', cleaned.at(-1).text.length, LIMITS.chars);
ok('unknown role becomes user', cleanHistory([{ role: 'system', text: 'oi' }])[0].role, 'user');
ok('drops blank messages', cleanHistory([{ role: 'model', text: '  ' }, { role: 'user', text: 'oi' }]).length, 1);

// --- request / response shapes ---
const body = buildRequest([{ role: 'user', text: 'Tenho R$ 100' }]);
ok('system prompt sent', body.systemInstruction.parts[0].text, SYSTEM_PROMPT);
ok('contents shape', body.contents, [{ role: 'user', parts: [{ text: 'Tenho R$ 100' }] }]);
ok('reply extracted', extractReply({ candidates: [{ content: { parts: [{ text: 'Oi ' }, { text: 'BB' }] } }] }), 'Oi BB');
ok('blocked reply is null', extractReply({ candidates: [{ finishReason: 'SAFETY' }] }), null);
ok('garbage is null', extractReply(null), null);
ok('thought parts skipped', extractReply({ candidates: [{ content: { parts: [{ text: 'hmm', thought: true }, { text: 'Oi' }] } }] }), 'Oi');
ok('budget leaves room past thinking', body.generationConfig.maxOutputTokens >= 4096, true);
ok('minimal thinking by default', body.generationConfig.thinkingConfig, { thinkingLevel: 'minimal' });
ok('3.8-flash thinks low', buildRequest([{ role: 'user', text: 'oi' }], 'gemini-3.8-flash').generationConfig.thinkingConfig, { thinkingLevel: 'low' });

// --- model fallback ---
ok('default chain starts at default', modelChain()[0], DEFAULT_MODEL);
ok('chain dedupes and trims', modelChain('a', [' b', 'a', '', 'c ']), ['a', 'b', 'c']);
ok('503 and 429 retry', [503, 429, 500].map(isRetryable), [true, true, true]);
ok('bad key does not retry', [400, 403, 404].map((s) => isRetryable(s, 'API key not valid')), [false, false, false]);
ok('thinking refusal moves on', isRetryable(400, 'Thinking level MINIMAL is not supported'), true);

console.log(failed ? `\n${failed} failing` : '\nall green');
process.exit(failed ? 1 : 0);
