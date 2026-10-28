/* Run: node test/vision.test.mjs */
import { cleanVision, buildVisionRequest, extractVision, PLACES, MAX_IMAGE_CHARS } from '../server/vision.js';
import { ACTIONS } from '../src/js/config.js';

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
const answer = (obj) => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(obj) }] } }] });

// --- input checks ---
const good = { kind: 'meal', mime: 'image/jpeg', image: 'aGVsbG8=' };
ok('valid input passes', cleanVision(good), good);
throws('unknown kind rejected', () => cleanVision({ ...good, kind: 'selfie' }));
throws('bad mime rejected', () => cleanVision({ ...good, mime: 'text/html' }));
throws('empty image rejected', () => cleanVision({ ...good, image: '' }));
throws('non-base64 rejected', () => cleanVision({ ...good, image: '<script>' }));
throws('huge image rejected', () => cleanVision({ ...good, image: 'A'.repeat(MAX_IMAGE_CHARS + 1) }));

// --- request: image inline, JSON answer, no creativity ---
const req = buildVisionRequest(good, 'gemini-3.6-flash');
ok('image sent inline', req.contents[0].parts[0].inlineData, { mimeType: 'image/jpeg', data: 'aGVsbG8=' });
ok('answers in JSON', req.generationConfig.responseMimeType, 'application/json');
ok('temperature 0', req.generationConfig.temperature, 0);
ok('photo schema lists the places', buildVisionRequest({ ...good, kind: 'photo' }).generationConfig.responseSchema.properties.place.enum, PLACES);

// --- answers are validated before they can pay ---
ok('food answer kept', extractVision('meal', answer({ isFood: true, label: 'arroz e feijão' })), { isFood: true, label: 'arroz e feijão' });
ok('not food kept', extractVision('meal', answer({ isFood: false, label: 'teclado' })).isFood, false);
ok('meal without boolean is null', extractVision('meal', answer({ isFood: 'sim' })), null);
ok('place answer kept', extractVision('photo', answer({ place: 'natureza', label: 'parque' })), { place: 'natureza', label: 'parque' });
ok('unknown place is null', extractVision('photo', answer({ place: 'cassino', label: 'x' })), null);
ok('chatty text is null', extractVision('meal', { candidates: [{ content: { parts: [{ text: 'Parece comida!' }] } }] }), null);
ok('empty response is null', extractVision('photo', {}), null);
ok('label is capped', extractVision('meal', answer({ isFood: true, label: 'x'.repeat(200) })).label.length, 60);

// --- every place the AI can name has a rate in the game ---
ok('places match the config', Object.keys(ACTIONS.photo.places), PLACES);
ok('going out pays more than home', ACTIONS.photo.places.natureza.xp > ACTIONS.photo.places.casa.xp, true);
ok('work pays more than home', ACTIONS.photo.places.trabalho.xp > ACTIONS.photo.places.casa.xp, true);

console.log(failed ? `\n${failed} failing` : '\nall green');
process.exit(failed ? 1 : 0);
