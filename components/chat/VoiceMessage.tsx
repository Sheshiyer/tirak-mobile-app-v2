import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Play, Pause, Mic } from 'lucide-react-native';
import { designTokens } from '@/constants/design-tokens';

interface VoiceMessageProps {
  duration: number; // in seconds
  isUser: boolean;
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read';
  audioUrl?: string; // In a real app, this would be the audio file URL
  onPlay?: () => void;
  onPause?: () => void;
}

export const VoiceMessage: React.FC<VoiceMessageProps> = ({
  duration,
  isUser,
  timestamp,
  status,
  audioUrl,
  onPlay,
  onPause,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);
  
  // Animation values for waveform
  const waveAnimations = useRef(
    Array.from({ length: 20 }, () => new Animated.Value(0.3))
  ).current;
  
  // Animation for play button
  const playButtonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isPlaying) {
      startWaveAnimation();
      startProgressSimulation();
    } else {
      stopWaveAnimation();
    }
  }, [isPlaying]);

  const startWaveAnimation = () => {
    const animations = waveAnimations.map((anim, index) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: Math.random() * 0.8 + 0.2,
            duration: 300 + Math.random() * 200,
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: 0.3,
            duration: 300 + Math.random() * 200,
            useNativeDriver: false,
          }),
        ]),
        { iterations: -1 }
      );
    });

    Animated.stagger(50, animations).start();
  };

  const stopWaveAnimation = () => {
    waveAnimations.forEach(anim => {
      anim.stopAnimation();
      Animated.timing(anim, {
        toValue: 0.3,
        duration: 200,
        useNativeDriver: false,
      }).start();
    });
  };

  const startProgressSimulation = () => {
    // Simulate audio playback progress
    const interval = setInterval(() => {
      setCurrentTime(prev => {
        const newTime = prev + 0.1;
        const newProgress = newTime / duration;
        setProgress(newProgress);
        
        if (newTime >= duration) {
          setIsPlaying(false);
          setCurrentTime(0);
          setProgress(0);
          clearInterval(interval);
          return 0;
        }
        
        return newTime;
      });
    }, 100);

    return () => clearInterval(interval);
  };

  const handlePlayPause = () => {
    // Animate play button
    Animated.sequence([
      Animated.timing(playButtonScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(playButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (isPlaying) {
      setIsPlaying(false);
      onPause?.();
    } else {
      setIsPlaying(true);
      onPlay?.();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderWaveform = () => {
    return (
      <View style={styles.waveformContainer}>
        {waveAnimations.map((anim, index) => (
          <Animated.View
            key={index}
            style={[
              styles.waveBar,
              {
                height: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [4, 24],
                }),
                backgroundColor: isUser 
                  ? designTokens.colors.semantic.primaryContrast
                  : designTokens.colors.semantic.primary,
                opacity: index / waveAnimations.length < progress ? 1 : 0.4,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={[
      styles.container,
      isUser ? styles.userContainer : styles.companionContainer,
    ]}>
      <View style={[
        styles.voiceMessageBubble,
        isUser ? styles.userVoiceBubble : styles.companionVoiceBubble,
      ]}>
        <View style={styles.voiceContent}>
          {/* Mic Icon */}
          <View style={[
            styles.micIcon,
            isUser ? styles.userMicIcon : styles.companionMicIcon,
          ]}>
            <Mic size={16} color={
              isUser 
                ? designTokens.colors.semantic.primary
                : designTokens.colors.semantic.primaryContrast
            } />
          </View>

          {/* Play/Pause Button */}
          <Animated.View style={{ transform: [{ scale: playButtonScale }] }}>
            <TouchableOpacity
              style={[
                styles.playButton,
                isUser ? styles.userPlayButton : styles.companionPlayButton,
              ]}
              onPress={handlePlayPause}
              activeOpacity={0.8}
            >
              {isPlaying ? (
                <Pause size={20} color={
                  isUser 
                    ? designTokens.colors.semantic.primaryContrast
                    : designTokens.colors.semantic.primary
                } />
              ) : (
                <Play size={20} color={
                  isUser 
                    ? designTokens.colors.semantic.primaryContrast
                    : designTokens.colors.semantic.primary
                } />
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Waveform */}
          <View style={styles.waveformSection}>
            {renderWaveform()}
          </View>

          {/* Duration */}
          <Text style={[
            styles.duration,
            isUser ? styles.userDuration : styles.companionDuration,
          ]}>
            {isPlaying ? formatTime(currentTime) : formatTime(duration)}
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={[
          styles.progressBarContainer,
          isUser ? styles.userProgressBar : styles.companionProgressBar,
        ]}>
          <View 
            style={[
              styles.progressBar,
              { width: `${progress * 100}%` },
              isUser ? styles.userProgress : styles.companionProgress,
            ]} 
          />
        </View>
      </View>
      
      <View style={[
        styles.messageFooter,
        isUser ? styles.userMessageFooter : styles.companionMessageFooter,
      ]}>
        <Text style={styles.timestamp}>{timestamp}</Text>
        {isUser && status && (
          <View style={styles.statusContainer}>
            <Text style={styles.status}>
              {status === 'sent' ? '✓' : status === 'delivered' ? '✓✓' : '✓✓'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: designTokens.spacing.xs,
    maxWidth: '80%',
  },
  userContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  companionContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  voiceMessageBubble: {
    borderRadius: designTokens.borderRadius.lg,
    padding: designTokens.spacing.md,
    minWidth: 200,
    ...designTokens.shadows.sm,
  },
  userVoiceBubble: {
    backgroundColor: designTokens.colors.semantic.primary,
  },
  companionVoiceBubble: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.border,
  },
  voiceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.sm,
  },
  micIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMicIcon: {
    backgroundColor: designTokens.colors.semantic.primaryContrast + '20',
  },
  companionMicIcon: {
    backgroundColor: designTokens.colors.semantic.primary + '20',
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    ...designTokens.shadows.sm,
  },
  userPlayButton: {
    backgroundColor: designTokens.colors.semantic.primaryContrast,
  },
  companionPlayButton: {
    backgroundColor: designTokens.colors.semantic.primary,
  },
  waveformSection: {
    flex: 1,
    marginHorizontal: designTokens.spacing.sm,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 24,
    gap: 2,
  },
  waveBar: {
    width: 3,
    borderRadius: 1.5,
    minHeight: 4,
  },
  duration: {
    fontSize: designTokens.typography.sizes.sm,
    fontWeight: designTokens.typography.weights.medium,
    minWidth: 35,
    textAlign: 'right',
  },
  userDuration: {
    color: designTokens.colors.semantic.primaryContrast,
  },
  companionDuration: {
    color: designTokens.colors.semantic.text,
  },
  progressBarContainer: {
    height: 2,
    borderRadius: 1,
    marginTop: designTokens.spacing.sm,
    overflow: 'hidden',
  },
  userProgressBar: {
    backgroundColor: designTokens.colors.semantic.primaryContrast + '30',
  },
  companionProgressBar: {
    backgroundColor: designTokens.colors.semantic.border,
  },
  progressBar: {
    height: '100%',
    borderRadius: 1,
  },
  userProgress: {
    backgroundColor: designTokens.colors.semantic.primaryContrast,
  },
  companionProgress: {
    backgroundColor: designTokens.colors.semantic.primary,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: designTokens.spacing.xs,
    paddingHorizontal: designTokens.spacing.xs,
  },
  userMessageFooter: {
    justifyContent: 'flex-end',
  },
  companionMessageFooter: {
    justifyContent: 'flex-start',
  },
  timestamp: {
    fontSize: designTokens.typography.sizes.xs,
    color: designTokens.colors.semantic.textSecondary,
  },
  statusContainer: {
    marginLeft: designTokens.spacing.xs,
  },
  status: {
    fontSize: designTokens.typography.sizes.xs,
    color: designTokens.colors.semantic.accent,
  },
});
