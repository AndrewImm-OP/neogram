/**
 * Debug and connectivity test for neogram v10.0.2.
 * Verifies the bot token and basic API calls work.
 *
 * Usage:
 *   node examples/test-bot-debug.js
 *   # or: BOT_TOKEN="your_token" node examples/test-bot-debug.js
 */

import { Bot, TelegramError } from '../src/index.js';

const TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN';

console.log('neogram v10.0.2 — Debug Test');
console.log('Token prefix:', TOKEN.substring(0, 10) + '...');
console.log('');

const bot = new Bot(TOKEN);

try {
  const me = await bot.getMe();
  console.log('getMe OK:');
  console.log('  ID:', me.id);
  console.log('  Username:', me.username);
  console.log('  Name:', me.first_name);
  console.log('  Is Bot:', me.is_bot);
  console.log('');

  const wh = await bot.getWebhookInfo();
  console.log('getWebhookInfo OK:');
  console.log('  URL:', wh.url || '(empty — using long polling)');
  console.log('  Pending updates:', wh.pending_update_count);
  console.log('');

  const commands = await bot.getMyCommands();
  console.log('getMyCommands OK:', commands.length, 'commands');
  for (const c of commands) {
    console.log('  /' + c.command, '-', c.description);
  }
  console.log('');

  console.log('All checks passed!');
} catch (error) {
  if (error instanceof TelegramError) {
    console.error('Telegram API Error:');
    console.error('  Code:', error.errorCode);
    console.error('  Description:', error.description);
  } else {
    console.error('Error:', error.message);
  }
  process.exit(1);
}
