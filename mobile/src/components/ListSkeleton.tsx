import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function ListSkeleton({ rows = 8, height = 48 }: { rows?: number; height?: number }) {
  return (
    <View style={styles.container}>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={[styles.skeletonRow, { height }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 8,
  },
  skeletonRow: {
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    marginBottom: 12,
    width: '100%',
    opacity: 0.6,
  },
});
