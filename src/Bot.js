import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { TelegramError, StopPropagation } from './TelegramError.js';
import { TelegramObject } from './TelegramObject.js';
import { InputFile } from './InputFile.js';
import { TYPE_REGISTRY, createType } from './types.js';

const API_VERSION = '10.0';
const DEFAULT_API_URL = 'https://api.telegram.org';

const UPDATE_KINDS = [
  'message', 'edited_message', 'channel_post', 'edited_channel_post',
  'inline_query', 'chosen_inline_result', 'callback_query',
  'shipping_query', 'pre_checkout_query', 'poll', 'poll_answer',
  'my_chat_member', 'chat_member', 'chat_join_request', 'chat_boost',
  'removed_chat_boost', 'message_reaction', 'message_reaction_count',
  'business_connection', 'business_message', 'edited_business_message',
  'deleted_business_messages', 'purchased_paid_media',
];

const MESSAGE_CONTENT_TYPES = [
  'text', 'animation', 'audio', 'document', 'paid_media', 'photo', 'sticker',
  'story', 'video', 'video_note', 'voice', 'contact', 'dice', 'game',
  'poll', 'venue', 'location', 'new_chat_members', 'left_chat_member',
  'new_chat_title', 'new_chat_photo', 'delete_chat_photo',
  'group_chat_created', 'supergroup_chat_created', 'channel_chat_created',
  'migrate_to_chat_id', 'migrate_from_chat_id', 'pinned_message',
  'invoice', 'successful_payment', 'refunded_payment',
  'connected_website', 'passport_data', 'forum_topic_created',
  'forum_topic_edited', 'forum_topic_closed', 'forum_topic_reopened',
  'general_forum_topic_hidden', 'general_forum_topic_unhidden',
  'giveaway_created', 'giveaway', 'giveaway_winners', 'giveaway_completed',
  'web_app_data', 'checklist',
];

/** Serialize a value for Telegram API */
function serialize(value) {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  if (value instanceof TelegramObject) return value.toJSON();
  if (Array.isArray(value)) return value.map(v => serialize(v));
  if (typeof value === 'object' && !(value instanceof Buffer) && !value.pipe) {
    const result = {};
    for (const [k, v] of Object.entries(value)) {
      if (v !== undefined && v !== null) result[k] = serialize(v);
    }
    return result;
  }
  return value;
}

/** Check if value contains file-like objects */
function hasFiles(obj) {
  if (!obj || typeof obj !== 'object') return false;
  for (const value of Object.values(obj)) {
    if (value instanceof InputFile) return true;
    if (Buffer.isBuffer(value)) return true;
    if (value && typeof value === 'object' && typeof value.pipe === 'function') return true;
    if (value && typeof value === 'object' && typeof value.read === 'function' && typeof value.pipe === 'function') return true;
  }
  return false;
}

/** Check if message has a given content type */
function messageHasContentType(message, contentTypes) {
  for (const ct of contentTypes) {
    if (message[ct] !== undefined && message[ct] !== null) return true;
  }
  return false;
}

/** Decode API result into typed objects */
function decodeResult(raw, meta) {
  if (raw === null || raw === undefined) return raw;
  if (meta.isList && Array.isArray(raw)) {
    const innerType = meta.listInnerObject;
    if (innerType) {
      return raw.map(item => {
        if (item && typeof item === 'object') return createType(innerType, item);
        return item;
      });
    }
    return raw;
  }
  if (meta.isObject && raw && typeof raw === 'object') {
    return createType(meta.innerObject, raw);
  }
  return raw;
}

export class Bot {
  /**
   * @param {string} token - Bot token from @BotFather
   * @param {Object} [options]
   * @param {number} [options.timeout=60] - HTTP request timeout in seconds
   * @param {string} [options.parseMode] - Default parse mode for messages
   * @param {number} [options.maxRetries=3] - Max retries on transport/server errors
   * @param {boolean} [options.retryOnFlood=true] - Auto-retry on 429 flood errors
   * @param {string} [options.apiUrl] - Custom API URL
   */
  constructor(token, options = {}) {
    if (!token) throw new Error('Bot token is required');
    this.token = token;
    this.apiUrl = (options.apiUrl || DEFAULT_API_URL).replace(/\/+$/, '');
    this.timeout = (options.timeout || 60) * 1000;
    this.parseMode = options.parseMode || null;
    this.maxRetries = options.maxRetries ?? 3;
    this.retryOnFlood = options.retryOnFlood ?? true;

    this._baseUrl = `${this.apiUrl}/bot${this.token}/`;
    this._client = axios.create({
      baseURL: this._baseUrl,
      timeout: this.timeout,
    });

    // Handler system
    this._handlers = {};
    for (const kind of UPDATE_KINDS) {
      this._handlers[kind] = [];
    }
    this._errorHandlers = [];
    this._polling = false;
    this._pollAbort = null;
  }

  // ── HTTP Transport ─────────────────────────────────────────────────────

  async _request(method, payload = null) {
    const url = method;
    let lastError = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        let response;

        if (payload && hasFiles(payload)) {
          // Multipart form data for file uploads
          const form = new FormData();
          for (const [key, value] of Object.entries(payload)) {
            if (value === undefined || value === null) continue;
            if (value instanceof InputFile) {
              const [filename, source] = value.open();
              form.append(key, source, { filename });
            } else if (Buffer.isBuffer(value)) {
              form.append(key, value, { filename: key });
            } else if (value && typeof value === 'object' && typeof value.pipe === 'function') {
              const filename = path.basename(value.path || value.name || key);
              form.append(key, value, { filename });
            } else if (typeof value === 'object') {
              form.append(key, JSON.stringify(serialize(value)));
            } else if (typeof value === 'boolean') {
              form.append(key, value ? 'true' : 'false');
            } else {
              form.append(key, String(value));
            }
          }
          response = await this._client.post(url, form, {
            headers: form.getHeaders(),
            timeout: this.timeout,
          });
        } else {
          // JSON request
          const cleaned = {};
          if (payload) {
            for (const [key, value] of Object.entries(payload)) {
              if (value === undefined || value === null) continue;
              cleaned[key] = serialize(value);
            }
          }
          response = await this._client.post(url, Object.keys(cleaned).length ? cleaned : undefined);
        }

        const body = response.data;
        if (body.ok) return body.result;

        const errCode = body.error_code || response.status;
        const desc = body.description || 'Unknown error';
        const params = body.parameters || {};

        // Flood wait retry
        if (errCode === 429 && this.retryOnFlood && attempt < this.maxRetries) {
          const wait = (params.retry_after || 1) + 1;
          await this._sleep(wait * 1000);
          continue;
        }

        // Server error retry
        if (errCode >= 500 && attempt < this.maxRetries) {
          const wait = Math.min(2 ** attempt, 30);
          await this._sleep(wait * 1000);
          continue;
        }

        throw new TelegramError(errCode, desc, params);

      } catch (error) {
        if (error instanceof TelegramError) throw error;

        // Axios error with response
        if (error.response) {
          const body = error.response.data;
          if (body && typeof body === 'object') {
            const errCode = body.error_code || error.response.status;
            const desc = body.description || error.message;
            const params = body.parameters || {};

            if (errCode === 429 && this.retryOnFlood && attempt < this.maxRetries) {
              const wait = (params.retry_after || 1) + 1;
              await this._sleep(wait * 1000);
              continue;
            }
            if (errCode >= 500 && attempt < this.maxRetries) {
              const wait = Math.min(2 ** attempt, 30);
              await this._sleep(wait * 1000);
              continue;
            }
            throw new TelegramError(errCode, desc, params);
          }
        }

        // Network/transport error
        lastError = error;
        if (attempt < this.maxRetries) {
          const wait = Math.min(2 ** attempt, 30);
          await this._sleep(wait * 1000);
          continue;
        }
        throw error;
      }
    }

    if (lastError) throw lastError;
    throw new TelegramError(0, `Exhausted ${this.maxRetries} retries on ${method}`);
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ── Handler System ─────────────────────────────────────────────────────

  _addHandler(kind, fn, filters = {}) {
    const clean = {};
    for (const [k, v] of Object.entries(filters)) {
      if (v !== undefined && v !== null) clean[k] = v;
    }
    if (!this._handlers[kind]) this._handlers[kind] = [];
    this._handlers[kind].push({ fn, filters: clean });
  }

  /** Register a handler programmatically */
  registerHandler(kind, fn, filters = {}) {
    this._addHandler(kind, fn, filters);
  }

  /** Register a global error handler: fn(update, error) */
  onError(fn) {
    this._errorHandlers.push(fn);
    return fn;
  }

  // ── Handler decorators ─────────────────────────────────────────────────

  /** Register a message handler */
  onMessage(fn, filters = {}) {
    this._addHandler('message', fn, filters);
    return fn;
  }

  /** Register an edited message handler */
  onEditedMessage(fn, filters = {}) {
    this._addHandler('edited_message', fn, filters);
    return fn;
  }

  /** Register a channel post handler */
  onChannelPost(fn, filters = {}) {
    this._addHandler('channel_post', fn, filters);
    return fn;
  }

  /** Register an edited channel post handler */
  onEditedChannelPost(fn, filters = {}) {
    this._addHandler('edited_channel_post', fn, filters);
    return fn;
  }

  /** Register a callback query handler */
  onCallbackQuery(fn, filters = {}) {
    this._addHandler('callback_query', fn, filters);
    return fn;
  }

  /** Register an inline query handler */
  onInlineQuery(fn, filters = {}) {
    this._addHandler('inline_query', fn, filters);
    return fn;
  }

  /** Register a my_chat_member handler */
  onMyChatMember(fn, filters = {}) {
    this._addHandler('my_chat_member', fn, filters);
    return fn;
  }

  /** Register a chat_member handler */
  onChatMember(fn, filters = {}) {
    this._addHandler('chat_member', fn, filters);
    return fn;
  }

  /** Register a chat_join_request handler */
  onChatJoinRequest(fn, filters = {}) {
    this._addHandler('chat_join_request', fn, filters);
    return fn;
  }

  /** Register a poll handler */
  onPoll(fn, filters = {}) {
    this._addHandler('poll', fn, filters);
    return fn;
  }

  /** Register a poll_answer handler */
  onPollAnswer(fn, filters = {}) {
    this._addHandler('poll_answer', fn, filters);
    return fn;
  }

  /** Register a pre_checkout_query handler */
  onPreCheckoutQuery(fn, filters = {}) {
    this._addHandler('pre_checkout_query', fn, filters);
    return fn;
  }

  /** Register a shipping_query handler */
  onShippingQuery(fn, filters = {}) {
    this._addHandler('shipping_query', fn, filters);
    return fn;
  }

  /** Register a chosen_inline_result handler */
  onChosenInlineResult(fn, filters = {}) {
    this._addHandler('chosen_inline_result', fn, filters);
    return fn;
  }

  /** Register a message_reaction handler */
  onMessageReaction(fn, filters = {}) {
    this._addHandler('message_reaction', fn, filters);
    return fn;
  }

  /** Register a message_reaction_count handler */
  onMessageReactionCount(fn, filters = {}) {
    this._addHandler('message_reaction_count', fn, filters);
    return fn;
  }

  /** Register a chat_boost handler */
  onChatBoost(fn, filters = {}) {
    this._addHandler('chat_boost', fn, filters);
    return fn;
  }

  /** Register a removed_chat_boost handler */
  onRemovedChatBoost(fn, filters = {}) {
    this._addHandler('removed_chat_boost', fn, filters);
    return fn;
  }

  /** Register a business_message handler */
  onBusinessMessage(fn, filters = {}) {
    this._addHandler('business_message', fn, filters);
    return fn;
  }

  /** Register a purchased_paid_media handler */
  onPurchasedPaidMedia(fn, filters = {}) {
    this._addHandler('purchased_paid_media', fn, filters);
    return fn;
  }

  // ── Filter matching ────────────────────────────────────────────────────

  static _matches(handler, updateObj) {
    const f = handler.filters;

    // commands filter
    if (f.commands) {
      const text = updateObj.text || '';
      if (!text.startsWith('/')) return false;
      const parts = text.substring(1).split(/\s+/);
      if (!parts.length || !parts[0]) return false;
      const cmd = parts[0].split('@')[0].toLowerCase();
      const cmdSet = new Set(f.commands.map(c => c.replace(/^\//, '').toLowerCase()));
      if (!cmdSet.has(cmd)) return false;
    }

    // content_types filter
    if (f.contentTypes) {
      if (!messageHasContentType(updateObj, f.contentTypes)) return false;
    }

    // regexp filter
    if (f.regexp) {
      const target = updateObj.text || updateObj.caption || '';
      if (!target || !new RegExp(f.regexp).test(target)) return false;
    }

    // chatTypes filter
    if (f.chatTypes) {
      const chat = updateObj.chat;
      const chatType = chat ? (chat.type_val || chat.type) : null;
      if (!chatType || !f.chatTypes.includes(chatType)) return false;
    }

    // userIds filter
    if (f.userIds) {
      const fromUser = updateObj.from_user || updateObj.from;
      const uid = fromUser ? fromUser.id : null;
      if (!uid || !f.userIds.includes(uid)) return false;
    }

    // chatIds filter
    if (f.chatIds) {
      const chat = updateObj.chat;
      const cid = chat ? chat.id : null;
      if (!cid || !f.chatIds.includes(cid)) return false;
    }

    // callback_query data filter
    if (f.data !== undefined) {
      const cqData = updateObj.data || '';
      if (typeof f.data === 'string') {
        if (cqData !== f.data && !new RegExp(f.data).test(cqData)) return false;
      } else if (typeof f.data === 'function') {
        if (!f.data(cqData)) return false;
      }
    }

    // custom predicate
    if (f.func && !f.func(updateObj)) return false;

    return true;
  }

  // ── Dispatch ───────────────────────────────────────────────────────────

  async _dispatch(update) {
    for (const kind of Object.keys(this._handlers)) {
      const obj = update[kind];
      if (obj === undefined || obj === null) continue;

      for (const handler of this._handlers[kind]) {
        if (!Bot._matches(handler, obj)) continue;
        try {
          await handler.fn(obj, update);
        } catch (error) {
          if (error instanceof StopPropagation) break;
          console.error(`Handler error in ${kind}:`, error);
          for (const eh of this._errorHandlers) {
            try { await eh(update, error); } catch (e) { console.error('Error in error handler:', e); }
          }
        }
        break; // first matching handler wins
      }
    }
  }

  // ── Polling ────────────────────────────────────────────────────────────

  stopPolling() {
    this._polling = false;
    if (this._pollAbort) {
      this._pollAbort.abort();
      this._pollAbort = null;
    }
  }

  async polling({ timeout = 30, allowedUpdates = null, noneStop = true, interval = 0 } = {}) {
    let offset = 0;
    this._polling = true;
    console.log('neogram polling started');

    while (this._polling) {
      try {
        const updates = await this.getUpdates({ offset, timeout, allowed_updates: allowedUpdates }) || [];
        for (const upd of updates) {
          offset = upd.update_id + 1;
          await this._dispatch(upd);
        }
        if (interval) await this._sleep(interval * 1000);
      } catch (error) {
        if (error instanceof TelegramError) {
          console.error(`Telegram API error: ${error}`);
        } else {
          console.error('Polling error:', error.message || error);
        }
        if (!noneStop) throw error;
        await this._sleep(3000);
      }
    }
    console.log('neogram polling stopped');
  }

  async infinityPolling(options = {}) {
    options.noneStop = options.noneStop ?? true;
    return this.polling(options);
  }

  // ── Telegram Bot API Methods ───────────────────────────────────────────

  // --- Getting Updates ---

  async getUpdates({ offset, limit, timeout, allowed_updates } = {}) {
    const result = await this._request('getUpdates', { offset, limit, timeout, allowed_updates });
    return decodeResult(result, { isList: true, listInnerObject: 'Update' });
  }

  async setWebhook({ url, certificate, ip_address, max_connections, allowed_updates, drop_pending_updates, secret_token } = {}) {
    return this._request('setWebhook', { url, certificate, ip_address, max_connections, allowed_updates, drop_pending_updates, secret_token });
  }

  async deleteWebhook({ drop_pending_updates } = {}) {
    return this._request('deleteWebhook', { drop_pending_updates });
  }

  async getWebhookInfo() {
    const result = await this._request('getWebhookInfo');
    return decodeResult(result, { isObject: true, innerObject: 'WebhookInfo' });
  }

  // --- Bot info ---

  async getMe() {
    const result = await this._request('getMe');
    return decodeResult(result, { isObject: true, innerObject: 'User' });
  }

  async logOut() {
    return this._request('logOut');
  }

  async close() {
    return this._request('close');
  }

  // --- Messages ---

  async sendMessage({ chat_id, text, business_connection_id, message_thread_id, direct_messages_topic_id, parse_mode, entities, link_preview_options, disable_notification, protect_content, allow_paid_broadcast, message_effect_id, suggested_post_parameters, reply_parameters, reply_markup } = {}) {
    const result = await this._request('sendMessage', {
      chat_id, text: text, business_connection_id, message_thread_id, direct_messages_topic_id,
      parse_mode: parse_mode || this.parseMode, entities, link_preview_options,
      disable_notification, protect_content, allow_paid_broadcast, message_effect_id,
      suggested_post_parameters, reply_parameters, reply_markup,
    });
    return decodeResult(result, { isObject: true, innerObject: 'Message' });
  }

  async forwardMessage({ chat_id, from_chat_id, message_id, message_thread_id, direct_messages_topic_id, video_start_timestamp, disable_notification, protect_content, message_effect_id, suggested_post_parameters } = {}) {
    const result = await this._request('forwardMessage', {
      chat_id, from_chat_id, message_id, message_thread_id, direct_messages_topic_id,
      video_start_timestamp, disable_notification, protect_content, message_effect_id, suggested_post_parameters,
    });
    return decodeResult(result, { isObject: true, innerObject: 'Message' });
  }

  async forwardMessages({ chat_id, from_chat_id, message_ids, message_thread_id, direct_messages_topic_id, disable_notification, protect_content } = {}) {
    const result = await this._request('forwardMessages', {
      chat_id, from_chat_id, message_ids, message_thread_id, direct_messages_topic_id, disable_notification, protect_content,
    });
    return decodeResult(result, { isList: true, listInnerObject: 'MessageId' });
  }

  async copyMessage({ chat_id, from_chat_id, message_id, message_thread_id, direct_messages_topic_id, video_start_timestamp, caption, parse_mode, caption_entities, show_caption_above_media, disable_notification, protect_content, allow_paid_broadcast, message_effect_id, suggested_post_parameters, reply_parameters, reply_markup } = {}) {
    const result = await this._request('copyMessage', {
      chat_id, from_chat_id, message_id, message_thread_id, direct_messages_topic_id,
      video_start_timestamp, caption, parse_mode, caption_entities, show_caption_above_media,
      disable_notification, protect_content, allow_paid_broadcast, message_effect_id,
      suggested_post_parameters, reply_parameters, reply_markup,
    });
    return decodeResult(result, { isObject: true, innerObject: 'MessageId' });
  }

  async copyMessages({ chat_id, from_chat_id, message_ids, message_thread_id, direct_messages_topic_id, disable_notification, protect_content, remove_caption } = {}) {
    const result = await this._request('copyMessages', {
      chat_id, from_chat_id, message_ids, message_thread_id, direct_messages_topic_id, disable_notification, protect_content, remove_caption,
    });
    return decodeResult(result, { isList: true, listInnerObject: 'MessageId' });
  }

  // --- Media ---

  async sendPhoto({ chat_id, photo, business_connection_id, message_thread_id, direct_messages_topic_id, caption, parse_mode, caption_entities, show_caption_above_media, has_spoiler, disable_notification, protect_content, allow_paid_broadcast, message_effect_id, suggested_post_parameters, reply_parameters, reply_markup } = {}) {
    const result = await this._request('sendPhoto', {
      chat_id, photo, business_connection_id, message_thread_id, direct_messages_topic_id,
      caption, parse_mode: parse_mode || this.parseMode, caption_entities, show_caption_above_media,
      has_spoiler, disable_notification, protect_content, allow_paid_broadcast, message_effect_id,
      suggested_post_parameters, reply_parameters, reply_markup,
    });
    return decodeResult(result, { isObject: true, innerObject: 'Message' });
  }

  async sendLivePhoto({ chat_id, live_photo, photo, business_connection_id, message_thread_id, direct_messages_topic_id, caption, parse_mode, caption_entities, show_caption_above_media, has_spoiler, disable_notification, protect_content, allow_paid_broadcast, message_effect_id, suggested_post_parameters, reply_parameters, reply_markup } = {}) {
    const result = await this._request('sendLivePhoto', {
      chat_id, live_photo, photo, business_connection_id, message_thread_id, direct_messages_topic_id,
      caption, parse_mode: parse_mode || this.parseMode, caption_entities, show_caption_above_media,
      has_spoiler, disable_notification, protect_content, allow_paid_broadcast, message_effect_id,
      suggested_post_parameters, reply_parameters, reply_markup,
    });
    return decodeResult(result, { isObject: true, innerObject: 'Message' });
  }

  async sendAudio({ chat_id, audio, business_connection_id, message_thread_id, direct_messages_topic_id, caption, parse_mode, caption_entities, duration, performer, title, thumbnail, disable_notification, protect_content, allow_paid_broadcast, message_effect_id, suggested_post_parameters, reply_parameters, reply_markup } = {}) {
    const result = await this._request('sendAudio', {
      chat_id, audio, business_connection_id, message_thread_id, direct_messages_topic_id,
      caption, parse_mode: parse_mode || this.parseMode, caption_entities, duration, performer, title, thumbnail,
      disable_notification, protect_content, allow_paid_broadcast, message_effect_id,
      suggested_post_parameters, reply_parameters, reply_markup,
    });
    return decodeResult(result, { isObject: true, innerObject: 'Message' });
  }

  async sendDocument({ chat_id, document, business_connection_id, message_thread_id, direct_messages_topic_id, thumbnail, caption, parse_mode, caption_entities, disable_content_type_detection, disable_notification, protect_content, allow_paid_broadcast, message_effect_id, suggested_post_parameters, reply_parameters, reply_markup } = {}) {
    const result = await this._request('sendDocument', {
      chat_id, document, business_connection_id, message_thread_id, direct_messages_topic_id,
      thumbnail, caption, parse_mode: parse_mode || this.parseMode, caption_entities,
      disable_content_type_detection, disable_notification, protect_content, allow_paid_broadcast,
      message_effect_id, suggested_post_parameters, reply_parameters, reply_markup,
    });
    return decodeResult(result, { isObject: true, innerObject: 'Message' });
  }

  async sendVideo({ chat_id, video, business_connection_id, message_thread_id, direct_messages_topic_id, duration, width, height, thumbnail, cover, start_timestamp, caption, parse_mode, caption_entities, show_caption_above_media, has_spoiler, supports_streaming, disable_notification, protect_content, allow_paid_broadcast, message_effect_id, suggested_post_parameters, reply_parameters, reply_markup } = {}) {
    const result = await this._request('sendVideo', {
      chat_id, video, business_connection_id, message_thread_id, direct_messages_topic_id,
      duration, width, height, thumbnail, cover, start_timestamp, caption,
      parse_mode: parse_mode || this.parseMode, caption_entities, show_caption_above_media,
      has_spoiler, supports_streaming, disable_notification, protect_content, allow_paid_broadcast,
      message_effect_id, suggested_post_parameters, reply_parameters, reply_markup,
    });
    return decodeResult(result, { isObject: true, innerObject: 'Message' });
  }

  async sendAnimation({ chat_id, animation, business_connection_id, message_thread_id, direct_messages_topic_id, duration, width, height, thumbnail, caption, parse_mode, caption_entities, show_caption_above_media, has_spoiler, disable_notification, protect_content, allow_paid_broadcast, message_effect_id, suggested_post_parameters, reply_parameters, reply_markup } = {}) {
    const result = await this._request('sendAnimation', {
      chat_id, animation, business_connection_id, message_thread_id, direct_messages_topic_id,
      duration, width, height, thumbnail, caption, parse_mode: parse_mode || this.parseMode, caption_entities,
      show_caption_above_media, has_spoiler, disable_notification, protect_content, allow_paid_broadcast,
      message_effect_id, suggested_post_parameters, reply_parameters, reply_markup,
    });
    return decodeResult(result, { isObject: true, innerObject: 'Message' });
  }

  async sendVoice({ chat_id, voice, business_connection_id, message_thread_id, direct_messages_topic_id, caption, parse_mode, caption_entities, duration, disable_notification, protect_content, allow_paid_broadcast, message_effect_id, suggested_post_parameters, reply_parameters, reply_markup } = {}) {
    const result = await this._request('sendVoice', {
      chat_id, voice, business_connection_id, message_thread_id, direct_messages_topic_id,
      caption, parse_mode: parse_mode || this.parseMode, caption_entities, duration,
      disable_notification, protect_content, allow_paid_broadcast, message_effect_id,
      suggested_post_parameters, reply_parameters, reply_markup,
    });
    return decodeResult(result, { isObject: true, innerObject: 'Message' });
  }

  async sendVideoNote({ chat_id, video_note, business_connection_id, message_thread_id, direct_messages_topic_id, duration, length, thumbnail, disable_notification, protect_content, allow_paid_broadcast, message_effect_id, suggested_post_parameters, reply_parameters, reply_markup } = {}) {
    const result = await this._request('sendVideoNote', {
      chat_id, video_note, business_connection_id, message_thread_id, direct_messages_topic_id,
      duration, length, thumbnail, disable_notification, protect_content, allow_paid_broadcast,
      message_effect_id, suggested_post_parameters, reply_parameters, reply_markup,
    });
    return decodeResult(result, { isObject: true, innerObject: 'Message' });
  }

  async sendPaidMedia({ chat_id, star_count, media, business_connection_id, message_thread_id, direct_messages_topic_id, payload, caption, parse_mode, caption_entities, show_caption_above_media, disable_notification, protect_content, allow_paid_broadcast, suggested_post_parameters, reply_parameters, reply_markup } = {}) {
    const result = await this._request('sendPaidMedia', {
      chat_id, star_count, media, business_connection_id, message_thread_id, direct_messages_topic_id,
      payload, caption, parse_mode: parse_mode || this.parseMode, caption_entities,
      show_caption_above_media, disable_notification, protect_content, allow_paid_broadcast,
      suggested_post_parameters, reply_parameters, reply_markup,
    });
    return decodeResult(result, { isObject: true, innerObject: 'Message' });
  }

  async sendMediaGroup({ chat_id, media, business_connection_id, message_thread_id, direct_messages_topic_id, disable_notification, protect_content, allow_paid_broadcast, message_effect_id, reply_parameters } = {}) {
    const result = await this._request('sendMediaGroup', {
      chat_id, media, business_connection_id, message_thread_id, direct_messages_topic_id,
      disable_notification, protect_content, allow_paid_broadcast, message_effect_id, reply_parameters,
    });
    return decodeResult(result, { isList: true, listInnerObject: 'Message' });
  }

  async sendLocation({ chat_id, latitude, longitude, business_connection_id, message_thread_id, direct_messages_topic_id, horizontal_accuracy, live_period, heading, proximity_alert_radius, disable_notification, protect_content, allow_paid_broadcast, message_effect_id, suggested_post_parameters, reply_parameters, reply_markup } = {}) {
    const result = await this._request('sendLocation', {
      chat_id, latitude, longitude, business_connection_id, message_thread_id, direct_messages_topic_id,
      horizontal_accuracy, live_period, heading, proximity_alert_radius, disable_notification,
      protect_content, allow_paid_broadcast, message_effect_id, suggested_post_parameters,
      reply_parameters, reply_markup,
    });
    return decodeResult(result, { isObject: true, innerObject: 'Message' });
  }

  async sendVenue({ chat_id, latitude, longitude, title, address, business_connection_id, message_thread_id, direct_messages_topic_id, foursquare_id, foursquare_type, google_place_id, google_place_type, disable_notification, protect_content, allow_paid_broadcast, message_effect_id, suggested_post_parameters, reply_parameters, reply_markup } = {}) {
    const result = await this._request('sendVenue', {
      chat_id, latitude, longitude, title, address, business_connection_id, message_thread_id,
      direct_messages_topic_id, foursquare_id, foursquare_type, google_place_id, google_place_type,
      disable_notification, protect_content, allow_paid_broadcast, message_effect_id,
      suggested_post_parameters, reply_parameters, reply_markup,
    });
    return decodeResult(result, { isObject: true, innerObject: 'Message' });
  }

  async sendContact({ chat_id, phone_number, first_name, business_connection_id, message_thread_id, direct_messages_topic_id, last_name, vcard, disable_notification, protect_content, allow_paid_broadcast, message_effect_id, suggested_post_parameters, reply_parameters, reply_markup } = {}) {
    const result = await this._request('sendContact', {
      chat_id, phone_number, first_name, business_connection_id, message_thread_id,
      direct_messages_topic_id, last_name, vcard, disable_notification, protect_content,
      allow_paid_broadcast, message_effect_id, suggested_post_parameters, reply_parameters, reply_markup,
    });
    return decodeResult(result, { isObject: true, innerObject: 'Message' });
  }

  async sendPoll({ chat_id, question, options, business_connection_id, message_thread_id, question_parse_mode, question_entities, is_anonymous, type, allows_multiple_answers, allows_revoting, shuffle_options, allow_adding_options, hide_results_until_closes, members_only, country_codes, correct_option_ids, explanation, explanation_parse_mode, explanation_entities, explanation_media, open_period, close_date, is_closed, description, description_parse_mode, description_entities, media, disable_notification, protect_content, allow_paid_broadcast, message_effect_id, reply_parameters, reply_markup } = {}) {
    const result = await this._request('sendPoll', {
      chat_id, question, options, business_connection_id, message_thread_id,
      question_parse_mode, question_entities, is_anonymous, type,
      allows_multiple_answers, allows_revoting, shuffle_options, allow_adding_options,
      hide_results_until_closes, members_only, country_codes, correct_option_ids,
      explanation, explanation_parse_mode, explanation_entities, explanation_media,
      open_period, close_date, is_closed, description, description_parse_mode,
      description_entities, media, disable_notification, protect_content,
      allow_paid_broadcast, message_effect_id, reply_parameters, reply_markup,
    });
    return decodeResult(result, { isObject: true, innerObject: 'Message' });
  }

  async sendChecklist({ business_connection_id, chat_id, checklist, disable_notification, protect_content, message_effect_id, reply_parameters, reply_markup } = {}) {
    const result = await this._request('sendChecklist', {
      business_connection_id, chat_id, checklist, disable_notification, protect_content,
      message_effect_id, reply_parameters, reply_markup,
    });
    return decodeResult(result, { isObject: true, innerObject: 'Message' });
  }

  async sendDice({ chat_id, business_connection_id, message_thread_id, direct_messages_topic_id, emoji, disable_notification, protect_content, allow_paid_broadcast, message_effect_id, suggested_post_parameters, reply_parameters, reply_markup } = {}) {
    const result = await this._request('sendDice', {
      chat_id, business_connection_id, message_thread_id, direct_messages_topic_id, emoji,
      disable_notification, protect_content, allow_paid_broadcast, message_effect_id,
      suggested_post_parameters, reply_parameters, reply_markup,
    });
    return decodeResult(result, { isObject: true, innerObject: 'Message' });
  }

  async sendMessageDraft({ chat_id, draft_id, business_connection_id, message_thread_id, direct_messages_topic_id, disable_notification, protect_content, reply_parameters } = {}) {
    return this._request('sendMessageDraft', {
      chat_id, draft_id, business_connection_id, message_thread_id, direct_messages_topic_id,
      disable_notification, protect_content, reply_parameters,
    });
  }

  async sendChatAction({ chat_id, action, business_connection_id, message_thread_id } = {}) {
    return this._request('sendChatAction', { chat_id, action, business_connection_id, message_thread_id });
  }

  async setMessageReaction({ chat_id, message_id, reaction, is_big } = {}) {
    return this._request('setMessageReaction', { chat_id, message_id, reaction, is_big });
  }

  // --- User/File ---

  async getUserProfilePhotos({ user_id, offset, limit } = {}) {
    const result = await this._request('getUserProfilePhotos', { user_id, offset, limit });
    return decodeResult(result, { isObject: true, innerObject: 'UserProfilePhotos' });
  }

  async getUserProfileAudios({ user_id, offset, limit } = {}) {
    const result = await this._request('getUserProfileAudios', { user_id, offset, limit });
    return decodeResult(result, { isObject: true, innerObject: 'UserProfileAudios' });
  }

  async setUserEmojiStatus({ user_id, emoji_status_custom_emoji_id, emoji_status_expiration_date } = {}) {
    return this._request('setUserEmojiStatus', { user_id, emoji_status_custom_emoji_id, emoji_status_expiration_date });
  }

  async getFile({ file_id } = {}) {
    const result = await this._request('getFile', { file_id });
    return decodeResult(result, { isObject: true, innerObject: 'File' });
  }

  // --- Chat member management ---

  async banChatMember({ chat_id, user_id, until_date, revoke_messages } = {}) {
    return this._request('banChatMember', { chat_id, user_id, until_date, revoke_messages });
  }

  async unbanChatMember({ chat_id, user_id, only_if_banned } = {}) {
    return this._request('unbanChatMember', { chat_id, user_id, only_if_banned });
  }

  async restrictChatMember({ chat_id, user_id, permissions, use_independent_chat_permissions, until_date } = {}) {
    return this._request('restrictChatMember', { chat_id, user_id, permissions, use_independent_chat_permissions, until_date });
  }

  async promoteChatMember({ chat_id, user_id, is_anonymous, can_manage_chat, can_delete_messages, can_manage_video_chats, can_restrict_members, can_promote_members, can_change_info, can_invite_users, can_post_stories, can_edit_stories, can_delete_stories, can_post_messages, can_edit_messages, can_pin_messages, can_manage_topics, can_manage_direct_messages, can_manage_tags } = {}) {
    return this._request('promoteChatMember', {
      chat_id, user_id, is_anonymous, can_manage_chat, can_delete_messages,
      can_manage_video_chats, can_restrict_members, can_promote_members,
      can_change_info, can_invite_users, can_post_stories, can_edit_stories,
      can_delete_stories, can_post_messages, can_edit_messages, can_pin_messages,
      can_manage_topics, can_manage_direct_messages, can_manage_tags,
    });
  }

  async setChatAdministratorCustomTitle({ chat_id, user_id, custom_title } = {}) {
    return this._request('setChatAdministratorCustomTitle', { chat_id, user_id, custom_title });
  }

  async setChatMemberTag({ chat_id, user_id, tag } = {}) {
    return this._request('setChatMemberTag', { chat_id, user_id, tag });
  }

  async banChatSenderChat({ chat_id, sender_chat_id } = {}) {
    return this._request('banChatSenderChat', { chat_id, sender_chat_id });
  }

  async unbanChatSenderChat({ chat_id, sender_chat_id } = {}) {
    return this._request('unbanChatSenderChat', { chat_id, sender_chat_id });
  }

  async setChatPermissions({ chat_id, permissions, use_independent_chat_permissions } = {}) {
    return this._request('setChatPermissions', { chat_id, permissions, use_independent_chat_permissions });
  }

  // --- Chat settings ---

  async exportChatInviteLink({ chat_id } = {}) {
    return this._request('exportChatInviteLink', { chat_id });
  }

  async createChatInviteLink({ chat_id, name, expire_date, member_limit, creates_join_request } = {}) {
    const result = await this._request('createChatInviteLink', { chat_id, name, expire_date, member_limit, creates_join_request });
    return decodeResult(result, { isObject: true, innerObject: 'ChatInviteLink' });
  }

  async editChatInviteLink({ chat_id, invite_link, name, expire_date, member_limit, creates_join_request } = {}) {
    const result = await this._request('editChatInviteLink', { chat_id, invite_link, name, expire_date, member_limit, creates_join_request });
    return decodeResult(result, { isObject: true, innerObject: 'ChatInviteLink' });
  }

  async createChatSubscriptionInviteLink({ chat_id, name, subscription_period, subscription_price } = {}) {
    const result = await this._request('createChatSubscriptionInviteLink', { chat_id, name, subscription_period, subscription_price });
    return decodeResult(result, { isObject: true, innerObject: 'ChatInviteLink' });
  }

  async editChatSubscriptionInviteLink({ chat_id, invite_link, name } = {}) {
    const result = await this._request('editChatSubscriptionInviteLink', { chat_id, invite_link, name });
    return decodeResult(result, { isObject: true, innerObject: 'ChatInviteLink' });
  }

  async revokeChatInviteLink({ chat_id, invite_link } = {}) {
    const result = await this._request('revokeChatInviteLink', { chat_id, invite_link });
    return decodeResult(result, { isObject: true, innerObject: 'ChatInviteLink' });
  }

  async approveChatJoinRequest({ chat_id, user_id } = {}) {
    return this._request('approveChatJoinRequest', { chat_id, user_id });
  }

  async declineChatJoinRequest({ chat_id, user_id } = {}) {
    return this._request('declineChatJoinRequest', { chat_id, user_id });
  }

  async setChatPhoto({ chat_id, photo } = {}) {
    return this._request('setChatPhoto', { chat_id, photo });
  }

  async deleteChatPhoto({ chat_id } = {}) {
    return this._request('deleteChatPhoto', { chat_id });
  }

  async setChatTitle({ chat_id, title } = {}) {
    return this._request('setChatTitle', { chat_id, title });
  }

  async setChatDescription({ chat_id, description } = {}) {
    return this._request('setChatDescription', { chat_id, description });
  }

  async pinChatMessage({ chat_id, message_id, business_connection_id, disable_notification } = {}) {
    return this._request('pinChatMessage', { chat_id, message_id, business_connection_id, disable_notification });
  }

  async unpinChatMessage({ chat_id, message_id, business_connection_id } = {}) {
    return this._request('unpinChatMessage', { chat_id, message_id, business_connection_id });
  }

  async unpinAllChatMessages({ chat_id } = {}) {
    return this._request('unpinAllChatMessages', { chat_id });
  }

  async leaveChat({ chat_id } = {}) {
    return this._request('leaveChat', { chat_id });
  }

  async getChat({ chat_id } = {}) {
    const result = await this._request('getChat', { chat_id });
    return decodeResult(result, { isObject: true, innerObject: 'ChatFullInfo' });
  }

  async getChatAdministrators({ chat_id, return_bots } = {}) {
    const result = await this._request('getChatAdministrators', { chat_id, return_bots });
    return result; // Returns array of ChatMember variants
  }

  async getChatMemberCount({ chat_id } = {}) {
    return this._request('getChatMemberCount', { chat_id });
  }

  async getChatMember({ chat_id, user_id } = {}) {
    return this._request('getChatMember', { chat_id, user_id });
  }

  async getUserPersonalChatMessages({ user_id, limit } = {}) {
    const result = await this._request('getUserPersonalChatMessages', { user_id, limit });
    return decodeResult(result, { isList: true, listInnerObject: 'Message' });
  }

  async setChatStickerSet({ chat_id, sticker_set_name } = {}) {
    return this._request('setChatStickerSet', { chat_id, sticker_set_name });
  }

  async deleteChatStickerSet({ chat_id } = {}) {
    return this._request('deleteChatStickerSet', { chat_id });
  }

  // --- Forum topics ---

  async getForumTopicIconStickers() {
    const result = await this._request('getForumTopicIconStickers');
    return decodeResult(result, { isList: true, listInnerObject: 'Sticker' });
  }

  async createForumTopic({ chat_id, name, icon_color, icon_custom_emoji_id } = {}) {
    const result = await this._request('createForumTopic', { chat_id, name, icon_color, icon_custom_emoji_id });
    return decodeResult(result, { isObject: true, innerObject: 'ForumTopic' });
  }

  async editForumTopic({ chat_id, message_thread_id, name, icon_custom_emoji_id } = {}) {
    return this._request('editForumTopic', { chat_id, message_thread_id, name, icon_custom_emoji_id });
  }

  async closeForumTopic({ chat_id, message_thread_id } = {}) {
    return this._request('closeForumTopic', { chat_id, message_thread_id });
  }

  async reopenForumTopic({ chat_id, message_thread_id } = {}) {
    return this._request('reopenForumTopic', { chat_id, message_thread_id });
  }

  async deleteForumTopic({ chat_id, message_thread_id } = {}) {
    return this._request('deleteForumTopic', { chat_id, message_thread_id });
  }

  async unpinAllForumTopicMessages({ chat_id, message_thread_id } = {}) {
    return this._request('unpinAllForumTopicMessages', { chat_id, message_thread_id });
  }

  async editGeneralForumTopic({ chat_id, name } = {}) {
    return this._request('editGeneralForumTopic', { chat_id, name });
  }

  async closeGeneralForumTopic({ chat_id } = {}) {
    return this._request('closeGeneralForumTopic', { chat_id });
  }

  async reopenGeneralForumTopic({ chat_id } = {}) {
    return this._request('reopenGeneralForumTopic', { chat_id });
  }

  async hideGeneralForumTopic({ chat_id } = {}) {
    return this._request('hideGeneralForumTopic', { chat_id });
  }

  async unhideGeneralForumTopic({ chat_id } = {}) {
    return this._request('unhideGeneralForumTopic', { chat_id });
  }

  async unpinAllGeneralForumTopicMessages({ chat_id } = {}) {
    return this._request('unpinAllGeneralForumTopicMessages', { chat_id });
  }

  // --- Callback / Inline ---

  async answerCallbackQuery({ callback_query_id, text, show_alert, url, cache_time } = {}) {
    return this._request('answerCallbackQuery', { callback_query_id, text, show_alert, url, cache_time });
  }

  async answerGuestQuery({ guest_query_id, result } = {}) {
    const res = await this._request('answerGuestQuery', { guest_query_id, result });
    return decodeResult(res, { isObject: true, innerObject: 'SentGuestMessage' });
  }

  async getUserChatBoosts({ chat_id, user_id } = {}) {
    const result = await this._request('getUserChatBoosts', { chat_id, user_id });
    return decodeResult(result, { isObject: true, innerObject: 'UserChatBoosts' });
  }

  async getBusinessConnection({ business_connection_id } = {}) {
    const result = await this._request('getBusinessConnection', { business_connection_id });
    return decodeResult(result, { isObject: true, innerObject: 'BusinessConnection' });
  }

  // --- Managed Bots ---

  async getManagedBotToken({ user_id } = {}) {
    return this._request('getManagedBotToken', { user_id });
  }

  async replaceManagedBotToken({ user_id } = {}) {
    return this._request('replaceManagedBotToken', { user_id });
  }

  async getManagedBotAccessSettings({ user_id } = {}) {
    const result = await this._request('getManagedBotAccessSettings', { user_id });
    return decodeResult(result, { isObject: true, innerObject: 'BotAccessSettings' });
  }

  async setManagedBotAccessSettings({ user_id, is_access_restricted, ...rest } = {}) {
    return this._request('setManagedBotAccessSettings', { user_id, is_access_restricted, ...rest });
  }

  // --- Bot Commands & Settings ---

  async setMyCommands({ commands, scope, language_code } = {}) {
    return this._request('setMyCommands', { commands, scope, language_code });
  }

  async deleteMyCommands({ scope, language_code } = {}) {
    return this._request('deleteMyCommands', { scope, language_code });
  }

  async getMyCommands({ scope, language_code } = {}) {
    const result = await this._request('getMyCommands', { scope, language_code });
    return decodeResult(result, { isList: true, listInnerObject: 'BotCommand' });
  }

  async setMyName({ name, language_code } = {}) {
    return this._request('setMyName', { name, language_code });
  }

  async getMyName({ language_code } = {}) {
    const result = await this._request('getMyName', { language_code });
    return decodeResult(result, { isObject: true, innerObject: 'BotName' });
  }

  async setMyDescription({ description, language_code } = {}) {
    return this._request('setMyDescription', { description, language_code });
  }

  async getMyDescription({ language_code } = {}) {
    const result = await this._request('getMyDescription', { language_code });
    return decodeResult(result, { isObject: true, innerObject: 'BotDescription' });
  }

  async setMyShortDescription({ short_description, language_code } = {}) {
    return this._request('setMyShortDescription', { short_description, language_code });
  }

  async getMyShortDescription({ language_code } = {}) {
    const result = await this._request('getMyShortDescription', { language_code });
    return decodeResult(result, { isObject: true, innerObject: 'BotShortDescription' });
  }

  async setMyProfilePhoto({ photo } = {}) {
    return this._request('setMyProfilePhoto', { photo });
  }

  async removeMyProfilePhoto() {
    return this._request('removeMyProfilePhoto');
  }

  async setChatMenuButton({ chat_id, menu_button } = {}) {
    return this._request('setChatMenuButton', { chat_id, menu_button });
  }

  async getChatMenuButton({ chat_id } = {}) {
    return this._request('getChatMenuButton', { chat_id });
  }

  async setMyDefaultAdministratorRights({ rights, for_channels } = {}) {
    return this._request('setMyDefaultAdministratorRights', { rights, for_channels });
  }

  async getMyDefaultAdministratorRights({ for_channels } = {}) {
    return this._request('getMyDefaultAdministratorRights', { for_channels });
  }

  // --- Edit messages ---

  async editMessageText({ chat_id, message_id, inline_message_id, text, business_connection_id, parse_mode, entities, link_preview_options, reply_markup } = {}) {
    return this._request('editMessageText', {
      chat_id, message_id, inline_message_id, text, business_connection_id,
      parse_mode: parse_mode || this.parseMode, entities, link_preview_options, reply_markup,
    });
  }

  async editMessageCaption({ chat_id, message_id, inline_message_id, business_connection_id, caption, parse_mode, caption_entities, show_caption_above_media, reply_markup } = {}) {
    return this._request('editMessageCaption', {
      chat_id, message_id, inline_message_id, business_connection_id,
      caption, parse_mode: parse_mode || this.parseMode, caption_entities, show_caption_above_media, reply_markup,
    });
  }

  async editMessageMedia({ chat_id, message_id, inline_message_id, business_connection_id, media, reply_markup } = {}) {
    return this._request('editMessageMedia', {
      chat_id, message_id, inline_message_id, business_connection_id, media, reply_markup,
    });
  }

  async editMessageLiveLocation({ chat_id, message_id, inline_message_id, business_connection_id, latitude, longitude, live_period, horizontal_accuracy, heading, proximity_alert_radius, reply_markup } = {}) {
    return this._request('editMessageLiveLocation', {
      chat_id, message_id, inline_message_id, business_connection_id,
      latitude, longitude, live_period, horizontal_accuracy, heading, proximity_alert_radius, reply_markup,
    });
  }

  async stopMessageLiveLocation({ chat_id, message_id, inline_message_id, business_connection_id, reply_markup } = {}) {
    return this._request('stopMessageLiveLocation', {
      chat_id, message_id, inline_message_id, business_connection_id, reply_markup,
    });
  }

  async editMessageChecklist({ business_connection_id, chat_id, message_id, checklist, reply_markup } = {}) {
    const result = await this._request('editMessageChecklist', {
      business_connection_id, chat_id, message_id, checklist, reply_markup,
    });
    return decodeResult(result, { isObject: true, innerObject: 'Message' });
  }

  async editMessageReplyMarkup({ chat_id, message_id, inline_message_id, business_connection_id, reply_markup } = {}) {
    return this._request('editMessageReplyMarkup', {
      chat_id, message_id, inline_message_id, business_connection_id, reply_markup,
    });
  }

  async stopPoll({ chat_id, message_id, business_connection_id, reply_markup } = {}) {
    const result = await this._request('stopPoll', { chat_id, message_id, business_connection_id, reply_markup });
    return decodeResult(result, { isObject: true, innerObject: 'Poll' });
  }

  async approveSuggestedPost({ chat_id, message_id, schedule_date } = {}) {
    return this._request('approveSuggestedPost', { chat_id, message_id, schedule_date });
  }

  async declineSuggestedPost({ chat_id, message_id } = {}) {
    return this._request('declineSuggestedPost', { chat_id, message_id });
  }

  async deleteMessage({ chat_id, message_id } = {}) {
    return this._request('deleteMessage', { chat_id, message_id });
  }

  async deleteMessages({ chat_id, message_ids } = {}) {
    return this._request('deleteMessages', { chat_id, message_ids });
  }

  async deleteMessageReaction({ chat_id, message_id, reaction } = {}) {
    return this._request('deleteMessageReaction', { chat_id, message_id, reaction });
  }

  async deleteAllMessageReactions({ chat_id, message_id } = {}) {
    return this._request('deleteAllMessageReactions', { chat_id, message_id });
  }

  // --- Stickers ---

  async sendSticker({ chat_id, sticker, business_connection_id, message_thread_id, direct_messages_topic_id, emoji, disable_notification, protect_content, allow_paid_broadcast, message_effect_id, suggested_post_parameters, reply_parameters, reply_markup } = {}) {
    const result = await this._request('sendSticker', {
      chat_id, sticker, business_connection_id, message_thread_id, direct_messages_topic_id, emoji,
      disable_notification, protect_content, allow_paid_broadcast, message_effect_id,
      suggested_post_parameters, reply_parameters, reply_markup,
    });
    return decodeResult(result, { isObject: true, innerObject: 'Message' });
  }

  async getStickerSet({ name } = {}) {
    const result = await this._request('getStickerSet', { name });
    return decodeResult(result, { isObject: true, innerObject: 'StickerSet' });
  }

  async getCustomEmojiStickers({ custom_emoji_ids } = {}) {
    const result = await this._request('getCustomEmojiStickers', { custom_emoji_ids });
    return decodeResult(result, { isList: true, listInnerObject: 'Sticker' });
  }

  async uploadStickerFile({ user_id, sticker, sticker_format } = {}) {
    const result = await this._request('uploadStickerFile', { user_id, sticker, sticker_format });
    return decodeResult(result, { isObject: true, innerObject: 'File' });
  }

  async createNewStickerSet({ user_id, name, title, stickers, sticker_type, needs_repainting } = {}) {
    return this._request('createNewStickerSet', { user_id, name, title, stickers, sticker_type, needs_repainting });
  }

  async addStickerToSet({ user_id, name, sticker } = {}) {
    return this._request('addStickerToSet', { user_id, name, sticker });
  }

  async setStickerPositionInSet({ sticker, position } = {}) {
    return this._request('setStickerPositionInSet', { sticker, position });
  }

  async deleteStickerFromSet({ sticker } = {}) {
    return this._request('deleteStickerFromSet', { sticker });
  }

  async replaceStickerInSet({ user_id, name, old_sticker, sticker } = {}) {
    return this._request('replaceStickerInSet', { user_id, name, old_sticker, sticker });
  }

  async setStickerEmojiList({ sticker, emoji_list } = {}) {
    return this._request('setStickerEmojiList', { sticker, emoji_list });
  }

  async setStickerKeywords({ sticker, keywords } = {}) {
    return this._request('setStickerKeywords', { sticker, keywords });
  }

  async setStickerMaskPosition({ sticker, mask_position } = {}) {
    return this._request('setStickerMaskPosition', { sticker, mask_position });
  }

  async setStickerSetTitle({ name, title } = {}) {
    return this._request('setStickerSetTitle', { name, title });
  }

  async setStickerSetThumbnail({ name, user_id, format, thumbnail } = {}) {
    return this._request('setStickerSetThumbnail', { name, user_id, format, thumbnail });
  }

  async setCustomEmojiStickerSetThumbnail({ name, custom_emoji_id } = {}) {
    return this._request('setCustomEmojiStickerSetThumbnail', { name, custom_emoji_id });
  }

  async deleteStickerSet({ name } = {}) {
    return this._request('deleteStickerSet', { name });
  }

  // --- Inline mode ---

  async answerInlineQuery({ inline_query_id, results, cache_time, is_personal, next_offset, button } = {}) {
    return this._request('answerInlineQuery', { inline_query_id, results, cache_time, is_personal, next_offset, button });
  }

  async answerWebAppQuery({ web_app_query_id, result } = {}) {
    const res = await this._request('answerWebAppQuery', { web_app_query_id, result });
    return decodeResult(res, { isObject: true, innerObject: 'SentWebAppMessage' });
  }

  async savePreparedInlineMessage({ user_id, result, allow_user_chats, allow_bot_chats, allow_group_chats, allow_channel_chats } = {}) {
    const res = await this._request('savePreparedInlineMessage', {
      user_id, result, allow_user_chats, allow_bot_chats, allow_group_chats, allow_channel_chats,
    });
    return decodeResult(res, { isObject: true, innerObject: 'PreparedInlineMessage' });
  }

  async savePreparedKeyboardButton({ user_id, button } = {}) {
    const res = await this._request('savePreparedKeyboardButton', { user_id, button });
    return decodeResult(res, { isObject: true, innerObject: 'PreparedKeyboardButton' });
  }

  // --- Payments ---

  async sendInvoice({ chat_id, title, description, payload, currency, prices, provider_token, message_thread_id, direct_messages_topic_id, max_tip_amount, suggested_tip_amounts, start_parameter, provider_data, photo_url, photo_size, photo_width, photo_height, need_name, need_phone_number, need_email, need_shipping_address, send_phone_number_to_provider, send_email_to_provider, is_flexible, disable_notification, protect_content, allow_paid_broadcast, message_effect_id, suggested_post_parameters, reply_parameters, reply_markup } = {}) {
    const result = await this._request('sendInvoice', {
      chat_id, title, description, payload, currency, prices, provider_token,
      message_thread_id, direct_messages_topic_id, max_tip_amount, suggested_tip_amounts,
      start_parameter, provider_data, photo_url, photo_size, photo_width, photo_height,
      need_name, need_phone_number, need_email, need_shipping_address,
      send_phone_number_to_provider, send_email_to_provider, is_flexible,
      disable_notification, protect_content, allow_paid_broadcast, message_effect_id,
      suggested_post_parameters, reply_parameters, reply_markup,
    });
    return decodeResult(result, { isObject: true, innerObject: 'Message' });
  }

  async createInvoiceLink({ title, description, payload, currency, prices, provider_token, max_tip_amount, suggested_tip_amounts, provider_data, photo_url, photo_size, photo_width, photo_height, need_name, need_phone_number, need_email, need_shipping_address, send_phone_number_to_provider, send_email_to_provider, is_flexible, subscription_period } = {}) {
    return this._request('createInvoiceLink', {
      title, description, payload, currency, prices, provider_token,
      max_tip_amount, suggested_tip_amounts, provider_data, photo_url, photo_size,
      photo_width, photo_height, need_name, need_phone_number, need_email,
      need_shipping_address, send_phone_number_to_provider, send_email_to_provider,
      is_flexible, subscription_period,
    });
  }

  async answerShippingQuery({ shipping_query_id, ok, shipping_options, error_message } = {}) {
    return this._request('answerShippingQuery', { shipping_query_id, ok, shipping_options, error_message });
  }

  async answerPreCheckoutQuery({ pre_checkout_query_id, ok, error_message } = {}) {
    return this._request('answerPreCheckoutQuery', { pre_checkout_query_id, ok, error_message });
  }

  async getMyStarBalance() {
    const result = await this._request('getMyStarBalance');
    return decodeResult(result, { isObject: true, innerObject: 'StarAmount' });
  }

  async getStarTransactions({ offset, limit } = {}) {
    const result = await this._request('getStarTransactions', { offset, limit });
    return decodeResult(result, { isObject: true, innerObject: 'StarTransactions' });
  }

  async refundStarPayment({ user_id, telegram_payment_charge_id } = {}) {
    return this._request('refundStarPayment', { user_id, telegram_payment_charge_id });
  }

  async editUserStarSubscription({ user_id, telegram_payment_charge_id, is_canceled } = {}) {
    return this._request('editUserStarSubscription', { user_id, telegram_payment_charge_id, is_canceled });
  }

  // --- Gifts ---

  async getAvailableGifts() {
    const result = await this._request('getAvailableGifts');
    return decodeResult(result, { isObject: true, innerObject: 'Gifts' });
  }

  async sendGift({ gift_id, user_id, chat_id, text, text_parse_mode, text_entities, pay_for_upgrade } = {}) {
    return this._request('sendGift', { gift_id, user_id, chat_id, text, text_parse_mode, text_entities, pay_for_upgrade });
  }

  async giftPremiumSubscription({ user_id, month_count, star_count, text, text_parse_mode, text_entities } = {}) {
    return this._request('giftPremiumSubscription', { user_id, month_count, star_count, text, text_parse_mode, text_entities });
  }

  async getUserGifts({ user_id, offset, limit } = {}) {
    const result = await this._request('getUserGifts', { user_id, offset, limit });
    return decodeResult(result, { isObject: true, innerObject: 'OwnedGifts' });
  }

  async getChatGifts({ chat_id, offset, limit } = {}) {
    const result = await this._request('getChatGifts', { chat_id, offset, limit });
    return decodeResult(result, { isObject: true, innerObject: 'OwnedGifts' });
  }

  async getBusinessAccountGifts({ business_connection_id, exclude_unsaved, exclude_saved, exclude_unlimited, exclude_limited, exclude_unique, sort_by, offset, limit } = {}) {
    const result = await this._request('getBusinessAccountGifts', {
      business_connection_id, exclude_unsaved, exclude_saved, exclude_unlimited,
      exclude_limited, exclude_unique, sort_by, offset, limit,
    });
    return decodeResult(result, { isObject: true, innerObject: 'OwnedGifts' });
  }

  async convertGiftToStars({ business_connection_id, owned_gift_id } = {}) {
    return this._request('convertGiftToStars', { business_connection_id, owned_gift_id });
  }

  async upgradeGift({ business_connection_id, owned_gift_id, keep_original_details, star_count } = {}) {
    return this._request('upgradeGift', { business_connection_id, owned_gift_id, keep_original_details, star_count });
  }

  async transferGift({ business_connection_id, owned_gift_id, new_owner_chat_id, star_count } = {}) {
    return this._request('transferGift', { business_connection_id, owned_gift_id, new_owner_chat_id, star_count });
  }

  // --- Verification ---

  async verifyUser({ user_id, custom_description } = {}) {
    return this._request('verifyUser', { user_id, custom_description });
  }

  async verifyChat({ chat_id, custom_description } = {}) {
    return this._request('verifyChat', { chat_id, custom_description });
  }

  async removeUserVerification({ user_id } = {}) {
    return this._request('removeUserVerification', { user_id });
  }

  async removeChatVerification({ chat_id } = {}) {
    return this._request('removeChatVerification', { chat_id });
  }

  // --- Business ---

  async readBusinessMessage({ business_connection_id, chat_id, message_id } = {}) {
    return this._request('readBusinessMessage', { business_connection_id, chat_id, message_id });
  }

  async deleteBusinessMessages({ business_connection_id, message_ids } = {}) {
    return this._request('deleteBusinessMessages', { business_connection_id, message_ids });
  }

  async setBusinessAccountName({ business_connection_id, first_name, last_name } = {}) {
    return this._request('setBusinessAccountName', { business_connection_id, first_name, last_name });
  }

  async setBusinessAccountUsername({ business_connection_id, username } = {}) {
    return this._request('setBusinessAccountUsername', { business_connection_id, username });
  }

  async setBusinessAccountBio({ business_connection_id, bio } = {}) {
    return this._request('setBusinessAccountBio', { business_connection_id, bio });
  }

  async setBusinessAccountProfilePhoto({ business_connection_id, photo, is_public } = {}) {
    return this._request('setBusinessAccountProfilePhoto', { business_connection_id, photo, is_public });
  }

  async removeBusinessAccountProfilePhoto({ business_connection_id, is_public } = {}) {
    return this._request('removeBusinessAccountProfilePhoto', { business_connection_id, is_public });
  }

  async setBusinessAccountGiftSettings({ business_connection_id, show_gift_button, accepted_gift_types } = {}) {
    return this._request('setBusinessAccountGiftSettings', { business_connection_id, show_gift_button, accepted_gift_types });
  }

  async getBusinessAccountStarBalance({ business_connection_id } = {}) {
    const result = await this._request('getBusinessAccountStarBalance', { business_connection_id });
    return decodeResult(result, { isObject: true, innerObject: 'StarAmount' });
  }

  async transferBusinessAccountStars({ business_connection_id, star_count } = {}) {
    return this._request('transferBusinessAccountStars', { business_connection_id, star_count });
  }

  // --- Stories ---

  async postStory({ business_connection_id, content, active_period, caption, parse_mode, caption_entities, areas, post_to_chat_page, protect_content } = {}) {
    const result = await this._request('postStory', {
      business_connection_id, content, active_period, caption,
      parse_mode: parse_mode || this.parseMode, caption_entities, areas, post_to_chat_page, protect_content,
    });
    return decodeResult(result, { isObject: true, innerObject: 'Story' });
  }

  async repostStory({ business_connection_id, from_chat_id, from_story_id, caption, parse_mode, caption_entities, areas, post_to_chat_page } = {}) {
    const result = await this._request('repostStory', {
      business_connection_id, from_chat_id, from_story_id, caption,
      parse_mode: parse_mode || this.parseMode, caption_entities, areas, post_to_chat_page,
    });
    return decodeResult(result, { isObject: true, innerObject: 'Story' });
  }

  async editStory({ business_connection_id, story_id, content, caption, parse_mode, caption_entities, areas } = {}) {
    const result = await this._request('editStory', {
      business_connection_id, story_id, content, caption,
      parse_mode: parse_mode || this.parseMode, caption_entities, areas,
    });
    return decodeResult(result, { isObject: true, innerObject: 'Story' });
  }

  async deleteStory({ business_connection_id, story_id } = {}) {
    return this._request('deleteStory', { business_connection_id, story_id });
  }

  // --- Games ---

  async sendGame({ chat_id, game_short_name, business_connection_id, message_thread_id, disable_notification, protect_content, allow_paid_broadcast, message_effect_id, reply_parameters, reply_markup } = {}) {
    const result = await this._request('sendGame', {
      chat_id, game_short_name, business_connection_id, message_thread_id,
      disable_notification, protect_content, allow_paid_broadcast, message_effect_id,
      reply_parameters, reply_markup,
    });
    return decodeResult(result, { isObject: true, innerObject: 'Message' });
  }

  async setGameScore({ user_id, score, force, disable_edit_message, chat_id, message_id, inline_message_id } = {}) {
    return this._request('setGameScore', { user_id, score, force, disable_edit_message, chat_id, message_id, inline_message_id });
  }

  async getGameHighScores({ user_id, chat_id, message_id, inline_message_id } = {}) {
    const result = await this._request('getGameHighScores', { user_id, chat_id, message_id, inline_message_id });
    return decodeResult(result, { isList: true, listInnerObject: 'GameHighScore' });
  }

  // --- Passport ---

  async setPassportDataErrors({ user_id, errors } = {}) {
    return this._request('setPassportDataErrors', { user_id, errors });
  }
}
