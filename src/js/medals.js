/**
 * Medals: fixed milestones on what the player has already done.
 *
 * Every one is a published number the player can read before reaching it,
 * and none of them can be lost - the counters they watch only go up. They
 * are a record of the past, not a goal the game nags about, so nothing in
 * the UI pushes the player toward the next one.
 *
 *   kind  - which counter the medal watches
 *             units    units of `type` logged, lifetime
 *             xp       lifetime XP
 *             level    pet level
 *             days     days with at least one action logged
 *             trilhas  trilhas finished
 *   goal  - the value that earns it
 */
export const MEDALS = [
  { id: 'first',     kind: 'xp',      goal: 1,      name: 'Primeiro registro', desc: 'Registrar a primeira atividade.' },
  { id: 'photo-10',  kind: 'units', type: 'photo',  goal: 10,     name: 'Olhar atento',    desc: '10 fotos registradas.' },
  { id: 'photo-50',  kind: 'units', type: 'photo',  goal: 50,     name: 'Álbum cheio',     desc: '50 fotos registradas.' },
  { id: 'steps-50k', kind: 'units', type: 'steps',  goal: 50000,  name: 'Em movimento',    desc: '50.000 passos.' },
  { id: 'steps-250k',kind: 'units', type: 'steps',  goal: 250000, name: 'Incansável',      desc: '250.000 passos.' },
  { id: 'book-200',  kind: 'units', type: 'book',   goal: 200,    name: 'Leitor',          desc: '200 páginas lidas.' },
  { id: 'book-1000', kind: 'units', type: 'book',   goal: 1000,   name: 'Rato de livraria',desc: '1.000 páginas lidas.' },
  { id: 'course-600',kind: 'units', type: 'course', goal: 600,    name: 'Estudioso',       desc: '10 horas de estudo.' },
  { id: 'course-3000',kind:'units', type: 'course', goal: 3000,   name: 'Dedicado',        desc: '50 horas de estudo.' },
  { id: 'meal-100',  kind: 'units', type: 'meal',   goal: 100,    name: 'Boa mesa',        desc: '100 refeições registradas.' },
  { id: 'days-7',    kind: 'days',    goal: 7,      name: 'Uma semana',      desc: '7 dias com atividade registrada.' },
  { id: 'days-30',   kind: 'days',    goal: 30,     name: 'Um mês',          desc: '30 dias com atividade registrada.' },
  { id: 'days-100',  kind: 'days',    goal: 100,    name: 'Cem dias',        desc: '100 dias com atividade registrada.' },
  { id: 'trilha-1',  kind: 'trilhas', goal: 1,      name: 'Primeira trilha', desc: 'Concluir uma trilha.' },
  { id: 'trilha-7',  kind: 'trilhas', goal: 7,      name: 'Sete trilhas',    desc: 'Concluir 7 trilhas.' },
  { id: 'trilha-30', kind: 'trilhas', goal: 30,     name: 'Trinta trilhas',  desc: 'Concluir 30 trilhas.' },
  { id: 'lv-16',     kind: 'level',   goal: 16,     name: 'Primeira evolução', desc: 'Chegar ao Nv. 16.' },
  { id: 'lv-36',     kind: 'level',   goal: 36,     name: 'Forma final',     desc: 'Chegar ao Nv. 36.' },
  { id: 'xp-1000',   kind: 'xp',      goal: 4000,   name: 'Quatro mil de XP', desc: '4.000 XP acumulados.' },
  { id: 'xp-5000',   kind: 'xp',      goal: 20000,  name: 'Vinte mil de XP', desc: '20.000 XP acumulados.' },
];
