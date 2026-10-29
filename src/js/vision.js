/**
 * Asks the server's AI about a photo: is it a meal, or what kind of place
 * is it (server/vision.js). The photo is shrunk first - a phone shot is
 * several MB, the check needs a few hundred KB - and sent once; the game
 * keeps nothing.
 */

const MAX_SIDE = 768;
// A server that is down fails at once; this only caps a slow AI.
const TIMEOUT_MS = 10_000;

/** Draws the image into a canvas no larger than MAX_SIDE, as base64 JPEG. */
async function shrink(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  const url = canvas.toDataURL('image/jpeg', 0.8);
  return url.slice(url.indexOf(',') + 1);
}

/**
 * @param {'meal'|'photo'} kind
 * @param {File} file
 * @returns {Promise<{isFood: boolean, label: string} | {place: string, label: string}>}
 * @throws {Error} with a message fit to show the player
 */
export async function checkPhoto(kind, file) {
  let image;
  try {
    image = await shrink(file);
  } catch {
    throw new Error('Não consegui abrir essa imagem.');
  }

  let res;
  try {
    res = await fetch('api/vision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, image, mime: 'image/jpeg' }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    throw new Error(err.name === 'TimeoutError'
      ? 'A IA demorou demais. Tente de novo.'
      : 'Sem conexão com o servidor.');
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.result) throw new Error(body.error || 'A IA não respondeu agora.');
  return body.result;
}
