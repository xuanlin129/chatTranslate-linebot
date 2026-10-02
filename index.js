import 'dotenv/config';
import linebot from 'linebot';
import express from 'express';
import { waitUntil } from '@vercel/functions';
import translate from './services/translate.js';

const app = express();
const bot = linebot({
  channelId: process.env.CHANNEL_ID,
  channelSecret: process.env.CHANNEL_SECRET,
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
});
const groupModes = new Map();

async function reply(event, text) {
  const response = await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      replyToken: event.replyToken,
      messages: [{ type: 'text', text }],
    }),
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) {
    throw new Error(`LINE reply failed: HTTP ${response.status}`);
  }
  console.log('LINE reply succeeded');
}

async function handleMessage(event) {
  if (event.message?.type !== 'text') return;
  const text = event.message.text.trim();
  const hasPrefix = text.startsWith('!') || text.startsWith('！');
  const groupId = event.source?.type === 'group' ? event.source.groupId : undefined;

  if (groupId && text === '即時翻譯') {
    groupModes.set(groupId, 'translate');
    await reply(event, '已開啟即時翻譯模式');
    return;
  }
  if (groupId && text === '結束即時翻譯') {
    groupModes.delete(groupId);
    await reply(event, '已關閉即時翻譯模式');
    return;
  }
  if (groupModes.get(groupId) !== 'translate' && !hasPrefix) return;

  const inputText = hasPrefix ? text.slice(1).trim() : text;
  if (!inputText) {
    await reply(event, '請在「!」後輸入要翻譯的內容。');
    return;
  }
  const translatedText = await translate(inputText);
  await reply(event, translatedText);
}

async function handleEvent(event) {
  try {
    if (event.type === 'message') {
      await handleMessage(event);
      return;
    }
    if (event.type === 'join') {
      await reply(event, '大家好！\n機器人提供中英日翻譯服務\n使用方式為！+翻譯內容\n\n若是不想輸入「！」\n請輸入「即時翻譯」\n關閉則輸入「結束即時翻譯」');
    }
  } catch (error) {
    console.error('Webhook event failed', { type: event.type, message: error.message });
  }
}

app.post('/', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.get('x-line-signature');
  if (!process.env.CHANNEL_SECRET || !process.env.CHANNEL_ACCESS_TOKEN) {
    console.error('Missing CHANNEL_SECRET or CHANNEL_ACCESS_TOKEN');
    return res.sendStatus(500);
  }
  if (!signature || !Buffer.isBuffer(req.body)) return res.sendStatus(400);
  if (!bot.verify(req.body.toString('utf8'), signature)) return res.sendStatus(400);

  let body;
  try {
    body = JSON.parse(req.body.toString('utf8'));
  } catch {
    return res.sendStatus(400);
  }
  if (!Array.isArray(body.events)) return res.sendStatus(400);
  console.log('Webhook received', { eventCount: body.events.length });
  waitUntil(Promise.all(body.events.map(handleEvent)));
  return res.json({});
});

const port = process.env.PORT || 3000;
if (!process.env.VERCEL) {
  app.listen(port, () => console.log('機器人啟動'));
}
export default app;
