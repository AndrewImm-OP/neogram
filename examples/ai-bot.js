/**
 * AI-powered bot using neogram v10.0.2 + OnlySQ.
 * Maintains per-user conversation history.
 *
 * Usage:
 *   node examples/ai-bot.js
 *   # or: BOT_TOKEN="..." ONLYSQ_KEY="..." node examples/ai-bot.js
 */

import { Bot, OnlySQ, ReplyParameters } from '../src/index.js';

const TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN';
const ONLYSQ_KEY = process.env.ONLYSQ_KEY || 'YOUR_ONLYSQ_KEY';

const bot = new Bot(TOKEN);
const ai = new OnlySQ({ apiKey: ONLYSQ_KEY });
const histories = new Map();

const SYSTEM = 'You are a friendly assistant. Be concise and helpful.';

// /start
bot.onMessage(async (msg) => {
  histories.delete(msg.from_user?.id);
  await bot.sendMessage({
    chat_id: msg.chat.id,
    text: 'AI Bot ready! Ask me anything.\n\n/clear — reset conversation\n/models — list available models',
  });
}, { commands: ['start'] });

// /clear
bot.onMessage(async (msg) => {
  histories.delete(msg.from_user?.id);
  await bot.sendMessage({ chat_id: msg.chat.id, text: 'Conversation cleared.' });
}, { commands: ['clear'] });

// /models
bot.onMessage(async (msg) => {
  await bot.sendChatAction({ chat_id: msg.chat.id, action: 'typing' });
  try {
    const models = await ai.getModels({ modality: 'text', status: 'work', return_names: true });
    const list = models.slice(0, 20).join('\n');
    await bot.sendMessage({ chat_id: msg.chat.id, text: `Available text models:\n\n${list}` });
  } catch (e) {
    await bot.sendMessage({ chat_id: msg.chat.id, text: `Error: ${e.message}` });
  }
}, { commands: ['models'] });

// Any text message → AI response
bot.onMessage(async (msg) => {
  if (!msg.text || msg.text.startsWith('/')) return;
  const userId = msg.from_user?.id;
  if (!userId) return;

  await bot.sendChatAction({ chat_id: msg.chat.id, action: 'typing' });

  const history = histories.get(userId) || [];
  history.push({ role: 'user', content: msg.text });

  const answer = await ai.generateAnswer('gpt-5.2-chat', [
    { role: 'system', content: SYSTEM },
    ...history,
  ]);

  history.push({ role: 'assistant', content: answer });
  // Keep last 20 messages
  if (history.length > 20) history.splice(0, history.length - 20);
  histories.set(userId, history);

  await bot.sendMessage({
    chat_id: msg.chat.id,
    text: answer,
    reply_parameters: new ReplyParameters({ message_id: msg.message_id }),
  });
});

bot.onError((update, err) => console.error('Error:', err.message));

console.log('AI Bot starting...');
bot.getMe().then(me => {
  console.log(`Bot: @${me.username}`);
  return bot.polling();
}).catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
