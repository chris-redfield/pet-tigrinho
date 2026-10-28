/**
 * Gemini finance agent: the prompt and the request/response shapes.
 *
 * Pure functions only - no network, no env - so it can be unit tested and
 * reused from a serverless function later. server.js does the fetch.
 */

/**
 * Tried in order: when one is overloaded (503), rate limited (429) or too
 * slow, the server moves on to the next. Measured Oct 2026 with the real
 * prompt: 3.6-flash ~4s, 3.5-flash-lite ~5s; 3.8-flash was the newest but
 * often answered 503 "high demand" or hung past 45s.
 */
export const DEFAULT_MODEL = 'gemini-3.6-flash';
export const FALLBACK_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.8-flash'];

/** Primary model first, then the fallbacks, without repeats. */
export function modelChain(primary = DEFAULT_MODEL, fallbacks = FALLBACK_MODELS) {
  return [...new Set([primary, ...fallbacks].map((m) => m.trim()).filter(Boolean))];
}

/**
 * How hard each model "thinks" before answering. A short educational reply
 * needs little reasoning, and less thinking is much faster (3.6-flash: ~4s
 * at minimal, ~11s at low). Not every model accepts every level -
 * 3.8-flash rejects MINIMAL with a 400 - so overrides live here.
 */
const THINKING = { 'gemini-3.8-flash': 'low' };
export function thinkingLevel(model) {
  return THINKING[model] || 'minimal';
}

/**
 * Whether a failed upstream call is worth retrying on the next model:
 * overload, rate limit, server errors, and a model refusing our thinking
 * level. A bad key or a malformed request is final.
 */
export function isRetryable(status, message = '') {
  return status === 429 || status >= 500 || (status === 400 && /thinking/i.test(message));
}
export const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/** Keeps a single request small and cheap. */
export const LIMITS = { messages: 12, chars: 800 };

/**
 * The agent's standing instructions.
 *
 * The audience is people coming off gambling games, so the anti-gambling
 * part is not a footnote: it is said every time money comes up. The agent
 * educates, it does not decide for anyone, and it never quotes a rate it
 * cannot know is current.
 */
export const SYSTEM_PROMPT = `
Você é o Tigrin, o tigrinho mascote do app Pet Tigrinho, e aqui atua como assistente de educação financeira.
Fale em primeira pessoa como o Tigrin: simpático e próximo, mas sério quando o assunto é dinheiro.
O app ajuda pessoas que estão saindo de jogos de aposta (como o "jogo do tigrinho")
a criar hábitos saudáveis. Fale em português do Brasil, com linguagem simples e acolhedora.

QUANDO O USUÁRIO INFORMAR UM VALOR:
- Primeiro, lembre da reserva de emergência (de 3 a 6 meses de gastos) antes de qualquer outra aplicação.
- Sugira onde o dinheiro pode render, com foco no Banco do Brasil:
  - Tesouro Selic, comprado pela BB Investimentos (ótimo para reserva de emergência).
  - CDB do Banco do Brasil com liquidez diária.
  - LCI e LCA do Banco do Brasil (normalmente isentas de IR para pessoa física; peça para conferir as regras vigentes).
  - Poupança do BB (simples, mas costuma render menos).
  - Fundos de investimento BB (atenção à taxa de administração).
  - Previdência Brasilprev, só para objetivos de longo prazo.
- Para cada sugestão, diga em uma linha o risco, a liquidez e para qual prazo serve.
- Ajuste ao valor: com pouco dinheiro, foque na reserva e em produtos com aplicação mínima baixa.
- Mencione que CDB, LCI e LCA têm garantia do FGC dentro dos limites do fundo.
- NUNCA invente taxas, percentuais ou rentabilidades atuais. Diga para conferir no app do BB ou no site do Tesouro Direto.

APOSTAS:
- Afirme com clareza que o usuário NÃO deve colocar dinheiro em cassinos online, bets, apostas esportivas
  ou jogos como o do tigrinho: isso não é investimento, a casa sempre ganha no longo prazo e o resultado é perda.
- Se o usuário falar que aposta, que perdeu dinheiro ou que sente vontade de apostar, acolha sem julgamento
  e indique ajuda: Jogadores Anônimos (jogadoresanonimos.org.br), o CAPS mais próximo pelo SUS,
  e o CVV pelo telefone 188 em caso de sofrimento emocional.

NUNCA:
- Recomende apostas, "ganho rápido", day trade, criptomoedas especulativas, pirâmides ou promessas de retorno garantido.
- Peça ou aceite senha, CPF, número de conta ou cartão. Se o usuário enviar, avise para não compartilhar.
- Apresente sua resposta como recomendação personalizada. Feche dizendo que são sugestões educativas e que,
  para decidir, vale conversar com o gerente do BB ou um profissional certificado.

FORMATO: no máximo cerca de 180 palavras, frases curtas, listas com "- ", **negrito** só nos nomes dos produtos,
sem tabelas e sem títulos. Se o assunto não for finanças pessoais, redirecione com gentileza.
`.trim();

/**
 * Validates the chat history sent by the browser and keeps only what the
 * API needs. Throws with a user-safe message on bad input.
 *
 * @param {unknown} messages  [{ role: 'user'|'model', text: string }, ...]
 */
export function cleanHistory(messages) {
  if (!Array.isArray(messages) || messages.length === 0) throw new Error('Mensagem vazia.');
  const recent = messages.slice(-LIMITS.messages).map((m) => ({
    role: m?.role === 'model' ? 'model' : 'user',
    text: String(m?.text ?? '').trim().slice(0, LIMITS.chars),
  })).filter((m) => m.text);
  if (recent.at(-1)?.role !== 'user') throw new Error('A última mensagem precisa ser do usuário.');
  return recent;
}

/** Body for POST {API_BASE}/{model}:generateContent */
export function buildRequest(history, model = DEFAULT_MODEL) {
  return {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: history.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
    generationConfig: {
      temperature: 0.4,
      // Gemini 3 models "think" before answering, and those tokens count
      // against this budget: at 1024 the reply came back cut off.
      maxOutputTokens: 4096,
      thinkingConfig: { thinkingLevel: thinkingLevel(model) },
    },
  };
}

/** Pulls the reply text out of a generateContent response, or null. */
export function extractReply(json) {
  const parts = json?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return null;
  const text = parts.filter((p) => !p.thought).map((p) => p.text || '').join('').trim();
  return text || null;
}
