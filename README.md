# Pet Tigrinho

Um bichinho que cresce com o que você faz na vida real.
Sem aposta, sem giro, sem perder nada.

A pet-raising game for people coming off gambling games — in Brazil, mostly
Fortune Tiger (*jogo do tigrinho*). The tiger comes out of the slot machine
and becomes something you look after. Real-world actions feed it; it evolves.

## Design rules (non-negotiable)

The audience is people whose reward circuitry has been trained by a slot
machine. The game must not re-train it.

- **No variable-ratio rewards.** Every action pays a flat, published rate.
  The XP is shown in each action's log sheet, opened by tapping it, and
  recomputed live there *before* the player commits. No roll, no range, no luck multiplier.
- **No spin, no reels, no near-miss.** Nothing resolves after a suspenseful
  delay, and nothing ever shows the player what they *almost* got.
- **No losable currency or streak.** Lifetime XP only goes up. There is
  nothing to watch drain away and no streak to break.
- **No decay, no guilt.** The pet is never hungry, sad, sick or dying. Come
  back after a month and it is exactly where you left it, pleased to see you.
- **Daily caps, on purpose.** Each action stops paying XP after a day's worth
  (see `cap` in `src/js/config.js`). Over the cap the activity is still
  recorded, it just stops paying. The game should say *that's enough for
  today* rather than reward a six-hour binge — compulsion transfer is a real
  risk with this audience.
- **The egg pick is a choice, not a draw.** Each egg always hatches the same
  pet, and its colour shows its type (Branco Normal, Vermelho Fogo, Azul
  Água, Verde Grama). Nothing is rolled: the same egg gives the same pet
  every time. A random pull is a loot box, which is the thing this game
  exists to be an alternative to.
- **Evolution branches are a choice too.** Which form the pet becomes is set
  by the status bars, by a published rule, and the info screen shows live
  which form it would take right now. Every branch asks for *high* stats —
  there is no path that rewards or depends on neglect.

### On the Fortune Tiger look

The palette quotes the slot deliberately — lacquer red, imperial gold, a bit
of jade, ornate gold-edged panels. Familiarity is the point: the player
should recognise the world they came from. It is pitched a few stops darker
and less saturated than the real thing, which screams by design.

What is borrowed: palette, frames, the tiger, the chunky gold signage type.

What is **not** borrowed, ever: the reel grid, the coin-shower payout, the
rising-pitch win jingle, flashing win frames, counters that spin up, "big
win" burst typography. Those are the conditioned triggers. The evolution
reveal is a calm Pokémon-style bloom for exactly this reason.

## The loop

1. **First run** — pick one of four eggs. Each always hatches the same pet:
   Branco → Tigrin (Normal), Vermelho → Brasinha (Fogo),
   Azul → Tigre d'Água (Água), Verde → Folhiger (Grama).
   The eggs are 3D (`src/js/ui/eggs3d.js`, built in code, no model files):
   they drop one after another onto a 2x2 grid with two soft bounces,
   sit on a soft shadow and spin on their axis with an idle wiggle. The
   first tap hatches one: it shakes, bursts into shell pieces with a flash
   and the pet pops out. The screen shows only the title; what each egg
   hatches is in its button label for screen readers. Reduced motion: the
   eggs fade in place and the hatch is a soft bloom. Without WebGL the
   flat SVG eggs are used.

   Right after the first hatch a short **tour** (`src/js/ui/tour.js`)
   opens: Tigrin walks through the pet, the action row, the XP bar, the
   coins, the profile, the Trilhas, Progresso and Finanças tabs and where
   help is, one spotlight at a time (11 steps, Voltar/Próximo, arrow keys, Esc or *Pular* to skip).
   It opens once (`onboarded` in the save; saves from before it count as
   seen) and can be replayed from Perfil > Informações. A step whose element
   is not on screen falls back to a centred card.
2. **Log real-world actions** — five of them, each a flat XP rate. On the
   home screen they sit in a row under the centred pet, always in view:
   five round icon buttons without panels. The XP is not printed under
   them, to keep the scene clean; tapping one opens its sheet, which shows
   the rate before anything is logged. Once an action is done for the day
   its button dims and shows "✓ hoje":

   | Action   | Rate                   | Daily cap   | Feeds      |
   |----------|------------------------|-------------|------------|
   | Foto     | +40 to +80 XP / photo  | 5 photos    | Felicidade |
   | Passos   | +40 XP / 1.000         | 15.000      | Saúde      |
   | Leitura  | +60 XP / 10 pages      | 100 pages   | Sabedoria  |
   | Estudo   | +80 XP / 30 min        | 180 min     | Sabedoria  |
   | Refeição | +40 XP / meal photo    | 4 meals     | Saciedade  |

   **Cadeira de rodas**: with *Uso cadeira de rodas* on (Acessibilidade),
   Passos becomes Cadeira de rodas everywhere (name, icon, sheet,
   trilhas, medals), counted in minutes: +40 XP / 10 min, 150 min a day.
   Minutes are saved as steps (1 min = 100), so the cap, trilhas and
   medals stay one scale (`actionCfg` in `src/js/ui/dom.js`).

   **Photos and meals are checked by the AI** (`server/vision.js`, route
   `/api/vision`). The photo is shrunk in the browser, sent once to Gemini
   and dropped; the game keeps nothing. The answer must match a fixed JSON
   schema or it pays nothing.
   - *Refeição* is a photo of the plate: it pays only when the AI sees real
     food (not a drawing, a screen or a closed package). If the AI cannot be
     reached, the meal pays the base +40 under a short compliment
     (`ACTIONS.meal.praise`), never an error.
   - *Foto* pays by where it was taken, from a published table shown in
     the sheet before the photo: Natureza or Lugar visitado +80, Trabalho
     +60, Casa or Outro +40 (`ACTIONS.photo.places`). Drawings, screenshots
     and photos of screens count as Outro. If the AI cannot be reached, the
     photo pays the base +40 under a short word of praise
     (`ACTIONS.photo.praise`), never an error. Same photo, same answer as far as the model
     allows (temperature 0); it is a rate table, not a draw.

3. **Level** — going from Nv L to L+1 costs `L × LEVEL_STEP` (6) XP, so
   Nv 16 is at 720 XP and Nv 36 at 3.780. A normal day lands near 600 XP
   and a maxed one ~2.200, so the first evolution comes on day two and the
   second in about a week. (The XP rates were raised 4× on 2026-10-28 so
   the first evolution comes quickly; levels were left as they were.)

   On the home screen the level is a round badge ("5") on the left end of
   the XP bar, and the bar is the way to the *next level*, with "into /
   span" (e.g. "12 / 42") in small print beneath. When a gain crosses a
   level, the bar fills up, starts over from empty and grows to the new
   level's share, and the badge pops.
4. **Evolve** — eight lines of three forms, Pokémon style, at Nv 16 and
   Nv 36. The tree (20 forms) is data in `src/js/forms.js`:

   | Egg      | Comum    | Raro (Nv 16)   | Lendário (Nv 36) |
   |----------|----------|----------------|------------------|
   | Branco   | Tigrin   | Estreliger     | Tigre Cósmico    |
   | Branco   | Tigrin   | Tigran         | Tigre Sábio      |
   | Vermelho | Brasinha | Tigre-Fornalha | Mechatigre       |
   | Vermelho | Brasinha | Vulcaniger     | Magmatígreo      |
   | Azul     | Tigre d'Água | Oceaniger  | Tigre-Leviatã    |
   | Azul     | Tigre d'Água | Neviger    | Tigre-Glacial    |
   | Verde    | Folhiger | Floriger       | Tigre-Yggdrasil  |
   | Verde    | Folhiger | Tigrelis       | Parasitigre      |

   Every egg branches at Nv 16. Tigrin becomes
   Estreliger, the explorer (Felicidade ≥ 50% and Saúde ≥ 50%: photos and
   steps), or Tigran, the scholar (Sabedoria ≥ 70%: reading and study).
   Brasinha becomes Tigre-Fornalha, the forge (Sabedoria ≥ 50% and
   Saciedade ≥ 50%: study and meals), or Vulcaniger, the eruption (Saúde ≥
   60%: steps). Folhiger becomes Floriger, the bloom (Felicidade ≥ 60%:
   photos), or Tigrelis, the fungus (Saciedade ≥ 60%: meals). Tigre d'Água
   becomes Oceaniger (Felicidade ≥ 70%) or Neviger (Sabedoria ≥ 60% and
   Saúde ≥ 60%). Rule
   (`pickBranch` in `src/js/state.js`): each route's *margin* is how far
   its weakest required bar is above (or below) its requirement, and the
   largest margin wins. So if only one route is met, it wins; if both are
   met, the one cleared by more wins (it follows what the player focused
   on, not the harder route); if neither is met, the closest wins. Ties go
   to the first listed.

   Reaching the level evolves the pet by itself (`autoEvolve` in
   `src/js/ui/home.js`): after a short pause that lets the XP bar finish
   filling, the branch is decided by the rule above and the reveal plays.
   The reveal is rich but not a payout: the old form alternates with a
   white silhouette (at most ~2 times a second, under the WCAG 2.3.1
   limit of 3), one soft bloom swaps in the new form, light rays turn
   slowly and a ring of stars drifts out once. No coin shower, strobe,
   jingle or counter. The info screen shows the branch in advance, so the
   outcome is never a surprise draw. Glow looks can still be compared in
   `dev/aura-lab.html`.

5. **Status bars** measure the current *phase* (since the last evolution):
   XP earned from the bar's source actions as a share of `share × phase
   span`. Inside a phase they only fill — no hunger timer, no decay, no red
   low state. Evolving starts a new phase and they start over, like the XP
   bar does. The shares add up to more than 1, so you cannot max every bar
   in one phase: what you focus on picks the branch where there is one.
6. **Pet reactions** — tapping the pet pets it: it sinks under the hand,
   leans toward the tap, wiggles and glows warm for a moment (under
   reduced motion, a small squeeze and the glow only). Each tap also
   sends up one heart in one of three sizes and sometimes a speech bubble
   (`src/js/chatter.js`).
   While the home screen is open the pet speaks now and then: first after
   25 s, then every 90-150 s, at most 4 times per visit, mostly a gentle
   invitation to an action not done today, and *rest* once every action is
   capped. Never guilt, never hunger. A tap pays nothing, so the random
   choice of hearts and words is not a draw.

   An action that pays XP gets a celebration (`src/js/ui/petfx.js`): the
   pet hops, the fixed `+N XP` the button already showed rises from it,
   golden orbs fly into the XP bar and the bar answers with a glow, a
   bounce and a shine. No number counts up. Under reduced motion only the
   static parts remain.

7. **Pet info** — the ⓘ button opens name (tap to rename), level, type,
   rarity, the status bars and the next-evolution preview. Rarity is earned
   by evolving, never drawn. The preview shows the form the pet is heading
   for as a black silhouette until it has been discovered; its name and
   rule stay visible, so the branch is still never a surprise.

   **Enciclopédia** (`src/js/ui/encyclopedia.js`) lists every form, one line
   per egg. Forms the player has had (`seen` in the save) show art, name,
   type and description; the rest are a nameless silhouette. A form is
   discovered only by raising a pet into it — nothing is bought or rolled.

   **Novo ovo** stays locked until the pet reaches its final form (Nv 36).
   Then the player may retire it and pick any egg again (still a choice,
   not a draw). The new pet starts at Nv 1; totals, history, trilhas,
   medals and the encyclopedia carry over, the retired pet is kept in
   `retired`, and its XP still counts in the lifetime total. Choosing a new
   egg is optional and never prompted.
8. **Perfil** — the person button in the top-right corner of the home
   screen (the coins sit top left, the pet's name between them). One
   screen with three tabs (`src/js/ui/profile.js`):
   - **Informações** — the pet: name, level, rarity, status bars, next
     evolution, Enciclopédia, new egg, replay the tour (`info.js`).
   - **Conquistas** — below.
   - **Configurações** (`src/js/settings.js`, its own key, this device
     only) has two inner tabs. **Acessibilidade** (`src/js/a11y.js` puts
     them on `<html>` as classes): *Alto contraste* (`high-contrast`:
     dim text near full ink, bright gold edges), *Modo daltonismo*
     (`colorblind`: the jade scale turns blue, so nothing hinges on red
     vs green), *Reduzir movimento* (`reduce-motion`: starts from
     the phone's own setting, then the switch decides; eggs fade in, XP fades instead of flying,
     evolution is a plain fade, the finance chat shows replies whole)
     and *Uso cadeira de rodas* (see Cadeira de rodas). **Geral**: *Som* (volume and background music: one calm loop,
     `assets/audio/forest.mp3`, "forest" by syncopika, credited under
     *Créditos*; `src/js/music.js` fetches and starts it on the first tap (only if it is on), as browsers
     require, fades it in and out and pauses it while the game is out of
     view; and *Efeitos sonoros*, `src/js/sfx.js`: just three — a soft
     synthesized tick on buttons, a soft synthesized scratch on every
     pet tap (filtered noise that swells in and out, no hit; each tap
     starts a fresh one that overlaps the last, so fast taps pile up into
     a scritch), one short tone when XP lands in the bar, from
     "SoundPack01", converted to a small mono WAV in `assets/audio/sfx/`,
     and a soft synthesized two-note chime (G5 then B5, quiet, ringing
     out in ~0.7 s) each time an activity is logged (from the home buttons
     or a trilha card) and when a trilha day is finished, plus a short warm
     tune at the evolution reveal (five soft bell notes up a major chord,
     then the chord rings out, ~2.5 s) — the one big moment, earned over
     weeks, never on a tap, and kept soft so it reads as a milestone, not
     a jackpot. The egg pick has its own little foley, all synthesized:
     each egg lands like a marimba bar (C, E, G, high C, so the four drops
     play a rising chord, and each bounce rings its note again, softer),
     the chosen egg knocks and cracks faster and faster, and the hatch is
     a crunch of shell, a rising "pop" and a short run of sparkles. The
     very first drop on a first visit is silent: browsers allow no sound
     before the player touches the page. No coin sound, no jingle, nothing looped),
     *Notificações* (phone alerts, asking the
     browser; daily reminders for the risk hours and, after 19h, when
     nothing was logged — sent only while the game is open, even in the
     background, since reminders with it closed need push), *Preferências*
     (language: Português, English planned; vibration on petting and XP),
     *Conta e dados* (login, locked for now; erase everything and start
     over, with a second tap to confirm) and the app version
     (`APP_VERSION`, v0.1.0).

   **Conquistas**: everything
   the player has done, as **Sempre** or **Esta semana** (segunda a
   domingo, `WEEK_STARTS_ON` in `config.js`): XP, active days, trilhas,
   units per action, plus the medals in `src/js/medals.js`. It is a record,
   not a target — every counter it reads only goes up, nothing expires and
   nothing is phrased as being behind. `state.js` keeps a per-day history
   (`history`, 400 days) for the week column; the lifetime column comes
   from the totals every save has carried since v1.
9. **Trilhas** — the paw-print trail in the footer tab bar, with a badge for
   how much of today's trilha is done. One short mission per
   day, on a Duolingo-shaped path: *Dia 1*, *Dia 2*, … Each day asks for a
   few of the same five actions and carries one small thing worth knowing.
   The tasks tick themselves off from what was logged today — here or on
   the home screen — and finishing pays a flat `TRILHA_XP` (100) printed on
   the card before the player commits. One per calendar day: finish today's
   and the next opens tomorrow. What is *not* borrowed from Duolingo is the
   streak — a skipped day loses nothing, the trilha is simply still there.
   The days are data in `src/js/trilhas.js`, and the list wraps, so the
   path never runs out.

   Finishing a trilha also pays **coins** (`TRILHA_COINS`, 3, fixed and
   printed on the card): a Chinese cash coin (`assets/fx/coin.webp`), the
   trilha's own reward and the only source of coins. The balance sits in the
   top-left corner of the home screen (the pet's name is centred over the
   XP bar), and at the top of the Trilhas screen;
   a tap opens the **Loja** (`src/js/ui/shop.js`), which is locked ("Em
   breve") until the adornos are decided. When it opens, every item is
   shown with its fixed price and bought as seen — no boxes, rolls or
   surprise items, no timed offers, and coins are never sold for money.
   Coins carry over to a new egg; saves from before them are paid for the
   trilhas already finished.
10. **Progresso** — the recovery indicators, so the project can show it
    helps rather than only that it is liked. One card each
    (`src/js/ui/progress.js`, data and rules in `src/js/recovery.js`):
    - *Dias sem apostar*: once a week, "in how many of the last 7 days did
      you not bet?" (0–7), shown as bars for the last 8 weeks. Not a streak:
      the answer can be changed during the week, a hard week is just a
      lower bar, and nothing resets. The first answer each week pays a flat
      `CHECKIN_XP` (20) whatever the number, so honesty never costs XP.
    - *Gravidade (PGSI)*: the 9-question Problem Gambling Severity Index
      (0–27, published bands), at the start (last 12 months), then at 3 and
      6 months and every 3 months after (last 3 months), shown as
      "15 → 7". A moderate or problem result points to *Onde buscar ajuda*.
    - *Peso das dívidas*: income, monthly payments on betting debts and the
      balance still owed, once a month; shows the share of income and the
      first-to-latest change in share and balance.
    - *Chegada ao cuidado*: saw a contact → booked → went to the first
      appointment, ticked by the player; opening any link in *Onde buscar ajuda*
      ticks the first step.
    - *Rotina de volta*: the hours betting used to happen and an action to
      do instead. Inside that window Tigrin calls the player to it once a
      day on the home screen, and the card shows on how many days this
      week an action was logged in the window.

    **Onde buscar ajuda** (`src/js/ui/help.js`: Meu SUS Digital, UBS/CAPS,
    Jogadores Anônimos, CVV 188) has no tab of its own: the green *Ajuda*
    button at the top of Progresso opens it over the screen, with a back
    button to return, and the PGSI and care cards link to it too.

    Sensitive by nature, so it lives in its own key
    (`pet-tigrinho:recovery`), on this device only, and is never sent
    anywhere. `?reset` clears it too.

A form without its own sprite borrows Tigrin's until it lands (see *Art
pipeline*). v1 saves migrate to a Tigrin that keeps its XP, totals and
name; saves holding a form cut from the old 52-form tree rejoin their egg's
line at the depth their XP has reached.

All tuning lives in `src/js/config.js`.

### Known gaps

- **Steps are counted only while the game is open.** The web has no
  step-counter API and no Health Connect / HealthKit bridge from a browser.
  The Passos sheet has *Contar com o celular*: it reads the accelerometer
  (`devicemotion`) while the sheet is open, keeps the screen on with a wake
  lock, and finds each step as a bounce in the acceleration
  (`src/js/pedometer.js`). It needs HTTPS (or localhost), and iOS asks for
  permission on the tap. Typing the count stays available for walks the
  phone did not see. Photos use a real `capture` input, which opens the
  phone's camera; pages and minutes are typed in. Self-reporting is fine
  here — there is no leaderboard and nothing to win, so the only person a
  false entry cheats is the player.
- **Photos are not stored.** The image is shown once in the sheet and the
  object URL is revoked on close. Nothing is uploaded and nothing is kept.
  A persistent album would need IndexedDB.
- **Save is local.** `localStorage`, single device, no account.

## Stack

Plain HTML5 + CSS + JS, ES modules, no build step. One vendored library:
three.js 0.160 (`src/vendor/`, MIT), loaded only by the egg screen.

```
index.html
src/styles/   base (reset + tokens) · stage (viewport) · ui (screens)
src/js/       config · forms · trilhas · medals · sprites · state
              viewport · pedometer · main
src/js/ui/    dom · art · toast · egg · eggs3d · home · sheet · evolve · info
              encyclopedia · achievements · trilhas · finance · help · tabbar
src/vendor/   three.module.min.js (three.js 0.160, MIT)
assets/pet/   form sprites, <id>.webp, 900px
assets/icons/ action button icons, <action>.webp, 256px
assets/source/ original artwork, <id>.png, untouched
docs/         evolucoes.md: forms + ChatGPT prompts
tools/        sprites.py: source art -> sprites
dev/          aura-lab.html: ready-to-evolve animation lab
test/         node test/state.test.mjs
```

## Layout model

Mobile-first vertical, with desktop handled TikTok-style: the vertical format
is kept and centred in the window.

- `bleed` mode (phones): the stage is the viewport, edge to edge, with
  `env(safe-area-inset-*)` keeping content off the notch and home indicator.
- `framed` mode (anything wider than 9:16): the stage becomes a centred 9:16
  column with a backdrop around it.

`src/js/viewport.js` measures the true dynamic viewport with a hidden
`100dvw x 100dvh` probe element plus a `ResizeObserver`, so there is no
guessing at mobile browser chrome and no `window.innerHeight` hacks.

It publishes three CSS custom properties:

| property     | meaning           |
|--------------|-------------------|
| `--stage-w`  | stage width in px |
| `--stage-h`  | stage height in px|
| `--u`        | 1% of stage width |

**Size everything in `--u`.** `calc(var(--u) * 5)` is 5% of the stage width
and scales identically on every screen. Avoid `px`, `vw` and `vh` inside the
stage.

## Run

ES modules need HTTP, so `file://` will not work. The dev server serves
the game and proxies the Finanças chat and the meal/photo checks to
Gemini (Node 20.12+, no deps):

```sh
cp .env.example .env    # then paste your GEMINI_API_KEY
node server.js
```

Without a key the game still runs and never shows an AI error: the
Finanças chat answers from fixed replies by amount
(`src/js/finance-offline.js`), photos and meals pay the base rate. Any
AI call gives up after 10 s. A
plain `python3 -m http.server 8000` also serves the game, minus the AI.
Setup, key safety and deploy options: `docs/gemini.md`.

Then <http://localhost:8000>. Query flags: `?debug=1` for a viewport HUD,
`?reset=1` to wipe the save, `?dev=1` for a dev button on the home screen
that grants exactly the XP to the next level (it feeds no status bar, so
log real actions first to steer the Azul branch), `?motion` for the full
effects even with reduce motion on (system or Acessibilidade) (egg drop,
evolution charge, petting wiggle - see `src/js/motion.js`).

```sh
for f in test/*.test.mjs; do node "$f"; done
```

What `server.js` serves and how:

- **Not served:** `.env`, the server code, and what the game never needs
  at runtime — `assets/source/` (24 MB of original art), `docs/`, `test/`,
  `tools/`, `package*.json`, `.claude/`, `.mcp.json`. A host that serves
  the folder as plain static files (GitHub Pages, Netlify) does not apply
  this list, so leave those folders out of the upload there.
- **Caching:** `assets/` and `src/vendor/` may be kept an hour; code and
  pages are revalidated on every load. Every file carries `Last-Modified`,
  so an unchanged one costs a 304, not its bytes.
- **Audio:** `.mp3`/`.wav` get their real types and byte ranges, which
  Safari needs to play them.
- **Cheap phones (low RAM):** camera photos are decoded straight to at
  most 1440px (`shrinkPhoto` in `src/js/vision.js`) — a 12 MP shot would
  take ~48 MB decoded, the copy ~6 MB — and the sheet and the AI only see
  that copy. Small pet pictures use `srcset` with the 360px thumbnails, so
  the browser takes the full 900px art only on screens dense enough to
  need it. The 3D egg scene frees its GPU memory as soon as the egg hatches
  (`forceContextLoss`), and the drifting floor layer only extends past the
  stage on the two sides it slides in from. The idle home screen animates
  on the GPU only (no per-frame style or layout work).
- **`sw.js`** (a service worker) is registered on HTTPS/localhost only so
  reminders can show on Android. It caches nothing on purpose.

On a phone: the camera works over plain HTTP, but the step sensor only
works over HTTPS, so test from an HTTPS URL (a tunnel or GitHub Pages)
rather than `http://<your-pc-ip>:8000`.

## Art pipeline

Sprites are generated in the ChatGPT web interface (no API). Copy-paste
prompts for every form, and which reference images to attach, are in
[`docs/evolucoes.md`](docs/evolucoes.md).

Save each result as `assets/source/<form id>.png` (kept untouched) and run:

```sh
python3 tools/sprites.py              # needs Pillow
```

It crops each new source to its alpha bounds, resamples it to a 900px wide
`assets/pet/<id>.webp` plus a 360px `assets/pet/thumb/<id>.webp` (the
Enciclopédia uses the small one, lazy-loaded), regenerates `src/js/sprites.js` (the list of forms
that have a sprite, read by `forms.js`) and prints what is still missing.

Action icons work the same way: `assets/source/icons/<action>.png` (action
ids: `photo`, `steps`, `book`, `course`, `meal`) becomes a 256px square
`assets/icons/<action>.webp`. Until an action has one, its button shows the
built-in gold SVG from `ICONS` in `config.js`.
`--knockout` clears a painted white background; `--force` redoes all.

`scale` (sprite width as a percentage of stage width) defaults by rarity in
`forms.js` — 62 / 78 / 84 — because the later forms carry effects (spray,
orbiting stars) well outside the body silhouette and need more room to read
at the same apparent size. Pass `scale` to a form to override it.
