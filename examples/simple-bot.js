/**
 * Minimal echo bot using neogram v10.0.2 handler system.
 *
 * Usage:
 *   node examples/simple-bot.js
 *   # or: BOT_TOKEN="your_token" node examples/simple-bot.js
 */

import { Bot, ReplyParameters } from '../src/index.js';

const TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN';
const bot = new Bot(TOKEN);

bot.onMessage(async (msg) => {
  if (!msg.text) return;
  console.log('Получено:', msg.text);
  await bot.sendMessage({
    chat_id: msg.chat.id,
    text: 'Ты написал: ' + msg.text,
    reply_parameters: new ReplyParameters({ message_id: msg.message_id }),
  });
});

bot.getMe().then(me => {
  console.log('Бот запущен:', me.username);
  return bot.polling();
}).catch(console.error);
