import { logger } from '@/utils/logger';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Image } from 'expo-image';
import { X, Download, Share, Eye } from 'lucide-react-native';
import { designTokens } from '@/constants/design-tokens';

interface ImageMessageProps {
  images: string[];
  isUser: boolean;
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read';
  onImagePress?: (index: number) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const imageSize = screenWidth * 0.6; // 60% of screen width

export const ImageMessage: React.FC<ImageMessageProps> = ({
  images,
  isUser,
  timestamp,
  status,
  onImagePress,
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [galleryVisible, setGalleryVisible] = useState(false);

  const handleImagePress = (index: number) => {
    setSelectedImageIndex(index);
    setGalleryVisible(true);
    onImagePress?.(index);
  };

  const handleCloseGallery = () => {
    setGalleryVisible(false);
    setSelectedImageIndex(null);
  };

  const handleDownload = () => {
    // In a real app, this would download the image
    logger.log('Download image:', images[selectedImageIndex || 0]);
  };

  const handleShare = () => {
    // In a real app, this would share the image
    logger.log('Share image:', images[selectedImageIndex || 0]);
  };

  const renderImageGrid = () => {
    if (images.length === 1) {
      return (
        <TouchableOpacity
          style={styles.singleImageContainer}
          onPress={() => handleImagePress(0)}
          activeOpacity={0.8}
        >
          <Image
            source={{ uri: images[0] }}
            style={styles.singleImage}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.imageOverlay}>
            <Eye size={20} color="white" />
          </View>
        </TouchableOpacity>
      );
    }

    if (images.length === 2) {
      return (
        <View style={styles.twoImageContainer}>
          {images.map((image, index) => (
            <TouchableOpacity
              key={index}
              style={styles.halfImageContainer}
              onPress={() => handleImagePress(index)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: image }}
                style={styles.halfImage}
                contentFit="cover"
                transition={200}
              />
              <View style={styles.imageOverlay}>
                <Eye size={16} color="white" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    if (images.length === 3) {
      return (
        <View style={styles.threeImageContainer}>
          <TouchableOpacity
            style={styles.largeImageContainer}
            onPress={() => handleImagePress(0)}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: images[0] }}
              style={styles.largeImage}
              contentFit="cover"
              transition={200}
            />
            <View style={styles.imageOverlay}>
              <Eye size={16} color="white" />
            </View>
          </TouchableOpacity>
          <View style={styles.smallImagesContainer}>
            {images.slice(1).map((image, index) => (
              <TouchableOpacity
                key={index + 1}
                style={styles.smallImageContainer}
                onPress={() => handleImagePress(index + 1)}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: image }}
                  style={styles.smallImage}
                  contentFit="cover"
                  transition={200}
                />
                <View style={styles.imageOverlay}>
                  <Eye size={14} color="white" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }

    // 4+ images
    return (
      <View style={styles.gridContainer}>
        {images.slice(0, 3).map((image, index) => (
          <TouchableOpacity
            key={index}
            style={styles.gridImageContainer}
            onPress={() => handleImagePress(index)}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: image }}
              style={styles.gridImage}
              contentFit="cover"
              transition={200}
            />
            <View style={styles.imageOverlay}>
              <Eye size={14} color="white" />
            </View>
          </TouchableOpacity>
        ))}
        {images.length > 3 && (
          <TouchableOpacity
            style={[styles.gridImageContainer, styles.moreImagesContainer]}
            onPress={() => handleImagePress(3)}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: images[3] }}
              style={styles.gridImage}
              contentFit="cover"
              transition={200}
            />
            <View style={styles.moreImagesOverlay}>
              <Text style={styles.moreImagesText}>+{images.length - 3}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <>
      <View style={[
        styles.container,
        isUser ? styles.userContainer : styles.companionContainer,
      ]}>
        <View style={[
          styles.imageMessageBubble,
          isUser ? styles.userImageBubble : styles.companionImageBubble,
        ]}>
          {renderImageGrid()}
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

      {/* Full Screen Gallery Modal */}
      <Modal
        visible={galleryVisible}
        transparent={false}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleCloseGallery}
      >
        <SafeAreaView style={styles.galleryContainer}>
          <View style={styles.galleryHeader}>
            <TouchableOpacity
              style={styles.galleryCloseButton}
              onPress={handleCloseGallery}
            >
              <X size={24} color="white" />
            </TouchableOpacity>
            
            <Text style={styles.galleryTitle}>
              {selectedImageIndex !== null ? `${selectedImageIndex + 1} of ${images.length}` : ''}
            </Text>
            
            <View style={styles.galleryActions}>
              <TouchableOpacity
                style={styles.galleryActionButton}
                onPress={handleShare}
              >
                <Share size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.galleryActionButton}
                onPress={handleDownload}
              >
                <Download size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
          
          {selectedImageIndex !== null && (
            <View style={styles.galleryImageContainer}>
              <Image
                source={{ uri: images[selectedImageIndex] }}
                style={styles.galleryImage}
                contentFit="contain"
                transition={200}
              />
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: designTokens.spacing.xs,
    maxWidth: imageSize + designTokens.spacing.md * 2,
  },
  userContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  companionContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  imageMessageBubble: {
    borderRadius: designTokens.borderRadius.lg,
    overflow: 'hidden',
    ...designTokens.shadows.sm,
  },
  userImageBubble: {
    backgroundColor: designTokens.colors.semantic.primary + '20',
  },
  companionImageBubble: {
    backgroundColor: designTokens.colors.semantic.surface,
  },
  singleImageContainer: {
    width: imageSize,
    height: imageSize * 0.75,
    position: 'relative',
  },
  singleImage: {
    width: '100%',
    height: '100%',
  },
  twoImageContainer: {
    flexDirection: 'row',
    width: imageSize,
    height: imageSize * 0.6,
  },
  halfImageContainer: {
    flex: 1,
    position: 'relative',
    marginRight: 2,
  },
  halfImage: {
    width: '100%',
    height: '100%',
  },
  threeImageContainer: {
    flexDirection: 'row',
    width: imageSize,
    height: imageSize * 0.6,
  },
  largeImageContainer: {
    flex: 2,
    position: 'relative',
    marginRight: 2,
  },
  largeImage: {
    width: '100%',
    height: '100%',
  },
  smallImagesContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  smallImageContainer: {
    height: '48%',
    position: 'relative',
  },
  smallImage: {
    width: '100%',
    height: '100%',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: imageSize,
    height: imageSize * 0.6,
  },
  gridImageContainer: {
    width: '48%',
    height: '48%',
    margin: '1%',
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  moreImagesContainer: {
    position: 'relative',
  },
  moreImagesOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreImagesText: {
    color: 'white',
    fontSize: designTokens.typography.sizes.lg,
    fontWeight: designTokens.typography.weights.bold,
  },
  imageOverlay: {
    position: 'absolute',
    top: designTokens.spacing.xs,
    right: designTokens.spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: designTokens.borderRadius.full,
    padding: designTokens.spacing.xs,
    opacity: 0.8,
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
  galleryContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  galleryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  galleryCloseButton: {
    padding: designTokens.spacing.sm,
  },
  galleryTitle: {
    color: 'white',
    fontSize: designTokens.typography.sizes.md,
    fontWeight: designTokens.typography.weights.medium,
  },
  galleryActions: {
    flexDirection: 'row',
    gap: designTokens.spacing.sm,
  },
  galleryActionButton: {
    padding: designTokens.spacing.sm,
  },
  galleryImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryImage: {
    width: screenWidth,
    height: screenHeight * 0.8,
  },
});
