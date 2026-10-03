import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useTheme } from '../theme/ThemeContext';
import { listRecentPatterns, PatternListItem, deletePattern, savePattern } from '../services/patternStorage';
import * as DocumentPicker from 'expo-document-picker';
import { parsePatternFile } from '../services/parsers/patternParsers';

export default function PatternLibraryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useTheme();

  const [patterns, setPatterns] = useState<PatternListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'wip' | 'done'>('all');
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    loadPatterns();
  }, []);

  const loadPatterns = async () => {
    try {
      const list = await listRecentPatterns();
      setPatterns(list || []);
    } catch (e) {
      console.warn('Failed to load library patterns', e);
    }
  };

  const handleImportFile = async () => {
    try {
      setImporting(true);
      const res = await DocumentPicker.getDocumentAsync({
        type: ['*/*'],
        copyToCacheDirectory: true,
      });

      if (res.canceled || !res.assets || res.assets.length === 0) {
        setImporting(false);
        return;
      }

      const file = res.assets[0];
      let content = '';
      if (Platform.OS === 'web') {
        const fileObj = (file as any).file;
        if (fileObj) {
          content = await fileObj.text();
        }
      }

      const parseRes = await parsePatternFile(file.name, content);
      if (parseRes.success && parseRes.pattern) {
        await savePattern(parseRes.pattern);
        await loadPatterns();
        setImporting(false);
        Alert.alert(
          'Wczytano schemat!',
          `Plik ${file.name} został dodany do biblioteki.`,
          [
            {
              text: 'Otwórz tamborek',
              onPress: () =>
                navigation.navigate('PatternEditor', {
                  patternId: parseRes.pattern!.pattern_id,
                  pattern: parseRes.pattern,
                }),
            },
            { text: 'OK', style: 'cancel' },
          ]
        );
      } else {
        setImporting(false);
        Alert.alert('Błąd importu', parseRes.error || 'Nieobsługiwany format pliku.');
      }
    } catch (err: any) {
      setImporting(false);
      Alert.alert('Błąd', err.message || 'Nie udało się wczytać pliku.');
    }
  };

  const handleDelete = (patternId: string, name: string) => {
    Alert.alert(
      'Usuń wzór',
      `Czy na pewno chcesz usunąć wzór "${name}" z biblioteki?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: async () => {
            await deletePattern(patternId);
            await loadPatterns();
          },
        },
      ]
    );
  };

  const filteredPatterns = patterns.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.pattern_id && p.pattern_id.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (activeFilter === 'wip') return p.progress_percent < 100;
    if (activeFilter === 'done') return p.progress_percent === 100;
    return true;
  });

  const renderPatternCard = ({ item }: { item: PatternListItem }) => {
    const isCompleted = item.progress_percent >= 100;

    return (
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: theme.surface,
            borderColor: theme.surfaceBorder,
          },
        ]}
        onPress={() => navigation.navigate('PatternEditor', { patternId: item.pattern_id })}
        activeOpacity={0.88}
      >
        <View style={[styles.thumbBox, { backgroundColor: theme.backgroundAlt }]}>
          <Text style={{ fontSize: 32 }}>{isCompleted ? '🏆' : '🪡'}</Text>
          <View style={styles.formatBadge}>
            <Text style={styles.formatBadgeText}>
              {item.pattern_id.startsWith('mkt-') ? 'DRM' : 'SAGA/XSD'}
            </Text>
          </View>
        </View>

        <View style={styles.cardInfo}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={1}>
              {item.name}
            </Text>
            <TouchableOpacity
              onPress={() => handleDelete(item.pattern_id, item.name)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={{ fontSize: 16, color: theme.textMuted }}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.submeta, { color: theme.textSecondary }]}>
            {item.width_stitches}×{item.height_stitches} krzyżyków • {item.color_count} kolorów DMC
          </Text>

          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressTrack, { backgroundColor: theme.backgroundAlt }]}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${Math.max(item.progress_percent, 3)}%`,
                    backgroundColor: isCompleted ? theme.success : theme.primary,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: isCompleted ? theme.success : theme.primary }]}>
              {item.progress_percent}%
            </Text>
          </View>

          <View style={styles.bottomRow}>
            <Text style={[styles.dateText, { color: theme.textMuted }]}>
              Ostatnio: {new Date(item.updated_at).toLocaleDateString('pl-PL')}
            </Text>
            <Text style={[styles.openLink, { color: theme.primary }]}>Otwórz ➔</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.surfaceBorder }]}>
        <View style={styles.titleRow}>
          <View>
            <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>Moja Biblioteka</Text>
            <Text style={[styles.screenSubtitle, { color: theme.textSecondary }]}>
              Wszystkie Twoje wzory i schematy haftu
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.importBtn, { backgroundColor: theme.primary }]}
            onPress={handleImportFile}
            activeOpacity={0.85}
          >
            <Text style={styles.importBtnText}>{importing ? '...' : '＋ Wgraj plik'}</Text>
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={[styles.searchBox, { backgroundColor: theme.backgroundAlt, borderColor: theme.surfaceBorder }]}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder="Szukaj po nazwie wzoru..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={{ color: theme.textMuted, fontSize: 14 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Segmented Filter Pills */}
        <View style={styles.filtersRow}>
          <TouchableOpacity
            style={[
              styles.filterPill,
              { backgroundColor: activeFilter === 'all' ? theme.primary : theme.backgroundAlt },
            ]}
            onPress={() => setActiveFilter('all')}
          >
            <Text
              style={[
                styles.filterText,
                { color: activeFilter === 'all' ? '#FFFFFF' : theme.textSecondary },
              ]}
            >
              Wszystkie ({patterns.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              { backgroundColor: activeFilter === 'wip' ? theme.primary : theme.backgroundAlt },
            ]}
            onPress={() => setActiveFilter('wip')}
          >
            <Text
              style={[
                styles.filterText,
                { color: activeFilter === 'wip' ? '#FFFFFF' : theme.textSecondary },
              ]}
            >
              W trakcie ({patterns.filter((p) => p.progress_percent < 100).length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              { backgroundColor: activeFilter === 'done' ? theme.primary : theme.backgroundAlt },
            ]}
            onPress={() => setActiveFilter('done')}
          >
            <Text
              style={[
                styles.filterText,
                { color: activeFilter === 'done' ? '#FFFFFF' : theme.textSecondary },
              ]}
            >
              Ukończone ({patterns.filter((p) => p.progress_percent >= 100).length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Pattern List */}
      <FlatList
        data={filteredPatterns}
        keyExtractor={(item) => item.pattern_id}
        renderItem={renderPatternCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🧵</Text>
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
              {searchQuery ? 'Brak pasujących wzorów' : 'Biblioteka jest pusta'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              {searchQuery
                ? 'Spróbuj wpisać inną frazę lub zresetuj filtr.'
                : 'Wgraj gotowy plik .saga / .xsd / .pdf lub przekonwertuj zdjęcie w zakładce "Nowy".'}
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: theme.primary }]}
              onPress={handleImportFile}
            >
              <Text style={styles.emptyBtnText}>Wgraj pierwszy plik schematu ➔</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  importBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  importBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  thumbBox: {
    width: 72,
    height: 72,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  formatBadge: {
    position: 'absolute',
    bottom: 4,
    backgroundColor: '#37474F',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  formatBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  submeta: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '800',
    width: 38,
    textAlign: 'right',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 11,
  },
  openLink: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
