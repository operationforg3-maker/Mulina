import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';

export default function GlobalLoader({ visible, message }: { visible: boolean; message?: string }) {
  if (!visible) return null;
  return (
    <View style={styles.overlay}>
      <View style={styles.box}>
        <ActivityIndicator size="large" color="#6366f1" />
        {message && <Text style={styles.text}>{message}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  box: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
  },
});
