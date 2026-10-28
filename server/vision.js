/**
 * Gemini image checks: is this a meal, and what kind of place is this photo.
 *
 * Pure functions only - no network, no env - like gemini.js. server.js does
 * the fetch. The model answers in JSON against a fixed schema, and the
 * answer is validated here before it reaches the game, so a confused or
 * chatty reply can never pay XP by accident.
 *
 * Images are checked and dropped: nothing is written to disk or logged.
 */

import { thinkingLevel } from './gemini.js';

/** Largest image accepted, as base64 characters (~1.5 MB of JPEG). */
export const MAX_IMAGE_CHARS = 2_000_000;
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Photo places, from most to least rewarding. Keys match ACTIONS.photo.places. */
export const PLACES = ['natureza', 'passeio', 'trabalho', 'casa', 'outro'];

const KINDS = {
  meal: {
    prompt: `
Você verifica fotos de refeições para um app de hábitos saudáveis.
Responda se a foto mostra comida de verdade (um prato, lanche, fruta, bebida
nutritiva, marmita...). Embalagem fechada, cardápio, tela com foto de comida
ou desenho não contam. Em "label", descreva a comida em até 5 palavras, em
português do Brasil (ex.: "arroz, feijão e salada"). Se não for comida,
"label" diz o que aparece.`.trim(),
    schema: {
      type: 'OBJECT',
      properties: {
        isFood: { type: 'BOOLEAN' },
        label: { type: 'STRING' },
      },
      required: ['isFood', 'label'],
    },
  },
  photo: {
    prompt: `
Você classifica fotos de um app que incentiva a pessoa a sair e viver o dia.
Primeiro confira se é uma fotografia real tirada com câmera. Desenho,
ilustração, imagem gerada, captura de tela, foto de uma tela ou de uma
imagem impressa é sempre "outro", mesmo que mostre um parque ou paisagem.
Se for uma fotografia real, escolha "place" pelo lugar onde ela foi tirada:
- natureza: parque, praia, trilha, jardim, céu, árvores, animais, campo.
- passeio: lugar visitado fora de casa e do trabalho: rua, praça, museu,
  restaurante, ponto turístico, evento, cidade.
- trabalho: escritório, loja, sala de aula, ambiente de trabalho ou estudo.
- casa: dentro de casa: quarto, sala, cozinha, banheiro.
- outro: não dá para saber, imagem escura, ou não é fotografia real.
Em "label", descreva a cena em até 5 palavras, em português do Brasil.`.trim(),
    schema: {
      type: 'OBJECT',
      properties: {
        place: { type: 'STRING', enum: PLACES },
        label: { type: 'STRING' },
      },
      required: ['place', 'label'],
    },
  },
};

export const VISION_KINDS = Object.keys(KINDS);

/**
 * Validates what the browser sent. Throws with a user-safe message.
 *
 * @param {unknown} body  { kind, image (base64, no data: prefix), mime }
 */
export function cleanVision(body) {
  const kind = body?.kind;
  if (!KINDS[kind]) throw new Error('Tipo de verificação inválido.');
  const mime = IMAGE_TYPES.includes(body?.mime) ? body.mime : null;
  if (!mime) throw new Error('Formato de imagem inválido.');
  const image = String(body?.image ?? '');
  if (!image || image.length > MAX_IMAGE_CHARS || !/^[A-Za-z0-9+/=]+$/.test(image)) {
    throw new Error('Imagem inválida ou grande demais.');
  }
  return { kind, mime, image };
}

/** Body for POST {API_BASE}/{model}:generateContent */
export function buildVisionRequest({ kind, mime, image }, model) {
  const spec = KINDS[kind];
  return {
    systemInstruction: { parts: [{ text: spec.prompt }] },
    contents: [{ role: 'user', parts: [{ inlineData: { mimeType: mime, data: image } }] }],
    generationConfig: {
      // Same photo, same answer, as far as the model allows: no creativity.
      temperature: 0,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json',
      responseSchema: spec.schema,
      thinkingConfig: { thinkingLevel: thinkingLevel(model) },
    },
  };
}

/**
 * Pulls the checked answer out of a generateContent response, or null when
 * it is missing or does not match the schema.
 *
 * @returns {{isFood: boolean, label: string} | {place: string, label: string} | null}
 */
export function extractVision(kind, json) {
  const parts = json?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return null;
  const text = parts.filter((p) => !p.thought).map((p) => p.text || '').join('').trim();
  let data;
  try { data = JSON.parse(text); } catch { return null; }
  const label = String(data?.label ?? '').trim().slice(0, 60);
  if (kind === 'meal') {
    return typeof data?.isFood === 'boolean' ? { isFood: data.isFood, label } : null;
  }
  if (kind === 'photo') {
    return PLACES.includes(data?.place) ? { place: data.place, label } : null;
  }
  return null;
}
