// Type definitions for neogram 10.0.2
// Project: https://github.com/AstroSQ/neogram
// Definitions by: neogram contributors

/// <reference types="node" />

import { ReadStream } from 'fs';

// ============================================================================
// Core: TelegramObject
// ============================================================================

export declare class TelegramObject {
  constructor(data?: Record<string, any>);
  toJSON(): Record<string, any>;
  static fromJSON(data: Record<string, any> | null): TelegramObject | null;
  static fromJSON(data: Record<string, any>[]): TelegramObject[];
  toString(): string;
}

// ============================================================================
// Core: TelegramError & StopPropagation
// ============================================================================

export declare class TelegramError extends Error {
  name: 'TelegramError';
  errorCode: number;
  description: string;
  parameters: Record<string, any>;
  retryAfter: number | null;
  constructor(errorCode: number, description: string, parameters?: Record<string, any>);
  toString(): string;
}

export declare class StopPropagation extends Error {
  name: 'StopPropagation';
  constructor();
}

// ============================================================================
// Core: InputFile
// ============================================================================

export declare class InputFile {
  source: string | Buffer | ReadStream;
  filename: string;
  constructor(source: string | Buffer | ReadStream, filename?: string | null);
  open(): [string, ReadStream | Buffer | string];
  static isFileLike(value: any): boolean;
}

// ============================================================================
// Handler types
// ============================================================================

type FileSource = string | Buffer | ReadStream | InputFile;

interface HandlerFilters {
  commands?: string[];
  contentTypes?: string[];
  regexp?: string;
  chatTypes?: string[];
  userIds?: number[];
  chatIds?: number[];
  data?: string | ((data: string) => boolean);
  func?: (obj: any) => boolean;
}

type HandlerFn<T = any> = (obj: T, update: Update) => void | Promise<void>;
type ErrorHandlerFn = (update: Update, error: Error) => void | Promise<void>;

// ============================================================================
// BotOptions
// ============================================================================

interface BotOptions {
  timeout?: number;
  parseMode?: string;
  maxRetries?: number;
  retryOnFlood?: boolean;
  apiUrl?: string;
}

interface PollingOptions {
  timeout?: number;
  allowedUpdates?: string[] | null;
  noneStop?: boolean;
  interval?: number;
}

// ============================================================================
// Bot class
// ============================================================================

export declare class Bot {
  token: string;
  apiUrl: string;
  timeout: number;
  parseMode: string | null;
  maxRetries: number;
  retryOnFlood: boolean;

  constructor(token: string, options?: BotOptions);

  // ── Handler registration ─────────────────────────────────────────────

  registerHandler(kind: string, fn: HandlerFn, filters?: HandlerFilters): void;
  onError(fn: ErrorHandlerFn): ErrorHandlerFn;
  onMessage(fn: HandlerFn<Message>, filters?: HandlerFilters): HandlerFn<Message>;
  onEditedMessage(fn: HandlerFn<Message>, filters?: HandlerFilters): HandlerFn<Message>;
  onChannelPost(fn: HandlerFn<Message>, filters?: HandlerFilters): HandlerFn<Message>;
  onEditedChannelPost(fn: HandlerFn<Message>, filters?: HandlerFilters): HandlerFn<Message>;
  onCallbackQuery(fn: HandlerFn<CallbackQuery>, filters?: HandlerFilters): HandlerFn<CallbackQuery>;
  onInlineQuery(fn: HandlerFn<InlineQuery>, filters?: HandlerFilters): HandlerFn<InlineQuery>;
  onMyChatMember(fn: HandlerFn<ChatMemberUpdated>, filters?: HandlerFilters): HandlerFn<ChatMemberUpdated>;
  onChatMember(fn: HandlerFn<ChatMemberUpdated>, filters?: HandlerFilters): HandlerFn<ChatMemberUpdated>;
  onChatJoinRequest(fn: HandlerFn<ChatJoinRequest>, filters?: HandlerFilters): HandlerFn<ChatJoinRequest>;
  onPoll(fn: HandlerFn<Poll>, filters?: HandlerFilters): HandlerFn<Poll>;
  onPollAnswer(fn: HandlerFn<PollAnswer>, filters?: HandlerFilters): HandlerFn<PollAnswer>;
  onPreCheckoutQuery(fn: HandlerFn<PreCheckoutQuery>, filters?: HandlerFilters): HandlerFn<PreCheckoutQuery>;
  onShippingQuery(fn: HandlerFn<ShippingQuery>, filters?: HandlerFilters): HandlerFn<ShippingQuery>;
  onChosenInlineResult(fn: HandlerFn, filters?: HandlerFilters): HandlerFn;
  onMessageReaction(fn: HandlerFn<MessageReactionUpdated>, filters?: HandlerFilters): HandlerFn<MessageReactionUpdated>;
  onMessageReactionCount(fn: HandlerFn<MessageReactionCountUpdated>, filters?: HandlerFilters): HandlerFn<MessageReactionCountUpdated>;
  onChatBoost(fn: HandlerFn<ChatBoostUpdated>, filters?: HandlerFilters): HandlerFn<ChatBoostUpdated>;
  onRemovedChatBoost(fn: HandlerFn<ChatBoostRemoved>, filters?: HandlerFilters): HandlerFn<ChatBoostRemoved>;
  onBusinessMessage(fn: HandlerFn<Message>, filters?: HandlerFilters): HandlerFn<Message>;
  onPurchasedPaidMedia(fn: HandlerFn<PaidMediaPurchased>, filters?: HandlerFilters): HandlerFn<PaidMediaPurchased>;

  // ── Polling ──────────────────────────────────────────────────────────

  polling(options?: PollingOptions): Promise<void>;
  infinityPolling(options?: PollingOptions): Promise<void>;
  stopPolling(): void;

  // ── Getting Updates ──────────────────────────────────────────────────

  getUpdates(options?: {
    offset?: number;
    limit?: number;
    timeout?: number;
    allowed_updates?: string[];
  }): Promise<Update[]>;

  setWebhook(options: {
    url: string;
    certificate?: FileSource;
    ip_address?: string;
    max_connections?: number;
    allowed_updates?: string[];
    drop_pending_updates?: boolean;
    secret_token?: string;
  }): Promise<boolean>;

  deleteWebhook(options?: {
    drop_pending_updates?: boolean;
  }): Promise<boolean>;

  getWebhookInfo(): Promise<WebhookInfo>;

  // ── Bot info ─────────────────────────────────────────────────────────

  getMe(): Promise<User>;
  logOut(): Promise<boolean>;
  close(): Promise<boolean>;

  // ── Messages ─────────────────────────────────────────────────────────

  sendMessage(options: {
    chat_id: number | string;
    text: string;
    business_connection_id?: string;
    message_thread_id?: number;
    direct_messages_topic_id?: number;
    parse_mode?: string;
    entities?: MessageEntity[];
    link_preview_options?: LinkPreviewOptions;
    disable_notification?: boolean;
    protect_content?: boolean;
    allow_paid_broadcast?: boolean;
    message_effect_id?: string;
    suggested_post_parameters?: SuggestedPostParameters;
    reply_parameters?: ReplyParameters;
    reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply;
  }): Promise<Message>;

  forwardMessage(options: {
    chat_id: number | string;
    from_chat_id: number | string;
    message_id: number;
    message_thread_id?: number;
    direct_messages_topic_id?: number;
    video_start_timestamp?: number;
    disable_notification?: boolean;
    protect_content?: boolean;
    message_effect_id?: string;
    suggested_post_parameters?: SuggestedPostParameters;
  }): Promise<Message>;

  forwardMessages(options: {
    chat_id: number | string;
    from_chat_id: number | string;
    message_ids: number[];
    message_thread_id?: number;
    direct_messages_topic_id?: number;
    disable_notification?: boolean;
    protect_content?: boolean;
  }): Promise<MessageId[]>;

  copyMessage(options: {
    chat_id: number | string;
    from_chat_id: number | string;
    message_id: number;
    message_thread_id?: number;
    direct_messages_topic_id?: number;
    video_start_timestamp?: number;
    caption?: string;
    parse_mode?: string;
    caption_entities?: MessageEntity[];
    show_caption_above_media?: boolean;
    disable_notification?: boolean;
    protect_content?: boolean;
    allow_paid_broadcast?: boolean;
    message_effect_id?: string;
    suggested_post_parameters?: SuggestedPostParameters;
    reply_parameters?: ReplyParameters;
    reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply;
  }): Promise<MessageId>;

  copyMessages(options: {
    chat_id: number | string;
    from_chat_id: number | string;
    message_ids: number[];
    message_thread_id?: number;
    direct_messages_topic_id?: number;
    disable_notification?: boolean;
    protect_content?: boolean;
    remove_caption?: boolean;
  }): Promise<MessageId[]>;

  // ── Media ────────────────────────────────────────────────────────────

  sendPhoto(options: {
    chat_id: number | string;
    photo: FileSource;
    business_connection_id?: string;
    message_thread_id?: number;
    direct_messages_topic_id?: number;
    caption?: string;
    parse_mode?: string;
    caption_entities?: MessageEntity[];
    show_caption_above_media?: boolean;
    has_spoiler?: boolean;
    disable_notification?: boolean;
    protect_content?: boolean;
    allow_paid_broadcast?: boolean;
    message_effect_id?: string;
    suggested_post_parameters?: SuggestedPostParameters;
    reply_parameters?: ReplyParameters;
    reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply;
  }): Promise<Message>;

  sendLivePhoto(options: {
    chat_id: number | string;
    live_photo: FileSource;
    photo?: FileSource;
    business_connection_id?: string;
    message_thread_id?: number;
    direct_messages_topic_id?: number;
    caption?: string;
    parse_mode?: string;
    caption_entities?: MessageEntity[];
    show_caption_above_media?: boolean;
    has_spoiler?: boolean;
    disable_notification?: boolean;
    protect_content?: boolean;
    allow_paid_broadcast?: boolean;
    message_effect_id?: string;
    suggested_post_parameters?: SuggestedPostParameters;
    reply_parameters?: ReplyParameters;
    reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply;
  }): Promise<Message>;

  sendAudio(options: {
    chat_id: number | string;
    audio: FileSource;
    business_connection_id?: string;
    message_thread_id?: number;
    direct_messages_topic_id?: number;
    caption?: string;
    parse_mode?: string;
    caption_entities?: MessageEntity[];
    duration?: number;
    performer?: string;
    title?: string;
    thumbnail?: FileSource;
    disable_notification?: boolean;
    protect_content?: boolean;
    allow_paid_broadcast?: boolean;
    message_effect_id?: string;
    suggested_post_parameters?: SuggestedPostParameters;
    reply_parameters?: ReplyParameters;
    reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply;
  }): Promise<Message>;

  sendDocument(options: {
    chat_id: number | string;
    document: FileSource;
    business_connection_id?: string;
    message_thread_id?: number;
    direct_messages_topic_id?: number;
    thumbnail?: FileSource;
    caption?: string;
    parse_mode?: string;
    caption_entities?: MessageEntity[];
    disable_content_type_detection?: boolean;
    disable_notification?: boolean;
    protect_content?: boolean;
    allow_paid_broadcast?: boolean;
    message_effect_id?: string;
    suggested_post_parameters?: SuggestedPostParameters;
    reply_parameters?: ReplyParameters;
    reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply;
  }): Promise<Message>;

  sendVideo(options: {
    chat_id: number | string;
    video: FileSource;
    business_connection_id?: string;
    message_thread_id?: number;
    direct_messages_topic_id?: number;
    duration?: number;
    width?: number;
    height?: number;
    thumbnail?: FileSource;
    cover?: FileSource;
    start_timestamp?: number;
    caption?: string;
    parse_mode?: string;
    caption_entities?: MessageEntity[];
    show_caption_above_media?: boolean;
    has_spoiler?: boolean;
    supports_streaming?: boolean;
    disable_notification?: boolean;
    protect_content?: boolean;
    allow_paid_broadcast?: boolean;
    message_effect_id?: string;
    suggested_post_parameters?: SuggestedPostParameters;
    reply_parameters?: ReplyParameters;
    reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply;
  }): Promise<Message>;

  sendAnimation(options: {
    chat_id: number | string;
    animation: FileSource;
    business_connection_id?: string;
    message_thread_id?: number;
    direct_messages_topic_id?: number;
    duration?: number;
    width?: number;
    height?: number;
    thumbnail?: FileSource;
    caption?: string;
    parse_mode?: string;
    caption_entities?: MessageEntity[];
    show_caption_above_media?: boolean;
    has_spoiler?: boolean;
    disable_notification?: boolean;
    protect_content?: boolean;
    allow_paid_broadcast?: boolean;
    message_effect_id?: string;
    suggested_post_parameters?: SuggestedPostParameters;
    reply_parameters?: ReplyParameters;
    reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply;
  }): Promise<Message>;

  sendVoice(options: {
    chat_id: number | string;
    voice: FileSource;
    business_connection_id?: string;
    message_thread_id?: number;
    direct_messages_topic_id?: number;
    caption?: string;
    parse_mode?: string;
    caption_entities?: MessageEntity[];
    duration?: number;
    disable_notification?: boolean;
    protect_content?: boolean;
    allow_paid_broadcast?: boolean;
    message_effect_id?: string;
    suggested_post_parameters?: SuggestedPostParameters;
    reply_parameters?: ReplyParameters;
    reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply;
  }): Promise<Message>;

  sendVideoNote(options: {
    chat_id: number | string;
    video_note: FileSource;
    business_connection_id?: string;
    message_thread_id?: number;
    direct_messages_topic_id?: number;
    duration?: number;
    length?: number;
    thumbnail?: FileSource;
    disable_notification?: boolean;
    protect_content?: boolean;
    allow_paid_broadcast?: boolean;
    message_effect_id?: string;
    suggested_post_parameters?: SuggestedPostParameters;
    reply_parameters?: ReplyParameters;
    reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply;
  }): Promise<Message>;

  sendPaidMedia(options: {
    chat_id: number | string;
    star_count: number;
    media: (InputPaidMediaPhoto | InputPaidMediaVideo | InputPaidMediaLivePhoto)[];
    business_connection_id?: string;
    message_thread_id?: number;
    direct_messages_topic_id?: number;
    payload?: string;
    caption?: string;
    parse_mode?: string;
    caption_entities?: MessageEntity[];
    show_caption_above_media?: boolean;
    disable_notification?: boolean;
    protect_content?: boolean;
    allow_paid_broadcast?: boolean;
    suggested_post_parameters?: SuggestedPostParameters;
    reply_parameters?: ReplyParameters;
    reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply;
  }): Promise<Message>;

  sendMediaGroup(options: {
    chat_id: number | string;
    media: (InputMediaPhoto | InputMediaVideo | InputMediaAnimation | InputMediaAudio | InputMediaDocument)[];
    business_connection_id?: string;
    message_thread_id?: number;
    direct_messages_topic_id?: number;
    disable_notification?: boolean;
    protect_content?: boolean;
    allow_paid_broadcast?: boolean;
    message_effect_id?: string;
    reply_parameters?: ReplyParameters;
  }): Promise<Message[]>;

  sendLocation(options: {
    chat_id: number | string;
    latitude: number;
    longitude: number;
    business_connection_id?: string;
    message_thread_id?: number;
    direct_messages_topic_id?: number;
    horizontal_accuracy?: number;
    live_period?: number;
    heading?: number;
    proximity_alert_radius?: number;
    disable_notification?: boolean;
    protect_content?: boolean;
    allow_paid_broadcast?: boolean;
    message_effect_id?: string;
    suggested_post_parameters?: SuggestedPostParameters;
    reply_parameters?: ReplyParameters;
    reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply;
  }): Promise<Message>;

  sendVenue(options: {
    chat_id: number | string;
    latitude: number;
    longitude: number;
    title: string;
    address: string;
    business_connection_id?: string;
    message_thread_id?: number;
    direct_messages_topic_id?: number;
    foursquare_id?: string;
    foursquare_type?: string;
    google_place_id?: string;
    google_place_type?: string;
    disable_notification?: boolean;
    protect_content?: boolean;
    allow_paid_broadcast?: boolean;
    message_effect_id?: string;
    suggested_post_parameters?: SuggestedPostParameters;
    reply_parameters?: ReplyParameters;
    reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply;
  }): Promise<Message>;

  sendContact(options: {
    chat_id: number | string;
    phone_number: string;
    first_name: string;
    business_connection_id?: string;
    message_thread_id?: number;
    direct_messages_topic_id?: number;
    last_name?: string;
    vcard?: string;
    disable_notification?: boolean;
    protect_content?: boolean;
    allow_paid_broadcast?: boolean;
    message_effect_id?: string;
    suggested_post_parameters?: SuggestedPostParameters;
    reply_parameters?: ReplyParameters;
    reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply;
  }): Promise<Message>;

  sendPoll(options: {
    chat_id: number | string;
    question: string;
    options: (string | InputPollOption)[];
    business_connection_id?: string;
    message_thread_id?: number;
    question_parse_mode?: string;
    question_entities?: MessageEntity[];
    is_anonymous?: boolean;
    type?: string;
    allows_multiple_answers?: boolean;
    allows_revoting?: boolean;
    shuffle_options?: boolean;
    allow_adding_options?: boolean;
    hide_results_until_closes?: boolean;
    members_only?: boolean;
    country_codes?: string[];
    correct_option_ids?: number[];
    explanation?: string;
    explanation_parse_mode?: string;
    explanation_entities?: MessageEntity[];
    explanation_media?: any;
    open_period?: number;
    close_date?: number;
    is_closed?: boolean;
    description?: string;
    description_parse_mode?: string;
    description_entities?: MessageEntity[];
    media?: any;
    disable_notification?: boolean;
    protect_content?: boolean;
    allow_paid_broadcast?: boolean;
    message_effect_id?: string;
    reply_parameters?: ReplyParameters;
    reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply;
  }): Promise<Message>;

  sendChecklist(options: {
    chat_id: number | string;
    checklist: InputChecklist;
    business_connection_id?: string;
    disable_notification?: boolean;
    protect_content?: boolean;
    message_effect_id?: string;
    reply_parameters?: ReplyParameters;
    reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply;
  }): Promise<Message>;

  sendDice(options: {
    chat_id: number | string;
    business_connection_id?: string;
    message_thread_id?: number;
    direct_messages_topic_id?: number;
    emoji?: string;
    disable_notification?: boolean;
    protect_content?: boolean;
    allow_paid_broadcast?: boolean;
    message_effect_id?: string;
    suggested_post_parameters?: SuggestedPostParameters;
    reply_parameters?: ReplyParameters;
    reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply;
  }): Promise<Message>;

  sendMessageDraft(options: {
    chat_id: number | string;
    draft_id: string;
    business_connection_id?: string;
    message_thread_id?: number;
    direct_messages_topic_id?: number;
    disable_notification?: boolean;
    protect_content?: boolean;
    reply_parameters?: ReplyParameters;
  }): Promise<any>;

  sendChatAction(options: {
    chat_id: number | string;
    action: string;
    business_connection_id?: string;
    message_thread_id?: number;
  }): Promise<boolean>;

  setMessageReaction(options: {
    chat_id: number | string;
    message_id: number;
    reaction?: (ReactionTypeEmoji | ReactionTypeCustomEmoji | ReactionTypePaid)[];
    is_big?: boolean;
  }): Promise<boolean>;

  // ── User / File ──────────────────────────────────────────────────────

  getUserProfilePhotos(options: {
    user_id: number;
    offset?: number;
    limit?: number;
  }): Promise<UserProfilePhotos>;

  getUserProfileAudios(options: {
    user_id: number;
    offset?: number;
    limit?: number;
  }): Promise<UserProfileAudios>;

  setUserEmojiStatus(options: {
    user_id: number;
    emoji_status_custom_emoji_id?: string;
    emoji_status_expiration_date?: number;
  }): Promise<boolean>;

  getFile(options: { file_id: string }): Promise<File>;

  // ── Chat member management ───────────────────────────────────────────

  banChatMember(options: {
    chat_id: number | string;
    user_id: number;
    until_date?: number;
    revoke_messages?: boolean;
  }): Promise<boolean>;

  unbanChatMember(options: {
    chat_id: number | string;
    user_id: number;
    only_if_banned?: boolean;
  }): Promise<boolean>;

  restrictChatMember(options: {
    chat_id: number | string;
    user_id: number;
    permissions: ChatPermissions;
    use_independent_chat_permissions?: boolean;
    until_date?: number;
  }): Promise<boolean>;

  promoteChatMember(options: {
    chat_id: number | string;
    user_id: number;
    is_anonymous?: boolean;
    can_manage_chat?: boolean;
    can_delete_messages?: boolean;
    can_manage_video_chats?: boolean;
    can_restrict_members?: boolean;
    can_promote_members?: boolean;
    can_change_info?: boolean;
    can_invite_users?: boolean;
    can_post_stories?: boolean;
    can_edit_stories?: boolean;
    can_delete_stories?: boolean;
    can_post_messages?: boolean;
    can_edit_messages?: boolean;
    can_pin_messages?: boolean;
    can_manage_topics?: boolean;
    can_manage_direct_messages?: boolean;
    can_manage_tags?: boolean;
  }): Promise<boolean>;

  setChatAdministratorCustomTitle(options: {
    chat_id: number | string;
    user_id: number;
    custom_title: string;
  }): Promise<boolean>;

  setChatMemberTag(options: {
    chat_id: number | string;
    user_id: number;
    tag?: string;
  }): Promise<boolean>;

  banChatSenderChat(options: { chat_id: number | string; sender_chat_id: number }): Promise<boolean>;
  unbanChatSenderChat(options: { chat_id: number | string; sender_chat_id: number }): Promise<boolean>;

  setChatPermissions(options: {
    chat_id: number | string;
    permissions: ChatPermissions;
    use_independent_chat_permissions?: boolean;
  }): Promise<boolean>;

  // ── Chat settings ────────────────────────────────────────────────────

  exportChatInviteLink(options: { chat_id: number | string }): Promise<string>;

  createChatInviteLink(options: {
    chat_id: number | string;
    name?: string;
    expire_date?: number;
    member_limit?: number;
    creates_join_request?: boolean;
  }): Promise<ChatInviteLink>;

  editChatInviteLink(options: {
    chat_id: number | string;
    invite_link: string;
    name?: string;
    expire_date?: number;
    member_limit?: number;
    creates_join_request?: boolean;
  }): Promise<ChatInviteLink>;

  createChatSubscriptionInviteLink(options: {
    chat_id: number | string;
    name?: string;
    subscription_period?: number;
    subscription_price?: number;
  }): Promise<ChatInviteLink>;

  editChatSubscriptionInviteLink(options: {
    chat_id: number | string;
    invite_link: string;
    name?: string;
  }): Promise<ChatInviteLink>;

  revokeChatInviteLink(options: { chat_id: number | string; invite_link: string }): Promise<ChatInviteLink>;
  approveChatJoinRequest(options: { chat_id: number | string; user_id: number }): Promise<boolean>;
  declineChatJoinRequest(options: { chat_id: number | string; user_id: number }): Promise<boolean>;

  setChatPhoto(options: { chat_id: number | string; photo: FileSource }): Promise<boolean>;
  deleteChatPhoto(options: { chat_id: number | string }): Promise<boolean>;
  setChatTitle(options: { chat_id: number | string; title: string }): Promise<boolean>;
  setChatDescription(options: { chat_id: number | string; description?: string }): Promise<boolean>;

  pinChatMessage(options: {
    chat_id: number | string;
    message_id: number;
    business_connection_id?: string;
    disable_notification?: boolean;
  }): Promise<boolean>;

  unpinChatMessage(options: {
    chat_id: number | string;
    message_id?: number;
    business_connection_id?: string;
  }): Promise<boolean>;

  unpinAllChatMessages(options: { chat_id: number | string }): Promise<boolean>;
  leaveChat(options: { chat_id: number | string }): Promise<boolean>;
  getChat(options: { chat_id: number | string }): Promise<ChatFullInfo>;
  getChatAdministrators(options: { chat_id: number | string; return_bots?: boolean }): Promise<any[]>;
  getChatMemberCount(options: { chat_id: number | string }): Promise<number>;
  getChatMember(options: { chat_id: number | string; user_id: number }): Promise<any>;

  getUserPersonalChatMessages(options: {
    user_id: number;
    limit?: number;
  }): Promise<Message[]>;

  setChatStickerSet(options: { chat_id: number | string; sticker_set_name: string }): Promise<boolean>;
  deleteChatStickerSet(options: { chat_id: number | string }): Promise<boolean>;

  // ── Forum topics ─────────────────────────────────────────────────────

  getForumTopicIconStickers(): Promise<Sticker[]>;

  createForumTopic(options: {
    chat_id: number | string;
    name: string;
    icon_color?: number;
    icon_custom_emoji_id?: string;
  }): Promise<ForumTopicCreated>;

  editForumTopic(options: {
    chat_id: number | string;
    message_thread_id: number;
    name?: string;
    icon_custom_emoji_id?: string;
  }): Promise<boolean>;

  closeForumTopic(options: { chat_id: number | string; message_thread_id: number }): Promise<boolean>;
  reopenForumTopic(options: { chat_id: number | string; message_thread_id: number }): Promise<boolean>;
  deleteForumTopic(options: { chat_id: number | string; message_thread_id: number }): Promise<boolean>;
  unpinAllForumTopicMessages(options: { chat_id: number | string; message_thread_id: number }): Promise<boolean>;
  editGeneralForumTopic(options: { chat_id: number | string; name: string }): Promise<boolean>;
  closeGeneralForumTopic(options: { chat_id: number | string }): Promise<boolean>;
  reopenGeneralForumTopic(options: { chat_id: number | string }): Promise<boolean>;
  hideGeneralForumTopic(options: { chat_id: number | string }): Promise<boolean>;
  unhideGeneralForumTopic(options: { chat_id: number | string }): Promise<boolean>;
  unpinAllGeneralForumTopicMessages(options: { chat_id: number | string }): Promise<boolean>;

  // ── Callback / Inline ────────────────────────────────────────────────

  answerCallbackQuery(options: {
    callback_query_id: string;
    text?: string;
    show_alert?: boolean;
    url?: string;
    cache_time?: number;
  }): Promise<boolean>;

  answerGuestQuery(options: {
    guest_query_id: string;
    result: any;
  }): Promise<SentGuestMessage>;

  getUserChatBoosts(options: {
    chat_id: number | string;
    user_id: number;
  }): Promise<UserChatBoosts>;

  getBusinessConnection(options: { business_connection_id: string }): Promise<BusinessConnection>;

  // ── Managed Bots ─────────────────────────────────────────────────────

  getManagedBotToken(options: { user_id: number }): Promise<string>;
  replaceManagedBotToken(options: { user_id: number }): Promise<string>;
  getManagedBotAccessSettings(options: { user_id: number }): Promise<BotAccessSettings>;
  setManagedBotAccessSettings(options: { user_id: number; is_access_restricted?: boolean; [key: string]: any }): Promise<boolean>;

  // ── Bot Commands & Settings ──────────────────────────────────────────

  setMyCommands(options: {
    commands: BotCommand[];
    scope?: BotCommandScopeDefault | BotCommandScopeAllPrivateChats | BotCommandScopeAllGroupChats | BotCommandScopeAllChatAdministrators | BotCommandScopeChat | BotCommandScopeChatAdministrators | BotCommandScopeChatMember;
    language_code?: string;
  }): Promise<boolean>;

  deleteMyCommands(options?: {
    scope?: any;
    language_code?: string;
  }): Promise<boolean>;

  getMyCommands(options?: {
    scope?: any;
    language_code?: string;
  }): Promise<BotCommand[]>;

  setMyName(options?: { name?: string; language_code?: string }): Promise<boolean>;
  getMyName(options?: { language_code?: string }): Promise<BotName>;
  setMyDescription(options?: { description?: string; language_code?: string }): Promise<boolean>;
  getMyDescription(options?: { language_code?: string }): Promise<BotDescription>;
  setMyShortDescription(options?: { short_description?: string; language_code?: string }): Promise<boolean>;
  getMyShortDescription(options?: { language_code?: string }): Promise<BotShortDescription>;

  setMyProfilePhoto(options: { photo: any }): Promise<boolean>;
  removeMyProfilePhoto(): Promise<boolean>;

  setChatMenuButton(options?: { chat_id?: number | string; menu_button?: MenuButtonCommands | MenuButtonWebApp | MenuButtonDefault }): Promise<boolean>;
  getChatMenuButton(options?: { chat_id?: number | string }): Promise<MenuButtonCommands | MenuButtonWebApp | MenuButtonDefault>;

  setMyDefaultAdministratorRights(options?: { rights?: ChatAdministratorRights; for_channels?: boolean }): Promise<boolean>;
  getMyDefaultAdministratorRights(options?: { for_channels?: boolean }): Promise<ChatAdministratorRights>;

  // ── Edit messages ────────────────────────────────────────────────────

  editMessageText(options: {
    text: string;
    chat_id?: number | string;
    message_id?: number;
    inline_message_id?: string;
    business_connection_id?: string;
    parse_mode?: string;
    entities?: MessageEntity[];
    link_preview_options?: LinkPreviewOptions;
    reply_markup?: InlineKeyboardMarkup;
  }): Promise<Message | boolean>;

  editMessageCaption(options: {
    chat_id?: number | string;
    message_id?: number;
    inline_message_id?: string;
    business_connection_id?: string;
    caption?: string;
    parse_mode?: string;
    caption_entities?: MessageEntity[];
    show_caption_above_media?: boolean;
    reply_markup?: InlineKeyboardMarkup;
  }): Promise<Message | boolean>;

  editMessageMedia(options: {
    media: InputMediaPhoto | InputMediaVideo | InputMediaAnimation | InputMediaAudio | InputMediaDocument;
    chat_id?: number | string;
    message_id?: number;
    inline_message_id?: string;
    business_connection_id?: string;
    reply_markup?: InlineKeyboardMarkup;
  }): Promise<Message | boolean>;

  editMessageLiveLocation(options: {
    latitude: number;
    longitude: number;
    chat_id?: number | string;
    message_id?: number;
    inline_message_id?: string;
    business_connection_id?: string;
    live_period?: number;
    horizontal_accuracy?: number;
    heading?: number;
    proximity_alert_radius?: number;
    reply_markup?: InlineKeyboardMarkup;
  }): Promise<Message | boolean>;

  stopMessageLiveLocation(options: {
    chat_id?: number | string;
    message_id?: number;
    inline_message_id?: string;
    business_connection_id?: string;
    reply_markup?: InlineKeyboardMarkup;
  }): Promise<Message | boolean>;

  editMessageChecklist(options: {
    chat_id: number | string;
    message_id: number;
    checklist: InputChecklist;
    business_connection_id?: string;
    reply_markup?: InlineKeyboardMarkup;
  }): Promise<Message>;

  editMessageReplyMarkup(options: {
    chat_id?: number | string;
    message_id?: number;
    inline_message_id?: string;
    business_connection_id?: string;
    reply_markup?: InlineKeyboardMarkup;
  }): Promise<Message | boolean>;

  stopPoll(options: {
    chat_id: number | string;
    message_id: number;
    business_connection_id?: string;
    reply_markup?: InlineKeyboardMarkup;
  }): Promise<Poll>;

  approveSuggestedPost(options: {
    chat_id: number | string;
    message_id: number;
    schedule_date?: number;
  }): Promise<boolean>;

  declineSuggestedPost(options: {
    chat_id: number | string;
    message_id: number;
  }): Promise<boolean>;

  deleteMessage(options: { chat_id: number | string; message_id: number }): Promise<boolean>;
  deleteMessages(options: { chat_id: number | string; message_ids: number[] }): Promise<boolean>;

  deleteMessageReaction(options: {
    chat_id: number | string;
    message_id: number;
    reaction?: any;
  }): Promise<boolean>;

  deleteAllMessageReactions(options: {
    chat_id: number | string;
    message_id: number;
  }): Promise<boolean>;

  // ── Stickers ─────────────────────────────────────────────────────────

  sendSticker(options: {
    chat_id: number | string;
    sticker: FileSource;
    business_connection_id?: string;
    message_thread_id?: number;
    direct_messages_topic_id?: number;
    emoji?: string;
    disable_notification?: boolean;
    protect_content?: boolean;
    allow_paid_broadcast?: boolean;
    message_effect_id?: string;
    suggested_post_parameters?: SuggestedPostParameters;
    reply_parameters?: ReplyParameters;
    reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply;
  }): Promise<Message>;

  getStickerSet(options: { name: string }): Promise<StickerSet>;
  getCustomEmojiStickers(options: { custom_emoji_ids: string[] }): Promise<Sticker[]>;

  uploadStickerFile(options: {
    user_id: number;
    sticker: FileSource;
    sticker_format: string;
  }): Promise<File>;

  createNewStickerSet(options: {
    user_id: number;
    name: string;
    title: string;
    stickers: InputSticker[];
    sticker_type?: string;
    needs_repainting?: boolean;
  }): Promise<boolean>;

  addStickerToSet(options: { user_id: number; name: string; sticker: InputSticker }): Promise<boolean>;
  setStickerPositionInSet(options: { sticker: string; position: number }): Promise<boolean>;
  deleteStickerFromSet(options: { sticker: string }): Promise<boolean>;
  replaceStickerInSet(options: { user_id: number; name: string; old_sticker: string; sticker: InputSticker }): Promise<boolean>;
  setStickerEmojiList(options: { sticker: string; emoji_list: string[] }): Promise<boolean>;
  setStickerKeywords(options: { sticker: string; keywords?: string[] }): Promise<boolean>;
  setStickerMaskPosition(options: { sticker: string; mask_position?: MaskPosition }): Promise<boolean>;
  setStickerSetTitle(options: { name: string; title: string }): Promise<boolean>;

  setStickerSetThumbnail(options: {
    name: string;
    user_id: number;
    format: string;
    thumbnail?: FileSource;
  }): Promise<boolean>;

  setCustomEmojiStickerSetThumbnail(options: { name: string; custom_emoji_id?: string }): Promise<boolean>;
  deleteStickerSet(options: { name: string }): Promise<boolean>;

  // ── Inline mode ──────────────────────────────────────────────────────

  answerInlineQuery(options: {
    inline_query_id: string;
    results: any[];
    cache_time?: number;
    is_personal?: boolean;
    next_offset?: string;
    button?: InlineQueryResultsButton;
  }): Promise<boolean>;

  answerWebAppQuery(options: {
    web_app_query_id: string;
    result: any;
  }): Promise<SentWebAppMessage>;

  savePreparedInlineMessage(options: {
    user_id: number;
    result: any;
    allow_user_chats?: boolean;
    allow_bot_chats?: boolean;
    allow_group_chats?: boolean;
    allow_channel_chats?: boolean;
  }): Promise<PreparedInlineMessage>;

  savePreparedKeyboardButton(options: {
    user_id: number;
    button: any;
  }): Promise<PreparedKeyboardButton>;

  // ── Payments ─────────────────────────────────────────────────────────

  sendInvoice(options: {
    chat_id: number | string;
    title: string;
    description: string;
    payload: string;
    currency: string;
    prices: LabeledPrice[];
    provider_token?: string;
    message_thread_id?: number;
    direct_messages_topic_id?: number;
    max_tip_amount?: number;
    suggested_tip_amounts?: number[];
    start_parameter?: string;
    provider_data?: string;
    photo_url?: string;
    photo_size?: number;
    photo_width?: number;
    photo_height?: number;
    need_name?: boolean;
    need_phone_number?: boolean;
    need_email?: boolean;
    need_shipping_address?: boolean;
    send_phone_number_to_provider?: boolean;
    send_email_to_provider?: boolean;
    is_flexible?: boolean;
    disable_notification?: boolean;
    protect_content?: boolean;
    allow_paid_broadcast?: boolean;
    message_effect_id?: string;
    suggested_post_parameters?: SuggestedPostParameters;
    reply_parameters?: ReplyParameters;
    reply_markup?: InlineKeyboardMarkup;
  }): Promise<Message>;

  createInvoiceLink(options: {
    title: string;
    description: string;
    payload: string;
    currency: string;
    prices: LabeledPrice[];
    provider_token?: string;
    max_tip_amount?: number;
    suggested_tip_amounts?: number[];
    provider_data?: string;
    photo_url?: string;
    photo_size?: number;
    photo_width?: number;
    photo_height?: number;
    need_name?: boolean;
    need_phone_number?: boolean;
    need_email?: boolean;
    need_shipping_address?: boolean;
    send_phone_number_to_provider?: boolean;
    send_email_to_provider?: boolean;
    is_flexible?: boolean;
    subscription_period?: number;
  }): Promise<string>;

  answerShippingQuery(options: {
    shipping_query_id: string;
    ok: boolean;
    shipping_options?: ShippingOption[];
    error_message?: string;
  }): Promise<boolean>;

  answerPreCheckoutQuery(options: {
    pre_checkout_query_id: string;
    ok: boolean;
    error_message?: string;
  }): Promise<boolean>;

  getMyStarBalance(): Promise<StarAmount>;

  getStarTransactions(options?: {
    offset?: number;
    limit?: number;
  }): Promise<StarTransactions>;

  refundStarPayment(options: {
    user_id: number;
    telegram_payment_charge_id: string;
  }): Promise<boolean>;

  editUserStarSubscription(options: {
    user_id: number;
    telegram_payment_charge_id: string;
    is_canceled: boolean;
  }): Promise<boolean>;

  // ── Gifts ────────────────────────────────────────────────────────────

  getAvailableGifts(): Promise<Gifts>;

  sendGift(options: {
    gift_id: string;
    user_id?: number;
    chat_id?: number | string;
    text?: string;
    text_parse_mode?: string;
    text_entities?: MessageEntity[];
    pay_for_upgrade?: boolean;
  }): Promise<boolean>;

  giftPremiumSubscription(options: {
    user_id: number;
    month_count: number;
    star_count: number;
    text?: string;
    text_parse_mode?: string;
    text_entities?: MessageEntity[];
  }): Promise<boolean>;

  getUserGifts(options: { user_id: number; offset?: string; limit?: number }): Promise<OwnedGifts>;
  getChatGifts(options: { chat_id: number | string; offset?: string; limit?: number }): Promise<OwnedGifts>;

  getBusinessAccountGifts(options: {
    business_connection_id: string;
    exclude_unsaved?: boolean;
    exclude_saved?: boolean;
    exclude_unlimited?: boolean;
    exclude_limited?: boolean;
    exclude_unique?: boolean;
    sort_by?: string;
    offset?: string;
    limit?: number;
  }): Promise<OwnedGifts>;

  convertGiftToStars(options: { business_connection_id: string; owned_gift_id: string }): Promise<boolean>;
  upgradeGift(options: { business_connection_id: string; owned_gift_id: string; keep_original_details?: boolean; star_count?: number }): Promise<boolean>;
  transferGift(options: { business_connection_id: string; owned_gift_id: string; new_owner_chat_id: number; star_count?: number }): Promise<boolean>;

  // ── Verification ─────────────────────────────────────────────────────

  verifyUser(options: { user_id: number; custom_description?: string }): Promise<boolean>;
  verifyChat(options: { chat_id: number | string; custom_description?: string }): Promise<boolean>;
  removeUserVerification(options: { user_id: number }): Promise<boolean>;
  removeChatVerification(options: { chat_id: number | string }): Promise<boolean>;

  // ── Business ─────────────────────────────────────────────────────────

  readBusinessMessage(options: { business_connection_id: string; chat_id: number | string; message_id: number }): Promise<boolean>;
  deleteBusinessMessages(options: { business_connection_id: string; message_ids: number[] }): Promise<boolean>;
  setBusinessAccountName(options: { business_connection_id: string; first_name: string; last_name?: string }): Promise<boolean>;
  setBusinessAccountUsername(options: { business_connection_id: string; username?: string }): Promise<boolean>;
  setBusinessAccountBio(options: { business_connection_id: string; bio?: string }): Promise<boolean>;
  setBusinessAccountProfilePhoto(options: { business_connection_id: string; photo: any; is_public?: boolean }): Promise<boolean>;
  removeBusinessAccountProfilePhoto(options: { business_connection_id: string; is_public?: boolean }): Promise<boolean>;
  setBusinessAccountGiftSettings(options: { business_connection_id: string; show_gift_button: boolean; accepted_gift_types: AcceptedGiftTypes }): Promise<boolean>;
  getBusinessAccountStarBalance(options: { business_connection_id: string }): Promise<StarAmount>;
  transferBusinessAccountStars(options: { business_connection_id: string; star_count: number }): Promise<boolean>;

  // ── Stories ──────────────────────────────────────────────────────────

  postStory(options: {
    business_connection_id: string;
    content: InputStoryContentPhoto | InputStoryContentVideo;
    active_period?: number;
    caption?: string;
    parse_mode?: string;
    caption_entities?: MessageEntity[];
    areas?: StoryArea[];
    post_to_chat_page?: boolean;
    protect_content?: boolean;
  }): Promise<Story>;

  repostStory(options: {
    business_connection_id: string;
    from_chat_id: number | string;
    from_story_id: number;
    caption?: string;
    parse_mode?: string;
    caption_entities?: MessageEntity[];
    areas?: StoryArea[];
    post_to_chat_page?: boolean;
  }): Promise<Story>;

  editStory(options: {
    business_connection_id: string;
    story_id: number;
    content?: InputStoryContentPhoto | InputStoryContentVideo;
    caption?: string;
    parse_mode?: string;
    caption_entities?: MessageEntity[];
    areas?: StoryArea[];
  }): Promise<Story>;

  deleteStory(options: { business_connection_id: string; story_id: number }): Promise<boolean>;

  // ── Games ────────────────────────────────────────────────────────────

  sendGame(options: {
    chat_id: number | string;
    game_short_name: string;
    business_connection_id?: string;
    message_thread_id?: number;
    disable_notification?: boolean;
    protect_content?: boolean;
    allow_paid_broadcast?: boolean;
    message_effect_id?: string;
    reply_parameters?: ReplyParameters;
    reply_markup?: InlineKeyboardMarkup;
  }): Promise<Message>;

  setGameScore(options: {
    user_id: number;
    score: number;
    force?: boolean;
    disable_edit_message?: boolean;
    chat_id?: number | string;
    message_id?: number;
    inline_message_id?: string;
  }): Promise<Message | boolean>;

  getGameHighScores(options: {
    user_id: number;
    chat_id?: number | string;
    message_id?: number;
    inline_message_id?: string;
  }): Promise<GameHighScore[]>;

  // ── Passport ─────────────────────────────────────────────────────────

  setPassportDataErrors(options: {
    user_id: number;
    errors: (PassportElementErrorDataField | PassportElementErrorFrontSide | PassportElementErrorReverseSide | PassportElementErrorSelfie | PassportElementErrorFile | PassportElementErrorFiles | PassportElementErrorTranslationFile | PassportElementErrorTranslationFiles | PassportElementErrorUnspecified)[];
  }): Promise<boolean>;
}

// ============================================================================
// AI Classes
// ============================================================================

export declare class OnlySQ {
  apiKey: string;
  constructor(options?: string | { apiKey?: string });

  getModels(options?: {
    modality?: string | string[];
    can_tools?: boolean;
    can_think?: boolean;
    can_stream?: boolean;
    status?: string;
    max_cost?: number;
    return_names?: boolean;
  }): Promise<string[]>;

  generateAnswer(model?: string, messages?: Array<{ role: string; content: string }>): Promise<string>;

  generateImage(model?: string, prompt?: string, ratio?: string, filename?: string): Promise<boolean>;
}

export declare class Deef {
  translate(text: string, lang?: string): Promise<string>;
  shortUrl(longUrl: string): Promise<string>;
  runInBg(func: (...args: any[]) => any, ...args: any[]): void;
  encodeBase64(filePath: string): string | null;
  perplexityAsk(prompt: string, model?: string): Promise<{ text: string; urls: string[] }>;
  toolchat(prompt: string, model?: string): Promise<string>;
}

export declare class ChatGPT {
  url: string;
  headers: Record<string, string>;
  constructor(url: string, headers?: Record<string, string>);

  _makeRequest(method: string, endpoint: string, data?: any, files?: any): Promise<any>;

  generateChatCompletion(
    model: string,
    messages: Array<{ role: string; content: string }>,
    temperature?: number | null,
    max_tokens?: number | null,
    stream?: boolean,
    kwargs?: Record<string, any>,
  ): Promise<any>;

  generateImage(
    prompt: string,
    n?: number,
    size?: string,
    response_format?: string,
    kwargs?: Record<string, any>,
  ): Promise<any>;

  generateEmbedding(
    model: string,
    input_data: string | string[],
    user?: string | null,
    kwargs?: Record<string, any>,
  ): Promise<any>;

  generateTranscription(
    file: any,
    model: string,
    language?: string | null,
    prompt?: string | null,
    response_format?: string,
    temperature?: number,
    kwargs?: Record<string, any>,
  ): Promise<any>;

  generateTranslation(
    file: any,
    model: string,
    prompt?: string | null,
    response_format?: string,
    temperature?: number,
    kwargs?: Record<string, any>,
  ): Promise<any>;

  getModels(): Promise<any>;
}

export { ChatGPT as OpenAI };

// ============================================================================
// Telegram Type Classes - Fully Defined (key types)
// ============================================================================

export declare class Update extends TelegramObject {
  update_id: number;
  message?: Message;
  edited_message?: Message;
  channel_post?: Message;
  edited_channel_post?: Message;
  business_connection?: BusinessConnection;
  business_message?: Message;
  edited_business_message?: Message;
  deleted_business_messages?: BusinessMessagesDeleted;
  inline_query?: InlineQuery;
  chosen_inline_result?: any;
  callback_query?: CallbackQuery;
  shipping_query?: ShippingQuery;
  pre_checkout_query?: PreCheckoutQuery;
  poll?: Poll;
  poll_answer?: PollAnswer;
  my_chat_member?: ChatMemberUpdated;
  chat_member?: ChatMemberUpdated;
  chat_join_request?: ChatJoinRequest;
  chat_boost?: ChatBoostUpdated;
  removed_chat_boost?: ChatBoostRemoved;
  message_reaction?: MessageReactionUpdated;
  message_reaction_count?: MessageReactionCountUpdated;
  purchased_paid_media?: PaidMediaPurchased;
}

export declare class User extends TelegramObject {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  added_to_attachment_menu?: boolean;
  can_join_groups?: boolean;
  can_read_all_group_messages?: boolean;
  supports_inline_queries?: boolean;
  can_connect_to_business?: boolean;
  has_main_web_app?: boolean;
}

export declare class Chat extends TelegramObject {
  id: number;
  type_val: string;
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  is_forum?: boolean;
}

export declare class ChatFullInfo extends TelegramObject {
  id: number;
  type_val: string;
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  is_forum?: boolean;
  photo?: ChatPhoto;
  active_usernames?: string[];
  birthdate?: Birthdate;
  business_intro?: BusinessIntro;
  business_location?: BusinessLocation;
  business_opening_hours?: BusinessOpeningHours;
  personal_chat?: Chat;
  available_reactions?: (ReactionTypeEmoji | ReactionTypeCustomEmoji | ReactionTypePaid)[];
  accent_color_id?: number;
  max_reaction_count?: number;
  background_custom_emoji_id?: string;
  profile_accent_color_id?: number;
  profile_background_custom_emoji_id?: string;
  emoji_status_custom_emoji_id?: string;
  emoji_status_expiration_date?: number;
  bio?: string;
  has_private_forwards?: boolean;
  has_restricted_voice_and_video_messages?: boolean;
  join_to_send_messages?: boolean;
  join_by_request?: boolean;
  description?: string;
  invite_link?: string;
  pinned_message?: Message;
  permissions?: ChatPermissions;
  can_send_paid_media?: boolean;
  slow_mode_delay?: number;
  unrestrict_boost_count?: number;
  message_auto_delete_time?: number;
  has_aggressive_anti_spam_enabled?: boolean;
  has_hidden_members?: boolean;
  has_protected_content?: boolean;
  has_visible_history?: boolean;
  sticker_set_name?: string;
  can_set_sticker_set?: boolean;
  custom_emoji_sticker_set_name?: string;
  linked_chat_id?: number;
  location?: ChatLocation;
}

export declare class Message extends TelegramObject {
  message_id: number;
  message_thread_id?: number;
  from_user?: User;
  sender_chat?: Chat;
  sender_boost_count?: number;
  sender_business_bot?: User;
  date: number;
  business_connection_id?: string;
  chat: Chat;
  forward_origin?: MessageOriginUser | MessageOriginHiddenUser | MessageOriginChat | MessageOriginChannel;
  is_topic_message?: boolean;
  is_automatic_forward?: boolean;
  reply_to_message?: Message;
  external_reply?: ExternalReplyInfo;
  quote?: TextQuote;
  reply_to_story?: Story;
  via_bot?: User;
  edit_date?: number;
  has_protected_content?: boolean;
  is_from_offline?: boolean;
  media_group_id?: string;
  author_signature?: string;
  text?: string;
  entities?: MessageEntity[];
  link_preview_options?: LinkPreviewOptions;
  effect_id?: string;
  animation?: Animation;
  audio?: Audio;
  document?: Document;
  paid_media?: PaidMediaInfo;
  photo?: PhotoSize[];
  sticker?: Sticker;
  story?: Story;
  video?: Video;
  video_note?: VideoNote;
  voice?: Voice;
  caption?: string;
  caption_entities?: MessageEntity[];
  show_caption_above_media?: boolean;
  has_media_spoiler?: boolean;
  contact?: Contact;
  dice?: Dice;
  game?: Game;
  poll?: Poll;
  venue?: Venue;
  location?: Location;
  new_chat_members?: User[];
  left_chat_member?: User;
  new_chat_title?: string;
  new_chat_photo?: PhotoSize[];
  delete_chat_photo?: boolean;
  group_chat_created?: boolean;
  supergroup_chat_created?: boolean;
  channel_chat_created?: boolean;
  message_auto_delete_timer_changed?: MessageAutoDeleteTimerChanged;
  migrate_to_chat_id?: number;
  migrate_from_chat_id?: number;
  pinned_message?: Message | InaccessibleMessage;
  invoice?: Invoice;
  successful_payment?: SuccessfulPayment;
  refunded_payment?: RefundedPayment;
  users_shared?: UsersShared;
  chat_shared?: ChatShared;
  connected_website?: string;
  write_access_allowed?: WriteAccessAllowed;
  passport_data?: PassportData;
  proximity_alert_triggered?: ProximityAlertTriggered;
  boost_added?: ChatBoostAdded;
  chat_background_set?: ChatBackground;
  forum_topic_created?: ForumTopicCreated;
  forum_topic_edited?: ForumTopicEdited;
  forum_topic_closed?: ForumTopicClosed;
  forum_topic_reopened?: ForumTopicReopened;
  general_forum_topic_hidden?: GeneralForumTopicHidden;
  general_forum_topic_unhidden?: GeneralForumTopicUnhidden;
  giveaway_created?: GiveawayCreated;
  giveaway?: Giveaway;
  giveaway_winners?: GiveawayWinners;
  giveaway_completed?: GiveawayCompleted;
  video_chat_scheduled?: VideoChatScheduled;
  video_chat_started?: VideoChatStarted;
  video_chat_ended?: VideoChatEnded;
  video_chat_participants_invited?: VideoChatParticipantsInvited;
  web_app_data?: WebAppData;
  reply_markup?: InlineKeyboardMarkup;
  checklist?: Checklist;
}

export declare class MessageId extends TelegramObject {
  message_id: number;
}

export declare class InaccessibleMessage extends TelegramObject {
  chat: Chat;
  message_id: number;
  date: 0;
}

export declare class MessageEntity extends TelegramObject {
  type_val: string;
  offset: number;
  length: number;
  url?: string;
  user?: User;
  language?: string;
  custom_emoji_id?: string;
}

export declare class CallbackQuery extends TelegramObject {
  id: string;
  from_user: User;
  message?: Message | InaccessibleMessage;
  inline_message_id?: string;
  chat_instance: string;
  data?: string;
  game_short_name?: string;
}

export declare class InlineQuery extends TelegramObject {
  id: string;
  from_user: User;
  query: string;
  offset: string;
  chat_type?: string;
  location?: Location;
}

export declare class ShippingQuery extends TelegramObject {
  id: string;
  from_user: User;
  invoice_payload: string;
  shipping_address: ShippingAddress;
}

export declare class PreCheckoutQuery extends TelegramObject {
  id: string;
  from_user: User;
  currency: string;
  total_amount: number;
  invoice_payload: string;
  shipping_option_id?: string;
  order_info?: OrderInfo;
}

export declare class Poll extends TelegramObject {
  id: string;
  question: string;
  options: PollOption[];
  total_voter_count: number;
  is_closed: boolean;
  is_anonymous: boolean;
  type_val: string;
  allows_multiple_answers: boolean;
  correct_option_id?: number;
  explanation?: string;
  explanation_entities?: MessageEntity[];
  open_period?: number;
  close_date?: number;
}

export declare class PollOption extends TelegramObject {
  text: string;
  text_entities?: MessageEntity[];
  voter_count: number;
}

export declare class PollAnswer extends TelegramObject {
  poll_id: string;
  voter_chat?: Chat;
  user?: User;
  option_ids: number[];
}

export declare class ChatMemberUpdated extends TelegramObject {
  chat: Chat;
  from_user: User;
  date: number;
  old_chat_member: ChatMemberOwner | ChatMemberAdministrator | ChatMemberMember | ChatMemberRestricted | ChatMemberBanned | ChatMemberLeft;
  new_chat_member: ChatMemberOwner | ChatMemberAdministrator | ChatMemberMember | ChatMemberRestricted | ChatMemberBanned | ChatMemberLeft;
  invite_link?: ChatInviteLink;
  via_join_request?: boolean;
  via_chat_folder_invite_link?: boolean;
}

export declare class ChatJoinRequest extends TelegramObject {
  chat: Chat;
  from_user: User;
  user_chat_id: number;
  date: number;
  bio?: string;
  invite_link?: ChatInviteLink;
}

// ── Keyboard types ─────────────────────────────────────────────────────

export declare class ReplyKeyboardMarkup extends TelegramObject {
  keyboard: KeyboardButton[][];
  is_persistent?: boolean;
  resize_keyboard?: boolean;
  one_time_keyboard?: boolean;
  input_field_placeholder?: string;
  selective?: boolean;
}

export declare class KeyboardButton extends TelegramObject {
  text: string;
  request_users?: KeyboardButtonRequestUsers;
  request_chat?: KeyboardButtonRequestChat;
  request_contact?: boolean;
  request_location?: boolean;
  request_poll?: KeyboardButtonPollType;
  web_app?: WebAppInfo;
}

export declare class ReplyKeyboardRemove extends TelegramObject {
  remove_keyboard: true;
  selective?: boolean;
}

export declare class InlineKeyboardMarkup extends TelegramObject {
  inline_keyboard: InlineKeyboardButton[][];
}

export declare class InlineKeyboardButton extends TelegramObject {
  text: string;
  url?: string;
  callback_data?: string;
  web_app?: WebAppInfo;
  login_url?: LoginUrl;
  switch_inline_query?: string;
  switch_inline_query_current_chat?: string;
  switch_inline_query_chosen_chat?: SwitchInlineQueryChosenChat;
  copy_text?: CopyTextButton;
  callback_game?: CallbackGame;
  pay?: boolean;
}

export declare class ForceReply extends TelegramObject {
  force_reply: true;
  input_field_placeholder?: string;
  selective?: boolean;
}

// ── Media types ────────────────────────────────────────────────────────

export declare class PhotoSize extends TelegramObject {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  file_size?: number;
}

export declare class Animation extends TelegramObject {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  duration: number;
  thumbnail?: PhotoSize;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
}

export declare class Audio extends TelegramObject {
  file_id: string;
  file_unique_id: string;
  duration: number;
  performer?: string;
  title?: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
  thumbnail?: PhotoSize;
}

export declare class Document extends TelegramObject {
  file_id: string;
  file_unique_id: string;
  thumbnail?: PhotoSize;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
}

export declare class Video extends TelegramObject {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  duration: number;
  thumbnail?: PhotoSize;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
}

export declare class VideoNote extends TelegramObject {
  file_id: string;
  file_unique_id: string;
  length: number;
  duration: number;
  thumbnail?: PhotoSize;
  file_size?: number;
}

export declare class Voice extends TelegramObject {
  file_id: string;
  file_unique_id: string;
  duration: number;
  mime_type?: string;
  file_size?: number;
}

export declare class File extends TelegramObject {
  file_id: string;
  file_unique_id: string;
  file_size?: number;
  file_path?: string;
}

export declare class Contact extends TelegramObject {
  phone_number: string;
  first_name: string;
  last_name?: string;
  user_id?: number;
  vcard?: string;
}

export declare class Dice extends TelegramObject {
  emoji: string;
  value: number;
}

export declare class Location extends TelegramObject {
  latitude: number;
  longitude: number;
  horizontal_accuracy?: number;
  live_period?: number;
  heading?: number;
  proximity_alert_radius?: number;
}

export declare class Venue extends TelegramObject {
  location: Location;
  title: string;
  address: string;
  foursquare_id?: string;
  foursquare_type?: string;
  google_place_id?: string;
  google_place_type?: string;
}

// ── Chat-related types ─────────────────────────────────────────────────

export declare class ChatPhoto extends TelegramObject {
  small_file_id: string;
  small_file_unique_id: string;
  big_file_id: string;
  big_file_unique_id: string;
}

export declare class ChatInviteLink extends TelegramObject {
  invite_link: string;
  creator: User;
  creates_join_request: boolean;
  is_primary: boolean;
  is_revoked: boolean;
  name?: string;
  expire_date?: number;
  member_limit?: number;
  pending_join_request_count?: number;
  subscription_period?: number;
  subscription_price?: number;
}

export declare class ChatPermissions extends TelegramObject {
  can_send_messages?: boolean;
  can_send_audios?: boolean;
  can_send_documents?: boolean;
  can_send_photos?: boolean;
  can_send_videos?: boolean;
  can_send_video_notes?: boolean;
  can_send_voice_notes?: boolean;
  can_send_polls?: boolean;
  can_send_other_messages?: boolean;
  can_add_web_page_previews?: boolean;
  can_change_info?: boolean;
  can_invite_users?: boolean;
  can_pin_messages?: boolean;
  can_manage_topics?: boolean;
}

export declare class ChatAdministratorRights extends TelegramObject {
  is_anonymous: boolean;
  can_manage_chat: boolean;
  can_delete_messages: boolean;
  can_manage_video_chats: boolean;
  can_restrict_members: boolean;
  can_promote_members: boolean;
  can_change_info: boolean;
  can_invite_users: boolean;
  can_post_stories: boolean;
  can_edit_stories: boolean;
  can_delete_stories: boolean;
  can_post_messages?: boolean;
  can_edit_messages?: boolean;
  can_pin_messages?: boolean;
  can_manage_topics?: boolean;
}

// ── ChatMember variants ────────────────────────────────────────────────

export declare class ChatMemberOwner extends TelegramObject {
  status: 'creator';
  user: User;
  is_anonymous: boolean;
  custom_title?: string;
}

export declare class ChatMemberAdministrator extends TelegramObject {
  status: 'administrator';
  user: User;
  can_be_edited: boolean;
  is_anonymous: boolean;
  can_manage_chat: boolean;
  can_delete_messages: boolean;
  can_manage_video_chats: boolean;
  can_restrict_members: boolean;
  can_promote_members: boolean;
  can_change_info: boolean;
  can_invite_users: boolean;
  can_post_stories: boolean;
  can_edit_stories: boolean;
  can_delete_stories: boolean;
  can_post_messages?: boolean;
  can_edit_messages?: boolean;
  can_pin_messages?: boolean;
  can_manage_topics?: boolean;
  custom_title?: string;
}

export declare class ChatMemberMember extends TelegramObject {
  status: 'member';
  user: User;
  until_date?: number;
}

export declare class ChatMemberRestricted extends TelegramObject {
  status: 'restricted';
  user: User;
  is_member: boolean;
  can_send_messages: boolean;
  can_send_audios: boolean;
  can_send_documents: boolean;
  can_send_photos: boolean;
  can_send_videos: boolean;
  can_send_video_notes: boolean;
  can_send_voice_notes: boolean;
  can_send_polls: boolean;
  can_send_other_messages: boolean;
  can_add_web_page_previews: boolean;
  can_change_info: boolean;
  can_invite_users: boolean;
  can_pin_messages: boolean;
  can_manage_topics: boolean;
  until_date: number;
}

export declare class ChatMemberBanned extends TelegramObject {
  status: 'kicked';
  user: User;
  until_date: number;
}

export declare class ChatMemberLeft extends TelegramObject {
  status: 'left';
  user: User;
}

// ── Sticker types ──────────────────────────────────────────────────────

export declare class Sticker extends TelegramObject {
  file_id: string;
  file_unique_id: string;
  type_val: string;
  width: number;
  height: number;
  is_animated: boolean;
  is_video: boolean;
  thumbnail?: PhotoSize;
  emoji?: string;
  set_name?: string;
  premium_animation?: File;
  mask_position?: MaskPosition;
  custom_emoji_id?: string;
  needs_repainting?: boolean;
  file_size?: number;
}

export declare class StickerSet extends TelegramObject {
  name: string;
  title: string;
  sticker_type: string;
  stickers: Sticker[];
  thumbnail?: PhotoSize;
}

export declare class MaskPosition extends TelegramObject {
  point: string;
  x_shift: number;
  y_shift: number;
  scale: number;
}

export declare class InputSticker extends TelegramObject {
  sticker: FileSource;
  format: string;
  emoji_list: string[];
  mask_position?: MaskPosition;
  keywords?: string[];
}

// ── Payment types ──────────────────────────────────────────────────────

export declare class LabeledPrice extends TelegramObject {
  label: string;
  amount: number;
}

export declare class Invoice extends TelegramObject {
  title: string;
  description: string;
  start_parameter: string;
  currency: string;
  total_amount: number;
}

export declare class ShippingAddress extends TelegramObject {
  country_code: string;
  state: string;
  city: string;
  street_line1: string;
  street_line2: string;
  post_code: string;
}

export declare class OrderInfo extends TelegramObject {
  name?: string;
  phone_number?: string;
  email?: string;
  shipping_address?: ShippingAddress;
}

export declare class ShippingOption extends TelegramObject {
  id: string;
  title: string;
  prices: LabeledPrice[];
}

export declare class SuccessfulPayment extends TelegramObject {
  currency: string;
  total_amount: number;
  invoice_payload: string;
  shipping_option_id?: string;
  order_info?: OrderInfo;
  telegram_payment_charge_id: string;
  provider_payment_charge_id: string;
}

export declare class RefundedPayment extends TelegramObject {
  currency: string;
  total_amount: number;
  invoice_payload: string;
  telegram_payment_charge_id: string;
  provider_payment_charge_id?: string;
}

// ── Bot command types ──────────────────────────────────────────────────

export declare class BotCommand extends TelegramObject {
  command: string;
  description: string;
}

export declare class BotDescription extends TelegramObject {
  description: string;
}

export declare class BotName extends TelegramObject {
  name: string;
}

export declare class BotShortDescription extends TelegramObject {
  short_description: string;
}

// ── Game types ─────────────────────────────────────────────────────────

export declare class Game extends TelegramObject {
  title: string;
  description: string;
  photo: PhotoSize[];
  text?: string;
  text_entities?: MessageEntity[];
  animation?: Animation;
}

export declare class GameHighScore extends TelegramObject {
  position: number;
  user: User;
  score: number;
}

export declare class CallbackGame extends TelegramObject {}

// ── Inline result types ────────────────────────────────────────────────

export declare class SentWebAppMessage extends TelegramObject {
  inline_message_id?: string;
}

export declare class UserProfilePhotos extends TelegramObject {
  total_count: number;
  photos: PhotoSize[][];
}

export declare class UserChatBoosts extends TelegramObject {
  boosts: ChatBoost[];
}

export declare class WebAppInfo extends TelegramObject {
  url: string;
}

export declare class LoginUrl extends TelegramObject {
  url: string;
  forward_text?: string;
  bot_username?: string;
  request_write_access?: boolean;
}

export declare class SwitchInlineQueryChosenChat extends TelegramObject {
  query?: string;
  allow_user_chats?: boolean;
  allow_bot_chats?: boolean;
  allow_group_chats?: boolean;
  allow_channel_chats?: boolean;
}

export declare class LinkPreviewOptions extends TelegramObject {
  is_disabled?: boolean;
  url?: string;
  prefer_small_media?: boolean;
  prefer_large_media?: boolean;
  show_above_text?: boolean;
}

export declare class WebAppData extends TelegramObject {
  data: string;
  button_text: string;
}

export declare class ChatLocation extends TelegramObject {
  location: Location;
  address: string;
}

export declare class ResponseParameters extends TelegramObject {
  migrate_to_chat_id?: number;
  retry_after?: number;
}

export declare class WebhookInfo extends TelegramObject {
  url: string;
  has_custom_certificate: boolean;
  pending_update_count: number;
  ip_address?: string;
  last_error_date?: number;
  last_error_message?: string;
  last_synchronization_error_date?: number;
  max_connections?: number;
  allowed_updates?: string[];
}

// ============================================================================
// Telegram Type Classes - Remaining (extend TelegramObject)
// ============================================================================

export declare class TextQuote extends TelegramObject {}
export declare class ExternalReplyInfo extends TelegramObject {}
export declare class ReplyParameters extends TelegramObject {
  message_id: number;
  chat_id?: number | string;
  allow_sending_without_reply?: boolean;
  quote?: string;
  quote_parse_mode?: string;
  quote_entities?: MessageEntity[];
  quote_position?: number;
}

export declare class MessageOriginUser extends TelegramObject {
  type_val: 'user';
  date: number;
  sender_user: User;
}
export declare class MessageOriginHiddenUser extends TelegramObject {
  type_val: 'hidden_user';
  date: number;
  sender_user_name: string;
}
export declare class MessageOriginChat extends TelegramObject {
  type_val: 'chat';
  date: number;
  sender_chat: Chat;
  author_signature?: string;
}
export declare class MessageOriginChannel extends TelegramObject {
  type_val: 'channel';
  date: number;
  chat: Chat;
  message_id: number;
  author_signature?: string;
}

// Paid media
export declare class PaidMediaInfo extends TelegramObject {
  star_count: number;
  paid_media: (PaidMediaPreview | PaidMediaPhoto | PaidMediaVideo | PaidMediaLivePhoto)[];
}
export declare class PaidMediaPreview extends TelegramObject {
  type_val: 'preview';
  width?: number;
  height?: number;
  duration?: number;
}
export declare class PaidMediaPhoto extends TelegramObject {
  type_val: 'photo';
  photo: PhotoSize[];
}
export declare class PaidMediaVideo extends TelegramObject {
  type_val: 'video';
  video: Video;
}
export declare class PaidMediaLivePhoto extends TelegramObject {}
export declare class PaidMediaPurchased extends TelegramObject {
  from_user: User;
  paid_media_payload: string;
}

// Poll
export declare class PollMedia extends TelegramObject {}
export declare class PollOptionAdded extends TelegramObject {}
export declare class PollOptionDeleted extends TelegramObject {}
export declare class InputPollOption extends TelegramObject {
  text: string;
  text_parse_mode?: string;
  text_entities?: MessageEntity[];
}

// Location
export declare class LocationAddress extends TelegramObject {}
export declare class ProximityAlertTriggered extends TelegramObject {
  traveler: User;
  watcher: User;
  distance: number;
}
export declare class MessageAutoDeleteTimerChanged extends TelegramObject {
  message_auto_delete_time: number;
}
export declare class ChatBoostAdded extends TelegramObject {
  boost_count: number;
}

// Forum
export declare class ForumTopicCreated extends TelegramObject {
  name: string;
  icon_color: number;
  icon_custom_emoji_id?: string;
}
export declare class ForumTopicClosed extends TelegramObject {}
export declare class ForumTopicEdited extends TelegramObject {
  name?: string;
  icon_custom_emoji_id?: string;
}
export declare class ForumTopicReopened extends TelegramObject {}
export declare class GeneralForumTopicHidden extends TelegramObject {}
export declare class GeneralForumTopicUnhidden extends TelegramObject {}

// Shared
export declare class SharedUser extends TelegramObject {
  user_id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo?: PhotoSize[];
}
export declare class UsersShared extends TelegramObject {
  request_id: number;
  users: SharedUser[];
}
export declare class ChatShared extends TelegramObject {
  request_id: number;
  chat_id: number;
  title?: string;
  username?: string;
  photo?: PhotoSize[];
}
export declare class WriteAccessAllowed extends TelegramObject {
  from_request?: boolean;
  web_app_name?: string;
  from_attachment_menu?: boolean;
}

// Video chat
export declare class VideoChatScheduled extends TelegramObject {
  start_date: number;
}
export declare class VideoChatStarted extends TelegramObject {}
export declare class VideoChatEnded extends TelegramObject {
  duration: number;
}
export declare class VideoChatParticipantsInvited extends TelegramObject {
  users: User[];
}

// Giveaway
export declare class GiveawayCreated extends TelegramObject {}
export declare class Giveaway extends TelegramObject {
  chats: Chat[];
  winners_selection_date: number;
  winner_count: number;
  only_new_members?: boolean;
  has_public_winners?: boolean;
  prize_description?: string;
  country_codes?: string[];
  prize_star_count?: number;
  premium_subscription_month_count?: number;
}
export declare class GiveawayWinners extends TelegramObject {
  chat: Chat;
  giveaway_message_id: number;
  winners_selection_date: number;
  winner_count: number;
  winners: User[];
  additional_chat_count?: number;
  prize_star_count?: number;
  premium_subscription_month_count?: number;
  unclaimed_prize_count?: number;
  only_new_members?: boolean;
  was_refunded?: boolean;
  prize_description?: string;
}
export declare class GiveawayCompleted extends TelegramObject {
  winner_count: number;
  unclaimed_prize_count?: number;
  giveaway_message?: Message;
  is_star_giveaway?: boolean;
}

// User profile
export declare class UserProfileAudios extends TelegramObject {}
export declare class UserRating extends TelegramObject {}

// Keyboard button types
export declare class KeyboardButtonRequestUsers extends TelegramObject {
  request_id: number;
  user_is_bot?: boolean;
  user_is_premium?: boolean;
  max_quantity?: number;
  request_name?: boolean;
  request_username?: boolean;
  request_photo?: boolean;
}
export declare class KeyboardButtonRequestChat extends TelegramObject {
  request_id: number;
  chat_is_channel: boolean;
  chat_is_forum?: boolean;
  chat_has_username?: boolean;
  chat_is_created?: boolean;
  user_administrator_rights?: ChatAdministratorRights;
  bot_administrator_rights?: ChatAdministratorRights;
  bot_is_member?: boolean;
  request_title?: boolean;
  request_username?: boolean;
  request_photo?: boolean;
}
export declare class KeyboardButtonRequestManagedBot extends TelegramObject {}
export declare class KeyboardButtonPollType extends TelegramObject {
  type_val?: string;
}
export declare class CopyTextButton extends TelegramObject {
  text: string;
}

// Chat info types
export declare class ChatOwnerChanged extends TelegramObject {}
export declare class ChatOwnerLeft extends TelegramObject {}
export declare class Birthdate extends TelegramObject {
  day: number;
  month: number;
  year?: number;
}

// Business
export declare class BusinessIntro extends TelegramObject {
  title?: string;
  message?: string;
  sticker?: Sticker;
}
export declare class BusinessLocation extends TelegramObject {
  address: string;
  location?: Location;
}
export declare class BusinessOpeningHoursInterval extends TelegramObject {
  opening_minute: number;
  closing_minute: number;
}
export declare class BusinessOpeningHours extends TelegramObject {
  time_zone_name: string;
  opening_hours: BusinessOpeningHoursInterval[];
}
export declare class BusinessConnection extends TelegramObject {
  id: string;
  user: User;
  user_chat_id: number;
  date: number;
  can_reply: boolean;
  is_enabled: boolean;
}
export declare class BusinessMessagesDeleted extends TelegramObject {
  business_connection_id: string;
  chat: Chat;
  message_ids: number[];
}
export declare class BusinessBotRights extends TelegramObject {}
export declare class BotAccessSettings extends TelegramObject {}

// Gifts
export declare class Gift extends TelegramObject {
  id: string;
  sticker: Sticker;
  star_count: number;
  total_count?: number;
  remaining_count?: number;
}
export declare class GiftBackground extends TelegramObject {}
export declare class GiftInfo extends TelegramObject {}
export declare class Gifts extends TelegramObject {
  gifts: Gift[];
}
export declare class AcceptedGiftTypes extends TelegramObject {}
export declare class OwnedGiftRegular extends TelegramObject {}
export declare class OwnedGiftUnique extends TelegramObject {}
export declare class OwnedGifts extends TelegramObject {
  total_count: number;
  gifts: (OwnedGiftRegular | OwnedGiftUnique)[];
  next_offset?: string;
}

// Unique gift
export declare class UniqueGift extends TelegramObject {}
export declare class UniqueGiftModel extends TelegramObject {}
export declare class UniqueGiftSymbol extends TelegramObject {}
export declare class UniqueGiftBackdrop extends TelegramObject {}
export declare class UniqueGiftBackdropColors extends TelegramObject {}
export declare class UniqueGiftColors extends TelegramObject {}
export declare class UniqueGiftInfo extends TelegramObject {}

// Inline query result types
export declare class InlineQueryResultsButton extends TelegramObject {
  text: string;
  web_app?: WebAppInfo;
  start_parameter?: string;
}
export declare class InlineQueryResultArticle extends TelegramObject {}
export declare class InlineQueryResultPhoto extends TelegramObject {}
export declare class InlineQueryResultGif extends TelegramObject {}
export declare class InlineQueryResultMpeg4Gif extends TelegramObject {}
export declare class InlineQueryResultVideo extends TelegramObject {}
export declare class InlineQueryResultAudio extends TelegramObject {}
export declare class InlineQueryResultVoice extends TelegramObject {}
export declare class InlineQueryResultDocument extends TelegramObject {}
export declare class InlineQueryResultLocation extends TelegramObject {}
export declare class InlineQueryResultVenue extends TelegramObject {}
export declare class InlineQueryResultContact extends TelegramObject {}
export declare class InlineQueryResultGame extends TelegramObject {}
export declare class InlineQueryResultCachedPhoto extends TelegramObject {}
export declare class InlineQueryResultCachedGif extends TelegramObject {}
export declare class InlineQueryResultCachedMpeg4Gif extends TelegramObject {}
export declare class InlineQueryResultCachedSticker extends TelegramObject {}
export declare class InlineQueryResultCachedDocument extends TelegramObject {}
export declare class InlineQueryResultCachedVideo extends TelegramObject {}
export declare class InlineQueryResultCachedVoice extends TelegramObject {}
export declare class InlineQueryResultCachedAudio extends TelegramObject {}

// Input message content
export declare class InputTextMessageContent extends TelegramObject {}
export declare class InputLocationMessageContent extends TelegramObject {}
export declare class InputVenueMessageContent extends TelegramObject {}
export declare class InputContactMessageContent extends TelegramObject {}
export declare class InputInvoiceMessageContent extends TelegramObject {}

// Sent / Prepared
export declare class SentGuestMessage extends TelegramObject {}
export declare class PreparedInlineMessage extends TelegramObject {
  id: string;
  expiration_date: number;
}
export declare class PreparedKeyboardButton extends TelegramObject {}

// Payment
export declare class PaidMessagePriceChanged extends TelegramObject {}
export declare class DirectMessagePriceChanged extends TelegramObject {}
export declare class DirectMessagesTopic extends TelegramObject {}
export declare class StarAmount extends TelegramObject {
  amount: number;
  nanostar_amount?: number;
}
export declare class StarTransaction extends TelegramObject {
  id: string;
  amount: number;
  nanostar_amount?: number;
  date: number;
  source?: TransactionPartnerUser | TransactionPartnerChat | TransactionPartnerFragment | TransactionPartnerTelegramAds | TransactionPartnerTelegramApi | TransactionPartnerOther | TransactionPartnerAffiliateProgram;
  receiver?: TransactionPartnerUser | TransactionPartnerChat | TransactionPartnerFragment | TransactionPartnerTelegramAds | TransactionPartnerTelegramApi | TransactionPartnerOther | TransactionPartnerAffiliateProgram;
}
export declare class StarTransactions extends TelegramObject {
  transactions: StarTransaction[];
}

// Transaction partners
export declare class TransactionPartnerUser extends TelegramObject {
  type_val: 'user';
  user: User;
}
export declare class TransactionPartnerChat extends TelegramObject {
  type_val: 'chat';
  chat: Chat;
}
export declare class TransactionPartnerAffiliateProgram extends TelegramObject {}
export declare class TransactionPartnerFragment extends TelegramObject {
  type_val: 'fragment';
  withdrawal_state?: RevenueWithdrawalStatePending | RevenueWithdrawalStateSucceeded | RevenueWithdrawalStateFailed;
}
export declare class TransactionPartnerTelegramAds extends TelegramObject {
  type_val: 'telegram_ads';
}
export declare class TransactionPartnerTelegramApi extends TelegramObject {
  type_val: 'telegram_api';
  request_count: number;
}
export declare class TransactionPartnerOther extends TelegramObject {
  type_val: 'other';
}

// Revenue
export declare class RevenueWithdrawalStatePending extends TelegramObject {
  type_val: 'pending';
}
export declare class RevenueWithdrawalStateSucceeded extends TelegramObject {
  type_val: 'succeeded';
  date: number;
  url: string;
}
export declare class RevenueWithdrawalStateFailed extends TelegramObject {
  type_val: 'failed';
}
export declare class AffiliateInfo extends TelegramObject {}

// Passport
export declare class PassportData extends TelegramObject {
  data: EncryptedPassportElement[];
  credentials: EncryptedCredentials;
}
export declare class PassportFile extends TelegramObject {
  file_id: string;
  file_unique_id: string;
  file_size: number;
  file_date: number;
}
export declare class EncryptedPassportElement extends TelegramObject {
  type_val: string;
  data?: string;
  phone_number?: string;
  email?: string;
  files?: PassportFile[];
  front_side?: PassportFile;
  reverse_side?: PassportFile;
  selfie?: PassportFile;
  translation?: PassportFile[];
  hash: string;
}
export declare class EncryptedCredentials extends TelegramObject {
  data: string;
  hash: string;
  secret: string;
}
export declare class PassportElementErrorDataField extends TelegramObject {}
export declare class PassportElementErrorFrontSide extends TelegramObject {}
export declare class PassportElementErrorReverseSide extends TelegramObject {}
export declare class PassportElementErrorSelfie extends TelegramObject {}
export declare class PassportElementErrorFile extends TelegramObject {}
export declare class PassportElementErrorFiles extends TelegramObject {}
export declare class PassportElementErrorTranslationFile extends TelegramObject {}
export declare class PassportElementErrorTranslationFiles extends TelegramObject {}
export declare class PassportElementErrorUnspecified extends TelegramObject {}

// Story
export declare class Story extends TelegramObject {
  chat: Chat;
  id: number;
}
export declare class StoryArea extends TelegramObject {
  position: StoryAreaPosition;
  type_val: StoryAreaTypeLocation | StoryAreaTypeLink | StoryAreaTypeSuggestedReaction | StoryAreaTypeWeather | StoryAreaTypeUniqueGift;
}
export declare class StoryAreaPosition extends TelegramObject {
  x_percentage: number;
  y_percentage: number;
  width_percentage: number;
  height_percentage: number;
  rotation_angle: number;
}
export declare class StoryAreaTypeLocation extends TelegramObject {}
export declare class StoryAreaTypeLink extends TelegramObject {}
export declare class StoryAreaTypeSuggestedReaction extends TelegramObject {}
export declare class StoryAreaTypeWeather extends TelegramObject {}
export declare class StoryAreaTypeUniqueGift extends TelegramObject {}
export declare class InputStoryContentPhoto extends TelegramObject {}
export declare class InputStoryContentVideo extends TelegramObject {}

// Checklist
export declare class Checklist extends TelegramObject {
  title: string;
  tasks: ChecklistTask[];
}
export declare class ChecklistTask extends TelegramObject {
  id: number;
  text: string;
  is_completed: boolean;
}
export declare class InputChecklist extends TelegramObject {
  title: string;
  tasks: InputChecklistTask[];
}
export declare class InputChecklistTask extends TelegramObject {
  text: string;
}
export declare class ChecklistTasksDone extends TelegramObject {}
export declare class ChecklistTasksAdded extends TelegramObject {}

// LivePhoto
export declare class LivePhoto extends TelegramObject {}

// Input media
export declare class InputMediaPhoto extends TelegramObject {
  type_val: 'photo';
  media: string;
  caption?: string;
  parse_mode?: string;
  caption_entities?: MessageEntity[];
  show_caption_above_media?: boolean;
  has_spoiler?: boolean;
}
export declare class InputMediaVideo extends TelegramObject {
  type_val: 'video';
  media: string;
  thumbnail?: FileSource;
  caption?: string;
  parse_mode?: string;
  caption_entities?: MessageEntity[];
  show_caption_above_media?: boolean;
  width?: number;
  height?: number;
  duration?: number;
  supports_streaming?: boolean;
  has_spoiler?: boolean;
}
export declare class InputMediaAnimation extends TelegramObject {
  type_val: 'animation';
  media: string;
  thumbnail?: FileSource;
  caption?: string;
  parse_mode?: string;
  caption_entities?: MessageEntity[];
  show_caption_above_media?: boolean;
  width?: number;
  height?: number;
  duration?: number;
  has_spoiler?: boolean;
}
export declare class InputMediaAudio extends TelegramObject {
  type_val: 'audio';
  media: string;
  thumbnail?: FileSource;
  caption?: string;
  parse_mode?: string;
  caption_entities?: MessageEntity[];
  duration?: number;
  performer?: string;
  title?: string;
}
export declare class InputMediaDocument extends TelegramObject {
  type_val: 'document';
  media: string;
  thumbnail?: FileSource;
  caption?: string;
  parse_mode?: string;
  caption_entities?: MessageEntity[];
  disable_content_type_detection?: boolean;
}
export declare class InputMediaLivePhoto extends TelegramObject {}
export declare class InputMediaLocation extends TelegramObject {}
export declare class InputMediaVenue extends TelegramObject {}
export declare class InputMediaSticker extends TelegramObject {}

// Input paid media
export declare class InputPaidMediaPhoto extends TelegramObject {
  type_val: 'photo';
  media: string;
}
export declare class InputPaidMediaVideo extends TelegramObject {
  type_val: 'video';
  media: string;
  thumbnail?: FileSource;
  width?: number;
  height?: number;
  duration?: number;
  supports_streaming?: boolean;
}
export declare class InputPaidMediaLivePhoto extends TelegramObject {}

// Profile photo inputs
export declare class InputProfilePhotoStatic extends TelegramObject {}
export declare class InputProfilePhotoAnimated extends TelegramObject {}

// Bot command scope
export declare class BotCommandScopeDefault extends TelegramObject {
  type_val: 'default';
}
export declare class BotCommandScopeAllPrivateChats extends TelegramObject {
  type_val: 'all_private_chats';
}
export declare class BotCommandScopeAllGroupChats extends TelegramObject {
  type_val: 'all_group_chats';
}
export declare class BotCommandScopeAllChatAdministrators extends TelegramObject {
  type_val: 'all_chat_administrators';
}
export declare class BotCommandScopeChat extends TelegramObject {
  type_val: 'chat';
  chat_id: number | string;
}
export declare class BotCommandScopeChatAdministrators extends TelegramObject {
  type_val: 'chat_administrators';
  chat_id: number | string;
}
export declare class BotCommandScopeChatMember extends TelegramObject {
  type_val: 'chat_member';
  chat_id: number | string;
  user_id: number;
}

// Menu buttons
export declare class MenuButtonCommands extends TelegramObject {
  type_val: 'commands';
}
export declare class MenuButtonWebApp extends TelegramObject {
  type_val: 'web_app';
  text: string;
  web_app: WebAppInfo;
}
export declare class MenuButtonDefault extends TelegramObject {
  type_val: 'default';
}

// Chat boost
export declare class ChatBoostSourcePremium extends TelegramObject {
  source: 'premium';
  user: User;
}
export declare class ChatBoostSourceGiftCode extends TelegramObject {
  source: 'gift_code';
  user: User;
}
export declare class ChatBoostSourceGiveaway extends TelegramObject {
  source: 'giveaway';
  giveaway_message_id: number;
  user?: User;
  prize_star_count?: number;
  is_unclaimed?: boolean;
}
export declare class ChatBoost extends TelegramObject {
  boost_id: string;
  add_date: number;
  expiration_date: number;
  source: ChatBoostSourcePremium | ChatBoostSourceGiftCode | ChatBoostSourceGiveaway;
}
export declare class ChatBoostUpdated extends TelegramObject {
  chat: Chat;
  boost: ChatBoost;
}
export declare class ChatBoostRemoved extends TelegramObject {
  chat: Chat;
  boost_id: string;
  remove_date: number;
  source: ChatBoostSourcePremium | ChatBoostSourceGiftCode | ChatBoostSourceGiveaway;
}

// Background
export declare class ChatBackground extends TelegramObject {}
export declare class BackgroundTypeFill extends TelegramObject {}
export declare class BackgroundTypeWallpaper extends TelegramObject {}
export declare class BackgroundTypePattern extends TelegramObject {}
export declare class BackgroundTypeChatTheme extends TelegramObject {}
export declare class BackgroundFillSolid extends TelegramObject {}
export declare class BackgroundFillGradient extends TelegramObject {}
export declare class BackgroundFillFreeformGradient extends TelegramObject {}

// Managed bots
export declare class ManagedBotCreated extends TelegramObject {}
export declare class ManagedBotUpdated extends TelegramObject {}

// Suggested posts
export declare class SuggestedPostInfo extends TelegramObject {}
export declare class SuggestedPostParameters extends TelegramObject {}
export declare class SuggestedPostPrice extends TelegramObject {}
export declare class SuggestedPostApproved extends TelegramObject {}
export declare class SuggestedPostDeclined extends TelegramObject {}
export declare class SuggestedPostPaid extends TelegramObject {}
export declare class SuggestedPostRefunded extends TelegramObject {}
export declare class SuggestedPostApprovalFailed extends TelegramObject {}

// Reactions
export declare class ReactionTypeEmoji extends TelegramObject {
  type_val: 'emoji';
  emoji: string;
}
export declare class ReactionTypeCustomEmoji extends TelegramObject {
  type_val: 'custom_emoji';
  custom_emoji_id: string;
}
export declare class ReactionTypePaid extends TelegramObject {
  type_val: 'paid';
}
export declare class ReactionCount extends TelegramObject {
  type_val: ReactionTypeEmoji | ReactionTypeCustomEmoji | ReactionTypePaid;
  total_count: number;
}
export declare class MessageReactionUpdated extends TelegramObject {
  chat: Chat;
  message_id: number;
  user?: User;
  actor_chat?: Chat;
  date: number;
  old_reaction: (ReactionTypeEmoji | ReactionTypeCustomEmoji | ReactionTypePaid)[];
  new_reaction: (ReactionTypeEmoji | ReactionTypeCustomEmoji | ReactionTypePaid)[];
}
export declare class MessageReactionCountUpdated extends TelegramObject {
  chat: Chat;
  message_id: number;
  date: number;
  reactions: ReactionCount[];
}

// Misc
export declare class VideoQuality extends TelegramObject {}

// ============================================================================
// TYPE_REGISTRY and createType
// ============================================================================

export declare const TYPE_REGISTRY: Record<string, typeof TelegramObject>;
export declare function createType(typeName: string, data: Record<string, any>): TelegramObject | Record<string, any>;
