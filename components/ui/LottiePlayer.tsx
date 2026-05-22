/**
 * LottiePlayer — thin wrapper around lottie-react-native.
 *
 * Usage:
 *   <LottiePlayer name="bookingSuccess" autoPlay loop={false} style={{ width: 200, height: 200 }} />
 *
 * Animation JSON files live in assets/animations/.
 * Inline bundled fallbacks are provided for critical flows so the component
 * always renders something meaningful even if a file hasn't been added yet.
 */

import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import LottieView from 'lottie-react-native';

export type LottieKey =
  | 'bookingSuccess'
  | 'heartBurst'
  | 'loadingSpinner'
  | 'emptyState'
  | 'sendMessage';

// Minimal inline Lottie JSON for booking success checkmark
// Uses brand colors: #6C63FF (purple) and #FF2E63 (pink)
const BOOKING_SUCCESS_JSON = {
  v: '5.7.1',
  fr: 60,
  ip: 0,
  op: 90,
  w: 200,
  h: 200,
  nm: 'Booking Success',
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'Circle',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [0, 0, 100], e: [110, 110, 100], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } },
            { t: 30, s: [110, 110, 100], e: [100, 100, 100], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } },
            { t: 45, s: [100, 100, 100] },
          ],
        },
      },
      ao: 0,
      shapes: [
        {
          ty: 'gr',
          it: [
            { ty: 'el', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [140, 140] } },
            { ty: 'fl', c: { a: 0, k: [0.42, 0.39, 1, 1] }, o: { a: 0, k: 100 }, r: 1 },
          ],
          nm: 'Ellipse',
        },
      ],
      ip: 0,
      op: 90,
      st: 0,
      bm: 0,
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: 'Check',
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { t: 20, s: [0], e: [100], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } },
            { t: 40, s: [100] },
          ],
        },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: [
        {
          ty: 'gr',
          it: [
            {
              ty: 'sh',
              ks: {
                a: 0,
                k: {
                  i: [[0, 0], [0, 0], [0, 0]],
                  o: [[0, 0], [0, 0], [0, 0]],
                  v: [[-30, 0], [-8, 22], [35, -20]],
                  c: false,
                },
              },
            },
            { ty: 'st', c: { a: 0, k: [1, 1, 1, 1] }, o: { a: 0, k: 100 }, w: { a: 0, k: 8 }, lc: 2, lj: 2 },
          ],
          nm: 'Checkmark',
        },
      ],
      ip: 0,
      op: 90,
      st: 0,
      bm: 0,
    },
  ],
};

const HEART_BURST_JSON = {
  v: '5.7.1',
  fr: 60,
  ip: 0,
  op: 60,
  w: 100,
  h: 100,
  nm: 'Heart Burst',
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'Heart',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [50, 50, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [0, 0, 100], e: [130, 130, 100], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } },
            { t: 20, s: [130, 130, 100], e: [100, 100, 100], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } },
            { t: 35, s: [100, 100, 100] },
          ],
        },
      },
      ao: 0,
      shapes: [
        {
          ty: 'gr',
          it: [
            {
              ty: 'sh',
              ks: {
                a: 0,
                k: {
                  i: [[-11, -12], [0, 0], [11, -12], [11, 12], [0, 0], [-11, 12]],
                  o: [[0, 0], [11, -12], [11, 12], [0, 0], [-11, 12], [-11, -12]],
                  v: [[-20, -5], [0, -22], [20, -5], [20, 8], [0, 22], [-20, 8]],
                  c: true,
                },
              },
            },
            { ty: 'fl', c: { a: 0, k: [1, 0.18, 0.39, 1] }, o: { a: 0, k: 100 }, r: 1 },
          ],
          nm: 'Heart Shape',
        },
      ],
      ip: 0,
      op: 60,
      st: 0,
      bm: 0,
    },
  ],
};

const INLINE_ANIMATIONS: Partial<Record<LottieKey, object>> = {
  bookingSuccess: BOOKING_SUCCESS_JSON,
  heartBurst: HEART_BURST_JSON,
};

// External file map — add files to assets/animations/ then uncomment:
const FILE_MAP: Partial<Record<LottieKey, any>> = {
  // bookingSuccess: require('@/assets/animations/booking-success.json'),
  // heartBurst: require('@/assets/animations/heart-burst.json'),
  // loadingSpinner: require('@/assets/animations/loading-spinner.json'),
  // emptyState: require('@/assets/animations/empty-state.json'),
  // sendMessage: require('@/assets/animations/send-message.json'),
};

interface LottiePlayerProps {
  name: LottieKey;
  autoPlay?: boolean;
  loop?: boolean;
  style?: ViewStyle;
  speed?: number;
  onAnimationFinish?: () => void;
}

export const LottiePlayer: React.FC<LottiePlayerProps> = ({
  name,
  autoPlay = true,
  loop = false,
  style,
  speed = 1,
  onAnimationFinish,
}) => {
  const ref = useRef<LottieView>(null);

  useEffect(() => {
    if (autoPlay) {
      ref.current?.play();
    }
  }, [autoPlay]);

  const source = FILE_MAP[name] ?? INLINE_ANIMATIONS[name];
  if (!source) return null;

  return (
    <LottieView
      ref={ref}
      source={source as any}
      autoPlay={autoPlay}
      loop={loop}
      speed={speed}
      style={[styles.default, style]}
      onAnimationFinish={onAnimationFinish}
      resizeMode="contain"
    />
  );
};

const styles = StyleSheet.create({
  default: {
    width: 200,
    height: 200,
  },
});
