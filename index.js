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

const groupModes = {};

bot.on('join', async (event) => {
  event.reply(
    '大家好！\n機器人提供中英日翻譯服務\n使用方式為！+翻譯內容\n\n若是不想輸入"！"\n請輸入“即時翻譯”\n關閉則輸入“結束即時翻譯”'
  );
});

bot.on('message', async (event) => {
  try {
    if (event.message.type !== 'text') return;

    const text = event.message.text.trim();

    if (event.source.type === 'group') {
      if (!Object.keys(groupModes).includes(event.source.groupId) || event.message.text === '結束即時翻譯') {
        groupModes[event.source.groupId] = 'normal';
        console.log('指令翻譯');
      }

      if (event.message.text === '即時翻譯') {
        groupModes[event.source.groupId] = 'translate';
        console.log('即時翻譯');
        event.reply('已開啟即時翻譯模式');
        return;
      }

      if (groupModes[event.source.groupId] === 'normal' && !text.startsWith('!') && !text.startsWith('！')) return;
    } else if (event.source.type === 'user') {
      if (!text.startsWith('!') && !text.startsWith('！')) return;
    }

    const translateText = await translate(text.slice(1));
    event.reply(translateText);
  } catch (ex) {
    console.warn(ex);
  }
});

app.get('/ping', (req, res) => {
  const key = req.query.key;
  if (!key || key !== process.env.PING_SECRET) {
    return res.status(403).send('Forbidden');
  }
  res.send('pong');
});

app.post('/', bot.parser());

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log('機器人啟動');
});
