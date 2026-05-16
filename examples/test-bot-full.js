/**
 * Full-featured test bot for neogram v10.0.2
 * Uses the new handler system with polling.
 *
 * Usage:
 *   node examples/test-bot-full.js
 *   # or with custom token:
 *   BOT_TOKEN="your_token" node examples/test-bot-full.js
 *   # fish shell:
 *   set -x BOT_TOKEN "your_token"; node examples/test-bot-full.js
 */

import {
  Bot, InputPollOption,
  InlineKeyboardMarkup, InlineKeyboardButton,
  ReplyKeyboardMarkup, KeyboardButton, ReplyKeyboardRemove,
  ReplyParameters,
} from '../src/index.js';

const TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN';
const bot = new Bot(TOKEN);

// ── /start ────────────────────────────────────────────────────────────────────

bot.onMessage(async (msg) => {
  const name = msg.from_user?.first_name || 'User';
  await bot.sendMessage({
    chat_id: msg.chat.id,
    text: `Привет, ${name}! Я тестовый бот neogram-js v10.0.2\n\n` +
          'Доступные команды:\n' +
          '/test — тест основных функций\n' +
          '/photo — отправить фото\n' +
          '/poll — создать опрос\n' +
          '/dice — бросить кубик\n' +
          '/location — отправить локацию\n' +
          '/keyboard — показать клавиатуру\n' +
          '/inline — inline кнопки\n' +
          '/help — помощь',
  });
}, { commands: ['start'] });

// ── /test ─────────────────────────────────────────────────────────────────────

bot.onMessage(async (msg) => {
  await bot.sendChatAction({ chat_id: msg.chat.id, action: 'typing' });
  await bot.sendMessage({
    chat_id: msg.chat.id,
    text: 'Тест основных функций:\n\n' +
          '- sendMessage работает\n' +
          '- getUpdates работает\n' +
          '- sendChatAction работает\n' +
          '- handler system работает\n\n' +
          'Всё ОК!',
  });
}, { commands: ['test'] });

// ── /photo ────────────────────────────────────────────────────────────────────

bot.onMessage(async (msg) => {
  await bot.sendPhoto({
    chat_id: msg.chat.id,
    photo: 'https://picsum.photos/800/600',
    caption: 'Случайное фото с picsum.photos',
  });
}, { commands: ['photo'] });

// ── /poll ─────────────────────────────────────────────────────────────────────

bot.onMessage(async (msg) => {
  await bot.sendPoll({
    chat_id: msg.chat.id,
    question: 'Как тебе neogram-js?',
    options: [
      new InputPollOption({ text: 'Отлично!' }),
      new InputPollOption({ text: 'Хорошо' }),
      new InputPollOption({ text: 'Норм' }),
      new InputPollOption({ text: 'Так себе' }),
    ],
    is_anonymous: false,
  });
}, { commands: ['poll'] });

// ── /dice ─────────────────────────────────────────────────────────────────────

bot.onMessage(async (msg) => {
  await bot.sendDice({ chat_id: msg.chat.id, emoji: '🎲' });
}, { commands: ['dice'] });

// ── /location ─────────────────────────────────────────────────────────────────

bot.onMessage(async (msg) => {
  await bot.sendLocation({
    chat_id: msg.chat.id,
    latitude: 55.7558,
    longitude: 37.6173,
  });
}, { commands: ['location'] });

// ── /keyboard ─────────────────────────────────────────────────────────────────

bot.onMessage(async (msg) => {
  const kb = new ReplyKeyboardMarkup({
    keyboard: [
      [new KeyboardButton({ text: 'Кнопка 1' }), new KeyboardButton({ text: 'Кнопка 2' })],
      [new KeyboardButton({ text: 'Кнопка 3' })],
      [new KeyboardButton({ text: 'Убрать клавиатуру' })],
    ],
    resize_keyboard: true,
  });
  await bot.sendMessage({
    chat_id: msg.chat.id,
    text: 'Клавиатура:',
    reply_markup: kb,
  });
}, { commands: ['keyboard'] });

// Убрать клавиатуру
bot.onMessage(async (msg) => {
  await bot.sendMessage({
    chat_id: msg.chat.id,
    text: 'Клавиатура убрана',
    reply_markup: new ReplyKeyboardRemove({ remove_keyboard: true }),
  });
}, { func: (msg) => msg.text === 'Убрать клавиатуру' });

// ── /inline ───────────────────────────────────────────────────────────────────

bot.onMessage(async (msg) => {
  const kb = new InlineKeyboardMarkup({
    inline_keyboard: [
      [
        new InlineKeyboardButton({ text: 'Кнопка 1', callback_data: 'btn1' }),
        new InlineKeyboardButton({ text: 'Кнопка 2', callback_data: 'btn2' }),
      ],
      [new InlineKeyboardButton({ text: 'Кнопка 3', callback_data: 'btn3' })],
      [new InlineKeyboardButton({ text: 'Google', url: 'https://google.com' })],
    ],
  });
  await bot.sendMessage({
    chat_id: msg.chat.id,
    text: 'Inline кнопки (нажми на них!):',
    reply_markup: kb,
  });
}, { commands: ['inline'] });

// ── /help ─────────────────────────────────────────────────────────────────────

bot.onMessage(async (msg) => {
  await bot.sendMessage({
    chat_id: msg.chat.id,
    text: 'Помощь:\n\nЭтот бот тестирует функциональность neogram-js v10.0.2\nИспользуй /start чтобы увидеть все команды',
  });
}, { commands: ['help'] });

// ── Callback query handler ───────────────────────────────────────────────────

bot.onCallbackQuery(async (cb) => {
  const chatId = cb.message?.chat?.id;
  await bot.answerCallbackQuery({ callback_query_id: cb.id });

  const labels = { btn1: 'Кнопка 1', btn2: 'Кнопка 2', btn3: 'Кнопка 3' };
  if (chatId && labels[cb.data]) {
    await bot.sendMessage({
      chat_id: chatId,
      text: `Ты нажал: ${labels[cb.data]}`,
    });
  }
});

// ── Default echo ─────────────────────────────────────────────────────────────

bot.onMessage(async (msg) => {
  if (!msg.text || msg.text.startsWith('/')) return;
  await bot.sendMessage({
    chat_id: msg.chat.id,
    text: `Эхо: ${msg.text}`,
    reply_parameters: new ReplyParameters({ message_id: msg.message_id }),
  });
});

// ── Error handler ────────────────────────────────────────────────────────────

bot.onError((update, error) => {
  console.error('Ошибка:', error.message || error);
});

// ── Start ────────────────────────────────────────────────────────────────────

console.log('Бот запускается...');
bot.getMe().then(me => {
  console.log(`Бот: @${me.username} (id: ${me.id})`);
  console.log('Ожидаю сообщения...');
  return bot.polling({ timeout: 30, allowedUpdates: ['message', 'callback_query'] });
}).catch(err => {
  console.error('Ошибка при запуске:', err.message);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\nБот остановлен');
  bot.stopPolling();
  process.exit(0);
});
