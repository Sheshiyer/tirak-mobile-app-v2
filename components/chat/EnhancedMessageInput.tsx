import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { 
  Send, 
} from 'lucide-react-native';
import { designTokens } from '@/constants/design-tokens';

interface EnhancedMessageInputProps {
  message: string;
  onMessageChange: (text: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

export const EnhancedMessageInput: React.FC<EnhancedMessageInputProps> = ({
  message,
  onMessageChange,
  onSend,
  disabled = false,
}) => {
  const [inputHeight, setInputHeight] = useState(40);

  const canSend = message.trim().length > 0 && !disabled;

  return (
    <View style={styles.container}>
      {/* Main Input Container */}
      <View style={styles.inputContainer}>
        {/* Text Input */}
        <View style={styles.textInputContainer}>
          <TextInput
            style={[styles.textInput, { height: Math.max(40, inputHeight) }]}
            placeholder="Type a message..."
            placeholderTextColor={designTokens.colors.semantic.textSecondary}
            value={message}
            onChangeText={onMessageChange}
            multiline
            maxLength={1000}
            onContentSizeChange={(event) => {
              setInputHeight(event.nativeEvent.contentSize.height);
            }}
            editable={!disabled}
          />
        </View>

        {/* Right Actions */}
        <View style={styles.rightActions}>
          <TouchableOpacity
            style={[
              styles.sendButton,
              canSend ? styles.sendButtonActive : styles.sendButtonDisabled,
            ]}
            onPress={onSend}
            disabled={!canSend}
            activeOpacity={0.8}
          >
            <Send size={20} color={
              canSend 
                ? designTokens.colors.components.button.text
                : designTokens.colors.semantic.textSecondary
            } />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: designTokens.colors.semantic.surface,
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.semantic.border,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: designTokens.spacing.scale.md,
    paddingVertical: designTokens.spacing.scale.sm,
    gap: designTokens.spacing.scale.sm,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.scale.xs,
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: designTokens.colors.semantic.background,
    borderRadius: designTokens.borderRadius.lg,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.border,
    paddingHorizontal: designTokens.spacing.scale.md,
    paddingVertical: designTokens.spacing.scale.sm,
    maxHeight: 120,
  },
  textInput: {
    fontSize: designTokens.typography.sizes.small,
    color: designTokens.colors.semantic.text,
    textAlignVertical: 'top',
    ...Platform.select({
      ios: {
        paddingTop: 8,
        paddingBottom: 8,
      },
      android: {
        paddingTop: 4,
        paddingBottom: 4,
      },
    }),
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    ...designTokens.shadows.sm,
  },
  sendButtonActive: {
    backgroundColor: designTokens.colors.semantic.accent,
  },
  sendButtonDisabled: {
    backgroundColor: designTokens.colors.semantic.border,
  },
});
