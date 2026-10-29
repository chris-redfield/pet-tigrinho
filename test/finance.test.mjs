/* Run: node test/finance.test.mjs */
import { parseAmount, offlineReply } from '../src/js/finance-offline.js';

let failed = 0;
const ok = (name, got, want) => {
  const pass = JSON.stringify(got) === JSON.stringify(want);
  if (!pass) failed++;
  console.log((pass ? 'PASS' : `FAIL got ${JSON.stringify(got)} want ${JSON.stringify(want)}`).padEnd(36), name);
};

// --- amounts, written the Brazilian way ---
ok('plain number', parseAmount('tenho 500'), 500);
ok('R$ with thousands dot', parseAmount('Tenho R$ 1.000. Onde posso investir?'), 1000);
ok('cents with comma', parseAmount('R$ 1.500,50'), 1500.5);
ok('mil', parseAmount('uns 5 mil'), 5000);
ok('decimal mil', parseAmount('1.5 mil'), 1500);
ok('k', parseAmount('2k'), 2000);
ok('reais', parseAmount('300 reais'), 300);
ok('no number', parseAmount('onde invisto?'), null);

// --- replies: right band, always the reminder, never a rate ---
const has = (text, part) => text.includes(part);
ok('no amount asks for one', has(offlineReply('oi'), 'Me conta um valor'), true);
ok('small amount: start', has(offlineReply('tenho R$ 100'), 'começar'), true);
ok('mid amount: reserve', has(offlineReply('tenho R$ 500'), 'reserva de emergência'), true);
ok('1.000 band: LCI/LCA', has(offlineReply('Tenho R$ 1.000. Onde posso investir?'), 'LCI ou LCA'), true);
ok('5.000 band: carteira', has(offlineReply('Tenho R$ 5.000.'), 'carteira'), true);
ok('names the amount', has(offlineReply('tenho 500'), 'R$'), true);
ok('bets get the bet answer', has(offlineReply('vale a pena apostar no tigrinho?'), 'Aposta não é investimento'), true);
for (const q of ['oi', 'tenho 50', 'tenho 500', 'tenho 2000', 'tenho 10 mil']) {
  ok(`reminder: ${q}`, has(offlineReply(q), 'não são investimento'), true);
  ok(`no percentages: ${q}`, /\d\s*%/.test(offlineReply(q)), false);
}

console.log(failed ? `\n${failed} failing` : '\nall green');
process.exit(failed ? 1 : 0);
