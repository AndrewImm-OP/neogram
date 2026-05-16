/**
 * Comprehensive Test Bot for neogram v10.0.2
 *
 * Tests ALL major Bot API methods:
 *  /start    - getMe, sendMessage
 *  /photo    - sendPhoto (URL)
 *  /document - sendDocument (buffer)
 *  /location - sendLocation
 *  /venue    - sendVenue
 *  /contact  - sendContact
 *  /poll     - sendPoll
 *  /dice     - sendDice
 *  /sticker  - sendSticker
 *  /forward  - forwardMessage
 *  /copy     - copyMessage
 *  /edit     - sendMessage + editMessageText
 *  /delete   - sendMessage + deleteMessage
 *  /pin      - sendMessage + pinChatMessage + unpinChatMessage
 *  /keyboard - ReplyKeyboardMarkup
 *  /inline   - InlineKeyboardMarkup + callback handling
 *  /action   - sendChatAction
 *  /commands - setMyCommands + getMyCommands
 *  /info     - getChat + getChatMemberCount
 *  /reaction - setMessageReaction
 *  /me       - getMe (detailed)
 *  /media    - sendMediaGroup
 *  /invoice  - sendInvoice (Stars)
 *
 * Also handles:
 *  - Callback queries (inline button presses)
 *  - Any text message (echo)
 *
 * Usage:
 *   BOT_TOKEN="your_token" node examples/test-bot-comprehensive.js
 *   - or set token directly below
 */

import {
  Bot, TelegramError, InputPollOption,
  InlineKeyboardMarkup, InlineKeyboardButton,
  ReplyKeyboardMarkup, KeyboardButton, ReplyKeyboardRemove,
  ReplyParameters, BotCommand, LinkPreviewOptions,
  LabeledPrice, ReactionTypeEmoji, InputMediaPhoto,
} from '../src/index.js';

const TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN';
const bot = new Bot(TOKEN, { timeout: 60 });

// ── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function reply(chatId, text, extra = {}) {
  return bot.sendMessage({ chat_id: chatId, text, parse_mode: 'HTML', ...extra });
}

// ── Handlers ─────────────────────────────────────────────────────────────────

// /start — basic connectivity test
bot.onMessage(async (msg) => {
  const chatId = msg.chat.id;
  const me = await bot.getMe();
  await reply(chatId,
    `<b>neogram v10.0.2 — Test Bot</b>\n\n` +
    `Bot: @${me.username} (id: ${me.id})\n` +
    `Chat: ${chatId}\n\n` +
    `Commands:\n` +
    `/photo /document /location /venue\n` +
    `/contact /poll /dice /sticker\n` +
    `/forward /copy /edit /delete /pin\n` +
    `/keyboard /inline /action /commands\n` +
    `/info /reaction /me /media /invoice`
  );
}, { commands: ['start'] });

// /me — detailed getMe
bot.onMessage(async (msg) => {
  const me = await bot.getMe();
  await reply(msg.chat.id,
    `<b>Bot Info:</b>\n` +
    `ID: <code>${me.id}</code>\n` +
    `Name: ${me.first_name}\n` +
    `Username: @${me.username}\n` +
    `Is Bot: ${me.is_bot}\n` +
    `Can Join Groups: ${me.can_join_groups}\n` +
    `Can Read Group Messages: ${me.can_read_all_group_messages}\n` +
    `Supports Inline: ${me.supports_inline_queries}`
  );
}, { commands: ['me'] });

// /photo — send photo by URL
bot.onMessage(async (msg) => {
  await bot.sendChatAction({ chat_id: msg.chat.id, action: 'upload_photo' });
  await bot.sendPhoto({
    chat_id: msg.chat.id,
    photo: 'https://www.python.org/static/community_logos/python-logo-master-v3-TM.png',
    caption: '<b>sendPhoto</b> — URL upload test',
    parse_mode: 'HTML',
    reply_parameters: new ReplyParameters({ message_id: msg.message_id }),
  });
}, { commands: ['photo'] });

// /document — send document from buffer
bot.onMessage(async (msg) => {
  await bot.sendChatAction({ chat_id: msg.chat.id, action: 'upload_document' });
  const content = `neogram test file\nGenerated: ${new Date().toISOString()}\n`;
  const buf = Buffer.from(content, 'utf-8');
  buf.name = 'test-file.txt';
  await bot.sendDocument({
    chat_id: msg.chat.id,
    document: buf,
    caption: '<b>sendDocument</b> — Buffer upload test',
    parse_mode: 'HTML',
  });
}, { commands: ['document'] });

// /location — send location
bot.onMessage(async (msg) => {
  await bot.sendLocation({
    chat_id: msg.chat.id,
    latitude: 55.7558,
    longitude: 37.6176,
  });
}, { commands: ['location'] });

// /venue — send venue
bot.onMessage(async (msg) => {
  await bot.sendVenue({
    chat_id: msg.chat.id,
    latitude: 48.8566,
    longitude: 2.3522,
    title: 'Eiffel Tower',
    address: 'Champ de Mars, Paris, France',
  });
}, { commands: ['venue'] });

// /contact — send contact
bot.onMessage(async (msg) => {
  await bot.sendContact({
    chat_id: msg.chat.id,
    phone_number: '+1234567890',
    first_name: 'Test',
    last_name: 'User',
  });
}, { commands: ['contact'] });

// /poll — send poll
bot.onMessage(async (msg) => {
  await bot.sendPoll({
    chat_id: msg.chat.id,
    question: 'What is the best programming language?',
    options: [
      new InputPollOption({ text: 'Python' }),
      new InputPollOption({ text: 'JavaScript' }),
      new InputPollOption({ text: 'Rust' }),
      new InputPollOption({ text: 'Go' }),
    ],
    is_anonymous: false,
  });
}, { commands: ['poll'] });

// /dice — send animated dice
bot.onMessage(async (msg) => {
  const emojis = ['🎲', '🎯', '🏀', '⚽', '🎰', '🎳'];
  const emoji = emojis[Math.floor(Math.random() * emojis.length)];
  const result = await bot.sendDice({ chat_id: msg.chat.id, emoji });
  await reply(msg.chat.id, `Dice result: <b>${result.dice?.value || '?'}</b> (${emoji})`);
}, { commands: ['dice'] });

// /sticker — send sticker (by URL — .webp format)
bot.onMessage(async (msg) => {
  try {
    await bot.sendSticker({
      chat_id: msg.chat.id,
      sticker: 'https://www.gstatic.com/webp/gallery/1.webp',
    });
  } catch (e) {
    // Fallback: send as document if sticker format not accepted
    await reply(msg.chat.id, `sendSticker test: ${e.description || e.message}\n\n<i>Sticker file_ids are bot-specific — send a sticker to the bot and it will echo the file_id.</i>`);
  }
}, { commands: ['sticker'] });

// /forward — forward a message
bot.onMessage(async (msg) => {
  const sent = await reply(msg.chat.id, 'This message will be forwarded...');
  await sleep(500);
  await bot.forwardMessage({
    chat_id: msg.chat.id,
    from_chat_id: msg.chat.id,
    message_id: sent.message_id,
  });
}, { commands: ['forward'] });

// /copy — copy a message
bot.onMessage(async (msg) => {
  const sent = await reply(msg.chat.id, 'This message will be copied...');
  await sleep(500);
  await bot.copyMessage({
    chat_id: msg.chat.id,
    from_chat_id: msg.chat.id,
    message_id: sent.message_id,
  });
}, { commands: ['copy'] });

// /edit — send and edit message
bot.onMessage(async (msg) => {
  const sent = await reply(msg.chat.id, 'This message will be edited in 2 seconds...');
  await sleep(2000);
  await bot.editMessageText({
    chat_id: msg.chat.id,
    message_id: sent.message_id,
    text: '<b>Message edited successfully!</b> ✅',
    parse_mode: 'HTML',
  });
}, { commands: ['edit'] });

// /delete — send and delete message
bot.onMessage(async (msg) => {
  const sent = await reply(msg.chat.id, 'This message will be deleted in 2 seconds...');
  await sleep(2000);
  await bot.deleteMessage({ chat_id: msg.chat.id, message_id: sent.message_id });
  await reply(msg.chat.id, 'Message deleted! ✅');
}, { commands: ['delete'] });

// /pin — pin and unpin
bot.onMessage(async (msg) => {
  const sent = await reply(msg.chat.id, '📌 This message will be pinned for 3 seconds...');
  try {
    await bot.pinChatMessage({ chat_id: msg.chat.id, message_id: sent.message_id });
    await sleep(3000);
    await bot.unpinChatMessage({ chat_id: msg.chat.id, message_id: sent.message_id });
    await reply(msg.chat.id, 'Pin/unpin test complete ✅');
  } catch (e) {
    await reply(msg.chat.id, `Pin failed (need admin rights): ${e.description || e.message}`);
  }
}, { commands: ['pin'] });

// /keyboard — reply keyboard
bot.onMessage(async (msg) => {
  const kb = new ReplyKeyboardMarkup({
    keyboard: [
      [new KeyboardButton({ text: '📍 Location', request_location: true })],
      [new KeyboardButton({ text: '📱 Contact', request_contact: true })],
      [new KeyboardButton({ text: '❌ Remove Keyboard' })],
    ],
    resize_keyboard: true,
    one_time_keyboard: false,
    input_field_placeholder: 'Choose an option...',
  });
  await bot.sendMessage({
    chat_id: msg.chat.id,
    text: '<b>Reply Keyboard Test</b>\nPress a button below:',
    parse_mode: 'HTML',
    reply_markup: kb,
  });
}, { commands: ['keyboard'] });

// Handle "Remove Keyboard" button
bot.onMessage(async (msg) => {
  if (msg.text === '❌ Remove Keyboard') {
    await bot.sendMessage({
      chat_id: msg.chat.id,
      text: 'Keyboard removed ✅',
      reply_markup: new ReplyKeyboardRemove({ remove_keyboard: true }),
    });
  }
}, { func: (msg) => msg.text === '❌ Remove Keyboard' });

// /inline — inline keyboard with callbacks
bot.onMessage(async (msg) => {
  const kb = new InlineKeyboardMarkup({
    inline_keyboard: [
      [
        new InlineKeyboardButton({ text: '✅ OK', callback_data: 'btn_ok' }),
        new InlineKeyboardButton({ text: '❌ Cancel', callback_data: 'btn_cancel' }),
      ],
      [
        new InlineKeyboardButton({ text: '🔗 GitHub', url: 'https://github.com/SiriLV/neogram' }),
      ],
      [
        new InlineKeyboardButton({ text: '🔄 Edit this message', callback_data: 'btn_edit' }),
      ],
    ],
  });
  await bot.sendMessage({
    chat_id: msg.chat.id,
    text: '<b>Inline Keyboard Test</b>\nPress a button:',
    parse_mode: 'HTML',
    reply_markup: kb,
  });
}, { commands: ['inline'] });

// /action — chat action
bot.onMessage(async (msg) => {
  const actions = ['typing', 'upload_photo', 'upload_video', 'upload_document', 'find_location'];
  for (const action of actions) {
    await bot.sendChatAction({ chat_id: msg.chat.id, action });
    await sleep(800);
  }
  await reply(msg.chat.id, 'Chat actions test complete ✅');
}, { commands: ['action'] });

// /commands — set and get bot commands
bot.onMessage(async (msg) => {
  await bot.setMyCommands({
    commands: [
      new BotCommand({ command: 'start', description: 'Start the bot' }),
      new BotCommand({ command: 'help', description: 'Get help' }),
      new BotCommand({ command: 'photo', description: 'Send a photo' }),
      new BotCommand({ command: 'poll', description: 'Create a poll' }),
      new BotCommand({ command: 'dice', description: 'Roll a dice' }),
    ],
  });
  const commands = await bot.getMyCommands();
  const list = commands.map(c => `/${c.command} — ${c.description}`).join('\n');
  await reply(msg.chat.id, `<b>Bot Commands Set:</b>\n${list}`);
}, { commands: ['commands'] });

// /info — chat info
bot.onMessage(async (msg) => {
  try {
    const chat = await bot.getChat({ chat_id: msg.chat.id });
    const count = await bot.getChatMemberCount({ chat_id: msg.chat.id });
    await reply(msg.chat.id,
      `<b>Chat Info:</b>\n` +
      `ID: <code>${chat.id}</code>\n` +
      `Type: ${chat.type_val || chat.type}\n` +
      `Title: ${chat.title || chat.first_name || 'N/A'}\n` +
      `Members: ${count}\n` +
      `Bio: ${chat.bio || 'N/A'}`
    );
  } catch (e) {
    await reply(msg.chat.id, `Error: ${e.description || e.message}`);
  }
}, { commands: ['info'] });

// /reaction — set reaction on message
bot.onMessage(async (msg) => {
  const sent = await reply(msg.chat.id, 'Adding reaction to this message...');
  try {
    await bot.setMessageReaction({
      chat_id: msg.chat.id,
      message_id: sent.message_id,
      reaction: [new ReactionTypeEmoji({ type_val: 'emoji', emoji: '🔥' })],
    });
    await reply(msg.chat.id, 'Reaction set ✅');
  } catch (e) {
    await reply(msg.chat.id, `Reaction failed: ${e.description || e.message}`);
  }
}, { commands: ['reaction'] });

// /media — send media group
bot.onMessage(async (msg) => {
  await bot.sendChatAction({ chat_id: msg.chat.id, action: 'upload_photo' });
  try {
    await bot.sendMediaGroup({
      chat_id: msg.chat.id,
      media: [
        new InputMediaPhoto({
          type_val: 'photo',
          media: 'https://www.python.org/static/community_logos/python-logo-master-v3-TM.png',
          caption: 'Photo 1',
        }),
        new InputMediaPhoto({
          type_val: 'photo',
          media: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Unofficial_JavaScript_logo_2.svg/480px-Unofficial_JavaScript_logo_2.svg.png',
          caption: 'Photo 2',
        }),
      ],
    });
  } catch (e) {
    await reply(msg.chat.id, `Media group failed: ${e.description || e.message}`);
  }
}, { commands: ['media'] });

// /invoice — send Telegram Stars invoice
bot.onMessage(async (msg) => {
  try {
    await bot.sendInvoice({
      chat_id: msg.chat.id,
      title: 'Test Product',
      description: 'This is a test invoice (Telegram Stars)',
      payload: 'test_payload_' + Date.now(),
      provider_token: '',
      currency: 'XTR',
      prices: [new LabeledPrice({ label: 'Test Item', amount: 1 })],
    });
  } catch (e) {
    await reply(msg.chat.id, `Invoice failed: ${e.description || e.message}`);
  }
}, { commands: ['invoice'] });

// ── Callback Query Handler ───────────────────────────────────────────────────

bot.onCallbackQuery(async (cb) => {
  const chatId = cb.message?.chat?.id;

  if (cb.data === 'btn_ok') {
    await bot.answerCallbackQuery({ callback_query_id: cb.id, text: 'You pressed OK! ✅' });
  } else if (cb.data === 'btn_cancel') {
    await bot.answerCallbackQuery({ callback_query_id: cb.id, text: 'Cancelled! ❌', show_alert: true });
  } else if (cb.data === 'btn_edit') {
    await bot.answerCallbackQuery({ callback_query_id: cb.id });
    if (chatId && cb.message?.message_id) {
      await bot.editMessageText({
        chat_id: chatId,
        message_id: cb.message.message_id,
        text: '<b>Message edited via callback!</b> 🎉\n\n<i>Timestamp: ' + new Date().toISOString() + '</i>',
        parse_mode: 'HTML',
      });
    }
  } else {
    await bot.answerCallbackQuery({ callback_query_id: cb.id, text: `Unknown: ${cb.data}` });
  }
});

// ── Pre-Checkout Query Handler ───────────────────────────────────────────────

bot.onPreCheckoutQuery(async (query) => {
  await bot.answerPreCheckoutQuery({ pre_checkout_query_id: query.id, ok: true });
});

// ── Default message handler (echo) ──────────────────────────────────────────

bot.onMessage(async (msg) => {
  if (!msg.text || msg.text.startsWith('/')) return;
  await bot.sendMessage({
    chat_id: msg.chat.id,
    text: `Echo: <code>${msg.text}</code>`,
    parse_mode: 'HTML',
    reply_parameters: new ReplyParameters({ message_id: msg.message_id }),
  });
});

// ── Error Handler ────────────────────────────────────────────────────────────

bot.onError((update, error) => {
  console.error('Global error handler:', error);
});

// ── Start Polling ────────────────────────────────────────────────────────────

console.log('Starting comprehensive test bot...');
console.log(`Token: ${TOKEN.substring(0, 10)}...`);

bot.polling({
  timeout: 30,
  allowedUpdates: ['message', 'callback_query', 'inline_query', 'pre_checkout_query'],
}).catch(error => {
  console.error('Fatal polling error:', error);
  process.exit(1);
});
