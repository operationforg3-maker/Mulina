import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Image, 
  Platform 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { colors, shadows } from '../theme/colors';
import { useResponsive } from '../theme/useResponsive';
import PwaInstallBanner from '../components/PwaInstallBanner';
import AndroidDownloadModal from '../components/AndroidDownloadModal';
import { listRecentPatterns, PatternListItem } from '../services/patternStorage';

import { useTheme } from '../theme/ThemeContext';
import * as DocumentPicker from 'expo-document-picker';
import { parsePatternFile } from '../services/parsers/patternParsers';
import { savePattern } from '../services/patternStorage';
import { Alert } from 'react-native';

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Home'>>();
  const { theme, themeMode, cycleTheme } = useTheme();
  const { isTabletOrLarger, isDesktop } = useResponsive();
  const [showAndroidModal, setShowAndroidModal] = useState(false);
  const [recentPatterns, setRecentPatterns] = useState<PatternListItem[]>([]);
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
          "Wczytano pomyślnie!",
          `Plik ${file.name} został zaimportowany (${parseRes.pattern.grid_data.width}x${parseRes.pattern.grid_data.height} krz., ${parseRes.pattern.color_palette.length} kolorów).`,
          [
            {
              text: 'Otwórz w edytorze',
              onPress: () => navigation.navigate('PatternEditor', { patternId: parseRes.pattern!.pattern_id, pattern: parseRes.pattern }),
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

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.mainWrapper, isTabletOrLarger && styles.tabletContainer]}>
          
          {/* Header Banner - Cozy Embroidery Workshop Atmosphere */}
          <View style={[styles.heroHeader, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
            <View style={styles.heroTopRow}>
              <View style={styles.logoRow}>
                <View style={[styles.logoBadge, { backgroundColor: theme.primary }]}>
                  <Text style={styles.logoEmoji}>🧵</Text>
                </View>
                <View>
                  <Text style={[styles.appTitle, { color: theme.textPrimary }]}>Mu'alina</Text>
                  <Text style={[styles.appTagline, { color: theme.textSecondary }]}>Twój cyfrowy tamborek & konwerter wzorów</Text>
                </View>
              </View>

              <View style={styles.headerControlsRow}>
                <TouchableOpacity 
                  style={[styles.themePill, { backgroundColor: themeMode === 'cozy' ? '#FCE4EC' : theme.backgroundAlt }]}
                  onPress={cycleTheme}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.themePillText, { color: theme.textPrimary }]}>{getThemeIcon()}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.statusPill, { backgroundColor: '#FFF3E0', borderColor: '#FFE0B2' }]}
                  onPress={() => navigation.navigate('Profile')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.streakText}>🔥 7 dni</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={[styles.heroDescription, { color: theme.textSecondary }]}>
              Kompleksowa aplikacja dla pasjonatów haftu. Otwieraj schematy .saga, .xsd, .pat, .oxs, .pdf, konwertuj zdjęcia z AI, kontroluj zapasy mulin i zaznaczaj postępy gestami.
            </Text>
          </View>

          {/* PWA & Install Banner */}
          <PwaInstallBanner onOpenAndroidModal={() => setShowAndroidModal(true)} />

          {/* Primary Action Hero Card - Photo to Pattern AI */}
          <TouchableOpacity
            style={[styles.primaryActionCard, isTabletOrLarger && styles.primaryActionCardTablet]}
            onPress={() => navigation.navigate('ImagePicker')}
            activeOpacity={0.9}
          >
            <View style={styles.primaryActionIconBox}>
              <Text style={styles.primaryActionEmoji}>📸</Text>
            </View>

            <View style={styles.primaryActionContent}>
              <View style={styles.badgeRow}>
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>AI PHOTO CONVERTER</Text>
                </View>
                <Text style={styles.primaryActionDmc}>DMC • Anchor • Ariadna • CXC</Text>
              </View>
              <Text style={styles.primaryActionTitle}>Przekonwertuj zdjęcie na wzór haftu</Text>
              <Text style={styles.primaryActionSubtitle}>
                Wybierz grafikę z telefonu. Algorytm dopasuje gęstość kanwy (Aida 11-18ct, Evenweave 28-32ct), skompresuje paletę barw i usunie confetti.
              </Text>
            </View>

            <View style={styles.primaryActionArrowBtn}>
              <Text style={styles.arrowIcon}>➔</Text>
            </View>
          </TouchableOpacity>

          {/* Direct File Import Banner (.saga, .xsd, .pat, .oxs, .pdf) */}
          <TouchableOpacity
            style={[styles.importBannerCard, { backgroundColor: theme.backgroundAlt, borderColor: theme.surfaceBorder }]}
            onPress={handleDirectFileImport}
            activeOpacity={0.85}
          >
            <View style={styles.importIconCircle}>
              <Text style={{ fontSize: 24 }}>📂</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.importTitle, { color: theme.textPrimary }]}>Wgraj gotowy plik schematu</Text>
                <View style={styles.formatTag}><Text style={styles.formatTagText}>.SAGA</Text></View>
                <View style={styles.formatTag}><Text style={styles.formatTagText}>.XSD</Text></View>
                <View style={styles.formatTag}><Text style={styles.formatTagText}>.PDF</Text></View>
              </View>
              <Text style={[styles.importSubtitle, { color: theme.textSecondary }]}>
                {importing ? 'Trwa wczytywanie i parsowanie pliku...' : 'Obsługa formatów Cross Stitch Saga, Pattern Maker, PCStitch, OpenXStitch i skanów PDF z Grid Alignment.'}
              </Text>
            </View>
            <Text style={[styles.importActionText, { color: theme.primary }]}>Wybierz plik ➔</Text>
          </TouchableOpacity>

          {/* Tablet Quick Action Grid - 2 or 4 Columns */}
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Pracownia & Narzędzia</Text>
            <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>Wszystko w jednym miejscu</Text>
          </View>

          <View style={[styles.gridContainer, isTabletOrLarger && styles.gridContainerTablet]}>
            
            {/* Profile & Streaks */}
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }, isTabletOrLarger && styles.actionCardTablet]}
              onPress={() => navigation.navigate('Profile')}
              activeOpacity={0.85}
            >
              <View style={[styles.actionIconWrapper, { backgroundColor: '#FCE4EC' }]}>
                <Text style={styles.actionCardEmoji}>🔥</Text>
              </View>
              <View style={styles.actionCardTextWrap}>
                <Text style={[styles.actionCardTitle, { color: theme.textPrimary }]}>Mój Profil & Postępy</Text>
                <Text style={[styles.actionCardDesc, { color: theme.textSecondary }]}>Seria haftowania, odznaki i pastelowa relacja na Insta/TikTok</Text>
              </View>
            </TouchableOpacity>

            {/* Inventory */}
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }, isTabletOrLarger && styles.actionCardTablet]}
              onPress={() => navigation.navigate('Inventory')}
              activeOpacity={0.85}
            >
              <View style={[styles.actionIconWrapper, { backgroundColor: '#FFF3E0' }]}>
                <Text style={styles.actionCardEmoji}>🧶</Text>
              </View>
              <View style={styles.actionCardTextWrap}>
                <Text style={[styles.actionCardTitle, { color: theme.textPrimary }]}>Zapas Mulin & Skaner</Text>
                <Text style={[styles.actionCardDesc, { color: theme.textSecondary }]}>Katalog pasemek, skaner kodów kreskowych i przypisywanie do WIP</Text>
              </View>
            </TouchableOpacity>

            {/* Marketplace */}
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }, isTabletOrLarger && styles.actionCardTablet]}
              onPress={() => navigation.navigate('Marketplace')}
              activeOpacity={0.85}
            >
              <View style={[styles.actionIconWrapper, { backgroundColor: '#F3E5F5' }]}>
                <Text style={styles.actionCardEmoji}>🎨</Text>
              </View>
              <View style={styles.actionCardTextWrap}>
                <Text style={[styles.actionCardTitle, { color: theme.textPrimary }]}>Marketplace Wzorów</Text>
                <Text style={[styles.actionCardDesc, { color: theme.textSecondary }]}>Oficjalne wzory projektantów z Instant Import i DRM</Text>
              </View>
            </TouchableOpacity>

            {/* FAQ */}
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }, isTabletOrLarger && styles.actionCardTablet]}
              onPress={() => navigation.navigate('FAQ')}
              activeOpacity={0.85}
            >
              <View style={[styles.actionIconWrapper, { backgroundColor: '#E8F5E9' }]}>
                <Text style={styles.actionCardEmoji}>❓</Text>
              </View>
              <View style={styles.actionCardTextWrap}>
                <Text style={[styles.actionCardTitle, { color: theme.textPrimary }]}>Poradnik & Gesty</Text>
                <Text style={[styles.actionCardDesc, { color: theme.textSecondary }]}>Instrukcja gestów czytnika, parking mode i tabela kanw</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Quick Demo Pattern / Recent Patterns Section */}
          <View style={styles.recentSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Twoje Wzory & Szybki start</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>Kontynuuj rozpoczęty haft lub wypróbuj demo</Text>
            </View>

            {/* Render saved user patterns if any */}
            {recentPatterns.length > 0 && recentPatterns.map(pat => (
              <TouchableOpacity
                key={pat.pattern_id}
                style={[styles.demoCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder, marginBottom: 12 }, isTabletOrLarger && styles.demoCardTablet]}
                onPress={() => navigation.navigate('PatternEditor', { patternId: pat.pattern_id })}
                activeOpacity={0.85}
              >
                <View style={[styles.demoThumb, { backgroundColor: theme.backgroundAlt }]}>
                  <Text style={{ fontSize: 28 }}>🪡</Text>
                </View>
                <View style={styles.demoInfo}>
                  <View style={styles.badgeRow}>
                    <View style={[styles.newBadge, { backgroundColor: '#E8F5E9' }]}>
                      <Text style={[styles.newBadgeText, { color: '#2E7D32' }]}>{pat.progress_percent}% WYHAFTOWANE</Text>
                    </View>
                    <Text style={[styles.demoDetails, { color: theme.textSecondary }]}>{pat.width_stitches}x{pat.height_stitches} krz. • {pat.color_count} kol.</Text>
                  </View>
                  <Text style={[styles.demoTitle, { color: theme.textPrimary }]}>{pat.name}</Text>
                  <Text style={[styles.demoSubtitle, { color: theme.textSecondary }]}>
                    Zaktualizowano: {new Date(pat.updated_at).toLocaleDateString('pl-PL')}
                  </Text>
                </View>
                <View style={[styles.openBtn, { backgroundColor: theme.primary }]}>
                  <Text style={styles.openBtnText}>Otwórz ➔</Text>
                </View>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.demoCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }, isTabletOrLarger && styles.demoCardTablet]}
              onPress={() => navigation.navigate('PatternEditor', { patternId: 'demo' })}
              activeOpacity={0.85}
            >
              <View style={styles.demoThumb}>
                <Text style={{ fontSize: 36 }}>🌹</Text>
              </View>
              <View style={styles.demoInfo}>
                <View style={styles.badgeRow}>
                  <View style={[styles.newBadge, { backgroundColor: '#E8F5E9' }]}>
                    <Text style={[styles.newBadgeText, { color: '#2E7D32' }]}>GOTOWY DO HAFTOWANIA</Text>
                  </View>
                  <Text style={[styles.demoDetails, { color: theme.textSecondary }]}>Aida 14ct • 16 kolorów DMC</Text>
                </View>
                <Text style={[styles.demoTitle, { color: theme.textPrimary }]}>Czerwona Róża (Wzór demonstracyjny)</Text>
                <Text style={[styles.demoSubtitle, { color: theme.textSecondary }]}>
                  Przetestuj interaktywny tamborek: gesty 1-palec zaznaczanie, 2-palce pan/zoom, parking mode, warstwę backstitch i zakupy 1-klik.
                </Text>
              </View>
              <View style={[styles.openBtn, { backgroundColor: theme.primary }]}>
                <Text style={styles.openBtnText}>Otwórz edytor ➔</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Footer Info */}
          <View style={styles.footerNote}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>
              🌸 Mu'alina • Nowoczesna aplikacja do haftu krzyżykowego i płaskiego (iOS, iPadOS, Android, Web)
            </Text>
          </View>

        </View>
      </ScrollView>

      {/* Android PWA Download Modal */}
      <AndroidDownloadModal 
        visible={showAndroidModal} 
        onClose={() => setShowAndroidModal(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  mainWrapper: {
    width: '100%',
    alignSelf: 'center',
  },
  tabletContainer: {
    maxWidth: 1040,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  heroHeader: {
    backgroundColor: colors.surface,
    padding: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 20,
    ...shadows.card,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  logoEmoji: {
    fontSize: 26,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: -0.5,
  },
  appTagline: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 1,
  },
  headerControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themePill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  themePillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  streakText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E65100',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.sage,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.sageDark,
  },
  heroDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  importBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
  },
  importIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EDE7F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  importTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  importSubtitle: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  importActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  formatTag: {
    backgroundColor: '#E8EAF6',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  formatTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#3949AB',
  },
  primaryActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 20,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.primaryBorder,
    ...shadows.cardHover,
    gap: 16,
  },
  primaryActionCardTablet: {
    marginHorizontal: 0,
    padding: 26,
  },
  primaryActionIconBox: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  primaryActionEmoji: {
    fontSize: 34,
  },
  primaryActionContent: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  newBadge: {
    backgroundColor: colors.primaryLight,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: 0.5,
  },
  primaryActionDmc: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  primaryActionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  primaryActionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  primaryActionArrowBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.glowPrimary,
  },
  arrowIcon: {
    fontSize: 20,
    color: colors.textInverted,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  gridContainer: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  gridContainerTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 0,
    gap: 14,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    ...shadows.card,
    gap: 14,
  },
  actionCardTablet: {
    width: '48.8%',
  },
  actionIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionCardEmoji: {
    fontSize: 24,
  },
  actionCardTextWrap: {
    flex: 1,
  },
  actionCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  actionCardDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  recentSection: {
    marginBottom: 20,
  },
  demoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    ...shadows.card,
    gap: 16,
  },
  demoCardTablet: {
    marginHorizontal: 0,
  },
  demoThumb: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  demoInfo: {
    flex: 1,
  },
  demoDetails: {
    fontSize: 11,
    color: colors.textMuted,
  },
  demoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 3,
  },
  demoSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  openBtn: {
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  openBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  footerNote: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  footerText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
