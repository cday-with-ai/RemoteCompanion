import React from 'react';
import { StyleSheet, Pressable, View as RNView } from 'react-native';
import { Text } from '@/components/Themed';
import type { ConnectionMode } from '../../types';

const MODE_CONFIG: Record<ConnectionMode, { color: string; label: string }> = {
  home: { color: '#34c759', label: 'Home' },
  local: { color: '#007aff', label: 'Local' },
  offline: { color: '#ff3b30', label: 'Offline' },
};

interface Props {
  mode: ConnectionMode;
  isChecking: boolean;
  onPress: () => void;
}

export default function ConnectionBadge({ mode, isChecking, onPress }: Props) {
  const config = MODE_CONFIG[mode];

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <RNView style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={styles.label}>
        {isChecking ? 'Checking...' : config.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
});
