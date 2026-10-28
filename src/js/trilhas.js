/**
 * Trilhas: one short mission per day.
 *
 * A trilha is a handful of the same five real-world actions the home screen
 * already logs, plus one small thing worth knowing. Nothing here is a new
 * way to earn: the tasks are tracked from what the player logs anyway, and
 * finishing the day pays one flat, printed bonus.
 *
 * Rules this file has to keep (see the README):
 *   - the bonus is fixed and shown before the player commits, never a roll;
 *   - a missed day costs nothing - there is no streak to break, the trilha
 *     simply waits;
 *   - task targets stay well under the daily caps in config.js, so no
 *     trilha can ask for more than a day's worth of anything.
 */

/** Flat, published bonus for finishing a day's trilha. */
export const TRILHA_XP = 25;

/**
 * The days, in order. `tasks` are action ids and the units the day asks
 * for; `note` is the small thing shown on the day's card.
 *
 * The list is finite and the path is not: `trilhaFor` wraps around, so a
 * player on day 40 gets day 4's tasks under the label "Dia 40". Add days
 * here and the wrap moves with them.
 */
export const TRILHAS = [
  {
    title: 'O primeiro passo',
    tasks: [{ type: 'photo', units: 1 }, { type: 'meal', units: 1 }],
    note: {
      title: 'Começar já é o passo maior',
      text: 'O dia 1 de qualquer coisa é o mais difícil, e você já está nele. Aqui nada zera: o que você registrar hoje continua contando amanhã.',
    },
  },
  {
    title: 'Pé na estrada',
    tasks: [{ type: 'steps', units: 2000 }, { type: 'meal', units: 2 }],
    note: {
      title: 'Caminhar é remédio barato',
      text: 'Caminhadas curtas e regulares ajudam a baixar a ansiedade. Não precisa de academia, nem de roupa certa: dois mil passos já contam.',
    },
  },
  {
    title: 'Página virada',
    tasks: [{ type: 'book', units: 10 }, { type: 'photo', units: 1 }],
    note: {
      title: 'Dez páginas antes de dormir',
      text: 'Ler desacelera o corpo e ocupa a cabeça na hora em que ela costuma acelerar. Dez páginas já mudam o sono de muita gente.',
    },
  },
  {
    title: 'Trinta minutos',
    tasks: [{ type: 'course', units: 30 }, { type: 'meal', units: 2 }],
    note: {
      title: 'Meia hora por dia vira muito',
      text: 'Trinta minutos de estudo por dia dão quinze horas em um mês. É assim que curso online termina: aos poucos, não de uma vez.',
    },
  },
  {
    title: 'Corpo em dia',
    tasks: [{ type: 'steps', units: 4000 }, { type: 'meal', units: 3 }],
    note: {
      title: 'Horário certo acalma',
      text: 'Comer mais ou menos nos mesmos horários todo dia ajuda o corpo a regular o humor. Fome e sono bagunçados deixam qualquer um mais no limite.',
    },
  },
  {
    title: 'Dia de leitura',
    tasks: [{ type: 'book', units: 20 }, { type: 'course', units: 30 }],
    note: {
      title: 'Tédio é um gatilho',
      text: 'A vontade de apostar costuma aparecer no tempo vazio. Ter algo na mão para esses minutos é metade do caminho.',
    },
  },
  {
    title: 'Semana fechada',
    tasks: [{ type: 'photo', units: 2 }, { type: 'steps', units: 3000 }, { type: 'meal', units: 3 }],
    note: {
      title: 'A primeira semana é a mais pesada',
      text: 'Muita gente conta que os primeiros dias são os piores e que o sono melhora logo depois. Se você chegou até aqui, a parte mais íngreme ficou para trás.',
    },
  },
  {
    title: 'Rotina',
    tasks: [{ type: 'course', units: 60 }, { type: 'meal', units: 2 }],
    note: {
      title: 'Saber para onde vai o dinheiro',
      text: 'Anotar os gastos, sem se julgar por eles, costuma assustar bem menos do que não saber. A aba Finanças ajuda a pensar no que fazer com o que sobra.',
    },
  },
  {
    title: 'Caminhada longa',
    tasks: [{ type: 'steps', units: 6000 }, { type: 'photo', units: 1 }],
    note: {
      title: 'A vontade passa',
      text: 'O impulso de apostar costuma durar poucos minutos. Sair para caminhar atravessa esse tempo, e quando você volta ele geralmente já foi.',
    },
  },
  {
    title: 'Mergulho nos livros',
    tasks: [{ type: 'book', units: 30 }, { type: 'course', units: 30 }],
    note: {
      title: 'Você pode ligar antes da crise',
      text: 'O CVV atende de graça, 24 horas, no 188, com sigilo. Não precisa estar no fundo do poço para ligar — a aba Ajuda tem outros caminhos.',
    },
  },
  {
    title: 'Dia completo',
    tasks: [
      { type: 'photo', units: 2 },
      { type: 'steps', units: 4000 },
      { type: 'book', units: 10 },
      { type: 'meal', units: 3 },
    ],
    note: {
      title: 'Recaída não apaga o caminho',
      text: 'Se um dia sair do trilho, nada aqui volta a zero: o XP só sobe e o bichinho continua te esperando exatamente onde estava.',
    },
  },
  {
    title: 'Marco',
    tasks: [{ type: 'course', units: 90 }, { type: 'steps', units: 5000 }, { type: 'meal', units: 3 }],
    note: {
      title: 'Contar para alguém ajuda',
      text: 'Quem divide a decisão com uma pessoa de confiança costuma ter mais facilidade para mantê-la. Não precisa ser para todo mundo — uma pessoa basta.',
    },
  },
];

/** The trilha for a day number, wrapping around the list. Day 1 is the first. */
export function trilhaFor(day) {
  const def = TRILHAS[(day - 1) % TRILHAS.length];
  return { ...def, day };
}
