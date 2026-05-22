import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  Modal,
  StatusBar,
  SafeAreaView,
  Text,
  Animated
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { designTokens, componentTokens } from '@/constants/design-tokens';
import { X, ChevronLeft, ChevronRight, Camera } from 'lucide-react-native';

interface ImageCarouselProps {
  images: string[];
  height?: number;
  showDots?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  onImagePress?: (index: number) => void;
  style?: any;
  enableFullScreen?: boolean;
  initialIndex?: number;
  showImageCounter?: boolean;
  enableZoom?: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  height = 200,
  showDots = true,
  autoPlay = false,
  autoPlayInterval = 3000,
  onImagePress,
  style,
  enableFullScreen = true,
  initialIndex = 0,
  showImageCounter = true,
  enableZoom = true,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [fullScreenVisible, setFullScreenVisible] = useState(false);
  const [fullScreenIndex, setFullScreenIndex] = useState(initialIndex);
  const scrollViewRef = useRef<ScrollView>(null);
  const fullScreenScrollRef = useRef<ScrollView>(null);
  const scaleValue = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (autoPlay && images.length > 1 && !fullScreenVisible) {
      const interval = setInterval(() => {
        const nextIndex = (currentIndex + 1) % images.length;
        scrollViewRef.current?.scrollTo({
          x: nextIndex * screenWidth,
          animated: true,
        });
        setCurrentIndex(nextIndex);
      }, autoPlayInterval);

      return () => clearInterval(interval);
    }
  }, [autoPlay, autoPlayInterval, currentIndex, images.length, fullScreenVisible]);

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / screenWidth);
    setCurrentIndex(index);
  };

  const handleFullScreenScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / screenWidth);
    setFullScreenIndex(index);
  };

  const handleImagePress = (index: number) => {
    if (enableFullScreen) {
      setFullScreenIndex(index);
      setFullScreenVisible(true);
      // Scroll to the selected image in full screen
      setTimeout(() => {
        fullScreenScrollRef.current?.scrollTo({
          x: index * screenWidth,
          animated: false,
        });
      }, 100);
    }
    onImagePress?.(index);
  };

  const closeFullScreen = () => {
    setFullScreenVisible(false);
    // Reset zoom and position
    Animated.parallel([
      Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }),
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
    ]).start();
  };

  const navigateFullScreen = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev'
      ? (fullScreenIndex - 1 + images.length) % images.length
      : (fullScreenIndex + 1) % images.length;

    setFullScreenIndex(newIndex);
    fullScreenScrollRef.current?.scrollTo({
      x: newIndex * screenWidth,
      animated: true,
    });
  };

  const validImages = images.filter(img => img && typeof img === 'string' && img.trim() !== '');

  if (validImages.length === 0) {
    return (
      <View style={[styles.container, { height }, style]}>
        <LinearGradient
          colors={['#A85CF9', '#FFBAA0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.placeholder}
        >
          <Camera size={40} color="rgba(255,255,255,0.7)" />
          <Text style={styles.placeholderText}>No photos yet</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <>
      <View style={[styles.container, { height }, style]}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.scrollView}
        >
          {validImages.map((image, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.imageContainer, { width: screenWidth }]}
              onPress={() => handleImagePress(index)}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: image }}
                style={styles.image}
                contentFit="cover"
                transition={200}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {showDots && validImages.length > 1 && (
          <View style={styles.dotsContainer}>
            {validImages.map((_, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dot,
                  index === currentIndex ? styles.dotActive : styles.dotInactive,
                ]}
                onPress={() => {
                  setCurrentIndex(index);
                  scrollViewRef.current?.scrollTo({
                    x: index * screenWidth,
                    animated: true,
                  });
                }}
                activeOpacity={0.7}
              />
            ))}
          </View>
        )}

        {showImageCounter && validImages.length > 1 && (
          <View style={styles.counterContainer}>
            <Text style={styles.counterText}>
              {currentIndex + 1} / {validImages.length}
            </Text>
          </View>
        )}
      </View>

      {/* Full Screen Modal */}
      <Modal
        visible={fullScreenVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeFullScreen}
        statusBarTranslucent={true}
      >
        <StatusBar hidden={true} />
        <SafeAreaView style={styles.fullScreenContainer}>
          {/* Header */}
          <View style={styles.fullScreenHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeFullScreen}
              activeOpacity={0.7}
            >
              <X size={24} color={designTokens.colors.semantic.surface} />
            </TouchableOpacity>

            {showImageCounter && (
              <Text style={styles.fullScreenCounter}>
                {fullScreenIndex + 1} / {validImages.length}
              </Text>
            )}
          </View>

          {/* Image Gallery */}
          <View style={styles.fullScreenContent}>
            <ScrollView
              ref={fullScreenScrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleFullScreenScroll}
              scrollEventThrottle={16}
              style={styles.fullScreenScrollView}
            >
              {validImages.map((image, index) => (
                <View key={index} style={styles.fullScreenImageContainer}>
                  <Animated.View
                    style={[
                      styles.zoomContainer,
                      {
                        transform: [
                          { scale: scaleValue },
                          { translateX: translateX },
                          { translateY: translateY },
                        ],
                      },
                    ]}
                  >
                    <Image
                      source={{ uri: image }}
                      style={styles.fullScreenImage}
                      contentFit="contain"
                      transition={200}
                    />
                  </Animated.View>
                </View>
              ))}
            </ScrollView>

            {/* Navigation Arrows */}
            {validImages.length > 1 && (
              <>
                <TouchableOpacity
                  style={[styles.navButton, styles.navButtonLeft]}
                  onPress={() => navigateFullScreen('prev')}
                  activeOpacity={0.7}
                >
                  <ChevronLeft size={32} color={designTokens.colors.semantic.surface} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.navButton, styles.navButtonRight]}
                  onPress={() => navigateFullScreen('next')}
                  activeOpacity={0.7}
                >
                  <ChevronRight size={32} color={designTokens.colors.semantic.surface} />
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Bottom Dots */}
          {showDots && validImages.length > 1 && (
            <View style={styles.fullScreenDotsContainer}>
              {validImages.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.fullScreenDot,
                    index === fullScreenIndex ? styles.fullScreenDotActive : styles.fullScreenDotInactive,
                  ]}
                  onPress={() => {
                    setFullScreenIndex(index);
                    fullScreenScrollRef.current?.scrollTo({
                      x: index * screenWidth,
                      animated: true,
                    });
                  }}
                  activeOpacity={0.7}
                />
              ))}
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    backgroundColor: designTokens.colors.semantic.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 8,
    fontWeight: '500',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: designTokens.spacing.scale.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: designTokens.spacing.scale.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: designTokens.borderRadius.full,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  dotActive: {
    backgroundColor: designTokens.colors.semantic.accent,
    borderColor: designTokens.colors.semantic.accent,
  },
  dotInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  counterContainer: {
    position: 'absolute',
    bottom: designTokens.spacing.scale['2xl'],
    right: designTokens.spacing.scale.md,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: designTokens.spacing.scale.sm,
    paddingVertical: 4,
    borderRadius: designTokens.borderRadius.components.button,
  },
  counterText: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.surface,
    fontWeight: '600',
  },

  // Full Screen Styles
  fullScreenContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  fullScreenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: designTokens.spacing.scale.lg,
    paddingVertical: designTokens.spacing.scale.md,
    zIndex: 10,
    marginTop: designTokens.spacing.scale.md,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenCounter: {
    ...designTokens.typography.styles.body,
    color: designTokens.colors.semantic.surface,
    fontWeight: '600',
  },
  fullScreenContent: {
    flex: 1,
    position: 'relative',
  },
  fullScreenScrollView: {
    flex: 1,
  },
  fullScreenImageContainer: {
    width: screenWidth,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomContainer: {
    width: screenWidth,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: screenWidth,
    height: '100%',
    maxHeight: screenHeight * 0.8,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -25,
    zIndex: 10,
  },
  navButtonLeft: {
    left: designTokens.spacing.scale.lg,
  },
  navButtonRight: {
    right: designTokens.spacing.scale.lg,
  },
  fullScreenDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: designTokens.spacing.scale.lg,
    gap: designTokens.spacing.scale.sm,
  },
  fullScreenDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  fullScreenDotActive: {
    backgroundColor: designTokens.colors.semantic.accent,
    borderColor: designTokens.colors.semantic.accent,
  },
  fullScreenDotInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
});