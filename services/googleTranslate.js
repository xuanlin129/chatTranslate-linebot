const ENDPOINT = 'https://translate.googleapis.com/translate_a/single';

export default async function googleTranslate(text, targetLanguage, signal) {
  const url = new URL(ENDPOINT);
  url.search = new URLSearchParams({
    client: 'gtx',
    sl: 'auto',
    tl: targetLanguage,
    dt: 't',
    q: text,
  }).toString();

  const response = await fetch(url, { signal });
  if (!response.ok) {
    const error = new Error(`Google translation failed: HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }

  const body = await response.json();
  if (!Array.isArray(body?.[0])) {
    throw new Error('Invalid Google translation response');
  }

  const translation = body[0]
    .filter(segment => Array.isArray(segment) && typeof segment[0] === 'string')
    .map(segment => segment[0])
    .join('');
  if (!translation.trim()) throw new Error('Empty Google translation response');
  return translation;
}
