import { translate } from '@vitalets/google-translate-api';
import { delay, detectLanguage } from '../utils/index.js';
import getAgent, { PROXY_LIST } from './proxy.js';

const TIMEOUT_MS = 5000;
const DISPLAY_LANG_MAP = {
  zh: { en: '英文', ja: '日文', zh: '中文' },
  en: { zh: '中文', ja: 'Japanese', en: 'English' },
  ja: { zh: '中国語', en: '英語', ja: '日本語' },
};

export default async function translateWithProxy(inputText, retryCount = 0) {
  const detectLang = detectLanguage(inputText);
  const targets =
    detectLang === 'zh'
      ? ['en', 'ja']
      : detectLang === 'en'
      ? ['zh-tw', 'ja']
      : detectLang === 'ja'
      ? ['zh-tw', 'en']
      : ['zh-tw', 'en', 'ja'];

  try {
    const results = await Promise.all(
      targets.map(async (to) => {
        const agent = getAgent();
        const result = await translate(inputText, {
          to,
          fetchOptions: { agent, timeout: TIMEOUT_MS },
        });
        return { lang: to, text: result.text };
      })
    );

    const output = results
      .map(({ lang, text }) => {
        const displayLang = DISPLAY_LANG_MAP[detectLang][lang.replace('-tw', '')] || lang;
        return `${displayLang}: ${text}`;
      })
      .join('\n');

    console.log(`翻譯成功: "${inputText}"\n${output}`);
    return output;
  } catch (error) {
    console.warn(`翻譯失敗 (${retryCount + 1}次): ${error.message}`);

    if (retryCount < PROXY_LIST.length) {
      await delay(100);
      return translateWithProxy(inputText, retryCount + 1);
    }

    console.error('所有 Proxy 都無法使用');
    return '目前翻譯服務暫時無法使用，請稍後再試。';
  }
}
