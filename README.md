<div align="center">

# neogram

**Modern JavaScript library for the Telegram Bot API**

Synchronous-style async wrapper over the Telegram Bot API with built-in handler system, retry logic, and AI integrations.
Full port of the [Python neogram](https://github.com/SiriLV/neogram) library by SiriLV.

[![npm version](https://img.shields.io/npm/v/neogram.svg)](https://www.npmjs.com/package/neogram)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Bot API](https://img.shields.io/badge/Bot%20API-10.0-blue)](https://core.telegram.org/bots/api)

</div>

---

## Features

- **Telegram Bot API 10.0** — all 120+ methods, 278 types, full coverage
- **Handler system** — `onMessage`, `onCallbackQuery`, `onInlineQuery`, and 17 more event handlers with filters
- **Built-in polling** — `bot.polling()` with automatic retry, flood wait handling, and exponential backoff
- **AI integrations** — OnlySQ (text + image generation), Deef (translate, Perplexity, Toolbaz), ChatGPT/OpenAI
- **TypeScript ready** — complete `.d.ts` declarations for all types and methods
- **ES Modules** — native ESM (`import`/`export`)
- **Lightweight** — 3 dependencies: `axios`, `cheerio`, `form-data`
- **File uploads** — send photos, documents, audio, video from paths, Buffers, or streams

## Installation

```bash
npm install neogram
```

**Requirements:** Node.js 18+

## Quick Start

```javascript
import { Bot, ReplyParameters } from 'neogram';

const bot = new Bot('YOUR_BOT_TOKEN');

// Handle /start command
bot.onMessage(async (msg) => {
  await bot.sendMessage({
    chat_id: msg.chat.id,
    text: `Hello, ${msg.from_user.first_name}!`,
  });
}, { commands: ['start'] });

// Echo all other text messages
bot.onMessage(async (msg) => {
  if (!msg.text || msg.text.startsWith('/')) return;
  await bot.sendMessage({
    chat_id: msg.chat.id,
    text: `You said: ${msg.text}`,
    reply_parameters: new ReplyParameters({ message_id: msg.message_id }),
  });
});

// Start polling
bot.polling();
```

---

## Table of Contents

- [Bot Class](#bot-class)
  - [Constructor](#constructor)
  - [Handler System](#handler-system)
  - [Filters](#filters)
  - [Polling](#polling)
  - [Error Handling](#error-handling)
- [API Methods](#api-methods)
  - [Messages](#messages)
  - [Media](#media)
  - [Editing & Deleting](#editing--deleting)
  - [Keyboards](#keyboards)
  - [Chat Management](#chat-management)
  - [Inline Mode](#inline-mode)
  - [Payments & Stars](#payments--stars)
  - [Stickers](#stickers)
  - [Bot Settings](#bot-settings)
  - [Business Features](#business-features)
  - [Stories](#stories)
  - [Games](#games)
- [Types](#types)
  - [Field Renaming](#field-renaming)
  - [Serialization](#serialization)
- [AI Integrations](#ai-integrations)
  - [OnlySQ](#onlysq)
  - [Deef](#deef)
  - [ChatGPT / OpenAI](#chatgpt--openai)
- [File Uploads](#file-uploads)
- [Examples](#examples)

---

## Bot Class

### Constructor

```javascript
import { Bot } from 'neogram';

const bot = new Bot('YOUR_TOKEN');

// With options
const bot = new Bot('YOUR_TOKEN', {
  timeout: 120,          // HTTP timeout in seconds (default: 60)
  parseMode: 'HTML',     // Default parse mode for messages
  maxRetries: 3,         // Retry on transport/server errors (default: 3)
  retryOnFlood: true,    // Auto-retry on 429 flood errors (default: true)
  apiUrl: 'http://localhost:8081', // Custom API URL
});
```

### Handler System

Register handlers for incoming updates. First matching handler wins (no further handlers run for that update).

```javascript
// Message handlers with filters
bot.onMessage(handler, filters);
bot.onEditedMessage(handler, filters);
bot.onChannelPost(handler, filters);
bot.onEditedChannelPost(handler, filters);

// Callback queries (inline button presses)
bot.onCallbackQuery(handler, filters);

// Inline mode
bot.onInlineQuery(handler, filters);
bot.onChosenInlineResult(handler, filters);

// Chat events
bot.onMyChatMember(handler, filters);
bot.onChatMember(handler, filters);
bot.onChatJoinRequest(handler, filters);
bot.onChatBoost(handler, filters);
bot.onRemovedChatBoost(handler, filters);

// Polls
bot.onPoll(handler, filters);
bot.onPollAnswer(handler, filters);

// Payments
bot.onPreCheckoutQuery(handler, filters);
bot.onShippingQuery(handler, filters);

// Reactions
bot.onMessageReaction(handler, filters);
bot.onMessageReactionCount(handler, filters);

// Business
bot.onBusinessMessage(handler, filters);
bot.onPurchasedPaidMedia(handler, filters);

// Error handler
bot.onError((update, error) => {
  console.error('Handler error:', error);
});

// Programmatic registration
bot.registerHandler('message', handler, { commands: ['start'] });
```

Handlers receive `(updateObject, fullUpdate)`:

```javascript
bot.onMessage(async (msg, update) => {
  // msg = update.message
  // update = full Update object
  console.log(msg.text, msg.chat.id);
});

bot.onCallbackQuery(async (cb, update) => {
  await bot.answerCallbackQuery({ callback_query_id: cb.id, text: 'Clicked!' });
});
```

### Filters

```javascript
// Commands — matches /start, /start@botname
bot.onMessage(handler, { commands: ['start', 'help'] });

// Content types
bot.onMessage(handler, { contentTypes: ['photo', 'video', 'document'] });

// Regular expression on text or caption
bot.onMessage(handler, { regexp: 'hello|hi' });

// Chat types
bot.onMessage(handler, { chatTypes: ['private'] });
// Options: 'private', 'group', 'supergroup', 'channel'

// User ID whitelist
bot.onMessage(handler, { userIds: [123456, 789012] });

// Chat ID whitelist
bot.onMessage(handler, { chatIds: [-100123456789] });

// Custom predicate
bot.onMessage(handler, { func: (msg) => msg.text?.length > 100 });

// Callback data — exact string or regex
bot.onCallbackQuery(handler, { data: 'btn_ok' });
bot.onCallbackQuery(handler, { data: '^action_' });
bot.onCallbackQuery(handler, { data: (d) => d.startsWith('page_') });

// Combine multiple filters (all must match)
bot.onMessage(handler, {
  commands: ['admin'],
  chatTypes: ['private'],
  userIds: [ADMIN_ID],
});
```

### Polling

```javascript
// Start polling (blocking)
await bot.polling({
  timeout: 30,              // Long polling timeout
  allowedUpdates: ['message', 'callback_query'],
  noneStop: true,           // Continue on errors (default: true)
  interval: 0,              // Delay between polls in seconds
});

// Convenience wrapper
await bot.infinityPolling();

// Stop
bot.stopPolling();
```

### Error Handling

```javascript
import { TelegramError, StopPropagation } from 'neogram';

// TelegramError is thrown on API errors
try {
  await bot.sendMessage({ chat_id: 0, text: 'test' });
} catch (error) {
  if (error instanceof TelegramError) {
    console.log(error.errorCode);    // 400
    console.log(error.description);  // "Bad Request: chat not found"
    console.log(error.retryAfter);   // null, or seconds to wait (429)
  }
}

// StopPropagation — throw inside a handler to explicitly stop
bot.onMessage(async (msg) => {
  // Process and stop further handlers
  throw new StopPropagation();
});

// Global error handler
bot.onError((update, error) => {
  console.error(`Error processing update ${update.update_id}:`, error);
});
```

| Error Code | Meaning | Action |
|---|---|---|
| 400 | Bad Request | Check parameters |
| 401 | Unauthorized | Token is invalid |
| 403 | Forbidden | Bot blocked or no permissions |
| 409 | Conflict | Another bot instance is running |
| 429 | Too Many Requests | Auto-retried if `retryOnFlood: true` |
| 5xx | Server Error | Auto-retried with exponential backoff |

---

## API Methods

All methods are async and take a single options object. Full Bot API 10.0 coverage.

### Messages

```javascript
// Text message
await bot.sendMessage({
  chat_id: 123456,
  text: '<b>Bold</b> and <i>italic</i>',
  parse_mode: 'HTML',
});

// Reply to a message
import { ReplyParameters } from 'neogram';
await bot.sendMessage({
  chat_id: 123456,
  text: 'Replying!',
  reply_parameters: new ReplyParameters({ message_id: originalMsgId }),
});

// Forward
await bot.forwardMessage({ chat_id: target, from_chat_id: source, message_id: msgId });

// Copy (no link to original)
await bot.copyMessage({ chat_id: target, from_chat_id: source, message_id: msgId });

// Chat action (typing indicator)
await bot.sendChatAction({ chat_id: 123456, action: 'typing' });
// Actions: typing, upload_photo, upload_video, upload_document,
//          upload_voice, find_location, record_video_note
```

### Media

```javascript
// Photo — URL, file_id, or Buffer/Stream
await bot.sendPhoto({ chat_id: 123456, photo: 'https://example.com/photo.jpg', caption: 'Nice!' });

// Document from Buffer
const buf = Buffer.from('file content');
buf.name = 'report.txt';
await bot.sendDocument({ chat_id: 123456, document: buf });

// Audio, Video, Voice, Video Note, Animation, Sticker
await bot.sendAudio({ chat_id: 123456, audio: 'file_id_or_url' });
await bot.sendVideo({ chat_id: 123456, video: readStream, caption: 'Video' });
await bot.sendVoice({ chat_id: 123456, voice: buffer });
await bot.sendVideoNote({ chat_id: 123456, video_note: buffer });
await bot.sendAnimation({ chat_id: 123456, animation: 'https://example.com/anim.gif' });
await bot.sendSticker({ chat_id: 123456, sticker: 'sticker_file_id' });

// Location & Venue
await bot.sendLocation({ chat_id: 123456, latitude: 48.8566, longitude: 2.3522 });
await bot.sendVenue({ chat_id: 123456, latitude: 48.8566, longitude: 2.3522, title: 'Eiffel Tower', address: 'Paris' });

// Contact, Poll, Dice
await bot.sendContact({ chat_id: 123456, phone_number: '+1234567890', first_name: 'John' });
await bot.sendPoll({ chat_id: 123456, question: 'Favorite language?', options: [
  new InputPollOption({ text: 'JavaScript' }),
  new InputPollOption({ text: 'Python' }),
]});
await bot.sendDice({ chat_id: 123456, emoji: '🎲' }); // 🎲 🎯 🏀 ⚽ 🎰 🎳

// Media group (album)
import { InputMediaPhoto } from 'neogram';
await bot.sendMediaGroup({ chat_id: 123456, media: [
  new InputMediaPhoto({ type_val: 'photo', media: 'url1', caption: 'First' }),
  new InputMediaPhoto({ type_val: 'photo', media: 'url2' }),
]});

// Invoice (Telegram Stars)
import { LabeledPrice } from 'neogram';
await bot.sendInvoice({
  chat_id: 123456,
  title: 'Premium Access',
  description: '30 days of premium',
  payload: 'premium_30d',
  provider_token: '',     // empty for Stars
  currency: 'XTR',
  prices: [new LabeledPrice({ label: 'Premium', amount: 50 })],
});
```

### Editing & Deleting

```javascript
await bot.editMessageText({ chat_id, message_id: msgId, text: 'Updated text' });
await bot.editMessageCaption({ chat_id, message_id: msgId, caption: 'New caption' });
await bot.editMessageReplyMarkup({ chat_id, message_id: msgId, reply_markup: newKeyboard });
await bot.deleteMessage({ chat_id, message_id: msgId });
await bot.deleteMessages({ chat_id, message_ids: [id1, id2, id3] });

// Reactions
import { ReactionTypeEmoji } from 'neogram';
await bot.setMessageReaction({
  chat_id, message_id: msgId,
  reaction: [new ReactionTypeEmoji({ type_val: 'emoji', emoji: '🔥' })],
});
```

### Keyboards

```javascript
import {
  InlineKeyboardMarkup, InlineKeyboardButton,
  ReplyKeyboardMarkup, KeyboardButton,
  ReplyKeyboardRemove, ForceReply,
} from 'neogram';

// Inline keyboard (attached to message)
const inline = new InlineKeyboardMarkup({
  inline_keyboard: [
    [
      new InlineKeyboardButton({ text: 'Yes', callback_data: 'yes' }),
      new InlineKeyboardButton({ text: 'No', callback_data: 'no' }),
    ],
    [new InlineKeyboardButton({ text: 'Visit site', url: 'https://example.com' })],
  ],
});
await bot.sendMessage({ chat_id, text: 'Choose:', reply_markup: inline });

// Reply keyboard (below input field)
const reply = new ReplyKeyboardMarkup({
  keyboard: [
    [new KeyboardButton({ text: 'Location', request_location: true })],
    [new KeyboardButton({ text: 'Contact', request_contact: true })],
  ],
  resize_keyboard: true,
  one_time_keyboard: true,
});
await bot.sendMessage({ chat_id, text: 'Menu:', reply_markup: reply });

// Remove keyboard
await bot.sendMessage({ chat_id, text: 'Done', reply_markup: new ReplyKeyboardRemove({ remove_keyboard: true }) });

// Force reply
await bot.sendMessage({ chat_id, text: 'Your name?', reply_markup: new ForceReply({ force_reply: true }) });
```

### Chat Management

```javascript
const chat = await bot.getChat({ chat_id });
const count = await bot.getChatMemberCount({ chat_id });
const member = await bot.getChatMember({ chat_id, user_id });
const admins = await bot.getChatAdministrators({ chat_id });

await bot.banChatMember({ chat_id, user_id, until_date: Math.floor(Date.now()/1000) + 3600 });
await bot.unbanChatMember({ chat_id, user_id });
await bot.restrictChatMember({ chat_id, user_id, permissions: new ChatPermissions({ can_send_messages: false }) });
await bot.promoteChatMember({ chat_id, user_id, can_delete_messages: true });

await bot.pinChatMessage({ chat_id, message_id: msgId });
await bot.unpinChatMessage({ chat_id, message_id: msgId });
await bot.unpinAllChatMessages({ chat_id });

await bot.setChatTitle({ chat_id, title: 'New Title' });
await bot.setChatDescription({ chat_id, description: 'New description' });

const link = await bot.createChatInviteLink({ chat_id, name: 'Invite', member_limit: 10 });
```

### Inline Mode

```javascript
import { InlineQueryResultArticle, InputTextMessageContent } from 'neogram';

bot.onInlineQuery(async (query) => {
  await bot.answerInlineQuery({
    inline_query_id: query.id,
    results: [
      new InlineQueryResultArticle({
        type_val: 'article',
        id: '1',
        title: 'Result',
        input_message_content: new InputTextMessageContent({ message_text: 'Selected!' }),
      }),
    ],
    cache_time: 1,
  });
});
```

### Payments & Stars

```javascript
await bot.sendInvoice({ chat_id, title: 'Product', description: '...', payload: 'order_123',
  provider_token: '', currency: 'XTR', prices: [new LabeledPrice({ label: 'Item', amount: 50 })] });

bot.onPreCheckoutQuery(async (query) => {
  await bot.answerPreCheckoutQuery({ pre_checkout_query_id: query.id, ok: true });
});

const balance = await bot.getMyStarBalance();
const transactions = await bot.getStarTransactions({ limit: 10 });
await bot.refundStarPayment({ user_id, telegram_payment_charge_id: chargeId });
```

### Stickers

```javascript
await bot.sendSticker({ chat_id, sticker: 'file_id' });
const set = await bot.getStickerSet({ name: 'sticker_set_name' });
await bot.uploadStickerFile({ user_id, sticker: buffer, sticker_format: 'static' });
await bot.createNewStickerSet({ user_id, name: 'set_name', title: 'Set Title', stickers: [...] });
```

### Bot Settings

```javascript
import { BotCommand } from 'neogram';

await bot.setMyCommands({ commands: [
  new BotCommand({ command: 'start', description: 'Start the bot' }),
  new BotCommand({ command: 'help', description: 'Get help' }),
]});

const commands = await bot.getMyCommands();
const me = await bot.getMe();

await bot.setMyName({ name: 'My Bot' });
await bot.setMyDescription({ description: 'What this bot does' });
await bot.setMyShortDescription({ short_description: 'Short desc' });
```

### Business Features

```javascript
const conn = await bot.getBusinessConnection({ business_connection_id });
await bot.readBusinessMessage({ business_connection_id, chat_id, message_id });
await bot.setBusinessAccountName({ business_connection_id, first_name: 'Name' });
await bot.setBusinessAccountBio({ business_connection_id, bio: 'Bio text' });

// Gifts
const gifts = await bot.getAvailableGifts();
await bot.sendGift({ gift_id, user_id, text: 'Enjoy!' });
await bot.getUserGifts({ user_id });

// Verification
await bot.verifyUser({ user_id, custom_description: 'Verified user' });
await bot.verifyChat({ chat_id, custom_description: 'Official' });
```

### Stories

```javascript
await bot.postStory({ business_connection_id, content: storyContent, active_period: 86400 });
await bot.editStory({ business_connection_id, story_id, content: newContent });
await bot.deleteStory({ business_connection_id, story_id });
```

### Games

```javascript
await bot.sendGame({ chat_id, game_short_name: 'my_game' });
await bot.setGameScore({ user_id, score: 1500, chat_id, message_id: msgId });
const scores = await bot.getGameHighScores({ user_id, chat_id, message_id: msgId });
```

---

## Types

All 278 Telegram Bot API types are available as classes extending `TelegramObject`:

```javascript
import { User, Message, Chat, InlineKeyboardMarkup, ... } from 'neogram';
```

### Field Renaming

Some Telegram API fields conflict with JavaScript reserved words and are renamed:

| Telegram API | neogram | Used in |
|---|---|---|
| `from` | `from_user` | Message, CallbackQuery, InlineQuery, etc. |
| `type` | `type_val` | Chat, Sticker, Poll, ReactionType, InlineQueryResult, etc. |
| `filter` | `filter_val` | Rare fields |

The renaming is automatic — `toJSON()` converts back to the original API names.

```javascript
// Reading
msg.from_user.id        // user who sent the message
msg.chat.type_val       // 'private', 'group', 'supergroup', 'channel'

// toJSON() reverses automatically
const json = msg.toJSON();
json.from.id            // 'from_user' -> 'from'
json.chat.type           // 'type_val' -> 'type'
```

### Serialization

```javascript
import { User } from 'neogram';

// Create from plain object
const user = User.fromJSON({ id: 123, is_bot: false, first_name: 'John' });
console.log(user.first_name); // 'John'

// Convert to plain object (for API calls)
const json = user.toJSON();
// { id: 123, is_bot: false, first_name: 'John' }

// Batch
const users = User.fromJSON([{ id: 1, ... }, { id: 2, ... }]);
```

---

## AI Integrations

### OnlySQ

Client for the [OnlySQ](https://my.onlysq.ru/) API — text and image generation.

```javascript
import { OnlySQ } from 'neogram';

const ai = new OnlySQ('YOUR_API_KEY');
// or: new OnlySQ({ apiKey: 'YOUR_API_KEY' })

// List available models
const models = await ai.getModels({ modality: 'text', status: 'work' });
const imageModels = await ai.getModels({ modality: 'image' });
const names = await ai.getModels({ modality: 'text', return_names: true });
const cheap = await ai.getModels({ max_cost: 0.005 });
const withTools = await ai.getModels({ can_tools: true });

// Generate text
const answer = await ai.generateAnswer('gpt-5.2-chat', [
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'What is JavaScript?' },
]);
console.log(answer);

// Generate image
const ok = await ai.generateImage('flux', 'sunset over mountains', '16:9', 'output.png');
```

### Deef

Utility toolkit — translation, URL shortening, AI queries, file encoding.

```javascript
import { Deef } from 'neogram';

const deef = new Deef();

// Translation (Google Translate)
const ru = await deef.translate('Hello world', 'ru');   // 'Привет, мир'
const en = await deef.translate('Привет', 'en');         // 'Hello'

// URL shortening
const short = await deef.shortUrl('https://very-long-url.com/path');
// 'https://clck.ru/...'

// Perplexity AI (no API key needed)
const result = await deef.perplexityAsk('Capital of France?', 'auto');
console.log(result.text);  // 'The capital of France is Paris...'
console.log(result.urls);  // ['https://...', ...]

// Toolbaz AI (no API key needed)
const response = await deef.toolchat('Explain quantum computing', 'toolbaz-v4.5-fast');
// Models: gemini-3-flash, deepseek-v3.1, gpt-5.2, claude-sonnet-4, toolbaz-v4.5-fast, etc.

// Base64 encoding
const b64 = deef.encodeBase64('/path/to/file.jpg');

// Fire-and-forget background task
deef.runInBg(async () => {
  await someHeavyWork();
});
```

### ChatGPT / OpenAI

Client for any OpenAI-compatible API. `OpenAI` is an alias for `ChatGPT`.

```javascript
import { ChatGPT } from 'neogram';
// or: import { OpenAI } from 'neogram';

const client = new ChatGPT('https://api.openai.com/v1', {
  Authorization: 'Bearer YOUR_API_KEY',
});

// Chat completion
const resp = await client.generateChatCompletion('gpt-4o', [
  { role: 'user', content: 'Write a haiku' },
], 0.9, 200);
console.log(resp.choices[0].message.content);

// Image generation
const img = await client.generateImage('a sunset over mountains');

// Embeddings
const emb = await client.generateEmbedding('text-embedding-3-small', 'Hello');

// Audio transcription
const text = await client.generateTranscription(audioFile, 'whisper-1', 'en');

// List models
const models = await client.getModels();
```

---

## File Uploads

All media methods accept files in multiple formats:

```javascript
// 1. URL — Telegram downloads it
await bot.sendPhoto({ chat_id, photo: 'https://example.com/photo.jpg' });

// 2. file_id — already uploaded to Telegram (fastest)
await bot.sendPhoto({ chat_id, photo: 'AgACAgIAAxkBAAI...' });

// 3. Buffer
const buf = Buffer.from(fileContent);
buf.name = 'photo.jpg';  // set filename
await bot.sendPhoto({ chat_id, photo: buf });

// 4. ReadStream
import fs from 'fs';
await bot.sendDocument({ chat_id, document: fs.createReadStream('report.pdf') });

// 5. InputFile
import { InputFile } from 'neogram';
await bot.sendDocument({ chat_id, document: new InputFile('/path/to/file.pdf') });

// Get download URL for a file
const file = await bot.getFile({ file_id: 'file_id_here' });
const url = `https://api.telegram.org/file/bot${TOKEN}/${file.file_path}`;
```

---

## Examples

See the [`examples/`](examples/) directory:

| File | Description |
|---|---|
| `simple-bot.js` | Minimal echo bot |
| `test-bot.js` | Commands, photos, polls, dice, keyboards |
| `test-bot-full.js` | Complete bot with inline callbacks |
| `test-bot-comprehensive.js` | Full API test — 25+ commands |
| `ai-bot.js` | AI chat bot with OnlySQ + conversation history |
| `test-bot-debug.js` | Debug and connectivity check |
| `test-all-functions.js` | Automated test suite — 137 tests |

```bash
node examples/simple-bot.js
```

### Complete Bot Example

```javascript
import { Bot, InlineKeyboardMarkup, InlineKeyboardButton, BotCommand } from 'neogram';

const bot = new Bot('YOUR_TOKEN');

// Set commands
await bot.setMyCommands({ commands: [
  new BotCommand({ command: 'start', description: 'Start the bot' }),
  new BotCommand({ command: 'help', description: 'Get help' }),
]});

// /start
bot.onMessage(async (msg) => {
  await bot.sendMessage({
    chat_id: msg.chat.id,
    text: `Welcome, ${msg.from_user.first_name}!`,
    reply_markup: new InlineKeyboardMarkup({
      inline_keyboard: [[
        new InlineKeyboardButton({ text: 'About', callback_data: 'about' }),
        new InlineKeyboardButton({ text: 'GitHub', url: 'https://github.com/SiriLV/neogram' }),
      ]],
    }),
  });
}, { commands: ['start'] });

// Callback query
bot.onCallbackQuery(async (cb) => {
  if (cb.data === 'about') {
    await bot.answerCallbackQuery({ callback_query_id: cb.id, text: 'neogram v10.0.2', show_alert: true });
  }
});

// Error handling
bot.onError((update, err) => console.error('Error:', err));

// Start
bot.polling();
```

---

## Project Structure

```
src/
├── index.js              Main exports (288 symbols)
├── Bot.js                Bot class — 201 methods
├── TelegramObject.js     Base class with field mapping
├── TelegramError.js      TelegramError + StopPropagation
├── InputFile.js           File upload handling
├── types.js              All 278 Telegram API types
└── ai/
    ├── OnlySQ.js         OnlySQ API client
    ├── Deef.js           Translate, Perplexity, Toolbaz, utils
    └── ChatGPT.js        OpenAI-compatible client
types/
└── index.d.ts            TypeScript declarations
```

## Contributing

Telegram channel: https://t.me/neogram_js

## Credits

- [Original Python library by SiriLV](https://github.com/SiriLV/neogram)
- [JavaScript port by AndrewImm-OP](https://github.com/AndrewImm-OP/neogram)

## License

[MIT](LICENSE)
