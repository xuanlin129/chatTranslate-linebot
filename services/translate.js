import googleTranslate from './googleTranslate.js';
import { detectLanguage } from '../utils/index.js';

const TIMEOUT_MS = 5000;
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_LIMIT = 100;
const translationCache = new Map();
const TARGET_LANGUAGES = {
  zh: ['en', 'ja'],
  en: ['zh-tw', 'ja'],
  ja: ['zh-tw', 'en'],
  unknown: ['zh-tw', 'en', 'ja'],
};
const DISPLAY_LANG_MAP = {
  zh: { en: '英文', ja: '日文', zh: '中文' },
  en: { zh: '中文', ja: 'Japanese', en: 'English' },
  ja: { zh: '中国語', en: '英語', ja: '日本語' },
  unknown: { zh: '中文', en: '英文', ja: '日文' },
};

export default async function translateText(inputText) {
  const cached = translationCache.get(inputText);
  if (cached && cached.expiresAt > Date.now()) return cached.text;
  translationCache.delete(inputText);

  const language = detectLanguage(inputText);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const results = await Promise.all(
      TARGET_LANGUAGES[language].map(async (to) => {
        const text = await googleTranslate(inputText, to, controller.signal);
        const label = DISPLAY_LANG_MAP[language][to.replace('-tw', '')];
        return `${label}: ${text}`;
      })
    );
    const output = results.join('\n');
    if (translationCache.size >= CACHE_LIMIT) {
      translationCache.delete(translationCache.keys().next().value);
    }
    translationCache.set(inputText, { text: output, expiresAt: Date.now() + CACHE_TTL_MS });
    console.log('Translation succeeded');
    return output;
  } catch (error) {
    console.error('Translation failed', { name: error.name, status: error.status, message: error.message });
    if (error.status === 429) return '免費翻譯服務目前受到流量限制，請稍後再試。';
    return '目前翻譯服務暫時無法使用，請稍後再試。';
  } finally {
    clearTimeout(timeout);
    controller.abort();
  }
}
