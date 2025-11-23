import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface Pattern {
  id: string;
  name: string;
  thumbnail?: string;
  createdAt: string;
  stitchCount: number;
  colorCount: number;
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPatterns = async () => {
    // TODO: Fetch from Firestore when configured
    // For now, show example data
    setPatterns([
      {
        id: '1',
        name: 'Sample Pattern 1',
        createdAt: new Date().toISOString(),
        stitchCount: 5000,
        colorCount: 15,
      },
    ]);
  };

  useEffect(() => {
    fetchPatterns();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPatterns();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Mulina</Text>
          <Text style={styles.subtitle}>Hafty Cross-Stitch & Surface</Text>
        </View>

        {/* Upload Button */}
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => navigation.navigate('ImagePicker' as never)}
        >
          <Text style={styles.uploadIcon}>📸</Text>
          <View style={styles.uploadTextContainer}>
            <Text style={styles.uploadTitle}>Utwórz nowy wzór</Text>
            <Text style={styles.uploadSubtitle}>
              Wybierz zdjęcie z galerii lub zrób nowe
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('ApiTest' as never)}
          >
            <Text style={styles.actionIcon}>🧵</Text>
            <Text style={styles.actionLabel}>Nitki DMC</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => {
              // TODO: Navigate to inventory
            }}
          >
            <Text style={styles.actionIcon}>📦</Text>
            <Text style={styles.actionLabel}>Moje nitki</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => {
              // TODO: Navigate to settings
            }}
          >
            <Text style={styles.actionIcon}>⚙️</Text>
            <Text style={styles.actionLabel}>Ustawienia</Text>
          </TouchableOpacity>
        </View>

        {/* Patterns Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ostatnie wzory</Text>

          {patterns.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🎨</Text>
              <Text style={styles.emptyTitle}>Brak wzorów</Text>
              <Text style={styles.emptySubtitle}>
                Zacznij od utworzenia pierwszego wzoru
              </Text>
            </View>
          ) : (
            patterns.map((pattern) => (
              <TouchableOpacity
                key={pattern.id}
                style={styles.patternCard}
                onPress={() => {
                  // TODO: Navigate to pattern editor
                }}
              >
                <View style={styles.patternThumbnail}>
                  {pattern.thumbnail ? (
                    <Image
                      source={{ uri: pattern.thumbnail }}
                      style={styles.thumbnailImage}
                    />
                  ) : (
                    <Text style={styles.thumbnailPlaceholder}>🧵</Text>
                  )}
                </View>
                <View style={styles.patternInfo}>
                  <Text style={styles.patternName}>{pattern.name}</Text>
                  <Text style={styles.patternStats}>
                    {pattern.stitchCount.toLocaleString()} ściegów • {pattern.colorCount} kolorów
                  </Text>
                  <Text style={styles.patternDate}>
                    {new Date(pattern.createdAt).toLocaleDateString('pl-PL')}
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    backgroundColor: '#6366f1',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#e0e7ff',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  uploadTextContainer: {
    flex: 1,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  chevron: {
    fontSize: 24,
    color: '#9ca3af',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  patternCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  patternThumbnail: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  thumbnailImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  thumbnailPlaceholder: {
    fontSize: 32,
  },
  patternInfo: {
    flex: 1,
  },
  patternName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  patternStats: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
  },
  patternDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
