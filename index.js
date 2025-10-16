import 'dotenv/config';
import linebot from 'linebot';
import express from 'express';
import translate from './services/translate.js';

const app = express();
const bot = linebot({
  channelId: process.env.CHANNEL_ID,
  channelSecret: process.env.CHANNEL_SECRET,
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
});

bot.on('join', async (event) => {
  event.reply('大家好！\n機器人提供中英日翻譯服務\n使用方式為！+翻譯內容');
});

bot.on('message', async (event) => {
  try {
    const text = event.message.text;
    const user = await bot.getUserProfile(event.source.userId);
    console.log('使用者', user);

    if (event.message.type !== 'text' || (!text.startsWith('!') && !text.startsWith('！'))) return;

    const translateText = await translate(text.slice(1));
    event.reply(translateText);
  } catch (ex) {
    console.warn(ex);
  }
});

app.post('/', bot.parser());

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log('機器人啟動');
});
