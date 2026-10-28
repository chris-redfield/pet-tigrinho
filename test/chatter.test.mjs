/* Run: node test/chatter.test.mjs */
import { createChatter, reminder, CHATTER, REMINDERS, ALL_DONE, TAP_LINES, IDLE_LINES, EMOJIS } from '../src/js/chatter.js';

let failed = 0;
const ok = (name, got, want) => {
  const pass = JSON.stringify(got) === JSON.stringify(want);
  if (!pass) failed++;
  console.log((pass ? 'PASS' : `FAIL got ${JSON.stringify(got)} want ${JSON.stringify(want)}`).padEnd(36), name);
};

// A controllable clock and a scripted "random" sequence.
let t = 0;
const now = () => t;
const script = (values) => { let i = 0; return () => values[i++ % values.length]; };

// --- taps: only sometimes, and never back to back ---
let c = createChatter({ now, rand: script([0.9]) });
ok('high roll: no line, just hearts', c.onTap(), null);

c = createChatter({ now, rand: script([0.1, 0.1, 0]) });
const first = c.onTap();
ok('low roll speaks', TAP_LINES.includes(first), true);
t += CHATTER.tapCooldown - 1;
ok('inside cooldown stays quiet', c.onTap(), null);
t += 1;
ok('after cooldown may speak again', c.onTap() !== null, true);

c = createChatter({ now, rand: script([0.1, 0.9, 0]) });
t += CHATTER.tapCooldown;
ok('some tap lines are emojis', EMOJIS.includes(c.onTap()), true);

// --- idle remarks: spaced out and capped per visit ---
c = createChatter({ now, rand: script([0.5]) });
ok('first idle after 25 s', c.nextIdleDelay(), CHATTER.idleFirst);
c.onIdle(() => 0, () => 1);
const gap = c.nextIdleDelay();
ok('later idles 90-150 s apart', gap >= CHATTER.idleMin && gap <= CHATTER.idleMax, true);
for (let i = 1; i < CHATTER.idleMaxPerVisit; i++) c.onIdle(() => 0, () => 1);
ok('stops after the visit cap', c.nextIdleDelay(), null);

// --- reminders: invitations for untouched actions, rest when done ---
const none = () => 0;
ok('all capped says rest', reminder(none, () => 0), ALL_DONE);
ok('nothing untouched: no nag', reminder(() => 1, () => 1), null);
const onlyBook = (type) => (type === 'book' ? 0 : 1);
ok('names an untouched action', reminder(onlyBook, () => 1, () => 0), REMINDERS.book);
ok('reminders carry no guilt', Object.values(REMINDERS).some((r) => /fome|triste|sozinho|abandon/i.test(r)), false);

c = createChatter({ now, rand: script([0.1]) });
ok('idle prefers a reminder', c.onIdle(onlyBook, () => 1), REMINDERS.book);
ok('idle never answers a touch', IDLE_LINES.some((l) => /cócegas/i.test(l)), false);
c = createChatter({ now, rand: script([0.1, 0]) });   // no reminder applies: line vs emoji, then which line
ok('idle line without reminder', IDLE_LINES.includes(c.onIdle(() => 1, () => 1)), true);

console.log(failed ? `\n${failed} failing` : '\nall green');
process.exit(failed ? 1 : 0);
