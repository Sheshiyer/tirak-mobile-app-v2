import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Camera } from 'lucide-react-native';
import { designTokens } from '@/constants/design-tokens';

interface ImagePickerProps {
  images: string[];
  onImageAdd: () => void;
  onImageRemove: (index: number) => void;
  maxImages?: number;
  title?: string;
  placeholder?: string;
}

export const ImagePicker: React.FC<ImagePickerProps> = ({
  images,
  onImageAdd,
  onImageRemove,
  maxImages = 5,
  title = 'Photos',
  placeholder = 'Add photos to showcase your services',
}) => {
  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      
      <View style={styles.imagesContainer}>
        {images.map((image, index) => (
          <View key={index} style={styles.imageWrapper}>
            <Image source={{ uri: image }} style={styles.image} />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => onImageRemove(index)}
            >
              <Text style={styles.removeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
        
        {images.length < maxImages && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={onImageAdd}
          >
            <Camera size={24} color={designTokens.colors.semantic.primary} />
            <Text style={styles.addButtonText}>Add Photo</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {images.length === 0 && (
        <Text style={styles.placeholder}>{placeholder}</Text>
      )}
      
      <Text style={styles.info}>
        {images.length}/{maxImages} photos added
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: designTokens.colors.semantic.text,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  imageWrapper: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: designTokens.colors.semantic.surface,
  },
  addButtonText: {
    color: designTokens.colors.semantic.primary,
    marginTop: 4,
    fontSize: 12,
  },
  placeholder: {
    color: designTokens.colors.semantic.textSecondary,
    marginTop: 8,
    fontSize: 14,
  },
  info: {
    color: designTokens.colors.semantic.textSecondary,
    marginTop: 8,
    fontSize: 12,
  },
});