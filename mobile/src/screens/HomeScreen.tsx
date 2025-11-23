import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getPatternsList, deletePattern, PatternListItem } from '../services/patternStorage';

type RootStackParamList = {
  Home: undefined;
  ImagePicker: undefined;
  PatternEditor: { patternId: string; pattern?: any };
  ApiTest: undefined;
};

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [patterns, setPatterns] = useState<PatternListItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Load patterns when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadPatterns();
    }, [])
  );

  const loadPatterns = async () => {
    try {
      const savedPatterns = await getPatternsList();
      setPatterns(savedPatterns);
    } catch (error) {
      console.error('Error loading patterns:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPatterns();
    setRefreshing(false);
  };

  const handleDeletePattern = async (patternId: string, patternName: string) => {
    Alert.alert(
      'Usuń wzór',
      `Czy na pewno chcesz usunąć "${patternName}"?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePattern(patternId);
              await loadPatterns();
            } catch (error) {
              Alert.alert('Błąd', 'Nie udało się usunąć wzoru');
            }
          },
        },
      ]
    );
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

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Login' as never)}
          >
            <Text style={styles.actionIcon}>👤</Text>
            <Text style={styles.actionLabel}>Konto</Text>
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
                key={pattern.pattern_id}
                style={styles.patternCard}
                onPress={() => {
                  navigation.navigate('PatternEditor', {
                    patternId: pattern.pattern_id,
                  });
                }}
                onLongPress={() => handleDeletePattern(pattern.pattern_id, pattern.name)}
              >
                <View style={styles.patternThumbnail}>
                  {pattern.image_url ? (
                    <Image
                      source={{ uri: pattern.image_url }}
                      style={styles.thumbnailImage}
                    />
                  ) : pattern.thumbnail ? (
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
                    {pattern.width_stitches} × {pattern.height_stitches} • {pattern.color_count} kolorów
                  </Text>
                  <Text style={styles.patternDate}>
                    {new Date(pattern.updated_at).toLocaleDateString('pl-PL')}
                  </Text>
                  {pattern.progress_percent > 0 && (
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${pattern.progress_percent}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.progressText}>{pattern.progress_percent}%</Text>
                    </View>
                  )}
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
  chevron: {
    fontSize: 24,
    color: '#d1d5db',
    marginLeft: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366f1',
    minWidth: 32,
  },
});
