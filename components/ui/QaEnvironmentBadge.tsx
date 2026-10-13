import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { isCoreQaEnvironment } from '@/utils/qa-env';

export const QaEnvironmentBadge: React.FC = () => {
  if (!isCoreQaEnvironment()) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="none" testID="qa-environment-badge">
      <View style={styles.badge}>
        <Text style={styles.badgeText}>CORE QA</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 48 : 12,
    right: 12,
    zIndex: 99999,
  },
  badge: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 5,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
