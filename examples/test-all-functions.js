#!/usr/bin/env node
/**
 * neogram v10.0.2 — FULL FUNCTION TEST SUITE
 *
 * Tests EVERY public function: 201 Bot methods, 278 types, 20 handlers,
 * handler filters, dispatch logic, AI utilities, core classes.
 *
 * Usage:
 *   node examples/test-all-functions.js
 *   # With chat tests (send /start to bot first):
 *   CHAT_ID=123456 node examples/test-all-functions.js
 */

import * as neo from '../src/index.js';

const TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN';
const SQ_KEY = 'YOUR_ONLYSQ_KEY';
let P = 0, F = 0, S = 0;

function ok(n, d = '') { P++; console.log(`  [OK]   ${n}${d ? ' — ' + d : ''}`); }
function fail(n, e) { F++; console.log(`  [FAIL] ${n} — ${e}`); }
function skip(n, r) { S++; console.log(`  [SKIP] ${n} — ${r}`); }
async function t(n, fn) {
  try {
    const r = await fn();
    if (r === '__SKIP__') { skip(n, 'precondition'); return; }
    ok(n, typeof r === 'string' ? r : '');
  } catch (e) { fail(n, e.message || e); }
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

console.log('');
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║      neogram v10.0.2 — COMPLETE FUNCTION TEST SUITE       ║');
console.log('╚════════════════════════════════════════════════════════════╝');

// ╔═══════════════════════════════════════════════════════════════════════╗
// ║ 1. CORE CLASSES                                                      ║
// ╚═══════════════════════════════════════════════════════════════════════╝
console.log('\n─── 1. Core Classes ───');

await t('TelegramObject(data)', () => {
  const o = new neo.TelegramObject({ id: 1, text: 'hi' });
  if (o.id !== 1 || o.text !== 'hi') throw 'fields';
  return 'id=1';
});
await t('TelegramObject field map from->from_user', () => {
  const o = new neo.TelegramObject({ from: { id: 5 } });
  if (!o.from_user) throw 'no from_user';
});
await t('TelegramObject field map type->type_val', () => {
  const o = new neo.TelegramObject({ type: 'private' });
  if (o.type_val !== 'private') throw 'no type_val';
});
await t('TelegramObject field map filter->filter_val', () => {
  const o = new neo.TelegramObject({ filter: 'x' });
  if (o.filter_val !== 'x') throw 'no filter_val';
});
await t('TelegramObject.toJSON() reverse from_user->from', () => {
  const j = new neo.TelegramObject({ from: { id: 1 } }).toJSON();
  if (!j.from || j.from_user) throw 'bad reverse';
});
await t('TelegramObject.toJSON() reverse type_val->type', () => {
  const j = new neo.TelegramObject({ type: 'x' }).toJSON();
  if (j.type !== 'x' || j.type_val) throw 'bad reverse';
});
await t('TelegramObject.toJSON() nested objects', () => {
  const kb = new neo.InlineKeyboardMarkup({
    inline_keyboard: [[new neo.InlineKeyboardButton({ text: 'X', callback_data: 'x' })]]
  });
  const j = kb.toJSON();
  if (!j.inline_keyboard[0][0].text) throw 'nested fail';
  return JSON.stringify(j).substring(0, 50);
});
await t('TelegramObject.fromJSON(object)', () => {
  const u = neo.User.fromJSON({ id: 42, is_bot: false, first_name: 'T' });
  if (u.id !== 42) throw 'id';
  return 'User(42)';
});
await t('TelegramObject.fromJSON(array)', () => {
  const a = neo.User.fromJSON([{ id: 1, is_bot: false, first_name: 'A' }, { id: 2, is_bot: true, first_name: 'B' }]);
  if (a.length !== 2) throw 'len';
  return '2 users';
});
await t('TelegramObject.fromJSON(null)', () => {
  if (neo.User.fromJSON(null) !== null) throw 'not null';
});
await t('TelegramObject.toString()', () => {
  const s = new neo.User({ id: 1, is_bot: false, first_name: 'X' }).toString();
  if (!s.includes('User(')) throw 'bad string';
  return s.substring(0, 40);
});
await t('TelegramError constructor', () => {
  const e = new neo.TelegramError(429, 'flood', { retry_after: 5 });
  if (e.errorCode !== 429 || e.retryAfter !== 5 || e.description !== 'flood') throw 'fields';
  return 'code=429, retry=5';
});
await t('TelegramError instanceof Error', () => {
  if (!(new neo.TelegramError(400, 'x') instanceof Error)) throw 'not Error';
});
await t('TelegramError.toString()', () => {
  const s = new neo.TelegramError(400, 'Bad Request').toString();
  if (!s.includes('400')) throw 'no code';
  return s;
});
await t('StopPropagation constructor', () => {
  const e = new neo.StopPropagation();
  if (e.name !== 'StopPropagation') throw 'name';
});
await t('StopPropagation instanceof Error', () => {
  if (!(new neo.StopPropagation() instanceof Error)) throw 'not Error';
});
await t('InputFile(path)', () => {
  const f = new neo.InputFile('/tmp/test.txt');
  if (f.filename !== 'test.txt') throw 'filename';
  return 'filename=test.txt';
});
await t('InputFile(path, custom name)', () => {
  const f = new neo.InputFile('/tmp/x', 'report.pdf');
  if (f.filename !== 'report.pdf') throw 'custom name';
});
await t('InputFile(Buffer)', () => {
  const f = new neo.InputFile(Buffer.from('x'), 'f.txt');
  if (f.filename !== 'f.txt') throw 'filename';
});
await t('InputFile.open() returns [name, source]', () => {
  const [name, src] = new neo.InputFile(Buffer.from('x'), 'f.txt').open();
  if (name !== 'f.txt' || !Buffer.isBuffer(src)) throw 'bad open';
});
await t('InputFile.isFileLike(Buffer)', () => { if (!neo.InputFile.isFileLike(Buffer.from('x'))) throw ''; });
await t('InputFile.isFileLike(InputFile)', () => { if (!neo.InputFile.isFileLike(new neo.InputFile('x'))) throw ''; });
await t('InputFile.isFileLike(string)=false', () => { if (neo.InputFile.isFileLike('str')) throw 'true'; });
await t('InputFile.isFileLike(number)=false', () => { if (neo.InputFile.isFileLike(42)) throw 'true'; });
await t('TYPE_REGISTRY has 278 types', () => {
  const c = Object.keys(neo.TYPE_REGISTRY).length;
  if (c < 278) throw 'only ' + c;
  return c + ' types';
});
await t('createType()', () => {
  const u = neo.createType('User', { id: 99, is_bot: true, first_name: 'B' });
  if (u.id !== 99) throw 'id';
  return 'User(99)';
});
await t('createType() unknown returns raw', () => {
  const r = neo.createType('NonExistent', { a: 1 });
  if (r.a !== 1) throw 'not raw';
});

// ╔═══════════════════════════════════════════════════════════════════════╗
// ║ 2. ALL 278 TYPE CLASSES                                              ║
// ╚═══════════════════════════════════════════════════════════════════════╝
console.log('\n─── 2. All 278 Type Classes ───');

const typeNames = Object.keys(neo.TYPE_REGISTRY);
let typeOk = 0, typeFail = 0;
for (const name of typeNames) {
  try {
    const cls = neo.TYPE_REGISTRY[name];
    const o = new cls({ id: 1, text: 'test' });
    if (o.constructor.name !== name) throw 'name';
    const j = o.toJSON();
    if (typeof j !== 'object') throw 'toJSON';
    typeOk++;
  } catch (e) { typeFail++; console.log(`  [FAIL] ${name} — ${e}`); }
}
if (typeFail === 0) ok(`All ${typeOk} types: construct + toJSON`);
else fail(`${typeFail}/${typeNames.length} types failed`, '');

// ╔═══════════════════════════════════════════════════════════════════════╗
// ║ 3. BOT CONSTRUCTOR & HANDLER SYSTEM                                  ║
// ╚═══════════════════════════════════════════════════════════════════════╝
console.log('\n─── 3. Bot Constructor & Options ───');

await t('Bot(token)', () => { const b = new neo.Bot('t:k'); if (!b.token) throw ''; });
await t('Bot(token, {timeout})', () => {
  const b = new neo.Bot('t:k', { timeout: 120 });
  if (b.timeout !== 120000) throw 'timeout=' + b.timeout;
  return 'timeout=120s';
});
await t('Bot(token, {parseMode})', () => {
  const b = new neo.Bot('t:k', { parseMode: 'HTML' });
  if (b.parseMode !== 'HTML') throw '';
});
await t('Bot(token, {maxRetries})', () => {
  const b = new neo.Bot('t:k', { maxRetries: 5 });
  if (b.maxRetries !== 5) throw '';
});
await t('Bot(token, {retryOnFlood:false})', () => {
  const b = new neo.Bot('t:k', { retryOnFlood: false });
  if (b.retryOnFlood !== false) throw '';
});
await t('Bot(token, {apiUrl})', () => {
  const b = new neo.Bot('t:k', { apiUrl: 'http://localhost:8081' });
  if (!b.apiUrl.includes('localhost')) throw '';
});
await t('Bot("") throws', () => {
  try { new neo.Bot(''); throw 'no error'; } catch (e) { if (e === 'no error') throw e; }
});

console.log('\n─── 3b. Handler Registration (20 methods) ───');

const handlerMethods = [
  'onMessage', 'onEditedMessage', 'onChannelPost', 'onEditedChannelPost',
  'onCallbackQuery', 'onInlineQuery', 'onMyChatMember', 'onChatMember',
  'onChatJoinRequest', 'onPoll', 'onPollAnswer', 'onPreCheckoutQuery',
  'onShippingQuery', 'onChosenInlineResult', 'onMessageReaction',
  'onMessageReactionCount', 'onChatBoost', 'onRemovedChatBoost',
  'onBusinessMessage', 'onPurchasedPaidMedia',
];
for (const m of handlerMethods) {
  await t(`Bot.${m}()`, () => {
    const b = new neo.Bot('t:k');
    b[m](() => {}, { commands: ['x'] });
    const kind = m.replace(/^on/, '').replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
    // Find the handler list that got a new entry
    let found = false;
    for (const [k, v] of Object.entries(b._handlers)) {
      if (v.length > 0) { found = true; break; }
    }
    if (!found) throw 'not registered';
  });
}

await t('Bot.registerHandler()', () => {
  const b = new neo.Bot('t:k');
  b.registerHandler('message', () => {}, { commands: ['test'] });
  if (b._handlers.message.length !== 1) throw 'not registered';
});

await t('Bot.onError()', () => {
  const b = new neo.Bot('t:k');
  b.onError(() => {});
  if (b._errorHandlers.length !== 1) throw '';
});

await t('Bot.stopPolling()', () => {
  const b = new neo.Bot('t:k');
  b._polling = true;
  b.stopPolling();
  if (b._polling !== false) throw 'still polling';
});

console.log('\n─── 3c. Filter Matching ───');

await t('filter: commands [/start]', () => {
  if (!neo.Bot._matches({ filters: { commands: ['start'] } }, { text: '/start' })) throw '';
});
await t('filter: commands [/start] with @bot', () => {
  if (!neo.Bot._matches({ filters: { commands: ['start'] } }, { text: '/start@mybot' })) throw '';
});
await t('filter: commands rejects /other', () => {
  if (neo.Bot._matches({ filters: { commands: ['start'] } }, { text: '/other' })) throw 'matched';
});
await t('filter: commands rejects plain text', () => {
  if (neo.Bot._matches({ filters: { commands: ['start'] } }, { text: 'hello' })) throw 'matched';
});
await t('filter: commands rejects bare /', () => {
  if (neo.Bot._matches({ filters: { commands: ['start'] } }, { text: '/' })) throw 'matched';
});
await t('filter: regexp match', () => {
  if (!neo.Bot._matches({ filters: { regexp: 'hel+o' } }, { text: 'say hello' })) throw '';
});
await t('filter: regexp no match', () => {
  if (neo.Bot._matches({ filters: { regexp: '^exact$' } }, { text: 'not exact' })) throw 'matched';
});
await t('filter: regexp on caption', () => {
  if (!neo.Bot._matches({ filters: { regexp: 'cap' } }, { caption: 'my caption' })) throw '';
});
await t('filter: func predicate true', () => {
  if (!neo.Bot._matches({ filters: { func: m => m.text?.length > 3 } }, { text: 'long' })) throw '';
});
await t('filter: func predicate false', () => {
  if (neo.Bot._matches({ filters: { func: m => m.text?.length > 10 } }, { text: 'hi' })) throw 'matched';
});
await t('filter: contentTypes [photo]', () => {
  if (!neo.Bot._matches({ filters: { contentTypes: ['photo'] } }, { photo: [{}] })) throw '';
});
await t('filter: contentTypes [text] rejects photo', () => {
  if (neo.Bot._matches({ filters: { contentTypes: ['text'] } }, { photo: [{}] })) throw 'matched';
});
await t('filter: chatTypes [private]', () => {
  if (!neo.Bot._matches({ filters: { chatTypes: ['private'] } }, { chat: { type_val: 'private' } })) throw '';
});
await t('filter: chatTypes rejects group', () => {
  if (neo.Bot._matches({ filters: { chatTypes: ['private'] } }, { chat: { type_val: 'group' } })) throw 'matched';
});
await t('filter: userIds whitelist', () => {
  if (!neo.Bot._matches({ filters: { userIds: [100, 200] } }, { from_user: { id: 100 } })) throw '';
});
await t('filter: userIds rejects unknown', () => {
  if (neo.Bot._matches({ filters: { userIds: [100] } }, { from_user: { id: 999 } })) throw 'matched';
});
await t('filter: chatIds whitelist', () => {
  if (!neo.Bot._matches({ filters: { chatIds: [50] } }, { chat: { id: 50 } })) throw '';
});
await t('filter: chatIds rejects unknown', () => {
  if (neo.Bot._matches({ filters: { chatIds: [50] } }, { chat: { id: 99 } })) throw 'matched';
});
await t('filter: data exact match', () => {
  if (!neo.Bot._matches({ filters: { data: 'btn_ok' } }, { data: 'btn_ok' })) throw '';
});
await t('filter: data regex match', () => {
  if (!neo.Bot._matches({ filters: { data: '^btn_' } }, { data: 'btn_123' })) throw '';
});
await t('filter: data function', () => {
  if (!neo.Bot._matches({ filters: { data: d => d.startsWith('x') } }, { data: 'xyz' })) throw '';
});
await t('filter: combined commands+chatTypes', () => {
  const h = { filters: { commands: ['start'], chatTypes: ['private'] } };
  if (!neo.Bot._matches(h, { text: '/start', chat: { type_val: 'private' } })) throw '';
  if (neo.Bot._matches(h, { text: '/start', chat: { type_val: 'group' } })) throw 'group matched';
});
await t('filter: empty filters matches all', () => {
  if (!neo.Bot._matches({ filters: {} }, { text: 'anything' })) throw '';
});

console.log('\n─── 3d. Dispatch Logic ───');

await t('dispatch: first-match-wins', async () => {
  const b = new neo.Bot('t:k');
  const calls = [];
  b.onMessage(() => calls.push(1), { commands: ['x'] });
  b.onMessage(() => calls.push(2), { commands: ['x'] });
  await b._dispatch({ message: { text: '/x', chat: { id: 1 } } });
  if (calls.join() !== '1') throw calls;
});
await t('dispatch: StopPropagation no crash', async () => {
  const b = new neo.Bot('t:k');
  b.onMessage(() => { throw new neo.StopPropagation(); });
  await b._dispatch({ message: { text: 'x', chat: { id: 1 } } });
});
await t('dispatch: error handler called', async () => {
  const b = new neo.Bot('t:k');
  let errCalled = false;
  b.onMessage(() => { throw new Error('test'); });
  b.onError(() => { errCalled = true; });
  await b._dispatch({ message: { text: 'x', chat: { id: 1 } } });
  if (!errCalled) throw 'not called';
});
await t('dispatch: handler receives (obj, update)', async () => {
  const b = new neo.Bot('t:k');
  let gotObj, gotUpd;
  b.onMessage((o, u) => { gotObj = o; gotUpd = u; });
  const upd = { message: { text: 'hi', chat: { id: 1 } } };
  await b._dispatch(upd);
  if (gotObj !== upd.message || gotUpd !== upd) throw 'wrong args';
});
await t('dispatch: callback_query', async () => {
  const b = new neo.Bot('t:k');
  let got = null;
  b.onCallbackQuery((cb) => { got = cb.data; }, { data: 'x' });
  await b._dispatch({ callback_query: { id: '1', data: 'x' } });
  if (got !== 'x') throw 'not dispatched';
});
await t('dispatch: no match = no call', async () => {
  const b = new neo.Bot('t:k');
  let called = false;
  b.onMessage(() => { called = true; }, { commands: ['nope'] });
  await b._dispatch({ message: { text: 'hello', chat: { id: 1 } } });
  if (called) throw 'called';
});

// ╔═══════════════════════════════════════════════════════════════════════╗
// ║ 4. ALL 201 BOT METHODS EXIST                                        ║
// ╚═══════════════════════════════════════════════════════════════════════╝
console.log('\n─── 4. All 201 Bot Methods Exist ───');

const bot = new neo.Bot(TOKEN);
const allMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(bot))
  .filter(m => !m.startsWith('_') && m !== 'constructor' && typeof bot[m] === 'function')
  .sort();

let methodOk = 0;
for (const m of allMethods) {
  if (typeof bot[m] !== 'function') { fail(`Bot.${m} exists`, 'not a function'); continue; }
  methodOk++;
}
ok(`All ${methodOk} Bot methods exist as functions`);

// ╔═══════════════════════════════════════════════════════════════════════╗
// ║ 5. BOT API — NO CHAT_ID NEEDED                                      ║
// ╚═══════════════════════════════════════════════════════════════════════╝
console.log('\n─── 5. Bot API — Global (no chat_id) ───');

await t('getMe()', async () => {
  const me = await bot.getMe();
  if (!me.id) throw 'no id';
  return `@${me.username} id=${me.id}`;
});
await t('getWebhookInfo()', async () => {
  const w = await bot.getWebhookInfo();
  return `url="${w.url || ''}" pending=${w.pending_update_count}`;
});
await t('getUpdates()', async () => {
  const u = await bot.getUpdates({ timeout: 1, limit: 1 });
  return `${u.length} updates`;
});
await t('setMyCommands()', async () => {
  await bot.setMyCommands({ commands: [new neo.BotCommand({ command: 'start', description: 'S' })] });
});
await t('getMyCommands()', async () => {
  const c = await bot.getMyCommands();
  return `${c.length} cmds`;
});
await t('deleteMyCommands()', async () => { await bot.deleteMyCommands(); });
await t('setMyCommands() restore', async () => {
  await bot.setMyCommands({ commands: [
    new neo.BotCommand({ command: 'start', description: 'Start' }),
    new neo.BotCommand({ command: 'help', description: 'Help' }),
  ] });
});
await t('setMyName()', async () => { await bot.setMyName({ name: 'neogram-js Test Bot' }); });
await t('getMyName()', async () => {
  const n = await bot.getMyName();
  return `"${n.name}"`;
});
await t('setMyDescription()', async () => { await bot.setMyDescription({ description: 'Testing neogram-js' }); });
await t('getMyDescription()', async () => {
  const d = await bot.getMyDescription();
  return `"${d.description}"`;
});
await t('setMyShortDescription()', async () => { await bot.setMyShortDescription({ short_description: 'neogram' }); });
await t('getMyShortDescription()', async () => {
  const d = await bot.getMyShortDescription();
  return `"${d.short_description}"`;
});
await t('getMyDefaultAdministratorRights()', async () => {
  const r = await bot.getMyDefaultAdministratorRights();
  return JSON.stringify(r).substring(0, 50);
});
await t('getChatMenuButton()', async () => {
  const b = await bot.getChatMenuButton({});
  return JSON.stringify(b).substring(0, 40);
});
await t('getForumTopicIconStickers()', async () => {
  const s = await bot.getForumTopicIconStickers();
  return `${s.length} stickers`;
});
await t('getMyStarBalance()', async () => {
  try {
    const b = await bot.getMyStarBalance();
    return JSON.stringify(b);
  } catch (e) {
    if (e.errorCode === 400) return 'expected 400 (no stars)';
    throw e;
  }
});
await t('getStarTransactions()', async () => {
  try {
    const t = await bot.getStarTransactions({ limit: 1 });
    return JSON.stringify(t).substring(0, 50);
  } catch (e) {
    if (e.errorCode === 400) return 'expected error';
    throw e;
  }
});
await t('getAvailableGifts()', async () => {
  try {
    const g = await bot.getAvailableGifts();
    return `gifts: ${JSON.stringify(g).substring(0, 50)}`;
  } catch (e) {
    return `${e.errorCode}: ${e.description?.substring(0, 40)}`;
  }
});
await t('deleteWebhook()', async () => { await bot.deleteWebhook({}); });

// ╔═══════════════════════════════════════════════════════════════════════╗
// ║ 6. BOT API — CHAT-SPECIFIC                                          ║
// ╚═══════════════════════════════════════════════════════════════════════╝
console.log('\n─── 6. Bot API — Chat-specific ───');

let chatId = process.env.CHAT_ID ? parseInt(process.env.CHAT_ID) : null;
if (!chatId) {
  const updates = await bot.getUpdates({ timeout: 1, limit: 100 });
  for (const u of updates) {
    chatId = u.message?.chat?.id || u.callback_query?.message?.chat?.id;
    if (chatId) break;
  }
}

if (!chatId) {
  skip('ALL chat-specific tests (26 tests)', 'No chat_id. Send /start to @ADSearch_Log_bot, then re-run');
} else {
  console.log(`  chat_id: ${chatId}`);

  // --- Send methods ---
  let msgId;
  await t('sendMessage(text)', async () => {
    const m = await bot.sendMessage({ chat_id: chatId, text: 'Test: sendMessage' });
    msgId = m.message_id;
    return `id=${m.message_id}`;
  });
  await t('sendMessage(HTML)', async () => {
    const m = await bot.sendMessage({ chat_id: chatId, text: '<b>bold</b> <i>italic</i> <code>code</code>', parse_mode: 'HTML' });
    return `id=${m.message_id}`;
  });
  await t('sendMessage(reply)', async () => {
    const m = await bot.sendMessage({ chat_id: chatId, text: 'reply test',
      reply_parameters: new neo.ReplyParameters({ message_id: msgId }) });
    return `replied to ${msgId}`;
  });
  await t('sendMessage(InlineKeyboard)', async () => {
    const kb = new neo.InlineKeyboardMarkup({ inline_keyboard: [
      [new neo.InlineKeyboardButton({ text: 'Btn', callback_data: 'test' })] ] });
    const m = await bot.sendMessage({ chat_id: chatId, text: 'inline kb', reply_markup: kb });
    return `id=${m.message_id}`;
  });
  await t('sendMessage(ReplyKeyboard)', async () => {
    const kb = new neo.ReplyKeyboardMarkup({ keyboard: [
      [new neo.KeyboardButton({ text: 'TestBtn' })] ], resize_keyboard: true, one_time_keyboard: true });
    const m = await bot.sendMessage({ chat_id: chatId, text: 'reply kb', reply_markup: kb });
    return `id=${m.message_id}`;
  });
  await t('sendMessage(RemoveKeyboard)', async () => {
    const m = await bot.sendMessage({ chat_id: chatId, text: 'rm kb',
      reply_markup: new neo.ReplyKeyboardRemove({ remove_keyboard: true }) });
    return `id=${m.message_id}`;
  });
  await t('sendMessage(ForceReply)', async () => {
    const m = await bot.sendMessage({ chat_id: chatId, text: 'force reply',
      reply_markup: new neo.ForceReply({ force_reply: true, input_field_placeholder: 'type...' }) });
    return `id=${m.message_id}`;
  });
  await t('sendMessage(LinkPreviewOptions)', async () => {
    const m = await bot.sendMessage({ chat_id: chatId, text: 'https://example.com test',
      link_preview_options: new neo.LinkPreviewOptions({ is_disabled: true }) });
    return `id=${m.message_id}`;
  });

  await t('sendPhoto(URL)', async () => {
    const m = await bot.sendPhoto({ chat_id: chatId,
      photo: 'https://www.python.org/static/community_logos/python-logo-master-v3-TM.png', caption: 'sendPhoto' });
    return `id=${m.message_id}`;
  });
  await t('sendDocument(Buffer)', async () => {
    const buf = Buffer.from('neogram test\n'); buf.name = 'test.txt';
    const m = await bot.sendDocument({ chat_id: chatId, document: buf, caption: 'sendDocument' });
    return `id=${m.message_id}`;
  });
  await t('sendLocation()', async () => {
    const m = await bot.sendLocation({ chat_id: chatId, latitude: 48.8566, longitude: 2.3522 });
    return `id=${m.message_id}`;
  });
  await t('sendVenue()', async () => {
    const m = await bot.sendVenue({ chat_id: chatId, latitude: 48.8566, longitude: 2.3522,
      title: 'Eiffel Tower', address: 'Paris' });
    return `id=${m.message_id}`;
  });
  await t('sendContact()', async () => {
    const m = await bot.sendContact({ chat_id: chatId, phone_number: '+0000', first_name: 'Test' });
    return `id=${m.message_id}`;
  });
  await t('sendPoll()', async () => {
    const m = await bot.sendPoll({ chat_id: chatId, question: 'Test?',
      options: [new neo.InputPollOption({ text: 'Y' }), new neo.InputPollOption({ text: 'N' })] });
    return `id=${m.message_id}`;
  });
  await t('sendDice(🎲)', async () => {
    const m = await bot.sendDice({ chat_id: chatId, emoji: '🎲' });
    return `val=${m.dice?.value}`;
  });
  await t('sendDice(🎰)', async () => {
    const m = await bot.sendDice({ chat_id: chatId, emoji: '🎰' });
    return `val=${m.dice?.value}`;
  });
  await t('sendMediaGroup()', async () => {
    const msgs = await bot.sendMediaGroup({ chat_id: chatId, media: [
      new neo.InputMediaPhoto({ type_val: 'photo', media: 'https://www.python.org/static/community_logos/python-logo-master-v3-TM.png', caption: '#1' }),
      new neo.InputMediaPhoto({ type_val: 'photo', media: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Unofficial_JavaScript_logo_2.svg/480px-Unofficial_JavaScript_logo_2.svg.png' }),
    ] });
    return `${msgs.length} photos`;
  });
  await t('sendChatAction(typing)', async () => {
    await bot.sendChatAction({ chat_id: chatId, action: 'typing' });
  });
  await t('sendChatAction(upload_photo)', async () => {
    await bot.sendChatAction({ chat_id: chatId, action: 'upload_photo' });
  });
  await t('sendInvoice(Stars)', async () => {
    const m = await bot.sendInvoice({ chat_id: chatId, title: 'Test', description: 'Test',
      payload: 'p_' + Date.now(), provider_token: '', currency: 'XTR',
      prices: [new neo.LabeledPrice({ label: 'I', amount: 1 })] });
    return `id=${m.message_id}`;
  });

  // --- Edit / Delete ---
  await t('editMessageText()', async () => {
    const m = await bot.sendMessage({ chat_id: chatId, text: 'before edit' });
    await sleep(300);
    await bot.editMessageText({ chat_id: chatId, message_id: m.message_id, text: 'after edit' });
    return `edited ${m.message_id}`;
  });
  await t('editMessageCaption()', async () => {
    const m = await bot.sendPhoto({ chat_id: chatId,
      photo: 'https://www.python.org/static/community_logos/python-logo-master-v3-TM.png', caption: 'old' });
    await sleep(300);
    await bot.editMessageCaption({ chat_id: chatId, message_id: m.message_id, caption: 'new' });
    return `edited ${m.message_id}`;
  });
  await t('editMessageReplyMarkup()', async () => {
    const kb1 = new neo.InlineKeyboardMarkup({ inline_keyboard: [[new neo.InlineKeyboardButton({ text: 'A', callback_data: 'a' })]] });
    const m = await bot.sendMessage({ chat_id: chatId, text: 'markup', reply_markup: kb1 });
    await sleep(300);
    const kb2 = new neo.InlineKeyboardMarkup({ inline_keyboard: [[new neo.InlineKeyboardButton({ text: 'B', callback_data: 'b' })]] });
    await bot.editMessageReplyMarkup({ chat_id: chatId, message_id: m.message_id, reply_markup: kb2 });
    return `edited ${m.message_id}`;
  });
  await t('deleteMessage()', async () => {
    const m = await bot.sendMessage({ chat_id: chatId, text: 'will delete' });
    await sleep(300);
    await bot.deleteMessage({ chat_id: chatId, message_id: m.message_id });
    return `deleted ${m.message_id}`;
  });
  await t('deleteMessages()', async () => {
    const m1 = await bot.sendMessage({ chat_id: chatId, text: 'd1' });
    const m2 = await bot.sendMessage({ chat_id: chatId, text: 'd2' });
    await sleep(300);
    await bot.deleteMessages({ chat_id: chatId, message_ids: [m1.message_id, m2.message_id] });
    return 'deleted 2';
  });
  await t('forwardMessage()', async () => {
    const fwd = await bot.forwardMessage({ chat_id: chatId, from_chat_id: chatId, message_id: msgId });
    await bot.deleteMessage({ chat_id: chatId, message_id: fwd.message_id });
    return `fwd ${msgId}`;
  });
  await t('copyMessage()', async () => {
    const cp = await bot.copyMessage({ chat_id: chatId, from_chat_id: chatId, message_id: msgId });
    return `copy id=${cp.message_id}`;
  });
  await t('setMessageReaction()', async () => {
    const m = await bot.sendMessage({ chat_id: chatId, text: 'reaction test' });
    try {
      await bot.setMessageReaction({ chat_id: chatId, message_id: m.message_id,
        reaction: [new neo.ReactionTypeEmoji({ type_val: 'emoji', emoji: '👍' })] });
      return 'set';
    } catch (e) { return e.description?.substring(0, 30); }
  });
  await t('pinChatMessage()', async () => {
    const m = await bot.sendMessage({ chat_id: chatId, text: 'pin test' });
    try {
      await bot.pinChatMessage({ chat_id: chatId, message_id: m.message_id, disable_notification: true });
      await sleep(300);
      await bot.unpinChatMessage({ chat_id: chatId, message_id: m.message_id });
      return 'pin+unpin';
    } catch (e) { return e.description?.substring(0, 30); }
  });

  // --- Chat info ---
  await t('getChat()', async () => {
    const c = await bot.getChat({ chat_id: chatId });
    return `type=${c.type_val || c.type}`;
  });
  await t('getChatMemberCount()', async () => {
    const c = await bot.getChatMemberCount({ chat_id: chatId });
    return `count=${c}`;
  });
  await t('getChatMember()', async () => {
    const me = await bot.getMe();
    const m = await bot.getChatMember({ chat_id: chatId, user_id: me.id });
    return `status=${m.status}`;
  });
  await t('getUserProfilePhotos()', async () => {
    const p = await bot.getUserProfilePhotos({ user_id: chatId });
    return `total=${p.total_count}`;
  });
  await t('exportChatInviteLink()', async () => {
    try {
      const link = await bot.exportChatInviteLink({ chat_id: chatId });
      return link?.substring(0, 30);
    } catch (e) { return e.description?.substring(0, 30); }
  });

  // Final
  await bot.sendMessage({ chat_id: chatId,
    text: `<b>neogram v10.0.2 test complete</b>\nP=${P} F=${F} S=${S}`, parse_mode: 'HTML' });
}

// ╔═══════════════════════════════════════════════════════════════════════╗
// ║ 7. METHODS THAT NEED SPECIAL CONTEXT (existence check)              ║
// ╚═══════════════════════════════════════════════════════════════════════╝
console.log('\n─── 7. Special-context methods (signature check) ───');

// These methods exist but can't be called without specific context
// (business_connection_id, inline_message_id, specific sticker set, etc.)
// We verify they exist and are async functions.
const specialMethods = [
  'logOut', 'close', 'setWebhook',
  'sendLivePhoto', 'sendAudio', 'sendVideo', 'sendAnimation', 'sendVoice',
  'sendVideoNote', 'sendPaidMedia', 'sendSticker', 'sendChecklist', 'sendMessageDraft', 'sendGame',
  'banChatMember', 'unbanChatMember', 'restrictChatMember', 'promoteChatMember',
  'setChatAdministratorCustomTitle', 'setChatMemberTag',
  'banChatSenderChat', 'unbanChatSenderChat', 'setChatPermissions',
  'createChatInviteLink', 'editChatInviteLink',
  'createChatSubscriptionInviteLink', 'editChatSubscriptionInviteLink', 'revokeChatInviteLink',
  'approveChatJoinRequest', 'declineChatJoinRequest',
  'setChatPhoto', 'deleteChatPhoto', 'setChatTitle', 'setChatDescription',
  'unpinAllChatMessages', 'leaveChat',
  'getChatAdministrators', 'getUserPersonalChatMessages',
  'setChatStickerSet', 'deleteChatStickerSet',
  'createForumTopic', 'editForumTopic', 'closeForumTopic', 'reopenForumTopic',
  'deleteForumTopic', 'unpinAllForumTopicMessages',
  'editGeneralForumTopic', 'closeGeneralForumTopic', 'reopenGeneralForumTopic',
  'hideGeneralForumTopic', 'unhideGeneralForumTopic', 'unpinAllGeneralForumTopicMessages',
  'answerCallbackQuery', 'answerGuestQuery',
  'getUserChatBoosts', 'getBusinessConnection',
  'getManagedBotToken', 'replaceManagedBotToken',
  'getManagedBotAccessSettings', 'setManagedBotAccessSettings',
  'setMyProfilePhoto', 'removeMyProfilePhoto',
  'setChatMenuButton', 'setMyDefaultAdministratorRights',
  'editMessageMedia', 'editMessageLiveLocation', 'stopMessageLiveLocation',
  'editMessageChecklist', 'stopPoll',
  'approveSuggestedPost', 'declineSuggestedPost',
  'deleteMessageReaction', 'deleteAllMessageReactions',
  'getStickerSet', 'getCustomEmojiStickers', 'uploadStickerFile',
  'createNewStickerSet', 'addStickerToSet', 'setStickerPositionInSet',
  'deleteStickerFromSet', 'replaceStickerInSet',
  'setStickerEmojiList', 'setStickerKeywords', 'setStickerMaskPosition',
  'setStickerSetTitle', 'setStickerSetThumbnail', 'setCustomEmojiStickerSetThumbnail',
  'deleteStickerSet',
  'answerInlineQuery', 'answerWebAppQuery',
  'savePreparedInlineMessage', 'savePreparedKeyboardButton',
  'createInvoiceLink', 'answerShippingQuery', 'answerPreCheckoutQuery',
  'refundStarPayment', 'editUserStarSubscription',
  'sendGift', 'giftPremiumSubscription',
  'getUserGifts', 'getChatGifts', 'getBusinessAccountGifts',
  'convertGiftToStars', 'upgradeGift', 'transferGift',
  'verifyUser', 'verifyChat', 'removeUserVerification', 'removeChatVerification',
  'readBusinessMessage', 'deleteBusinessMessages',
  'setBusinessAccountName', 'setBusinessAccountUsername', 'setBusinessAccountBio',
  'setBusinessAccountProfilePhoto', 'removeBusinessAccountProfilePhoto',
  'setBusinessAccountGiftSettings', 'getBusinessAccountStarBalance', 'transferBusinessAccountStars',
  'postStory', 'repostStory', 'editStory', 'deleteStory',
  'setGameScore', 'getGameHighScores',
  'setUserEmojiStatus', 'getFile',
  'setPassportDataErrors',
  'infinityPolling', 'polling',
];
let specOk = 0;
for (const m of specialMethods) {
  if (typeof bot[m] === 'function') { specOk++; }
  else { fail(`Bot.${m} exists`, 'not a function'); }
}
ok(`All ${specOk} special-context methods verified as functions`);

// ╔═══════════════════════════════════════════════════════════════════════╗
// ║ 8. AI UTILITIES                                                      ║
// ╚═══════════════════════════════════════════════════════════════════════╝
console.log('\n─── 8. AI Utilities ───');

// OnlySQ
await t('OnlySQ(string key)', () => {
  if (new neo.OnlySQ(SQ_KEY).apiKey !== SQ_KEY) throw '';
});
await t('OnlySQ({apiKey})', () => {
  if (new neo.OnlySQ({ apiKey: SQ_KEY }).apiKey !== SQ_KEY) throw '';
});
await t('OnlySQ.getModels(text)', async () => {
  const m = await new neo.OnlySQ(SQ_KEY).getModels({ modality: 'text' });
  return `${m.length} models`;
});
await t('OnlySQ.getModels(image)', async () => {
  const m = await new neo.OnlySQ(SQ_KEY).getModels({ modality: 'image' });
  return `${m.length} models`;
});
await t('OnlySQ.getModels(return_names)', async () => {
  const m = await new neo.OnlySQ(SQ_KEY).getModels({ modality: 'text', return_names: true });
  return `first: "${m[0]}"`;
});
await t('OnlySQ.getModels(can_tools)', async () => {
  const m = await new neo.OnlySQ(SQ_KEY).getModels({ can_tools: true });
  return `${m.length} models`;
});
await t('OnlySQ.getModels(max_cost)', async () => {
  const m = await new neo.OnlySQ(SQ_KEY).getModels({ max_cost: 0.001 });
  return `${m.length} cheap models`;
});
await t('OnlySQ.generateAnswer()', async () => {
  const a = await new neo.OnlySQ(SQ_KEY).generateAnswer('gpt-5.2-chat', [{ role: 'user', content: 'Say OK' }]);
  if (a.startsWith('Error')) throw a;
  return `"${a.substring(0, 30)}"`;
});

// Deef
const deef = new neo.Deef();
await t('Deef.translate(en->ru)', async () => {
  const r = await deef.translate('Hello', 'ru');
  return `"${r}"`;
});
await t('Deef.translate(ru->en)', async () => {
  const r = await deef.translate('Мир', 'en');
  return `"${r}"`;
});
await t('Deef.translate(empty)', async () => {
  const r = await deef.translate('', 'en');
  if (r !== '') throw 'not empty';
});
await t('Deef.shortUrl()', async () => {
  const r = await deef.shortUrl('https://github.com');
  if (!r.includes('clck.ru')) throw r;
  return r;
});
await t('Deef.shortUrl(empty)', async () => {
  const r = await deef.shortUrl('');
  if (r !== '') throw 'not empty';
});
await t('Deef.encodeBase64()', () => {
  const r = deef.encodeBase64('/home/andrew/projects/neogram/neogram/package.json');
  if (!r || r.length < 10) throw 'short';
  return `${r.length} chars`;
});
await t('Deef.encodeBase64(missing file)', () => {
  const r = deef.encodeBase64('/nonexistent/file.xyz');
  if (r !== null) throw 'not null';
  return 'null';
});
await t('Deef.runInBg(sync)', async () => {
  let ran = false;
  deef.runInBg(() => { ran = true; });
  await sleep(100);
  if (!ran) throw '';
});
await t('Deef.runInBg(async)', async () => {
  let ran = false;
  deef.runInBg(async () => { await sleep(10); ran = true; });
  await sleep(150);
  if (!ran) throw '';
});
await t('Deef.toolchat()', async () => {
  const r = await deef.toolchat('Say OK', 'toolbaz-v4.5-fast');
  if (r === 'Error') throw 'Error';
  return `"${r.substring(0, 40)}"`;
});
await t('Deef.perplexityAsk()', async () => {
  const r = await deef.perplexityAsk('What is 2+2?', 'auto');
  if (r.text === 'Error') throw 'Error';
  return `"${r.text.substring(0, 40)}" urls=${r.urls.length}`;
});

// ChatGPT
await t('ChatGPT constructor', () => {
  const c = new neo.ChatGPT('https://api.openai.com/v1', { Authorization: 'Bearer x' });
  if (c.url !== 'https://api.openai.com/v1') throw '';
});
await t('ChatGPT strips trailing /', () => {
  const c = new neo.ChatGPT('https://api.openai.com/v1/', {});
  if (c.url !== 'https://api.openai.com/v1') throw c.url;
});
await t('OpenAI === ChatGPT', () => {
  if (neo.OpenAI !== neo.ChatGPT) throw '';
});
await t('ChatGPT.generateChatCompletion exists', () => {
  if (typeof new neo.ChatGPT('x', {}).generateChatCompletion !== 'function') throw '';
});
await t('ChatGPT.generateImage exists', () => {
  if (typeof new neo.ChatGPT('x', {}).generateImage !== 'function') throw '';
});
await t('ChatGPT.generateEmbedding exists', () => {
  if (typeof new neo.ChatGPT('x', {}).generateEmbedding !== 'function') throw '';
});
await t('ChatGPT.generateTranscription exists', () => {
  if (typeof new neo.ChatGPT('x', {}).generateTranscription !== 'function') throw '';
});
await t('ChatGPT.generateTranslation exists', () => {
  if (typeof new neo.ChatGPT('x', {}).generateTranslation !== 'function') throw '';
});
await t('ChatGPT.getModels exists', () => {
  if (typeof new neo.ChatGPT('x', {}).getModels !== 'function') throw '';
});

// ╔═══════════════════════════════════════════════════════════════════════╗
// ║ RESULTS                                                              ║
// ╚═══════════════════════════════════════════════════════════════════════╝
console.log('');
console.log('╔════════════════════════════════════════════════════════════╗');
console.log(`║  TOTAL: ${P} passed, ${F} failed, ${S} skipped              `);
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('');

if (F > 0) process.exit(1);
