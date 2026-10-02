import { translate } from '@vitalets/google-translate-api';
import { detectLanguage } from '../utils/index.js';

const TIMEOUT_MS = 5000;
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
  const language = detectLanguage(inputText);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const results = await Promise.all(
      TARGET_LANGUAGES[language].map(async (to) => {
        const result = await translate(inputText, {
          to,
          fetchOptions: { signal: controller.signal },
        });
        const label = DISPLAY_LANG_MAP[language][to.replace('-tw', '')];
        return `${label}: ${result.text}`;
      })
    );
    console.log('Translation succeeded');
    return results.join('\n');
  } catch (error) {
    console.error('Translation failed', { name: error.name, status: error.status, message: error.message });
    return '目前翻譯服務暫時無法使用，請稍後再試。';
  } finally {
    clearTimeout(timeout);
    controller.abort();
  }
}
