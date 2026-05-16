/**
 * Feature-rich test bot for neogram v10.0.2.
 * Tests commands, photos, polls, dice, locations, keyboards.
 *
 * Usage:
 *   node examples/test-bot.js
 *   # or: BOT_TOKEN="your_token" node examples/test-bot.js
 */

import {
  Bot, InputPollOption,
  InlineKeyboardMarkup, InlineKeyboardButton,
  ReplyKeyboardMarkup, KeyboardButton, ReplyKeyboardRemove,
} from '../src/index.js';

const TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN';
const bot = new Bot(TOKEN);

bot.onMessage(async (msg) => {
  const chatId = msg.chat.id;
  await bot.sendMessage({
    chat_id: chatId,
    text: 'Привет! Команды:\n/photo /poll /dice /location /keyboard /inline',
  });
}, { commands: ['start', 'help'] });

bot.onMessage(async (msg) => {
  await bot.sendPhoto({
    chat_id: msg.chat.id,
    photo: 'https://picsum.photos/800/600',
    caption: 'Случайное фото',
  });
}, { commands: ['photo'] });

bot.onMessage(async (msg) => {
  await bot.sendPoll({
    chat_id: msg.chat.id,
    question: 'Ваш любимый язык?',
    options: [
      new InputPollOption({ text: 'Python' }),
      new InputPollOption({ text: 'JavaScript' }),
      new InputPollOption({ text: 'Rust' }),
    ],
    is_anonymous: false,
  });
}, { commands: ['poll'] });

bot.onMessage(async (msg) => {
  await bot.sendDice({ chat_id: msg.chat.id, emoji: '🎲' });
}, { commands: ['dice'] });

bot.onMessage(async (msg) => {
  await bot.sendLocation({ chat_id: msg.chat.id, latitude: 55.7558, longitude: 37.6173 });
}, { commands: ['location'] });

bot.onMessage(async (msg) => {
  const kb = new ReplyKeyboardMarkup({
    keyboard: [
      [new KeyboardButton({ text: 'Кнопка 1' }), new KeyboardButton({ text: 'Кнопка 2' })],
      [new KeyboardButton({ text: 'Убрать' })],
    ],
    resize_keyboard: true,
  });
  await bot.sendMessage({ chat_id: msg.chat.id, text: 'Клавиатура:', reply_markup: kb });
}, { commands: ['keyboard'] });

bot.onMessage(async (msg) => {
  if (msg.text === 'Убрать') {
    await bot.sendMessage({
      chat_id: msg.chat.id, text: 'Убрано',
      reply_markup: new ReplyKeyboardRemove({ remove_keyboard: true }),
    });
  }
}, { func: (msg) => msg.text === 'Убрать' });

bot.onMessage(async (msg) => {
  const kb = new InlineKeyboardMarkup({
    inline_keyboard: [[
      new InlineKeyboardButton({ text: 'OK', callback_data: 'ok' }),
      new InlineKeyboardButton({ text: 'Cancel', callback_data: 'cancel' }),
    ]],
  });
  await bot.sendMessage({ chat_id: msg.chat.id, text: 'Inline кнопки:', reply_markup: kb });
}, { commands: ['inline'] });

bot.onCallbackQuery(async (cb) => {
  await bot.answerCallbackQuery({
    callback_query_id: cb.id,
    text: `Нажато: ${cb.data}`,
  });
});

bot.onError((update, err) => console.error('Error:', err.message));

console.log('Бот запускается...');
bot.getMe().then(me => {
  console.log(`Бот: @${me.username}`);
  return bot.polling();
}).catch(err => {
  console.error('Ошибка:', err.message);
  process.exit(1);
});
