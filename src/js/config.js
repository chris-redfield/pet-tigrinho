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
  paw: 'M7 7.5a2 2 0 110 4 2 2 0 010-4zm10 0a2 2 0 110 4 2 2 0 010-4zM9.8 3.6a2 2 0 110 4 2 2 0 010-4zm4.4 0a2 2 0 110 4 2 2 0 010-4zM12 11.6c2.6 0 5.6 3.4 5.6 6 0 1.6-1.2 2.6-2.8 2.6-1.1 0-1.8-.6-2.8-.6s-1.7.6-2.8.6c-1.6 0-2.8-1-2.8-2.6 0-2.6 3-6 5.6-6z',
  coin: 'M12 2.4a9.6 9.6 0 110 19.2 9.6 9.6 0 010-19.2zm.9 4h-1.8v1.3c-1.6.3-2.7 1.4-2.7 2.8 0 1.7 1.3 2.4 3.1 2.8 1.3.3 1.8.6 1.8 1.2 0 .6-.6 1-1.5 1-1 0-1.7-.4-2-1.1l-1.6.7c.4 1.1 1.4 1.9 2.9 2.1v1.3h1.8v-1.3c1.7-.3 2.7-1.4 2.7-2.9 0-1.7-1.2-2.4-3.1-2.8-1.3-.3-1.8-.6-1.8-1.1 0-.5.5-.9 1.3-.9.8 0 1.4.3 1.7 1l1.6-.7c-.4-1-1.2-1.6-2.4-1.8V6.4z',
  heart: 'M12 20.6l-1.3-1.2C6 15.2 3 12.4 3 8.9 3 6.1 5.2 4 8 4c1.6 0 3.1.7 4 1.9C12.9 4.7 14.4 4 16 4c2.8 0 5 2.1 5 4.9 0 3.5-3 6.3-7.7 10.5L12 20.6z',
  phone: 'M6.6 10.8a15.1 15.1 0 006.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 013 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z',
  send: 'M3 20.4l18-8.4L3 3.6l.1 6.5L15 12 3.1 13.9z',
  mic: 'M12 2.8a3.2 3.2 0 013.2 3.2v6a3.2 3.2 0 01-6.4 0V6A3.2 3.2 0 0112 2.8zM6.4 11.2a.9.9 0 011.8 0 3.8 3.8 0 007.6 0 .9.9 0 011.8 0 5.6 5.6 0 01-4.7 5.5v2.5h2.5a.9.9 0 010 1.8H8.6a.9.9 0 010-1.8h2.5v-2.5a5.6 5.6 0 01-4.7-5.5z',
  crown: 'M3.2 7.4l4.6 4.4L12 4.6l4.2 7.2 4.6-4.4-1.6 10.2H4.8L3.2 7.4zM4.4 19.6h15.2a.9.9 0 010 1.8H4.4a.9.9 0 010-1.8z',
  trail: 'M2.47 18.41a2.14 1.72 40 1 0 3.28 2.75a2.14 1.72 40 1 0 -3.28 -2.75zM2.35 16.41a0.83 0.95 40 1 0 1.27 1.06a0.83 0.95 40 1 0 -1.27 -1.06zM4.6 16.23a0.88 1.02 40 1 0 1.35 1.14a0.88 1.02 40 1 0 -1.35 -1.14zM6.17 17.54a0.88 1.02 40 1 0 1.35 1.14a0.88 1.02 40 1 0 -1.35 -1.14zM6.47 19.87a0.83 0.95 40 1 0 1.27 1.06a0.83 0.95 40 1 0 -1.27 -1.06zM9.97 11.41a2.14 1.72 40 1 0 3.28 2.75a2.14 1.72 40 1 0 -3.28 -2.75zM9.85 9.41a0.83 0.95 40 1 0 1.27 1.06a0.83 0.95 40 1 0 -1.27 -1.06zM12.1 9.23a0.88 1.02 40 1 0 1.35 1.14a0.88 1.02 40 1 0 -1.35 -1.14zM13.67 10.54a0.88 1.02 40 1 0 1.35 1.14a0.88 1.02 40 1 0 -1.35 -1.14zM13.97 12.87a0.83 0.95 40 1 0 1.27 1.06a0.83 0.95 40 1 0 -1.27 -1.06zM17.37 4.41a2.14 1.72 40 1 0 3.28 2.75a2.14 1.72 40 1 0 -3.28 -2.75zM17.25 2.41a0.83 0.95 40 1 0 1.27 1.06a0.83 0.95 40 1 0 -1.27 -1.06zM19.5 2.23a0.88 1.02 40 1 0 1.35 1.14a0.88 1.02 40 1 0 -1.35 -1.14zM21.07 3.54a0.88 1.02 40 1 0 1.35 1.14a0.88 1.02 40 1 0 -1.35 -1.14zM21.37 5.87a0.83 0.95 40 1 0 1.27 1.06a0.83 0.95 40 1 0 -1.27 -1.06z',
  plus: 'M10.8 3.4h2.4v7.4h7.4v2.4h-7.4v7.4h-2.4v-7.4H3.4v-2.4h7.4V3.4z',
  check: 'M20.3 5.4L22 7.1 9.2 19.9 2 12.7l1.7-1.7 5.5 5.5L20.3 5.4z',
  star: 'M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3.1-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9L12 2.6z',
  bulb: 'M12 2.4a7 7 0 014.3 12.5c-.7.6-1.1 1.3-1.2 2.1l-.1.6H9l-.1-.6c-.1-.8-.5-1.5-1.2-2.1A7 7 0 0112 2.4zM9.2 19.4h5.6v1.1a1.7 1.7 0 01-1.7 1.7h-2.2a1.7 1.7 0 01-1.7-1.7v-1.1z',
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
    // The AI names where the photo was taken; each place pays a fixed,
    // published amount (listed in the sheet before the photo is taken), so
    // going out pays more than staying in - it is a rate table, not a draw.
    // `xp` above is what a photo pays when the AI cannot be reached.
    verify: 'photo',
    places: {
      natureza: { label: 'Natureza',       emoji: '🌳', xp: 20 },
      passeio:  { label: 'Lugar visitado', emoji: '📍', xp: 20 },
      trabalho: { label: 'Trabalho',       emoji: '💼', xp: 15 },
      casa:     { label: 'Casa',           emoji: '🏠', xp: 10 },
      outro:    { label: 'Outro',          emoji: '📷', xp: 10 },
    },
  },
  steps: {
    label: 'Passos', verb: 'Registrar passos',
    rate: '1.000',
    unit: 'passo', unitPlural: 'passos',
    xp: 10, step: 1000, cap: 15000,
    sensor: true,
  },
  book: {
    label: 'Leitura', verb: 'Registrar leitura',
    rate: '10 pág',
    unit: 'página', unitPlural: 'páginas',
    xp: 15, step: 10, cap: 100,
  },
  course: {
    label: 'Estudo', verb: 'Registrar Horários de Estudo',
    rate: '30 min',
    unit: 'minuto', unitPlural: 'minutos',
    xp: 20, step: 30, cap: 180,
    schedule: true,   // logged as a start and end time
  },
  meal: {
    label: 'Refeição', verb: 'Foto da refeição',
    rate: 'refeição',
    unit: 'refeição', unitPlural: 'refeições',
    xp: 10, step: 1, cap: 4,
    capture: true,
    verify: 'meal',   // pays only if the AI sees food in the photo
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

/** Each egg always hatches the same form; its shell colour shows its type. */
export const EGGS = [
  { id: 'branco',   name: 'Branco',   type: 'Normal', base: 'tigrin',   shell: '#efe6d2', band: '#f5c242', speck: '#b79a6a' },
  { id: 'vermelho', name: 'Vermelho', type: 'Fogo',   base: 'brasinha', shell: '#c7273a', band: '#f5c242', speck: '#ffe9a8' },
  { id: 'azul',     name: 'Azul',     type: 'Água',   base: 'tigre-dagua', shell: '#2f6fb8', band: '#f5c242', speck: '#cfe6ff' },
  { id: 'verde',    name: 'Verde',    type: 'Grama',  base: 'folhiger', shell: '#2f8f6f', band: '#f5c242', speck: '#d6f5e4' },
];

/**
 * Which weekday a week starts on, for the "this week" column of the
 * achievements screen: 0 Sunday, 1 Monday. Monday, so the week reads
 * segunda a domingo like most Brazilian weekly goals.
 */
export const WEEK_STARTS_ON = 1;
