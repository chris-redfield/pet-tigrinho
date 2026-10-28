# Handoff — 2026-10-27

What happened in this session, what is still open, and the things that are
easy to trip over. The README covers how the game works; this file is only
what the README does not say. Delete it once it stops being useful.

Last commit at the time of writing: `a3a8499` on `feature/dev-chris`.

## Where things stand

- **Evolution tree:** cut from Erick's 52 forms to 5 lines / 14 forms. All
  14 have a sprite.
- **Home screen:** icon buttons in a left column, drifting diamond floor,
  tap the pet to evolve (aura + rising stars while it waits).
- **Steps:** counted live from the accelerometer in the Passos sheet.
- **Dev mode:** `?dev=1` shows a button that jumps one level.
- **Deploy:** GitHub Pages, published from `main` →
  <https://chris-redfield.github.io/pet-tigrinho/>.
- **Tested on a real phone:** yes, on an iPhone — camera and step counter
  work. Android not tested yet.

## Decisions and why

These were discussed and settled; worth knowing before changing them.

- **Five lines, chosen to look as different as possible.** Cosmic (the
  original Tigrinho → Tigre Cósmico, its art already existed), Fire/Metal,
  Water, Ice and Grass. Light and Shadow were dropped as too close to Cosmic.
- **Tigre d'Água is the Azul egg's starter**, not a mid stage (the team
  sees it as "the water Brasinha"). Gotigre was removed. Oceaniger, an Épico
  in Erick's catalog, became the water line's Raro.
- **Water and Ice share the Azul egg** and split at Nv 16 by stats. That
  keeps 4 eggs and keeps Erick's stat-driven branching in one place. The
  other eggs evolve straight.
- **Thresholds were lowered on purpose** (Água: Felicidade ≥ 70%; Gelo:
  Sabedoria ≥ 60% and Saúde ≥ 60%) — "if it is too hard, people will never
  see these things". The first numbers (90 / 70 / 80) were Erick's.
- **"Largest margin wins"** replaced "most demanding wins": with the easier
  thresholds most players meet both, and the old rule made Ice win almost
  every time.
- **XP per level cut by 60%** (`LEVEL_STEP` 15 → 6) — the team found
  levelling too slow for a demo.
- **Evolving waits for a tap.** The team liked it as a moment. Branch is
  decided at the tap, not when the level is reached.
- **Icon buttons keep "+N XP" on their face** even though the sketch was
  icon-only — design rule: the payout must be visible before acting.
- **Ready-to-evolve look = "combo 2"** (aura + sparkles) from
  `dev/aura-lab.html`. The lab is kept on purpose so others can try
  alternatives.
- **Floor drift:** tile rounded to whole pixels and 4s per tile. Slower or
  fractional tiles looked janky (stepping, and a jump on every loop).

## Open items

### Waiting on the team

- **The rest of the home-screen sketch** (`reference.jpeg`, not committed).
  Needs answers before building:
  - "Investir" with a money counter — careful: the design rules forbid
    losable currency, and "investing" can rebuild the gambling loop.
  - "Diamantes de conhecimento" — earn-only would fit the rules.
  - The 1 / 2 / 3 boxes at the bottom — slots? pages?
  - "Inclusão de certificado p/ ganhar XP" — uploading a course certificate?
  - "Água" button — a new action (drinking water) or part of Refeição?
- **Action icons** are not generated yet; buttons use the built-in gold
  SVGs until they are. Prompts below.

### Small fixes agreed for later

- `favicon.ico` 404 on Pages — add an icon.
- `index.html` preloads `assets/pet/tigrin.webp`, which is wasted (and warns
  in the console) whenever the pet is another form. Remove or make it
  dynamic.

### Ideas offered, not decided

- Toast after logging shows the stat too, e.g. "+10 XP · Felicidade +7%".
  One photo moves Felicidade ~7%, which is easy to miss (it confused us once).
- Steps pay 10 XP per 1.000, so a live-counted demo walk earns almost
  nothing (100 steps = 1 XP). Consider a better rate if steps are demoed.
- Estreliger is still mostly orange, so the jump to the navy/purple Tigre
  Cósmico is big. A follow-up image prompt ("make more of the fur deep navy
  blue, keep orange only on the head and chest") would smooth the line.
- Tigre-Leviatã and Tigre-Yggdrasil are wide, horizontal poses — check they
  read well at their default `scale` (84) and override in `forms.js` if not.

### Known rough edges

- The dev level-up button grants XP only and fills no status bar, so the
  Azul egg's branch is decided by whatever real actions were logged. Log
  photos (→ Oceaniger) or reading + steps (→ Neviger) first when testing.
- Old saves holding a removed form are moved onto their egg's line by XP
  depth (`retireForm` in `state.js`), taking the first branch where there is
  one.
- The step detector's thresholds (`RISE` 1.0 m/s², 300 ms between steps)
  were tuned on synthetic signals and confirmed on an iPhone. If they need
  tuning on other phones, the tests in `test/pedometer.test.mjs` say what
  must keep passing.

## Action icon prompts (ChatGPT web)

Same workflow as the pet sprites. Save as `assets/source/icons/<action>.png`
and run `python3 tools/sprites.py`.

First the camera, attaching `assets/source/tigrin.png` for the style:

```text
Create a game UI icon of a cute camera, for a mobile pet game. Use the
art style of the attached image: Pokémon style, clean bold dark outlines,
bright cel shading, cute and kawaii. Keep it synthetic: low detail, flat
shading, simple bold shapes that are readable at a very small size.

Colors: mostly warm gold and cream, with a few small touches of red and
teal, so it stands out on a dark red button.

Only the camera, centered, seen from the front, filling most of the
image. Transparent background, no shadow, no text, no frame, no button
shape behind it.
```

Then the other four, one at a time, attaching the finished camera icon:

```text
Create another icon for the same set as the attached camera icon: same
art style, same outline thickness, same colors, same level of detail,
same size and framing. Transparent background, no text, no frame.

The icon is: <ITEM>
```

| File | `<ITEM>` |
|---|---|
| `photo.png` | (the camera above) |
| `steps.png` | a cute sneaker, side view, with two little motion lines |
| `book.png` | a cute open book, seen from the front |
| `course.png` | a cute graduation cap with a gold tassel |
| `meal.png` | a cute bowl of food with a pair of chopsticks, a little steam on top |

## Gotchas

- **A new JS file must be committed with the change that imports it.** The
  app is plain ES modules: one missing import (a 404) stops the whole game
  from loading, not just that feature.
- **Pages serves `main`.** A change on a feature branch is not live until
  merged. After merging, hard-refresh (Ctrl+Shift+R) if the old CSS sticks.
- **Sprite and icon file names must equal the ids** exactly (`mechatigre`,
  not `mecha-tigre`; `tigre-leviata`, no accent), or `sprites.py` ignores
  them. `src/js/sprites.js` is generated — never edit it by hand.
- **The step sensor needs HTTPS.** `http://<pc-ip>:8000` on a phone shows
  the camera but silently blocks motion events. Use the Pages URL.
- **Recent Chrome has `DeviceMotionEvent.requestPermission`** (it used to be
  iOS-only) and may answer `'prompt'` instead of `'granted'`. The pedometer
  only treats an explicit `'denied'` as a refusal and lets a 1.5s watchdog
  detect "no sensor" — keep it that way.
- **Sensor tests need real timing.** Synthetic `devicemotion` events fired
  in a tight loop all share one timestamp, and the 300 ms gap rule then
  counts a single step. Dispatch them in real time.
