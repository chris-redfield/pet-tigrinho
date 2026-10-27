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
- **The egg pick is a choice, not a draw.** All three eggs hatch the same pet
  today. When real variety lands, show what each egg contains and let the
  player choose. Three unknowns and a random pull is a loot box, which is the
  thing this game exists to be an alternative to.

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

1. **First run** — pick one of three eggs, hatch it.
2. **Log real-world actions** — four of them, each a flat XP rate:

   | Action  | Rate              | Daily cap   |
   |---------|-------------------|-------------|
   | Foto    | +10 XP / photo    | 5 photos    |
   | Passos  | +10 XP / 1.000    | 15.000      |
   | Leitura | +15 XP / 10 pages | 100 pages   |
   | Estudo  | +20 XP / 30 min   | 180 min     |

3. **Evolve** — a three-stage line, Pokémon style:

   | Stage | Name          | At      |
   |-------|---------------|---------|
   | 0     | Tigrinho      | 0 XP    |
   | 1     | Tigre d'Água  | 300 XP  |
   | 2     | Tigre Cósmico | 1200 XP |

   A maxed-out day is ~470 XP and a normal one lands near 150, so Água is a
   few days in and Cósmico a week or two. Slow enough to be a habit, fast
   enough to feel alive.

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
src/js/       config · state · viewport · main
src/js/ui/    dom · art · egg · home · sheet · evolve
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
