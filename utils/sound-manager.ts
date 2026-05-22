/**
 * SoundManager — lightweight wrapper around expo-av Audio.
 *
 * Usage:
 *   await SoundManager.play('tap');
 *   await SoundManager.play('bookingSuccess');
 *   SoundManager.preloadAll(); // call once on app mount
 *
 * Sound files live in assets/sounds/ and must be added before use.
 * Missing files are silently ignored so the app never crashes on audio.
 */

import { Audio } from 'expo-av';
import { Platform } from 'react-native';

export type SoundKey =
  | 'tap'
  | 'messageSent'
  | 'bookingSuccess'
  | 'bookingCancel'
  | 'loginSuccess'
  | 'notification'
  | 'heartToggle'
  | 'pullRefresh'
  | 'slideChange'
  | 'tabSwitch'
  | 'error';

// Map keys to asset paths — add .mp3 files to assets/sounds/ when available
const SOUND_MAP: Partial<Record<SoundKey, any>> = {
  tap: require('@/assets/sounds/tap.mp3'),
  // messageSent: require('@/assets/sounds/message-sent.mp3'),
  bookingSuccess: require('@/assets/sounds/booking-success.mp3'),
  // bookingCancel: require('@/assets/sounds/booking-cancel.mp3'),
  loginSuccess: require('@/assets/sounds/login-success.mp3'),
  notification: require('@/assets/sounds/notification.mp3'),
  heartToggle: require('@/assets/sounds/heart.mp3'),
  pullRefresh: require('@/assets/sounds/pull-refresh.mp3'),
  slideChange: require('@/assets/sounds/slide-change.mp3'),
  tabSwitch: require('@/assets/sounds/tab-switch.mp3'),
  // error: require('@/assets/sounds/error.mp3'),
};

const loadedSounds: Partial<Record<SoundKey, Audio.Sound>> = {};
let audioModeSet = false;

async function ensureAudioMode() {
  if (audioModeSet || Platform.OS === 'web') return;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: false, // respect silent switch — sounds are ambient, not critical
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
    });
    audioModeSet = true;
  } catch {
    // Silently fail — audio is a nice-to-have
  }
}

async function loadSound(key: SoundKey): Promise<Audio.Sound | null> {
  const asset = SOUND_MAP[key];
  if (!asset) return null;

  try {
    const { sound } = await Audio.Sound.createAsync(asset, { volume: 0.5 });
    loadedSounds[key] = sound;
    return sound;
  } catch {
    return null;
  }
}

export const SoundManager = {
  /**
   * Preload all mapped sounds. Call once on app startup (after auth hydrates).
   * Safe to call multiple times — skips already-loaded sounds.
   */
  async preloadAll() {
    if (Platform.OS === 'web') return;
    await ensureAudioMode();
    const keys = Object.keys(SOUND_MAP) as SoundKey[];
    await Promise.allSettled(
      keys
        .filter((k) => !loadedSounds[k])
        .map((k) => loadSound(k))
    );
  },

  /**
   * Play a sound by key. Silently no-ops if file is not mapped/loaded.
   */
  async play(key: SoundKey) {
    if (Platform.OS === 'web') return;

    try {
      let sound = loadedSounds[key];
      if (!sound) {
        sound = (await loadSound(key)) ?? undefined;
      }
      if (!sound) return;

      // Rewind and play
      await sound.setPositionAsync(0);
      await sound.playAsync();
    } catch {
      // Never throw — audio is optional
    }
  },

  /**
   * Unload all sounds. Call on app unmount / logout.
   */
  async unloadAll() {
    await Promise.allSettled(
      (Object.values(loadedSounds) as Audio.Sound[]).map((s) => s.unloadAsync())
    );
    Object.keys(loadedSounds).forEach((k) => delete loadedSounds[k as SoundKey]);
  },
};
