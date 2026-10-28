/**
 * Every form the pet can take, and how it gets there.
 *
 * Five evolution lines of three forms each, hatched from four eggs. Three
 * eggs evolve in a straight line. The Azul egg branches at Nv 16: Tigre
 * d'Água becomes Oceaniger (water) or Neviger (ice) depending on its status
 * bars, and each of those has one final form.
 *
 *   Branco   Tigrin   -> Estreliger      -> Tigre Cósmico
 *   Vermelho Brasinha -> Tigre-Fornalha  -> Mechatigre
 *   Azul     Tigre d'Água -> Oceaniger  -> Tigre-Leviatã
 *                         -> Neviger    -> Tigre-Glacial
 *   Verde    Folhiger -> Floriger        -> Tigre-Yggdrasil
 *
 * Where there is a branch, it is decided by the status bars at the moment
 * the pet reaches the evolution level. Nothing is rolled. The rule is in
 * `pickBranch` in state.js and the info screen shows, live, which form the
 * pet would become if it evolved right now.
 *
 *   needs - { stat: pct } every bar must be at or above pct
 *
 * A form that is the only way forward needs nothing.
 *
 * Sprites live at assets/pet/<id>.webp and are listed in sprites.js, which
 * tools/sprites.py writes. A form without one borrows Tigrin's until it
 * lands. `scale` is the sprite width as a percentage of stage width; later
 * forms carry effects outside the body and get more room by default. Pass
 * `scale` to a form to override it.
 */

import { SPRITES } from './sprites.js';

const FALLBACK = 'assets/pet/tigrin.webp';
const SCALE = { comum: 62, raro: 78, lendario: 84 };

/** Levels at which the pet evolves. */
export const EVOLVE_AT = [16, 36];

const list = [];

function form(id, name, type, rarity, extra = {}) {
  const art = SPRITES.includes(id) ? `assets/pet/${id}.webp` : FALLBACK;
  list.push({ id, name, type, rarity, art, scale: SCALE[rarity], from: null, ...extra });
}

// ---------- Ovo Branco: Cósmico ----------

form('tigrin', 'Tigrin', 'Normal', 'comum',
  { desc: 'O Tigrinho base, equilibrado e com grande potencial de adaptação.' });
form('estreliger', 'Estreliger', 'Normal/Cósmico', 'raro',
  { from: 'tigrin', desc: 'As listras brilham como constelações e pequenas estrelas orbitam ao redor.' });
form('tigre-cosmico', 'Tigre Cósmico', 'Normal/Cósmico', 'lendario',
  { from: 'estreliger', desc: 'Carrega uma galáxia na cauda e planetas em órbita.' });

// ---------- Ovo Vermelho: Fogo ----------

form('brasinha', 'Brasinha', 'Fogo', 'comum',
  { desc: 'Um Tigrinho quente, com pelagem avermelhada e muita energia.' });
form('tigre-fornalha', 'Tigre-Fornalha', 'Fogo/Metálico', 'raro',
  { from: 'brasinha', desc: 'Desenvolve uma armadura de ferro quente.' });
form('mechatigre', 'Mechatigre', 'Fogo/Metálico', 'lendario',
  { from: 'tigre-fornalha', desc: 'Um tigre-robô de metal polido, com um núcleo de fogo no peito.' });

// ---------- Ovo Azul: Água / Gelo ----------

form('tigre-dagua', "Tigre d'Água", 'Água', 'comum',
  { scale: 78, desc: 'Um Tigrinho brincalhão, com ondas na cauda e gotas flutuando ao redor.' });

form('oceaniger', 'Oceaniger', 'Água', 'raro',
  { from: 'tigre-dagua', needs: { happiness: 70 },
    desc: 'Ondas formam sua juba e ele carrega um pequeno tridente.' });
form('neviger', 'Neviger', 'Água/Gelo', 'raro',
  { from: 'tigre-dagua', needs: { wisdom: 60, health: 60 },
    desc: 'A água em seu corpo congela, formando uma armadura de gelo.' });

form('tigre-leviata', 'Tigre-Leviatã', 'Água', 'lendario',
  { from: 'oceaniger', desc: 'Corpo longo e serpentino, com barbatanas: um dragão marinho.' });
form('tigre-glacial', 'Tigre-Glacial', 'Água/Gelo', 'lendario',
  { from: 'neviger', desc: 'Enorme, com coroa de estalactites e geada sob as patas.' });

// ---------- Ovo Verde: Grama ----------

form('folhiger', 'Folhiger', 'Grama', 'comum',
  { desc: 'Um Tigrinho com folhagens no lugar da juba, que adora sol.' });
form('floriger', 'Floriger', 'Grama/Fada', 'raro',
  { from: 'folhiger', desc: 'Flores exóticas desabrocham em sua juba.' });
form('tigre-yggdrasil', 'Tigre-Yggdrasil', 'Grama/Fada', 'lendario',
  { from: 'floriger', desc: 'Uma árvore inteira cresce em suas costas, com copa luminosa.' });

/** id -> form */
export const FORMS = Object.fromEntries(list.map((f) => [f.id, f]));

/** id -> the forms it can evolve into, in listed order (which breaks ties). */
export const BRANCHES = {};
for (const f of list) {
  if (f.from) (BRANCHES[f.from] ||= []).push(f);
}
