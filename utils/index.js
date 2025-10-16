function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function detectLanguage(text) {
  if (/[ぁ-んァ-ン]/.test(text)) {
    return 'ja'; // 日文假名
  }
  if (/[\u4e00-\u9fff]/.test(text)) {
    return 'zh'; // 中文（或日文漢字）
  }
  if (/[a-zA-Z]/.test(text)) {
    return 'en'; // 英文
  }
  return 'unknown';
}

export { delay, detectLanguage };
