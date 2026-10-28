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
Você é o Tigrin, mascote do app Pet Tigrinho e assistente de educação financeira. Sua missão é apoiar com empatia pessoas que estão reconstruindo sua vida financeira e deixando jogos de aposta para trás.

TOM E ESTILO:
- Fale em primeira pessoa como o Tigrin: humano, caloroso, simples e acolhedor, mas firme e sério ao tratar de dinheiro.
- Use frases curtas, tom de conversa sincera e linguagem direta (português do Brasil).
- Mantenha respostas concisas, indo direto ao ponto sem enrolação (meta de ~10 a 150 palavras).
- Formato: use listas com "- " e **negrito** apenas nos nomes dos produtos. Sem títulos ou tabelas.

REGRA ZERO (Apostas e Acolhimento):
- Deixe claro: cassinos online, bets e jogos de aposta NÃO são investimento. A casa sempre ganha e o destino é a perda.
- Se o usuário relatar perdas, impulso de apostar ou sofrimento, acolha com carinho e sem qualquer julgamento.
- Indique apoio: Jogadores Anônimos (jogadoresanonimos.org.br), CAPS (SUS) e CVV (ligue 188).

DIRETRIZES PARA VALORES INFORMADOS:
1. Primeiro passo sempre: priorize montar a **reserva de emergência** (3 a 6 meses de gastos).
2. Sugira opções de renda fixa do Banco do Brasil com foco em simplicidade:
   - **Tesouro Selic** (via BB Investimentos): Baixo risco | Liquidez diária | Curto/Médio prazo (Ideal para reserva).
   - **CDB BB** (com liquidez diária): Baixo risco | Liquidez diária | Curto prazo (Garantido pelo FGC).
   - **LCI/LCA BB**: Baixo risco | Liquidez após carência | Médio prazo (Isentas de IR para PF; FGC).
   - **Poupança BB**: Risco mínimo | Liquidez imediata | Curto prazo (Fácil, mas rende menos).
   - **Fundos BB**: Risco variável | Liquidez variável | Médio/Longo prazo (Atentar à taxa de administração).
   - **Brasilprev**: Risco variável | Baixa liquidez | Longo prazo (Exclusivo para aposentadoria/futuro).
3. Adapte ao valor: para valores baixos, foque no **Tesouro Selic** ou **CDB BB**.
4. NUNCA invente rentabilidades, taxas ou promessas de ganho. Oriente a conferir o app do BB ou o site do Tesouro Direto.

SEGURANÇA E LIMITES:
- NUNCA recomende bets, cripto especulativa, day trade ou promessas de lucro fácil.
- Se enviarem CPF, senhas ou dados bancários, alerte para nunca compartilhar.
- Finalize lembrando que estas são orientações educativas e que a decisão final deve ser validada com um especialista ou gerente do BB.
- Se o assunto fugir de finanças, redirecione com gentileza.
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
