/* Run: node test/pedometer.test.mjs */
import { createStepDetector } from '../src/js/pedometer.js';

let failed = 0;
const ok = (name, got, pass) => {
  if (!pass) failed++;
  console.log((pass ? 'PASS' : `FAIL got ${JSON.stringify(got)}`).padEnd(36), name);
};

// Deterministic noise, so the test never flakes.
let seed = 7;
const noise = (amp) => { seed = (seed * 16807) % 2147483647; return ((seed / 2147483647) * 2 - 1) * amp; };

/** Counts steps over `seconds` of a 60 Hz signal: gravity + a bounce at `hz` + noise. */
function count({ hz, amp, seconds = 20, jitter = 0.25 }) {
  const detect = createStepDetector();
  let steps = 0;
  for (let i = 0; i < seconds * 60; i++) {
    const t = i / 60;
    const bounce = hz ? amp * Math.max(0, Math.sin(2 * Math.PI * hz * t)) ** 1.5 : 0;
    if (detect(9.81 + bounce + noise(jitter), t * 1000)) steps++;
  }
  return steps;
}

const near = (got, want, tol = 0.1) => Math.abs(got - want) <= want * tol;

let n;
n = count({ hz: 2, amp: 3.5 });
ok('walking 2 steps/s, 20s ~ 40 steps', n, near(n, 40));
n = count({ hz: 1.5, amp: 2.2 });
ok('slow walk 1.5 steps/s ~ 30 steps', n, near(n, 30));
n = count({ hz: 2.8, amp: 7 });
ok('running 2.8 steps/s ~ 56 steps', n, near(n, 56));
n = count({ hz: 0, amp: 0 });
ok('phone at rest counts nothing', n, n === 0);
n = count({ hz: 0, amp: 0, jitter: 0.6 });
ok('shaky hand, no steps, counts nothing', n, n === 0);
n = count({ hz: 1, amp: 0.5 });
ok('gentle sway is not walking', n, n === 0);

console.log(failed ? `\n${failed} failing` : '\nall green');
process.exit(failed ? 1 : 0);
