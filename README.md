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
  The XP is printed on the face of every button and recomputed live in the
  log sheet *before* the player commits. No roll, no range, no luck multiplier.
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
- **The egg pick is a choice, not a draw.** Each egg shows its type and the
  pet it hatches before the player commits. Unknowns plus a random pull is a
  loot box, which is the thing this game exists to be an alternative to.
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

1. **First run** — pick one of four eggs, each showing what it hatches:
   Branco → Tigrin (Normal), Vermelho → Brasinha (Fogo),
   Azul → Gotigre (Água), Verde → Folhiger (Grama).
2. **Log real-world actions** — five of them, each a flat XP rate:

   | Action   | Rate              | Daily cap   | Feeds      |
   |----------|-------------------|-------------|------------|
   | Foto     | +10 XP / photo    | 5 photos    | Felicidade |
   | Passos   | +10 XP / 1.000    | 15.000      | Saúde      |
   | Leitura  | +15 XP / 10 pages | 100 pages   | Sabedoria  |
   | Estudo   | +20 XP / 30 min   | 180 min     | Sabedoria  |
   | Refeição | +10 XP / meal     | 4 meals     | Saciedade  |

3. **Level** — going from Nv L to L+1 costs `L × LEVEL_STEP` (15) XP, so
   Nv 16 is at 1.800 XP and Nv 36 at 9.450. A normal day lands near 150 XP
   and a maxed one ~510, so the first evolution is about two weeks in and
   the second about two months.
4. **Evolve** — two branching evolutions, Pokémon style. The full tree
   (52 forms) is data in `src/js/forms.js`:

   - **Nv 16** — the base form becomes one of three Raro forms, each with
     stat requirements (e.g. Gotigre → Coraliger: Felicidade ≥ 90%).
   - **Nv 36** — each Raro form becomes one Lendário or two Épico forms.
     The Tigreluz line has requirements; the rest go to the form whose
     favoured stat is highest.

   Rule (`pickBranch` in `src/js/state.js`): of the branches whose
   requirements are met, the most demanding wins; if none is met, the one
   it came closest to wins; ties go to the first listed.

5. **Status bars** measure the current *phase* (since the last evolution):
   XP earned from the bar's source actions as a share of `share × phase
   span`. Inside a phase they only fill — no hunger timer, no decay, no red
   low state. Evolving starts a new phase and they start over, like the XP
   bar does. The shares add up to more than 1, so you cannot max every bar
   in one phase: what you focus on picks the branch.
6. **Pet info** — the ⓘ button opens name (tap to rename), level, type,
   rarity, the status bars and the next-evolution preview. Rarity is earned
   by evolving, never drawn. **Enciclopédia** is shown but locked until it
   is built.

Only Tigrin has art so far; every form borrows `tigrinho-0.webp` until its
own sprite lands (set `art`/`scale` per form in `forms.js`). The old
`tigrinho-1`/`tigrinho-2` sprites are unused for now. v1 saves migrate to a
Tigrin that keeps its XP, totals and name.

All tuning lives in `src/js/config.js`.

### Known gaps

- **Actions are self-reported.** The web has no reliable step counter: there
  is no background sensor access and no Health Connect / HealthKit bridge
  from a browser. Photos use a real `capture` input; steps, pages and minutes
  are typed in. That is fine here — there is no leaderboard and nothing to
  win, so the only person a false entry cheats is the player.
- **Photos are not stored.** The image is shown once in the sheet and the
  object URL is revoked on close. Nothing is uploaded and nothing is kept.
  A persistent album would need IndexedDB.
- **Save is local.** `localStorage`, single device, no account.

## Stack

Plain HTML5 + CSS + JS, ES modules, no build step, no dependencies.

```
index.html
src/styles/   base (reset + tokens) · stage (viewport) · ui (screens)
src/js/       config · forms · state · viewport · main
src/js/ui/    dom · art · egg · home · sheet · evolve · info
assets/pet/   stage sprites, 900px WebP
assets/source/ original artwork, untouched
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

ES modules need HTTP, so `file://` will not work:

```sh
python3 -m http.server 8000
```

Then <http://localhost:8000>. Query flags: `?debug=1` for a viewport HUD,
`?reset=1` to wipe the save.

```sh
node test/state.test.mjs
```

## Art pipeline

Source art goes in `assets/source/` untouched. Sprites are cropped to their
alpha bounds and resampled to 900px wide WebP:

```sh
python3 - <<'PY'
from PIL import Image
im = Image.open('assets/source/NAME.png').convert('RGBA')
im = im.crop(im.getchannel('A').getbbox())
im = im.resize((900, round(im.height * 900 / im.width)), Image.LANCZOS)
im.save('assets/pet/NAME.webp', 'WEBP', quality=90, method=6)
PY
```

Each stage sets its own `scale` in `config.js` (sprite width as a percentage
of stage width), because the later forms carry effects — spray, orbiting
stars — well outside the body silhouette and need more room to read at the
same apparent size.
