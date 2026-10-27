/**
 * Every form the pet can take, and how it gets there.
 *
 * Four eggs, each with a base form. At Nv 16 the base form branches into
 * one of three Raro forms, and at Nv 36 each of those branches into one
 * Lendário and two Épico forms - 4 + 12 + 36 = 52 forms in all.
 *
 * Which branch the pet takes is decided by its status bars at the moment it
 * reaches the evolution level. Nothing is rolled. The rule is in
 * `pickBranch` in state.js and the info screen shows, live, which form the
 * pet would become if it evolved right now.
 *
 *   needs  - { stat: pct } every bar must be at or above pct
 *   favors - [stat, ...] used when a group has no `needs`: the branch whose
 *            favoured bar is highest wins
 *
 * Only the first form has art so far; every other form borrows it until its
 * own sprite lands. Swap `art` (and tune `scale`) per form when it does.
 */

const ART = 'assets/pet/tigrinho-0.webp';
const SCALE = 62;

/** Levels at which the pet evolves. */
export const EVOLVE_AT = [16, 36];

const list = [];

function form(id, name, type, rarity, extra = {}) {
  list.push({ id, name, type, rarity, art: ART, scale: SCALE, from: null, ...extra });
}

// ---------- Ovo Branco: Normal ----------

form('tigrin', 'Tigrin', 'Normal', 'comum',
  { desc: 'O Tigrinho base, equilibrado e com grande potencial de adaptação.' });

form('tigreluz', 'Tigreluz', 'Normal/Luz', 'raro',
  { from: 'tigrin', needs: { happiness: 80, health: 80 }, desc: 'Um tigre de pelagem brilhante.' });
form('mentetigre', 'MenteTigre', 'Normal/Psíquico', 'raro',
  { from: 'tigrin', needs: { wisdom: 85 }, desc: 'Um tigre flutuante que ataca com o poder da mente.' });
form('sombriger', 'Sombriger', 'Normal/Sombrio', 'raro',
  { from: 'tigrin', needs: { fullness: 90, wisdom: 80 },
    desc: 'Um tigre noturno e furtivo, bem alimentado e esperto o bastante para dominar a escuridão.' });

form('palatigre', 'Palatigre', 'Normal/Luz', 'lendario', { from: 'tigreluz', needs: { health: 100 } });
form('auroriger', 'Auroriger', 'Normal/Luz', 'epico', { from: 'tigreluz', needs: { happiness: 100 } });
form('tigreanjo', 'Tigreanjo', 'Normal/Luz', 'epico', { from: 'tigreluz', needs: { wisdom: 90 } });

form('alquimiger', 'Alquimiger', 'Normal/Psíquico', 'lendario', { from: 'mentetigre', favors: ['wisdom'] });
form('tigre-mestre', 'Tigre-Mestre', 'Normal/Psíquico', 'epico', { from: 'mentetigre', favors: ['health', 'fullness'] });
form('ilusioniger', 'Ilusioniger', 'Normal/Psíquico', 'epico', { from: 'mentetigre', favors: ['happiness'] });

form('tigre-abissal', 'Tigre-Abissal', 'Normal/Sombrio', 'lendario', { from: 'sombriger', favors: ['wisdom'] });
form('fantomiger', 'Fantomiger', 'Normal/Sombrio', 'epico', { from: 'sombriger', favors: ['happiness'] });
form('gatuno-noturno', 'Gatuno-Noturno', 'Normal/Sombrio', 'epico', { from: 'sombriger', favors: ['health', 'fullness'] });

// ---------- Ovo Vermelho: Fogo ----------

form('brasinha', 'Brasinha', 'Fogo', 'comum',
  { desc: 'Um Tigrinho quente, com pelagem avermelhada e muita energia.' });

form('tigre-fornalha', 'Tigre-Fornalha', 'Fogo/Metálico', 'raro',
  { from: 'brasinha', needs: { health: 90, wisdom: 70 }, desc: 'Desenvolve uma armadura de ferro quente.' });
form('chamatigre', 'Chamatigre', 'Fogo/Fada', 'raro',
  { from: 'brasinha', needs: { happiness: 85 }, desc: 'O fogo dele se torna mágico e curativo.' });
form('vulcaniger', 'Vulcaniger', 'Fogo/Terrestre', 'raro',
  { from: 'brasinha', needs: { fullness: 95 },
    desc: 'Usa o excesso de energia como combustível para virar magma e rocha pura.' });

form('mechatigre', 'Mechatigre', 'Fogo/Metálico', 'lendario', { from: 'tigre-fornalha', favors: ['wisdom'] });
form('tigre-tanque', 'Tigre-Tanque', 'Fogo/Metálico', 'epico', { from: 'tigre-fornalha', favors: ['health', 'fullness'] });
form('tigre-forja', 'Tigre-Forja', 'Fogo/Metálico', 'epico', { from: 'tigre-fornalha', favors: ['happiness'] });

form('fenixger', 'Fenixger', 'Fogo/Fada', 'lendario', { from: 'chamatigre', favors: ['happiness'] });
form('tigre-solar', 'Tigre-Solar', 'Fogo/Fada', 'epico', { from: 'chamatigre', favors: ['health', 'fullness'] });
form('mago-chama', 'Mago-Chama', 'Fogo/Fada', 'epico', { from: 'chamatigre', favors: ['wisdom'] });

form('tigre-terremoto', 'Tigre-Terremoto', 'Fogo/Terrestre', 'lendario', { from: 'vulcaniger', favors: ['fullness'] });
form('magmatigreo', 'Magmatígreo', 'Fogo/Terrestre', 'epico', { from: 'vulcaniger', favors: ['health'] });
form('tigre-meteoro', 'Tigre-Meteoro', 'Fogo/Terrestre', 'epico', { from: 'vulcaniger', favors: ['wisdom', 'happiness'] });

// ---------- Ovo Azul: Água ----------

form('gotigre', 'Gotigre', 'Água', 'comum',
  { desc: "Um Tigrinho dócil, com cauda semelhante a uma gota d'água." });

form('coraliger', 'Coraliger', 'Água/Fada', 'raro',
  { from: 'gotigre', needs: { happiness: 90 }, desc: 'Fica com escamas coloridas e corais no corpo.' });
form('neviger', 'Neviger', 'Água/Gelo', 'raro',
  { from: 'gotigre', needs: { wisdom: 70, health: 80 },
    desc: 'A água em seu corpo congela, formando uma armadura de gelo.' });
form('toxitigre', 'Toxitigre', 'Água/Veneno', 'raro',
  { from: 'gotigre', needs: { wisdom: 95, health: 90 },
    desc: 'Usa intelecto e imunidade para sintetizar toxinas sem se ferir.' });

form('tigre-leviata', 'Tigre-Leviatã', 'Água/Fada', 'lendario', { from: 'coraliger', favors: ['health', 'fullness'] });
form('sereiger', 'Sereiger', 'Água/Fada', 'epico', { from: 'coraliger', favors: ['happiness'] });
form('oceaniger', 'Oceaniger', 'Água/Fada', 'epico', { from: 'coraliger', favors: ['wisdom'] });

form('tigre-glacial', 'Tigre-Glacial', 'Água/Gelo', 'lendario', { from: 'neviger', favors: ['wisdom'] });
form('tigre-nevasca', 'Tigre-Nevasca', 'Água/Gelo', 'epico', { from: 'neviger', favors: ['health', 'fullness'] });
form('cristaliger', 'Cristaliger', 'Água/Gelo', 'epico', { from: 'neviger', favors: ['happiness'] });

form('tigre-pantanoso', 'Tigre-Pantanoso', 'Água/Veneno', 'lendario', { from: 'toxitigre', favors: ['health', 'fullness'] });
form('poluiger', 'Poluiger', 'Água/Veneno', 'epico', { from: 'toxitigre', favors: ['happiness'] });
form('tigre-acido', 'Tigre-Ácido', 'Água/Veneno', 'epico', { from: 'toxitigre', favors: ['wisdom'] });

// ---------- Ovo Verde: Grama ----------

form('folhiger', 'Folhiger', 'Grama', 'comum',
  { desc: 'Um Tigrinho com folhagens no lugar da juba, que adora sol.' });

form('floriger', 'Floriger', 'Grama/Fada', 'raro',
  { from: 'folhiger', needs: { happiness: 90 }, desc: 'Flores exóticas desabrocham em sua juba.' });
form('troncotigre', 'Troncotigre', 'Grama/Lutador', 'raro',
  { from: 'folhiger', needs: { health: 90, fullness: 80 },
    desc: 'Fica robusto, com patas que parecem madeira de carvalho.' });
form('espinhiger', 'Espinhiger', 'Grama/Sombrio', 'raro',
  { from: 'folhiger', needs: { health: 95, wisdom: 85 },
    desc: 'Folhas supernutridas viram espinhos robustos para se defender.' });

form('tigre-yggdrasil', 'Tigre-Yggdrasil', 'Grama/Fada', 'lendario', { from: 'floriger', favors: ['health', 'fullness'] });
form('xamatiger', 'Xamãtiger', 'Grama/Fada', 'epico', { from: 'floriger', favors: ['wisdom'] });
form('primaveriger', 'Primaveriger', 'Grama/Fada', 'epico', { from: 'floriger', favors: ['happiness'] });

form('tigre-tita', 'Tigre-Titã', 'Grama/Lutador', 'lendario', { from: 'troncotigre', favors: ['health', 'fullness'] });
form('lenhadoriger', 'Lenhadoriger', 'Grama/Lutador', 'epico', { from: 'troncotigre', favors: ['wisdom'] });
form('tigre-selvagem', 'Tigre-Selvagem', 'Grama/Lutador', 'epico', { from: 'troncotigre', favors: ['happiness'] });

form('tigre-parasita', 'Tigre-Parasita', 'Grama/Sombrio', 'lendario', { from: 'espinhiger', favors: ['wisdom'] });
form('tigre-venoso', 'Tigre-Venoso', 'Grama/Sombrio', 'epico', { from: 'espinhiger', favors: ['health', 'fullness'] });
form('sombra-da-mata', 'Sombra-Da-Mata', 'Grama/Sombrio', 'epico', { from: 'espinhiger', favors: ['happiness'] });

/** id -> form */
export const FORMS = Object.fromEntries(list.map((f) => [f.id, f]));

/** id -> the forms it can evolve into, in listed order (which breaks ties). */
export const BRANCHES = {};
for (const f of list) {
  if (f.from) (BRANCHES[f.from] ||= []).push(f);
}
