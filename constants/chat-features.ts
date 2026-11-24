/**
 * Chat feature flags for the soft launch.
 *
 * Only text chat is backed by the API today. Image/photo attachments, voice
 * messages, calling and in-chat translation have no backend support yet, so
 * their controls stay hidden for both traveler and guide chat. The underlying
 * components are kept so these can be switched on once the backend ships.
 */
export const CHAT_FEATURES = Object.freeze({
  imageAttachments: false,
  voiceMessages: false,
  calls: false,
  translation: false,
  /** Settings sheet (mute/block/report/archive) whose actions are not wired yet. */
  conversationSettings: false,
});

export type ChatFeature = keyof typeof CHAT_FEATURES;

export const isChatFeatureEnabled = (feature: ChatFeature): boolean => CHAT_FEATURES[feature];
