/**
 * Tigrin's fixed answers for when the AI cannot be reached, so the Finanças
 * chat never shows an error. They are chosen in the browser from the
 * amount in the message, by band. No rates or percentages: those change,
 * and a stale number in a demo is worse than none. Every answer ends with
 * the same reminder the AI gives.
 */

const REMINDER = '**Lembrete:** aposta, bet e cassino online não são investimento.';

/**
 * Reads a money amount from free text: "tenho R$ 1.500,00", "500 reais",
 * "5 mil", "2k". Returns null when there is no number.
 *
 * @param {string} text
 * @returns {number|null}
 */
export function parseAmount(text) {
  const m = String(text).toLowerCase().match(/(\d[\d.,]*)\s*(mil\b|k\b)?/);
  if (!m) return null;
  let digits = m[1];
  // pt-BR: "." groups thousands and "," marks cents ("1.500,50").
  if (digits.includes(',')) digits = digits.replace(/\./g, '').replace(',', '.');
  else if (/\.\d{3}(\.|$)/.test(digits)) digits = digits.replace(/\./g, '');
  const value = Number.parseFloat(digits);
  if (!Number.isFinite(value)) return null;
  return m[2] ? value * 1000 : value;
}

const brl = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

const BETS = /\b(bets?|apost\w*|cassino|tigrinho|roleta|slots?|jogo do bicho)\b/i;

/**
 * @param {string} text  the player's message
 * @returns {string}     reply in the same light markdown the AI uses ("- " lists, **bold**)
 */
export function offlineReply(text) {
  if (BETS.test(text)) {
    return [
      'Aposta não é investimento: bets, cassinos online e o jogo do tigrinho são feitos para a casa ganhar no longo prazo.',
      'Se a ideia é fazer o dinheiro crescer, o caminho é outro:',
      '- **Reserva de emergência** primeiro, num lugar com liquidez diária',
      '- Depois, **Tesouro Selic** ou **CDB do BB**, que rendem todo dia',
      'Se apostar está pesando, o **Jogadores Anônimos** e o **CVV (188)** ajudam, de graça.',
    ].join('\n');
  }

  const amount = parseAmount(text);

  if (amount === null || amount <= 0) {
    return [
      'Posso te ajudar a fazer um dinheiro render com segurança! Me conta um valor, por exemplo **"tenho R$ 300"**.',
      'Enquanto isso, a regra de ouro:',
      '- Primeiro uma **reserva de emergência** (uns 3 a 6 meses de gastos)',
      '- Só depois pense em prazos mais longos',
      REMINDER,
    ].join('\n');
  }

  const value = brl(amount);

  if (amount < 200) {
    return [
      `Com ${value} já dá para começar, e começar é o mais importante!`,
      '- **Tesouro Selic** aceita valores pequenos e rende todo dia útil',
      '- O **CDB do BB** com liquidez diária é simples de aplicar pelo app',
      '- Guardar um pouco todo mês vale mais que um valor grande de uma vez',
      REMINDER,
    ].join('\n');
  }

  if (amount < 1000) {
    return [
      `${value} é um ótimo começo para a sua **reserva de emergência**.`,
      '- **Tesouro Selic**: seguro e com resgate rápido',
      '- **CDB do BB com liquidez diária**: tira quando precisar',
      '- A **poupança** é fácil, mas costuma render menos que essas duas',
      REMINDER,
    ].join('\n');
  }

  if (amount < 5000) {
    return [
      `Com ${value} dá para separar em duas partes:`,
      '- **Reserva de emergência** no Tesouro Selic ou num CDB do BB com liquidez diária',
      '- O que não vai precisar logo pode ir para **LCI ou LCA do BB**, que são isentas de IR para pessoa física',
      '- Confira o prazo de carência antes de aplicar',
      REMINDER,
    ].join('\n');
  }

  return [
    `${value} já permite montar uma carteira simples:`,
    '- Garanta primeiro a **reserva de emergência** (Tesouro Selic ou CDB com liquidez diária)',
    '- Para prazos maiores: **LCI/LCA do BB**, **CDB com vencimento** ou **Tesouro IPCA+**',
    '- Dividir entre prazos diferentes deixa o dinheiro rendendo sem ficar preso',
    '- Para algo mais personalizado, vale conversar com o seu gerente no BB',
    REMINDER,
  ].join('\n');
}
