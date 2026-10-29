/**
 * Every form the pet can take, and how it gets there.
 *
 * Eight evolution lines of three forms each, hatched from four eggs. Every
 * egg branches at Nv 16, depending on the status bars, and each branch has
 * one final form:
 * Tigrin becomes Estreliger (cosmic: out walking and taking photos) or
 * Tigran (wise: reading and studying); Brasinha becomes Tigre-Fornalha
 * (metal: study and meals) or Vulcaniger (lava: walking); Tigre d'Água
 * becomes Oceaniger (water) or Neviger (ice); Folhiger becomes Floriger
 * (flowers: photos) or Tigrelis (fungi: meals).
 *
 *   Branco   Tigrin   -> Estreliger      -> Tigre Cósmico
 *                     -> Tigran          -> Tigre Sábio
 *   Vermelho Brasinha -> Tigre-Fornalha  -> Mechatigre
 *                     -> Vulcaniger      -> Magmatígreo
 *   Azul     Tigre d'Água -> Oceaniger  -> Tigre-Leviatã
 *                         -> Neviger    -> Tigre-Glacial
 *   Verde    Folhiger -> Floriger        -> Tigre-Yggdrasil
 *                     -> Tigrelis        -> Parasitigre
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
 * Sprites live at assets/pet/<id>.webp, with a small copy in
 * assets/pet/thumb/, and are listed in sprites.js, which tools/sprites.py
 * writes. A form without one borrows Tigrin's until it
 * lands. `scale` is the sprite width as a percentage of stage width; later
 * forms carry effects outside the body and get more room by default. Pass
 * `scale` to a form to override it.
 *
 * `aura` is the colour of the glow around the pet when it is ready to
 * evolve. A form inherits its parent's unless it sets its own, so it is set
 * once per line, and again where a line changes element (Neviger).
 */

import { SPRITES } from './sprites.js';

const FALLBACK = 'tigrin';
const SCALE = { comum: 62, raro: 78, lendario: 84 };

/** Levels at which the pet evolves. */
export const EVOLVE_AT = [16, 36];

const list = [];

function form(id, name, type, rarity, extra = {}) {
  const file = SPRITES.includes(id) ? id : FALLBACK;
  const art = `assets/pet/${file}.webp`;
  const thumb = `assets/pet/thumb/${file}.webp`;   // 288px, for small pictures
  const parent = list.find((f) => f.id === extra.from);
  list.push({ id, name, type, rarity, art, thumb, scale: SCALE[rarity], from: null, aura: parent?.aura, ...extra });
}

// ---------- Ovo Branco: Cósmico ----------

form('tigrin', 'Tigrin', 'Normal', 'comum',
  { aura: '#ffd36b', desc: 'O Tigrinho base, equilibrado e com grande potencial de adaptação.' });
// Estreliger is the explorer (Felicidade from photos, Saúde from steps);
// Tigran the scholar (Sabedoria from reading and study). One bar each
// way, so either is reachable by leaning into it for a phase.
form('estreliger', 'Estreliger', 'Normal/Cósmico', 'raro',
  { from: 'tigrin', needs: { happiness: 50, health: 50 }, aura: '#9b8cff',
    desc: 'As listras brilham como constelações e pequenas estrelas orbitam ao redor.' });
form('tigran', 'Tigran', 'Normal/Psíquico', 'raro',
  { from: 'tigrin', needs: { wisdom: 70 }, aura: '#7ee0c3',
    desc: 'De tanto ler e estudar, ganhou óculos redondos e um colete de aprendiz.' });

form('tigre-cosmico', 'Tigre Cósmico', 'Normal/Cósmico', 'lendario',
  { from: 'estreliger', desc: 'Carrega uma galáxia na cauda e planetas em órbita.' });
form('tigre-sabio', 'Tigre Sábio', 'Normal/Psíquico', 'lendario',
  { from: 'tigran', desc: 'Um mestre de barba branca e cajado de bambu, que ensina com paciência.' });

// ---------- Ovo Vermelho: Fogo ----------

form('brasinha', 'Brasinha', 'Fogo', 'comum',
  { aura: '#ff8a3d', desc: 'Um Tigrinho quente, com pelagem avermelhada e muita energia.' });
// Tigre-Fornalha is the forge (Sabedoria from study, Saciedade from meals:
// a fire that is fed and tended); Vulcaniger the eruption (Saúde from
// steps: energy that has to move). Fornalha is listed first, so with
// nothing logged it is still the one the pet comes closest to.
form('tigre-fornalha', 'Tigre-Fornalha', 'Fogo/Metálico', 'raro',
  { from: 'brasinha', needs: { wisdom: 50, fullness: 50 },
    desc: 'Desenvolve uma armadura de ferro quente.' });
form('vulcaniger', 'Vulcaniger', 'Fogo/Pedra', 'raro',
  { from: 'brasinha', needs: { health: 60 }, aura: '#ff5a1f',
    desc: 'Pele de rocha vulcânica com rachaduras de magma e pontas em chamas.' });

form('mechatigre', 'Mechatigre', 'Fogo/Metálico', 'lendario',
  { from: 'tigre-fornalha', desc: 'Um tigre-robô de metal polido, com um núcleo de fogo no peito.' });
form('magmatigreo', 'Magmatígreo', 'Fogo/Pedra', 'lendario',
  { from: 'vulcaniger', desc: 'Lava escorre pelo corpo e chamas brotam da juba: um vulcão em plena erupção.' });

// ---------- Ovo Azul: Água / Gelo ----------

form('tigre-dagua', "Tigre d'Água", 'Água', 'comum',
  { scale: 78, aura: '#5cc8ff', desc: 'Um Tigrinho brincalhão, com ondas na cauda e gotas flutuando ao redor.' });

form('oceaniger', 'Oceaniger', 'Água', 'raro',
  { from: 'tigre-dagua', needs: { happiness: 70 },
    desc: 'Ondas formam sua juba e ele carrega um pequeno tridente.' });
form('neviger', 'Neviger', 'Água/Gelo', 'raro',
  { from: 'tigre-dagua', needs: { wisdom: 60, health: 60 }, aura: '#bfeaff',
    desc: 'A água em seu corpo congela, formando uma armadura de gelo.' });

form('tigre-leviata', 'Tigre-Leviatã', 'Água', 'lendario',
  { from: 'oceaniger', desc: 'Corpo longo e serpentino, com barbatanas: um dragão marinho.' });
form('tigre-glacial', 'Tigre-Glacial', 'Água/Gelo', 'lendario',
  { from: 'neviger', desc: 'Enorme, com coroa de estalactites e geada sob as patas.' });

// ---------- Ovo Verde: Grama ----------

form('folhiger', 'Folhiger', 'Grama', 'comum',
  { aura: '#8de36b', desc: 'Um Tigrinho com folhagens no lugar da juba, que adora sol.' });
// Floriger blooms in the sun (Felicidade from photos, often of nature);
// Tigrelis grows from what feeds the forest floor (Saciedade from meals).
// Same bar height, so with nothing logged the tie goes to Floriger.
form('floriger', 'Floriger', 'Grama/Fada', 'raro',
  { from: 'folhiger', needs: { happiness: 60 }, desc: 'Flores exóticas desabrocham em sua juba.' });
form('tigrelis', 'Tigrelis', 'Grama/Inseto', 'raro',
  { from: 'folhiger', needs: { fullness: 60 }, aura: '#b7f05a',
    desc: 'Pequenos cogumelos brotam na cauda e duas folhas finas crescem como antenas.' });

form('tigre-yggdrasil', 'Tigre-Yggdrasil', 'Grama/Fada', 'lendario',
  { from: 'floriger', desc: 'Uma árvore inteira cresce em suas costas, com copa luminosa.' });
form('parasitigre', 'Parasitigre', 'Grama/Inseto', 'lendario',
  { from: 'tigrelis',
    desc: 'Após entrar em simbiose com os fungos da floresta, sua estrutura corporal desenvolveu uma carapaça rígida e antenas parecidas com folhagens. O cogumelo em suas costas libera esporos que mantêm o Parasitigre em um estado constante de transe alegre, assumindo o controle de suas ações enquanto amplia seus ataques de esporos e toxinas vegetais.' });

/** id -> form */
export const FORMS = Object.fromEntries(list.map((f) => [f.id, f]));

/** id -> the forms it can evolve into, in listed order (which breaks ties). */
export const BRANCHES = {};
for (const f of list) {
  if (f.from) (BRANCHES[f.from] ||= []).push(f);
}
