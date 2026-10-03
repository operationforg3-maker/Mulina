import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useTheme } from '../theme/ThemeContext';
import { useResponsive } from '../theme/useResponsive';
import { listRecentPatterns, PatternListItem, savePattern } from '../services/patternStorage';
import * as DocumentPicker from 'expo-document-picker';
import { parsePatternFile } from '../services/parsers/patternParsers';
import AndroidDownloadModal from '../components/AndroidDownloadModal';

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, themeMode, cycleTheme } = useTheme();
  const { isTabletOrLarger } = useResponsive();

  const [recentPatterns, setRecentPatterns] = useState<PatternListItem[]>([]);
  const [showAndroidModal, setShowAndroidModal] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const patterns = await listRecentPatterns();
        setRecentPatterns(patterns || []);
      } catch (e) {
        console.warn('Error loading recent patterns:', e);
      }
    })();
  }, []);

  const handleDirectFileImport = async () => {
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
        setImporting(false);
        Alert.alert(
          'Wczytano pomyślnie!',
          `Plik ${file.name} został zaimportowany (${parseRes.pattern.grid_data.width}×${parseRes.pattern.grid_data.height} krz., ${parseRes.pattern.color_palette.length} kolorów).`,
          [
            {
              text: 'Otwórz w edytorze',
              onPress: () =>
                navigation.navigate('PatternEditor', {
                  patternId: parseRes.pattern!.pattern_id,
                  pattern: parseRes.pattern,
                }),
            },
          ]
        );
      } else {
        setImporting(false);
        Alert.alert('Błąd importu', parseRes.error || 'Nie udało się wczytać pliku schematu.');
      }
    } catch (err: any) {
      setImporting(false);
      Alert.alert('Błąd importu', err.message || 'Nie udało się wczytać pliku schematu.');
    }
  };

  const getThemeIcon = () => {
    if (themeMode === 'cozy') return '🌸 Pastel';
    if (themeMode === 'oled') return '🌙 OLED';
    return '🔴 Ochrona';
  };

  // Active WIP project: first item from storage or demo
  const activeWip = recentPatterns.length > 0 ? recentPatterns[0] : null;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top App Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.surfaceBorder }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.logoBadge, { backgroundColor: theme.primary }]}>
            <Text style={{ fontSize: 20 }}>🧵</Text>
          </View>
          <View>
            <Text style={[styles.brandTitle, { color: theme.textPrimary }]}>Mu'alina</Text>
            <Text style={[styles.brandSubtitle, { color: theme.textSecondary }]}>Pracownia & Tamborek</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.themeBtn, { backgroundColor: theme.backgroundAlt, borderColor: theme.surfaceBorder }]}
            onPress={cycleTheme}
            activeOpacity={0.8}
          >
            <Text style={[styles.themeBtnText, { color: theme.textPrimary }]}>{getThemeIcon()}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.streakBtn, { backgroundColor: '#FFF3E0', borderColor: '#FFE0B2' }]}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.8}
          >
            <Text style={styles.streakBtnText}>🔥 7 dni</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.avatarBtn, { backgroundColor: theme.primaryLight, borderColor: theme.primaryBorder }]}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 16 }}>👩‍🎨</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, isTabletOrLarger && styles.tabletScrollContent]}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Greeting */}
        <View style={styles.greetingSection}>
          <Text style={[styles.greetingTitle, { color: theme.textPrimary }]}>Witaj z powrotem! ✨</Text>
          <Text style={[styles.greetingSubtitle, { color: theme.textSecondary }]}>
            Dziś wyhaftowano 260 krzyżyków. Tamborek czeka na kolejną nitkę!
          </Text>
        </View>

        {/* HERO CARD: Current Active WIP Tamborek */}
        <View style={[styles.heroCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
          <View style={styles.heroHeaderRow}>
            <View style={styles.wipTag}>
              <View style={styles.wipDot} />
              <Text style={styles.wipTagText}>AKTUALNIE NA TAMBORKU</Text>
            </View>
            <Text style={[styles.wipTimeLeft, { color: theme.textSecondary }]}>
              {activeWip ? `Zaktualizowano: ${new Date(activeWip.updated_at).toLocaleDateString('pl-PL')}` : 'Aida 14ct • 16 kolorów DMC'}
            </Text>
          </View>

          <View style={styles.heroBodyRow}>
            <View style={[styles.heroThumb, { backgroundColor: theme.backgroundAlt }]}>
              <Text style={{ fontSize: 44 }}>{activeWip ? '🪡' : '🌹'}</Text>
            </View>
            <View style={styles.heroDetails}>
              <Text style={[styles.heroPatternName, { color: theme.textPrimary }]} numberOfLines={1}>
                {activeWip ? activeWip.name : 'Czerwona Róża (Wzór demonstracyjny)'}
              </Text>
              <Text style={[styles.heroPatternMeta, { color: theme.textSecondary }]}>
                {activeWip
                  ? `${activeWip.width_stitches}×${activeWip.height_stitches} krzyżyków • ${activeWip.color_count} kolorów DMC`
                  : '32×32 krzyżyków • Gesty 1/2 palce • Backstitch • Parking'}
              </Text>

              {/* Progress Bar */}
              <View style={styles.progressRow}>
                <View style={[styles.progressTrack, { backgroundColor: theme.backgroundAlt }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${activeWip ? Math.max(activeWip.progress_percent, 5) : 34}%`,
                        backgroundColor: theme.primary,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.progressValText, { color: theme.primary }]}>
                  {activeWip ? `${activeWip.progress_percent}%` : '34%'}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Button: Kontynuuj Haftowanie */}
          <TouchableOpacity
            style={[styles.resumeBtn, { backgroundColor: theme.primary }]}
            onPress={() =>
              navigation.navigate('PatternEditor', {
                patternId: activeWip ? activeWip.pattern_id : 'demo',
              })
            }
            activeOpacity={0.88}
          >
            <Text style={styles.resumeBtnText}>Kontynuuj haftowanie ➔</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Szybki Start & Narzędzia</Text>
        </View>

        <View style={styles.quickGrid}>
          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}
            onPress={() => navigation.navigate('ImagePicker')}
            activeOpacity={0.85}
          >
            <View style={[styles.quickIconCircle, { backgroundColor: '#FCE4EC' }]}>
              <Text style={{ fontSize: 24 }}>📸</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.quickTitle, { color: theme.textPrimary }]}>Nowy ze zdjęcia</Text>
              <Text style={[styles.quickDesc, { color: theme.textSecondary }]}>AI Photo Converter (DMC/Anchor)</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}
            onPress={handleDirectFileImport}
            activeOpacity={0.85}
          >
            <View style={[styles.quickIconCircle, { backgroundColor: '#EDE7F6' }]}>
              <Text style={{ fontSize: 24 }}>📂</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.quickTitle, { color: theme.textPrimary }]}>Wgraj schemat</Text>
              <Text style={[styles.quickDesc, { color: theme.textSecondary }]}>
                {importing ? 'Wczytywanie...' : '.saga, .xsd, .pat, .oxs, .pdf'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}
            onPress={() => navigation.navigate('Inventory')}
            activeOpacity={0.85}
          >
            <View style={[styles.quickIconCircle, { backgroundColor: '#FFF3E0' }]}>
              <Text style={{ fontSize: 24 }}>🧶</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.quickTitle, { color: theme.textPrimary }]}>Zapas Nici & Skaner</Text>
              <Text style={[styles.quickDesc, { color: theme.textSecondary }]}>Baza 10k kolorów i kody kreskowe</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}
            onPress={() => navigation.navigate('Marketplace')}
            activeOpacity={0.85}
          >
            <View style={[styles.quickIconCircle, { backgroundColor: '#E8F5E9' }]}>
              <Text style={{ fontSize: 24 }}>🎨</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.quickTitle, { color: theme.textPrimary }]}>Odkryj Wzory</Text>
              <Text style={[styles.quickDesc, { color: theme.textSecondary }]}>Marketplace z licencją DRM</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Weekly Streaks Section */}
        <View style={[styles.streakWidget, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
          <View style={styles.streakTopRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 20 }}>🔥</Text>
              <Text style={[styles.streakWidgetTitle, { color: theme.textPrimary }]}>
                Twoja Seria Haftowania
              </Text>
            </View>
            <Text style={[styles.streakDaysCount, { color: theme.primary }]}>7 dni z rzędu!</Text>
          </View>

          <View style={styles.daysRow}>
            {[
              { day: 'Pn', done: true },
              { day: 'Wt', done: true },
              { day: 'Śr', done: true },
              { day: 'Cz', done: true },
              { day: 'Pt', done: true },
              { day: 'So', done: true },
              { day: 'Nd', done: true, today: true },
            ].map((item, idx) => (
              <View key={idx} style={styles.dayCol}>
                <View
                  style={[
                    styles.dayBadge,
                    {
                      backgroundColor: item.done ? theme.primary : theme.backgroundAlt,
                      borderColor: item.today ? theme.primaryDark : 'transparent',
                    },
                  ]}
                >
                  <Text style={{ color: item.done ? '#FFFFFF' : theme.textMuted, fontSize: 13, fontWeight: '800' }}>
                    ✓
                  </Text>
                </View>
                <Text style={[styles.dayText, { color: item.today ? theme.primary : theme.textSecondary }]}>
                  {item.day}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Other Recent WIP Projects */}
        {recentPatterns.length > 1 && (
          <View style={styles.otherWipSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Inne Rozpoczęte Wzory</Text>
            </View>

            {recentPatterns.slice(1, 4).map((pat) => (
              <TouchableOpacity
                key={pat.pattern_id}
                style={[styles.smallWipCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}
                onPress={() => navigation.navigate('PatternEditor', { patternId: pat.pattern_id })}
                activeOpacity={0.85}
              >
                <View style={[styles.smallWipThumb, { backgroundColor: theme.backgroundAlt }]}>
                  <Text style={{ fontSize: 24 }}>🪡</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.smallWipTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                    {pat.name}
                  </Text>
                  <Text style={[styles.smallWipMeta, { color: theme.textSecondary }]}>
                    {pat.width_stitches}×{pat.height_stitches} krz. • {pat.progress_percent}% wyhaftowane
                  </Text>
                </View>
                <Text style={[styles.smallWipArrow, { color: theme.primary }]}>➔</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Android Download Modal */}
      <AndroidDownloadModal visible={showAndroidModal} onClose={() => setShowAndroidModal(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  themeBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  streakBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  streakBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E65100',
  },
  avatarBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  tabletScrollContent: {
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%',
  },
  greetingSection: {
    marginBottom: 18,
  },
  greetingTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  greetingSubtitle: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  heroCard: {
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  wipTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 6,
  },
  wipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2E7D32',
  },
  wipTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2E7D32',
    letterSpacing: 0.4,
  },
  wipTimeLeft: {
    fontSize: 11,
  },
  heroBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 18,
  },
  heroThumb: {
    width: 76,
    height: 76,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroDetails: {
    flex: 1,
  },
  heroPatternName: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  heroPatternMeta: {
    fontSize: 12,
    marginBottom: 10,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
    borderRadius: 4,
  },
  progressValText: {
    fontSize: 13,
    fontWeight: '800',
    width: 40,
    textAlign: 'right',
  },
  resumeBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumeBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  quickCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  quickIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  quickDesc: {
    fontSize: 11,
    lineHeight: 14,
  },
  streakWidget: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  streakTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  streakWidgetTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  streakDaysCount: {
    fontSize: 13,
    fontWeight: '800',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCol: {
    alignItems: 'center',
    gap: 6,
  },
  dayBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  dayText: {
    fontSize: 11,
    fontWeight: '600',
  },
  otherWipSection: {
    marginBottom: 20,
  },
  smallWipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  smallWipThumb: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallWipTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  smallWipMeta: {
    fontSize: 12,
  },
  smallWipArrow: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 4,
  },
});
