import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { ProfileImage } from '@/components/ui/ProfileImage';
import { designTokens } from '@/constants/design-tokens';

export function ChatPeerHeader({ name, image, onBack }: { name: string; image: string; onBack: () => void }) {
  return <View style={styles.header}>
    <TouchableOpacity style={styles.back} onPress={onBack} accessibilityRole="button" accessibilityLabel="Go back">
      <ArrowLeft size={24} color={designTokens.colors.semantic.text} />
    </TouchableOpacity>
    <View style={styles.peer}>
      <ProfileImage uri={image} size="small" />
      <View style={styles.nameContainer}><Text numberOfLines={1} ellipsizeMode="tail" style={styles.name}>{name}</Text></View>
    </View>
  </View>;
}
const styles = StyleSheet.create({
  header: { width: '100%', minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 16, backgroundColor: designTokens.colors.semantic.surface, borderBottomWidth: 1, borderBottomColor: designTokens.colors.semantic.border },
  back: { width: 44, height: 44, flexShrink: 0, borderRadius: 22, justifyContent: 'center', alignItems: 'center', backgroundColor: designTokens.colors.semantic.background },
  peer: { flex: 1, minWidth: 0, flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  nameContainer: { flex: 1, minWidth: 0, flexShrink: 1 },
  name: { fontSize: 16, fontWeight: '600', color: designTokens.colors.semantic.text },
});
