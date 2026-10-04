import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Modal,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useTheme } from '../theme/ThemeContext';
import {
  listRecentPatterns,
  PatternListItem,
  deletePattern,
  savePattern,
  loadPattern,
  renamePattern,
  duplicatePattern,
  toggleFavoritePattern,
  updatePatternTags,
  resetPatternProgress,
  exportPatternJson,
  exportAllPatternsBackup,
  importPatternsBackup,
} from '../services/patternStorage';
import * as DocumentPicker from 'expo-document-picker';
import { parsePatternFile } from '../services/parsers/patternParsers';
import {
  HoopIcon,
  NeedleIcon,
  ZoomMagnifierIcon,
  RusticDivider,
  FlossSkeinIcon,
  FlowerIcon,
  PatternFolderIcon,
  PdfStitchIcon,
  PencilCraftIcon,
  FrameBoxIcon,
} from '../components/RusticIcons';

type SortOption = 'recent' | 'name_asc' | 'name_desc' | 'progress_desc' | 'stitches_desc';

const POPULAR_TAGS = ['Kwiaty', 'Zwierzęta', 'Portrety', 'Święta', 'Dla Aliny', 'Pamiątka', 'Krajobraz', 'Prezent'];

export default function PatternLibraryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useTheme();
  const { width: winWidth } = useWindowDimensions();
  const isLargeScreen = winWidth >= 768;

  const [patterns, setPatterns] = useState<PatternListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | 'wip' | 'done'>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(isLargeScreen ? 'grid' : 'grid');
  const [importing, setImporting] = useState(false);

  // Modals state
  const [actionPattern, setActionPattern] = useState<PatternListItem | null>(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  const [showTagsModal, setShowTagsModal] = useState(false);
  const [patternTags, setPatternTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');

  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);

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

  // Extract all existing unique tags from all patterns
  const allExistingTags = useMemo(() => {
    const set = new Set<string>();
    patterns.forEach((p) => {
      if (p.tags && Array.isArray(p.tags)) {
        p.tags.forEach((t) => set.add(t));
      }
    });
    return Array.from(set);
  }, [patterns]);

  // Statistics
  const totalCount = patterns.length;
  const wipCount = patterns.filter((p) => p.progress_percent < 100).length;
  const doneCount = patterns.filter((p) => p.progress_percent >= 100).length;
  const favCount = patterns.filter((p) => p.favorite).length;

  // Filter and Sort patterns
  const displayedPatterns = useMemo(() => {
    let result = patterns.filter((p) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        p.name.toLowerCase().includes(query) ||
        (p.tags && p.tags.some((t) => t.toLowerCase().includes(query))) ||
        (p.pattern_id && p.pattern_id.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      if (activeFilter === 'favorites' && !p.favorite) return false;
      if (activeFilter === 'wip' && p.progress_percent >= 100) return false;
      if (activeFilter === 'done' && p.progress_percent < 100) return false;

      if (selectedTag && (!p.tags || !p.tags.includes(selectedTag))) return false;

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      // Pinned favorites always appear at the top if sorting by recent
      if (sortBy === 'recent') {
        if (a.favorite && !b.favorite) return -1;
        if (!a.favorite && b.favorite) return 1;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name, 'pl');
      if (sortBy === 'name_desc') return b.name.localeCompare(a.name, 'pl');
      if (sortBy === 'progress_desc') return b.progress_percent - a.progress_percent;
      if (sortBy === 'stitches_desc') {
        const sa = a.total_stitches || a.width_stitches * a.height_stitches;
        const sb = b.total_stitches || b.width_stitches * b.height_stitches;
        return sb - sa;
      }
      return 0;
    });

    return result;
  }, [patterns, searchQuery, activeFilter, selectedTag, sortBy]);

  // Handle Import File (.saga, .xsd, .pdf, .json)
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

      // Check if it's a backup JSON file
      if (file.name.endsWith('.json') && content.includes('"patterns"')) {
        const count = await importPatternsBackup(content);
        await loadPatterns();
        setImporting(false);
        Alert.alert('Przywrócono kopię zapasową!', `Pomyślnie zaimportowano ${count} wzorów.`);
        return;
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
            { text: 'Zostań w bibliotece', style: 'cancel' },
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

  // Actions
  const handleToggleFavorite = async (patternId: string) => {
    const isFav = await toggleFavoritePattern(patternId);
    setPatterns((prev) =>
      prev.map((p) => (p.pattern_id === patternId ? { ...p, favorite: isFav } : p))
    );
  };

  const handleDuplicate = async (item: PatternListItem) => {
    const clone = await duplicatePattern(item.pattern_id);
    if (clone) {
      await loadPatterns();
      setActionPattern(null);
      Alert.alert('Zduplikowano wzór', `Utworzono kopię roboczą: "${clone.name}".`);
    }
  };

  const handleOpenRename = (item: PatternListItem) => {
    setActionPattern(item);
    setRenameValue(item.name);
    setShowRenameModal(true);
  };

  const handleSaveRename = async () => {
    if (!actionPattern || !renameValue.trim()) return;
    await renamePattern(actionPattern.pattern_id, renameValue.trim());
    await loadPatterns();
    setShowRenameModal(false);
    setActionPattern(null);
  };

  const handleOpenTags = (item: PatternListItem) => {
    setActionPattern(item);
    setPatternTags(item.tags || []);
    setNewTagInput('');
    setShowTagsModal(true);
  };

  const handleToggleTag = (tag: string) => {
    if (patternTags.includes(tag)) {
      setPatternTags(patternTags.filter((t) => t !== tag));
    } else {
      setPatternTags([...patternTags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    const trimmed = newTagInput.trim();
    if (trimmed && !patternTags.includes(trimmed)) {
      setPatternTags([...patternTags, trimmed]);
      setNewTagInput('');
    }
  };

  const handleSaveTags = async () => {
    if (!actionPattern) return;
    await updatePatternTags(actionPattern.pattern_id, patternTags);
    await loadPatterns();
    setShowTagsModal(false);
    setActionPattern(null);
  };

  const handleResetProgress = (item: PatternListItem) => {
    Alert.alert(
      'Reset postępu',
      `Czy na pewno chcesz zresetować postęp haftu dla wzoru "${item.name}" do 0%? Zaznaczone krzyżyki zostaną wyczyszczone.`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Zresetuj do 0%',
          style: 'destructive',
          onPress: async () => {
            await resetPatternProgress(item.pattern_id);
            await loadPatterns();
            setActionPattern(null);
            Alert.alert('Postęp zresetowany', 'Możesz rozpocząć haftowanie tego wzoru od początku.');
          },
        },
      ]
    );
  };

  const handleExportJson = async (item: PatternListItem) => {
    try {
      const jsonStr = await exportPatternJson(item.pattern_id);
      if (Platform.OS === 'web') {
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const cleanName = item.name.replace(/[^a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ_-]/g, '_');
        a.download = `${cleanName}.mualina.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        Alert.alert('Eksport JSON', 'Eksport pliku JSON wzoru gotowy.');
      }
      setActionPattern(null);
    } catch (e: any) {
      Alert.alert('Błąd eksportu', e.message);
    }
  };

  const handleExportFullBackup = async () => {
    try {
      setBackupStatus('Generowanie kopii zapasowej...');
      const backupStr = await exportAllPatternsBackup();
      if (Platform.OS === 'web') {
        const blob = new Blob([backupStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const dateStr = new Date().toISOString().split('T')[0];
        a.download = `mualina_kopia_zapasowa_${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
      setBackupStatus(`Pobrano kopię (${patterns.length} wzorów).`);
      setTimeout(() => setBackupStatus(null), 3000);
    } catch (e: any) {
      Alert.alert('Błąd kopii zapasowej', e.message);
      setBackupStatus(null);
    }
  };

  const handleRestoreBackupFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/json', '*/*'],
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets || res.assets.length === 0) return;

      const file = res.assets[0];
      let content = '';
      if (Platform.OS === 'web') {
        const fileObj = (file as any).file;
        if (fileObj) content = await fileObj.text();
      }

      if (content) {
        const count = await importPatternsBackup(content);
        await loadPatterns();
        setShowBackupModal(false);
        Alert.alert('Przywrócono bazę!', `Pomyślnie zaimportowano ${count} wzorów.`);
      }
    } catch (e: any) {
      Alert.alert('Błąd przywracania', e.message || 'Niepoprawny plik kopii zapasowej.');
    }
  };

  const handleDelete = (patternId: string, name: string) => {
    Alert.alert(
      'Usuń wzór',
      `Czy na pewno chcesz usunąć wzór "${name}" z biblioteki? Ta operacja jest nieodwracalna.`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: async () => {
            await deletePattern(patternId);
            await loadPatterns();
            setActionPattern(null);
          },
        },
      ]
    );
  };

  // Render Pattern in Grid Mode
  const renderGridCard = ({ item }: { item: PatternListItem }) => {
    const isCompleted = item.progress_percent >= 100;
    const formatLabel = item.pattern_id.startsWith('mkt-')
      ? 'SKLEP'
      : item.pattern_id.startsWith('pat_')
      ? 'WŁASNY'
      : 'SAGA/XSD';

    const widthCm = Math.round((item.width_stitches / 5.5) * 10) / 10;
    const heightCm = Math.round((item.height_stitches / 5.5) * 10) / 10;

    return (
      <View
        style={[
          styles.gridCard,
          {
            backgroundColor: theme.surface,
            borderColor: item.favorite ? theme.primary : theme.surfaceBorder,
          },
        ]}
      >
        {/* Card Header: Star & Badges */}
        <View style={styles.cardTopRow}>
          <TouchableOpacity
            style={styles.starBtn}
            onPress={() => handleToggleFavorite(item.pattern_id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={item.favorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
          >
            <Text style={{ fontSize: 16, color: item.favorite ? '#F59E0B' : theme.textMuted }}>
              {item.favorite ? '★' : '☆'}
            </Text>
          </TouchableOpacity>

          <View style={styles.badgeRow}>
            <View style={[styles.formatBadge, { backgroundColor: theme.backgroundAlt }]}>
              <Text style={[styles.formatBadgeText, { color: theme.textSecondary }]}>{formatLabel}</Text>
            </View>
            <TouchableOpacity
              style={styles.moreActionBtn}
              onPress={() => setActionPattern(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Więcej opcji"
            >
              <Text style={[styles.moreActionDots, { color: theme.textSecondary }]}>•••</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Visual Hoop Thumbnail */}
        <TouchableOpacity
          style={[styles.gridThumbContainer, { backgroundColor: theme.backgroundAlt }]}
          onPress={() => navigation.navigate('PatternEditor', { patternId: item.pattern_id })}
          activeOpacity={0.88}
        >
          <HoopIcon size={46} color={isCompleted ? theme.success : theme.primary} />
          {/* Dominant Palette Colors Preview */}
          {item.preview_colors && item.preview_colors.length > 0 && (
            <View style={styles.swatchDotsRow}>
              {item.preview_colors.slice(0, 6).map((col, idx) => (
                <View key={`dot-${idx}`} style={[styles.swatchDot, { backgroundColor: col }]} />
              ))}
            </View>
          )}
        </TouchableOpacity>

        {/* Card Body */}
        <View style={styles.gridBody}>
          <Text
            style={[styles.gridTitle, { color: theme.textPrimary }]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {item.name}
          </Text>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <View style={styles.tagsPillContainer}>
              {item.tags.slice(0, 2).map((t, i) => (
                <View key={`tag-${i}`} style={[styles.tagMiniPill, { backgroundColor: theme.backgroundAlt }]}>
                  <Text style={[styles.tagMiniText, { color: theme.textSecondary }]}>#{t}</Text>
                </View>
              ))}
              {item.tags.length > 2 && (
                <Text style={{ fontSize: 9, color: theme.textMuted, marginLeft: 2 }}>+{item.tags.length - 2}</Text>
              )}
            </View>
          )}

          {/* Dimensions */}
          <Text style={[styles.gridMeta, { color: theme.textSecondary }]}>
            {item.width_stitches}×{item.height_stitches} ({widthCm}×{heightCm} cm) • {item.color_count} kol.
          </Text>

          {/* Progress Bar */}
          <View style={styles.progressRow}>
            <View style={[styles.progressTrack, { backgroundColor: theme.backgroundAlt }]}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${Math.max(item.progress_percent, 2)}%`,
                    backgroundColor: isCompleted ? theme.success : theme.primary,
                  },
                ]}
              />
            </View>
            <Text
              style={[
                styles.progressText,
                { color: isCompleted ? theme.success : theme.primary },
              ]}
            >
              {item.progress_percent}%
            </Text>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity
            style={[
              styles.openTamborekBtn,
              { backgroundColor: isCompleted ? theme.sage : theme.primary },
            ]}
            onPress={() => navigation.navigate('PatternEditor', { patternId: item.pattern_id })}
            activeOpacity={0.85}
          >
            <NeedleIcon size={14} color="#FFFFFF" />
            <Text style={styles.openTamborekText}>
              {isCompleted ? 'Przeglądaj' : item.progress_percent > 0 ? 'Kontynuuj' : 'Haftuj'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render Pattern in List Mode
  const renderListCard = ({ item }: { item: PatternListItem }) => {
    const isCompleted = item.progress_percent >= 100;
    const widthCm = Math.round((item.width_stitches / 5.5) * 10) / 10;
    const heightCm = Math.round((item.height_stitches / 5.5) * 10) / 10;

    return (
      <View
        style={[
          styles.listCard,
          {
            backgroundColor: theme.surface,
            borderColor: item.favorite ? theme.primary : theme.surfaceBorder,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.listThumbBox, { backgroundColor: theme.backgroundAlt }]}
          onPress={() => navigation.navigate('PatternEditor', { patternId: item.pattern_id })}
          activeOpacity={0.85}
        >
          <HoopIcon size={32} color={isCompleted ? theme.success : theme.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.listCardInfo}
          onPress={() => navigation.navigate('PatternEditor', { patternId: item.pattern_id })}
          activeOpacity={0.88}
        >
          <View style={styles.listTitleRow}>
            <Text style={[styles.listTitle, { color: theme.textPrimary }]} numberOfLines={1}>
              {item.name}
            </Text>
            {item.favorite && <Text style={{ color: '#F59E0B', fontSize: 13, marginLeft: 4 }}>★</Text>}
          </View>

          <Text style={[styles.listMeta, { color: theme.textSecondary }]}>
            {item.width_stitches}×{item.height_stitches} ({widthCm}×{heightCm} cm) • {item.color_count} nici DMC
          </Text>

          {/* Palette preview */}
          {item.preview_colors && (
            <View style={styles.swatchDotsRow}>
              {item.preview_colors.slice(0, 6).map((col, idx) => (
                <View key={`ldot-${idx}`} style={[styles.swatchDot, { backgroundColor: col }]} />
              ))}
            </View>
          )}

          {/* Progress */}
          <View style={styles.listProgressRow}>
            <View style={[styles.progressTrack, { backgroundColor: theme.backgroundAlt }]}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${Math.max(item.progress_percent, 2)}%`,
                    backgroundColor: isCompleted ? theme.success : theme.primary,
                  },
                ]}
              />
            </View>
            <Text
              style={[
                styles.progressText,
                { color: isCompleted ? theme.success : theme.primary },
              ]}
            >
              {item.progress_percent}%
            </Text>
          </View>
        </TouchableOpacity>

        {/* Action button */}
        <TouchableOpacity
          style={styles.listMoreBtn}
          onPress={() => setActionPattern(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.moreActionDots, { color: theme.textSecondary }]}>•••</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.surfaceBorder }]}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <FlowerIcon size={20} color={theme.primary} />
              <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>Studio Wzorów</Text>
            </View>
            <Text style={[styles.screenSubtitle, { color: theme.textSecondary }]}>
              Kolekcja tamborków, schematów i postępów haftu
            </Text>
          </View>

          <View style={styles.headerButtonsGroup}>
            <TouchableOpacity
              style={[styles.backupBtn, { backgroundColor: theme.backgroundAlt, borderColor: theme.surfaceBorder }]}
              onPress={() => setShowBackupModal(true)}
              activeOpacity={0.85}
              accessibilityLabel="Kopia zapasowa"
            >
              <PatternFolderIcon size={15} color={theme.textPrimary} />
              <Text style={[styles.backupBtnText, { color: theme.textPrimary }]}>Kopia</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.importBtn, { backgroundColor: theme.primary }]}
              onPress={handleImportFile}
              activeOpacity={0.85}
              accessibilityLabel="Wgraj plik wzoru"
            >
              <Text style={styles.importBtnText}>{importing ? 'Wgrywam...' : '＋ Wgraj plik'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Studio Stats Summary Bar */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={[styles.statChip, activeFilter === 'all' && styles.statChipActive, { backgroundColor: theme.backgroundAlt }]}
            onPress={() => { setActiveFilter('all'); setSelectedTag(null); }}
          >
            <Text style={[styles.statChipValue, { color: theme.textPrimary }]}>{totalCount}</Text>
            <Text style={[styles.statChipLabel, { color: theme.textSecondary }]}>Wszystkie</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statChip, activeFilter === 'favorites' && styles.statChipActive, { backgroundColor: theme.backgroundAlt }]}
            onPress={() => { setActiveFilter('favorites'); setSelectedTag(null); }}
          >
            <Text style={[styles.statChipValue, { color: '#F59E0B' }]}>★ {favCount}</Text>
            <Text style={[styles.statChipLabel, { color: theme.textSecondary }]}>Ulubione</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statChip, activeFilter === 'wip' && styles.statChipActive, { backgroundColor: theme.backgroundAlt }]}
            onPress={() => { setActiveFilter('wip'); setSelectedTag(null); }}
          >
            <Text style={[styles.statChipValue, { color: theme.primary }]}>{wipCount}</Text>
            <Text style={[styles.statChipLabel, { color: theme.textSecondary }]}>W trakcie</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statChip, activeFilter === 'done' && styles.statChipActive, { backgroundColor: theme.backgroundAlt }]}
            onPress={() => { setActiveFilter('done'); setSelectedTag(null); }}
          >
            <Text style={[styles.statChipValue, { color: theme.sage }]}>{doneCount}</Text>
            <Text style={[styles.statChipLabel, { color: theme.textSecondary }]}>Ukończone</Text>
          </TouchableOpacity>
        </View>

        {/* Search & Layout Toggle */}
        <View style={styles.searchAndLayoutRow}>
          <View style={[styles.searchBox, { backgroundColor: theme.backgroundAlt, borderColor: theme.surfaceBorder }]}>
            <ZoomMagnifierIcon size={16} color={theme.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.searchInput, { color: theme.textPrimary }]}
              placeholder="Szukaj po nazwie, formacie, tagu..."
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

          {/* View Mode Toggle: Grid vs List */}
          <View style={[styles.viewModeToggle, { backgroundColor: theme.backgroundAlt, borderColor: theme.surfaceBorder }]}>
            <TouchableOpacity
              style={[styles.viewModeBtn, viewMode === 'grid' && { backgroundColor: theme.surface }]}
              onPress={() => setViewMode('grid')}
              accessibilityLabel="Widok kafelków"
            >
              <Text style={{ fontSize: 13, color: viewMode === 'grid' ? theme.primary : theme.textMuted }}>▦</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewModeBtn, viewMode === 'list' && { backgroundColor: theme.surface }]}
              onPress={() => setViewMode('list')}
              accessibilityLabel="Widok listy"
            >
              <Text style={{ fontSize: 13, color: viewMode === 'list' ? theme.primary : theme.textMuted }}>☰</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sort & Tag Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
          {/* Sort Selector Chips */}
          <TouchableOpacity
            style={[styles.sortChip, sortBy === 'recent' && styles.sortChipActive]}
            onPress={() => setSortBy('recent')}
          >
            <Text style={[styles.sortChipText, sortBy === 'recent' && styles.sortChipTextActive]}>
              🕒 Najnowsze
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sortChip, sortBy === 'name_asc' && styles.sortChipActive]}
            onPress={() => setSortBy(sortBy === 'name_asc' ? 'name_desc' : 'name_asc')}
          >
            <Text style={[styles.sortChipText, (sortBy === 'name_asc' || sortBy === 'name_desc') && styles.sortChipTextActive]}>
              {sortBy === 'name_desc' ? '🔤 Z-A' : '🔤 A-Z'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sortChip, sortBy === 'progress_desc' && styles.sortChipActive]}
            onPress={() => setSortBy('progress_desc')}
          >
            <Text style={[styles.sortChipText, sortBy === 'progress_desc' && styles.sortChipTextActive]}>
              📊 % Postępu
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sortChip, sortBy === 'stitches_desc' && styles.sortChipActive]}
            onPress={() => setSortBy('stitches_desc')}
          >
            <Text style={[styles.sortChipText, sortBy === 'stitches_desc' && styles.sortChipTextActive]}>
              📐 Rozmiar (ściegi)
            </Text>
          </TouchableOpacity>

          {/* Tag filters */}
          {allExistingTags.map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <TouchableOpacity
                key={`tagfilter-${tag}`}
                style={[styles.tagFilterChip, isSelected && { backgroundColor: theme.sage, borderColor: theme.sage }]}
                onPress={() => setSelectedTag(isSelected ? null : tag)}
              >
                <Text style={[styles.tagFilterText, isSelected && { color: '#FFFFFF', fontWeight: '700' }]}>
                  #{tag}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Pattern List / Grid */}
      <FlatList
        key={viewMode === 'grid' ? (isLargeScreen ? 'grid-3' : 'grid-2') : 'list-1'}
        data={displayedPatterns}
        keyExtractor={(item) => item.pattern_id}
        renderItem={viewMode === 'grid' ? renderGridCard : renderListCard}
        numColumns={viewMode === 'grid' ? (isLargeScreen ? 3 : 2) : 1}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={viewMode === 'grid' ? styles.gridRowWrapper : undefined}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <HoopIcon size={52} color={theme.primary} style={{ marginBottom: 14 }} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
              {searchQuery || selectedTag ? 'Brak pasujących wzorów' : 'Biblioteka jest pusta'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              {searchQuery || selectedTag
                ? 'Spróbuj zmienić zapytanie, wyczyść filtry lub usuń wybrany tag.'
                : 'Stwórz autorski schemat ze zdjęcia w zakładce "Nowy" lub wgraj gotowy plik (.saga / .xsd / .pdf / .json).'}
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: theme.primary }]}
              onPress={handleImportFile}
              activeOpacity={0.88}
            >
              <Text style={styles.emptyBtnText}>Wgraj schemat do biblioteki ›</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* --- MODAL 1: Pattern Actions Sheet --- */}
      <Modal
        visible={!!actionPattern && !showRenameModal && !showTagsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setActionPattern(null)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setActionPattern(null)}
        >
          <View style={[styles.actionSheetContainer, { backgroundColor: theme.surface }]}>
            {actionPattern && (
              <>
                <View style={styles.actionSheetHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.actionSheetTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                      {actionPattern.name}
                    </Text>
                    <Text style={[styles.actionSheetSubtitle, { color: theme.textSecondary }]}>
                      {actionPattern.width_stitches}×{actionPattern.height_stitches} krzyżyków • Postęp: {actionPattern.progress_percent}%
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setActionPattern(null)}>
                    <Text style={{ fontSize: 18, color: theme.textMuted }}>✕</Text>
                  </TouchableOpacity>
                </View>

                <RusticDivider style={{ marginVertical: 8 }} />

                <ScrollView style={{ maxHeight: 380 }}>
                  <TouchableOpacity
                    style={styles.sheetOption}
                    onPress={() => {
                      const id = actionPattern.pattern_id;
                      setActionPattern(null);
                      navigation.navigate('PatternEditor', { patternId: id });
                    }}
                  >
                    <NeedleIcon size={18} color={theme.primary} />
                    <Text style={[styles.sheetOptionText, { color: theme.textPrimary }]}>Otwórz na tamborku</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.sheetOption}
                    onPress={() => {
                      handleToggleFavorite(actionPattern.pattern_id);
                      setActionPattern(null);
                    }}
                  >
                    <Text style={{ fontSize: 16, color: '#F59E0B' }}>★</Text>
                    <Text style={[styles.sheetOptionText, { color: theme.textPrimary }]}>
                      {actionPattern.favorite ? 'Usuń z ulubionych' : 'Oznacz jako ulubiony (przypnij na górze)'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.sheetOption}
                    onPress={() => handleOpenRename(actionPattern)}
                  >
                    <PencilCraftIcon size={18} color={theme.textPrimary} />
                    <Text style={[styles.sheetOptionText, { color: theme.textPrimary }]}>Zmień nazwę wzoru</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.sheetOption}
                    onPress={() => handleDuplicate(actionPattern)}
                  >
                    <FrameBoxIcon size={18} color={theme.textPrimary} />
                    <Text style={[styles.sheetOptionText, { color: theme.textPrimary }]}>Duplikuj wzór (kopia robocza)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.sheetOption}
                    onPress={() => handleOpenTags(actionPattern)}
                  >
                    <FlowerIcon size={18} color={theme.sage} />
                    <Text style={[styles.sheetOptionText, { color: theme.textPrimary }]}>Zarządzaj tagami i kolekcją</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.sheetOption}
                    onPress={() => handleExportJson(actionPattern)}
                  >
                    <PatternFolderIcon size={18} color={theme.textPrimary} />
                    <Text style={[styles.sheetOptionText, { color: theme.textPrimary }]}>Eksportuj plik (.json / Mu'Alina)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.sheetOption}
                    onPress={() => handleResetProgress(actionPattern)}
                  >
                    <Text style={{ fontSize: 16 }}>🔄</Text>
                    <Text style={[styles.sheetOptionText, { color: theme.warning }]}>Zresetuj postęp haftu do 0%</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.sheetOption, { marginTop: 4 }]}
                    onPress={() => handleDelete(actionPattern.pattern_id, actionPattern.name)}
                  >
                    <Text style={{ fontSize: 16, color: theme.danger }}>🗑️</Text>
                    <Text style={[styles.sheetOptionText, { color: theme.danger, fontWeight: '700' }]}>
                      Usuń wzór z biblioteki
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* --- MODAL 2: Rename Modal --- */}
      <Modal visible={showRenameModal} transparent animationType="fade" onRequestClose={() => setShowRenameModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.promptCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.promptTitle, { color: theme.textPrimary }]}>Zmień nazwę wzoru</Text>
            <Text style={[styles.promptSubtitle, { color: theme.textSecondary }]}>Wpisz nową nazwę dla wybranego schematu:</Text>
            <TextInput
              style={[styles.promptInput, { color: theme.textPrimary, borderColor: theme.surfaceBorder, backgroundColor: theme.backgroundAlt }]}
              value={renameValue}
              onChangeText={setRenameValue}
              placeholder="np. Bukiet róż dla Mamy"
              placeholderTextColor={theme.textMuted}
              autoFocus
            />
            <View style={styles.promptButtonsRow}>
              <TouchableOpacity
                style={[styles.promptBtn, { backgroundColor: theme.backgroundAlt }]}
                onPress={() => setShowRenameModal(false)}
              >
                <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>Anuluj</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.promptBtn, { backgroundColor: theme.primary }]}
                onPress={handleSaveRename}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Zapisz nazwę</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- MODAL 3: Tags Modal --- */}
      <Modal visible={showTagsModal} transparent animationType="fade" onRequestClose={() => setShowTagsModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.promptCard, { backgroundColor: theme.surface, maxHeight: 480 }]}>
            <Text style={[styles.promptTitle, { color: theme.textPrimary }]}>Tagi i Kolekcje</Text>
            <Text style={[styles.promptSubtitle, { color: theme.textSecondary }]}>Przypisz etykiety, aby łatwo filtrować swoje wzory:</Text>

            {/* Popular / Suggested Tags */}
            <View style={styles.popularTagsWrapper}>
              {POPULAR_TAGS.map((tag) => {
                const isSelected = patternTags.includes(tag);
                return (
                  <TouchableOpacity
                    key={`poptag-${tag}`}
                    style={[styles.popTagChip, isSelected && { backgroundColor: theme.sage, borderColor: theme.sage }]}
                    onPress={() => handleToggleTag(tag)}
                  >
                    <Text style={[styles.popTagText, isSelected && { color: '#FFFFFF', fontWeight: '700' }]}>
                      {isSelected ? '✓ ' : '＋ '}#{tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Add Custom Tag */}
            <View style={styles.addTagRow}>
              <TextInput
                style={[styles.addTagInput, { color: theme.textPrimary, borderColor: theme.surfaceBorder, backgroundColor: theme.backgroundAlt }]}
                value={newTagInput}
                onChangeText={setNewTagInput}
                placeholder="Dodaj własny tag..."
                placeholderTextColor={theme.textMuted}
              />
              <TouchableOpacity
                style={[styles.addTagBtn, { backgroundColor: theme.primary }]}
                onPress={handleAddCustomTag}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Dodaj</Text>
              </TouchableOpacity>
            </View>

            {/* Current Active Tags */}
            <Text style={[styles.activeTagsLabel, { color: theme.textSecondary }]}>Przypisane do wzoru ({patternTags.length}):</Text>
            <View style={styles.assignedTagsRow}>
              {patternTags.map((t) => (
                <TouchableOpacity
                  key={`assigned-${t}`}
                  style={[styles.assignedTagPill, { backgroundColor: theme.primaryLight, borderColor: theme.primaryBorder }]}
                  onPress={() => handleToggleTag(t)}
                >
                  <Text style={[styles.assignedTagText, { color: theme.primaryDark }]}>#{t} ✕</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.promptButtonsRow}>
              <TouchableOpacity
                style={[styles.promptBtn, { backgroundColor: theme.backgroundAlt }]}
                onPress={() => setShowTagsModal(false)}
              >
                <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>Anuluj</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.promptBtn, { backgroundColor: theme.primary }]}
                onPress={handleSaveTags}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Zatwierdź tagi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- MODAL 4: Backup & Restore Modal --- */}
      <Modal visible={showBackupModal} transparent animationType="fade" onRequestClose={() => setShowBackupModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.promptCard, { backgroundColor: theme.surface }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <PatternFolderIcon size={20} color={theme.primary} />
              <Text style={[styles.promptTitle, { color: theme.textPrimary }]}>Kopia Zapasowa Biblioteki</Text>
            </View>
            <Text style={[styles.promptSubtitle, { color: theme.textSecondary }]}>
              Zabezpiecz wszystkie swoje schematy, postępy haftowania i kolory mulin w jednym bezpiecznym pliku.
            </Text>

            <View style={styles.backupOptionsBox}>
              <TouchableOpacity
                style={[styles.backupActionItem, { backgroundColor: theme.backgroundAlt, borderColor: theme.surfaceBorder }]}
                onPress={handleExportFullBackup}
                activeOpacity={0.85}
              >
                <Text style={{ fontSize: 24, marginRight: 12 }}>💾</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.backupItemTitle, { color: theme.textPrimary }]}>Pobierz kopię zapasową (.json)</Text>
                  <Text style={[styles.backupItemDesc, { color: theme.textSecondary }]}>
                    Zapisuje wszystkie {patterns.length} wzorów na dysk lub telefon.
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.backupActionItem, { backgroundColor: theme.backgroundAlt, borderColor: theme.surfaceBorder }]}
                onPress={handleRestoreBackupFile}
                activeOpacity={0.85}
              >
                <Text style={{ fontSize: 24, marginRight: 12 }}>📥</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.backupItemTitle, { color: theme.textPrimary }]}>Przywróć wzory z pliku</Text>
                  <Text style={[styles.backupItemDesc, { color: theme.textSecondary }]}>
                    Wgraj plik kopii .json i połącz z obecną kolekcją.
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {backupStatus && (
              <Text style={{ color: theme.success, fontSize: 12, fontWeight: '700', textAlign: 'center', marginVertical: 8 }}>
                ✓ {backupStatus}
              </Text>
            )}

            <TouchableOpacity
              style={[styles.promptBtn, { backgroundColor: theme.primary, marginTop: 12 }]}
              onPress={() => setShowBackupModal(false)}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '700', textAlign: 'center' }}>Zamknij</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  screenTitle: {
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  screenSubtitle: {
    fontSize: 11.5,
    marginTop: 2,
  },
  headerButtonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
  },
  backupBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  importBtn: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 18,
  },
  importBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12.5,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  statChip: {
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderRadius: 10,
    alignItems: 'center',
  },
  statChipActive: {
    borderWidth: 1.5,
    borderColor: '#D9777F',
  },
  statChipValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  statChipLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    marginTop: 1,
  },
  searchAndLayoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  viewModeToggle: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    padding: 2,
  },
  viewModeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  chipsScroll: {
    flexDirection: 'row',
  },
  sortChip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#F3EFEA',
    marginRight: 6,
  },
  sortChipActive: {
    backgroundColor: '#D9777F',
  },
  sortChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4A3525',
  },
  sortChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tagFilterChip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#EAE6E1',
    borderWidth: 1,
    borderColor: 'transparent',
    marginRight: 6,
  },
  tagFilterText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#554A41',
  },
  listContent: {
    padding: 12,
    paddingBottom: 40,
  },
  gridRowWrapper: {
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  gridCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
    maxWidth: '49%',
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  starBtn: {
    padding: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  formatBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  formatBadgeText: {
    fontSize: 8,
    fontWeight: '800',
  },
  moreActionBtn: {
    padding: 2,
  },
  moreActionDots: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -1,
  },
  gridThumbContainer: {
    width: '100%',
    height: 84,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 8,
  },
  swatchDotsRow: {
    position: 'absolute',
    bottom: 5,
    flexDirection: 'row',
    gap: 3,
  },
  swatchDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 0.8,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  gridBody: {
    flex: 1,
  },
  gridTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    lineHeight: 17,
    marginBottom: 4,
    minHeight: 34,
  },
  tagsPillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  tagMiniPill: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  tagMiniText: {
    fontSize: 9,
    fontWeight: '600',
  },
  gridMeta: {
    fontSize: 10.5,
    marginBottom: 6,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  progressTrack: {
    flex: 1,
    height: 5,
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  progressBar: {
    height: 5,
    borderRadius: 2.5,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '800',
    width: 30,
    textAlign: 'right',
  },
  openTamborekBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    borderRadius: 10,
  },
  openTamborekText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    marginBottom: 8,
    gap: 10,
  },
  listThumbBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listCardInfo: {
    flex: 1,
  },
  listTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  listMeta: {
    fontSize: 11,
    marginTop: 2,
    marginBottom: 4,
  },
  listProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  listMoreBtn: {
    padding: 8,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 45,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  emptyBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
  },
  emptyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  actionSheetContainer: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  actionSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  actionSheetTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  actionSheetSubtitle: {
    fontSize: 11.5,
    marginTop: 2,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    borderBottomWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  sheetOptionText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  promptCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    padding: 18,
  },
  promptTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  promptSubtitle: {
    fontSize: 12,
    marginBottom: 12,
  },
  promptInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: 14,
  },
  promptButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  promptBtn: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  popularTagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  popTagChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  popTagText: {
    fontSize: 11,
    color: '#374151',
  },
  addTagRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  addTagInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
  },
  addTagBtn: {
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTagsLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    marginBottom: 6,
  },
  assignedTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
    minHeight: 28,
  },
  assignedTagPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  assignedTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  backupOptionsBox: {
    gap: 10,
    marginVertical: 10,
  },
  backupActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  backupItemTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  backupItemDesc: {
    fontSize: 11,
    marginTop: 2,
  },
});
