/**
 * Every tunable number lives here.
 *
 * Rule for this file: a player must always be able to know, before acting,
 * exactly what an action will give them. So XP is a fixed rate per unit -
 * never a roll, never a range, never a multiplier that varies by luck.
 */

/** Gold line-art icons, drawn on a 24x24 grid. */
export const ICONS = {
  photo: 'M4 8h3.2l1.6-2.4h6.4L16.8 8H20a1.6 1.6 0 011.6 1.6v8.8A1.6 1.6 0 0120 20H4a1.6 1.6 0 01-1.6-1.6V9.6A1.6 1.6 0 014 8zm8 2.6a3.8 3.8 0 100 7.6 3.8 3.8 0 000-7.6z',
  steps: 'M7.5 3.2c1.7 0 2.8 1.6 2.8 3.9 0 1.7-.5 3-.5 4.3 0 1.6-.9 2.4-2.4 2.4s-2.5-.9-2.5-2.5c0-1.3-.5-2.5-.5-4.2 0-2.3 1.2-3.9 3.1-3.9zM5.2 16.1h4.5c.5 0 .8.4.8.9v1.6c0 1.3-1 2.2-2.4 2.2h-1.3c-1.4 0-2.4-.9-2.4-2.2V17c0-.5.3-.9.8-.9zM16.5 6.4c1.9 0 3.1 1.6 3.1 3.9 0 1.7-.5 2.9-.5 4.2 0 1.6-1 2.5-2.5 2.5s-2.4-.8-2.4-2.4c0-1.3-.5-2.6-.5-4.3 0-2.3 1.1-3.9 2.8-3.9zM14.3 19h4.5c.5 0 .8.4.8.9v.4c0 1.3-1 2.2-2.4 2.2h-1.3c-1.4 0-2.4-.9-2.4-2.2v-.4c0-.5.3-.9.8-.9z',
  book: 'M3.2 4.8c0-.9.7-1.6 1.6-1.6h5.6c.9 0 1.6.7 1.6 1.6v14.4c0-.9-.7-1.6-1.6-1.6H4.8c-.9 0-1.6-.7-1.6-1.6V4.8zm9.6 0c0-.9.7-1.6 1.6-1.6h4.8c.9 0 1.6.7 1.6 1.6V16c0 .9-.7 1.6-1.6 1.6h-4.8c-.9 0-1.6.7-1.6 1.6V4.8z',
  course: 'M12 3.2l9.6 4.8-9.6 4.8L2.4 8 12 3.2zM6 11.2l6 3 6-3v4.3c0 .6-.3 1.1-.8 1.4-1.4.8-3.2 1.3-5.2 1.3s-3.8-.5-5.2-1.3a1.6 1.6 0 01-.8-1.4v-4.3zM20.4 9.4v5.4a.9.9 0 01-1.8 0V9.4a.9.9 0 011.8 0z',
  meal: 'M5 3h1.4v5h1.2V3H9v5h1.2V3h1.4v6a3 3 0 01-2.3 2.9v8.5a1.2 1.2 0 01-2.4 0v-8.5A3 3 0 015 9V3zm12.6 0c1.3 0 2.2 1.6 2.2 4.6v5.2h-1.4v7.6a1.2 1.2 0 01-2.4 0V4.2c0-.7.7-1.2 1.6-1.2z',
  info: 'M12 2.4a9.6 9.6 0 110 19.2 9.6 9.6 0 010-19.2zm0 2a7.6 7.6 0 100 15.2 7.6 7.6 0 000-15.2zM11 10.4h2v6.8h-2zm1-3.8a1.3 1.3 0 110 2.6 1.3 1.3 0 010-2.6z',
  pencil: 'M15.6 3.6a1.6 1.6 0 012.3 0l2.5 2.5a1.6 1.6 0 010 2.3L9.2 19.6l-5.4 1.2a.5.5 0 01-.6-.6l1.2-5.4L15.6 3.6zM14.4 7.2l2.4 2.4 1.6-1.6-2.4-2.4-1.6 1.6z',
  lock: 'M12 2.8a4.8 4.8 0 014.8 4.8V10h.8c.9 0 1.6.7 1.6 1.6v8c0 .9-.7 1.6-1.6 1.6H6.4c-.9 0-1.6-.7-1.6-1.6v-8c0-.9.7-1.6 1.6-1.6h.8V7.6A4.8 4.8 0 0112 2.8zm0 2a2.8 2.8 0 00-2.8 2.8V10h5.6V7.6A2.8 2.8 0 0012 4.8zm0 8.4a1.6 1.6 0 00-.8 3v1.6h1.6v-1.6a1.6 1.6 0 00-.8-3z',
  back: 'M15.4 4.2a1 1 0 010 1.4L9 12l6.4 6.4a1 1 0 01-1.4 1.4l-7.1-7.1a1 1 0 010-1.4L14 4.2a1 1 0 011.4 0z',
};

/**
 * The five real-world actions.
 *
 *   xp   - points awarded per `step` units
 *   step - the increment the player logs in (one tap = one step)
 *   cap  - most units per day that still earn XP
 *
 * Caps exist on purpose. The audience is people prone to compulsive loops,
 * so the game should say "that's enough for today" rather than reward a
 * six-hour binge. Over the cap you still keep the record, just not the XP.
 */
export const ACTIONS = {
  photo: {
    label: 'Foto', verb: 'Tirar uma foto',
    rate: 'foto',
    unit: 'foto', unitPlural: 'fotos',
    xp: 10, step: 1, cap: 5,
    capture: true,
  },
  steps: {
    label: 'Passos', verb: 'Registrar passos',
    rate: '1.000',
    unit: 'passo', unitPlural: 'passos',
    xp: 10, step: 1000, cap: 15000,
  },
  book: {
    label: 'Leitura', verb: 'Registrar leitura',
    rate: '10 pág',
    unit: 'página', unitPlural: 'páginas',
    xp: 15, step: 10, cap: 100,
  },
  course: {
    label: 'Estudo', verb: 'Registrar estudo',
    rate: '30 min',
    unit: 'minuto', unitPlural: 'minutos',
    xp: 20, step: 30, cap: 180,
  },
  meal: {
    label: 'Refeição', verb: 'Registrar refeição',
    rate: 'refeição',
    unit: 'refeição', unitPlural: 'refeições',
    xp: 10, step: 1, cap: 4,
  },
};

export const ACTION_ORDER = ['photo', 'steps', 'book', 'course', 'meal'];

/**
 * Rarity is a rank the pet *earns* by evolving, never something drawn.
 * Base forms are Comum, Nv 16 forms Raro, Nv 36 forms Lendário.
 * Each form names its tier in forms.js.
 */
export const RARITIES = {
  comum:    { label: 'Comum',    color: '#e0bd92' },
  raro:     { label: 'Raro',     color: '#5cc7a2' },
  lendario: { label: 'Lendário', color: '#f5c242' },
};

/**
 * Pet level, read straight off lifetime XP.
 *
 * Going from level L to L+1 costs L * LEVEL_STEP XP, so level L starts at
 * LEVEL_STEP * L(L-1)/2. With 6: Nv 16 (first evolution) at 720 XP and
 * Nv 36 (second) at 3.780 XP. A normal ~150 XP day puts those about five
 * days and three and a half weeks in. Fixed and published like everything
 * else.
 */
export const LEVEL_STEP = 6;

/**
 * Pet status bars.
 *
 * Each bar is the XP earned from its source actions *during the current
 * phase* (since the last evolution), as a share of `share * phase span`.
 * The phase span is the XP between the last evolution level and the next.
 *
 * Inside a phase a bar only fills - there is no hunger timer and no decay.
 * Evolving starts a new phase and the bars start over, the same way the XP
 * bar starts over for the next evolution. No low-bar colour, no warning.
 *
 * The shares add up to more than 1 on purpose: you cannot max every bar in
 * one phase, so which bars you fill is a choice, and where a line branches
 * that choice picks the form the pet evolves into.
 *
 *   from  - actions whose earned XP feeds this bar
 *   share - fraction of the phase span that fills the bar to 100%
 */
export const STATS = [
  { id: 'wisdom',    label: 'Sabedoria',  from: ['book', 'course'], share: 0.45 },
  { id: 'happiness', label: 'Felicidade', from: ['photo'],          share: 0.20 },
  { id: 'fullness',  label: 'Saciedade',  from: ['meal'],           share: 0.15 },
  { id: 'health',    label: 'Saúde',      from: ['steps'],          share: 0.35 },
];

/** Each egg shows its type and the form it hatches into before the pick. */
export const EGGS = [
  { id: 'branco',   name: 'Branco',   type: 'Normal', base: 'tigrin',   shell: '#efe6d2', band: '#f5c242', speck: '#b79a6a' },
  { id: 'vermelho', name: 'Vermelho', type: 'Fogo',   base: 'brasinha', shell: '#c7273a', band: '#f5c242', speck: '#ffe9a8' },
  { id: 'azul',     name: 'Azul',     type: 'Água',   base: 'tigre-dagua', shell: '#2f6fb8', band: '#f5c242', speck: '#cfe6ff' },
  { id: 'verde',    name: 'Verde',    type: 'Grama',  base: 'folhiger', shell: '#2f8f6f', band: '#f5c242', speck: '#d6f5e4' },
];
