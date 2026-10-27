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
};

/**
 * The four real-world actions.
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
};

export const ACTION_ORDER = ['photo', 'steps', 'book', 'course'];

/**
 * Evolution ladder - a three-stage line, Pokemon style.
 *
 * `scale` is the sprite width as a percentage of stage width. The later
 * forms need more room because their artwork carries effects (spray,
 * orbiting stars) well outside the body silhouette.
 *
 * Pacing: a very full day caps out around 470 XP and a normal one lands
 * near 150, so Agua is a few days in and Cosmico is a week or two. Slow
 * enough to be a habit, not a grind.
 */
export const STAGES = [
  { name: 'Tigrinho',       at: 0,    art: 'assets/pet/tigrinho-0.webp', scale: 62 },
  { name: "Tigre d'Água",   at: 300,  art: 'assets/pet/tigrinho-1.webp', scale: 78 },
  { name: 'Tigre Cósmico',  at: 1200, art: 'assets/pet/tigrinho-2.webp', scale: 84 },
];

/** All three hatch the same pet for now; the choice is cosmetic. */
export const EGGS = [
  { id: 'rubi',  name: 'Rubi',  shell: '#c7273a', band: '#f5c242', speck: '#ffe9a8' },
  { id: 'ouro',  name: 'Ouro',  shell: '#d99a26', band: '#fff0bd', speck: '#8a4a12' },
  { id: 'jade',  name: 'Jade',  shell: '#2f8f6f', band: '#f5c242', speck: '#d6f5e4' },
];
