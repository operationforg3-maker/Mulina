import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, shadows } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { useResponsive } from '../theme/useResponsive';
import { listRecentPatterns, PatternListItem, getUserStash } from '../services/patternStorage';
import { HoopIcon, NeedleIcon, HearthFlameIcon, FlowerIcon, RusticDivider } from '../components/RusticIcons';

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { theme, themeMode } = useTheme();
  const { isTabletOrLarger } = useResponsive();

  const [patterns, setPatterns] = useState<PatternListItem[]>([]);
  const [totalStashColors, setTotalStashColors] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);

  // Gamification states
  const streakDays = 7;
  const stitchesToday = 260;
  const totalStitchesCount = 14850;
  const stitchingSpeedPerHour = 135;

  useEffect(() => {
    (async () => {
      try {
        const recent = await listRecentPatterns();
        setPatterns(recent || []);
        const stash = await getUserStash();
        setTotalStashColors(Object.keys(stash || {}).length);
      } catch (e) {
        console.warn('Failed to load profile data', e);
      }
    })();
  }, []);

  const handleShareStory = async () => {
    try {
      const message = `🌸 Mój postęp w Mu'alina dzisiaj:\n✨ +${stitchesToday} ściegów dzisiaj!\n🔥 Seria: ${streakDays} dni z haftem z rzędu!\n🧵 Sprawdź swój cyfrowy tamborek w Mu'alina!`;
      await Share.share({
        message,
        title: "Mój postęp w hafcie Mu'alina",
      });
    } catch (error: any) {
      Alert.alert('Udostępnianie', 'Zapisano podsumowanie postępów!');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.wrapper, isTabletOrLarger && styles.tabletWrapper]}>
          
          {/* Profile Header Card */}
          <View style={[styles.profileCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
            <View style={styles.profileHeaderRow}>
              <View style={[styles.avatarBox, { backgroundColor: theme.primaryLight, borderColor: theme.primaryBorder }]}>
                <NeedleIcon size={32} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <Text style={[styles.userName, { color: theme.textPrimary }]}>Hafciarka Kasia</Text>
                  <View style={[styles.levelBadge, { backgroundColor: theme.caramelLight, borderColor: theme.caramelBorder }]}>
                    <Text style={[styles.levelBadgeText, { color: theme.caramelDark }]}>Złota Igła (Poz. 4)</Text>
                  </View>
                </View>
                <Text style={[styles.userBio, { color: theme.textSecondary }]}>
                  Pasjonatka motywów botanicznych i pejzaży • DMC & Aida 14ct
                </Text>
              </View>
            </View>

            {/* Streak & Daily Progress Row */}
            <View style={styles.streakBanner}>
              <View style={[styles.streakBox, { backgroundColor: theme.primaryLight }]}>
                <HearthFlameIcon size={20} color="#E65100" />
                <View>
                  <Text style={[styles.streakNumber, { color: theme.primaryDark }]}>{streakDays} dni</Text>
                  <Text style={[styles.streakLabel, { color: theme.textSecondary }]}>Seria z haftem</Text>
                </View>
              </View>

              <View style={[styles.streakBox, { backgroundColor: theme.sageLight }]}>
                <NeedleIcon size={18} color={theme.sageDark} />
                <View>
                  <Text style={[styles.streakNumber, { color: theme.sageDark }]}>+{stitchesToday}</Text>
                  <Text style={[styles.streakLabel, { color: theme.textSecondary }]}>Wkłuć dzisiaj</Text>
                </View>
              </View>

              <View style={[styles.streakBox, { backgroundColor: theme.lavenderLight }]}>
                <FlowerIcon size={18} color={theme.lavender} />
                <View>
                  <Text style={[styles.streakNumber, { color: theme.lavender }]}>{stitchingSpeedPerHour}/h</Text>
                  <Text style={[styles.streakLabel, { color: theme.textSecondary }]}>Średnie tempo</Text>
                </View>
              </View>
            </View>

            {/* Social Share Card CTA */}
            <TouchableOpacity 
              style={[styles.shareStoryBtn, { backgroundColor: theme.primary }]}
              onPress={() => setShowShareModal(true)}
              activeOpacity={0.88}
            >
              <Text style={styles.shareStoryBtnText}>Wygeneruj pastelową kartę na Stories / TikTok</Text>
            </TouchableOpacity>
          </View>

          {/* Badges & Achievements */}
          <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Odznaki & Osiągnięcia</Text>
            <View style={styles.badgesGrid}>
              {[
                { title: 'Pierwszy tamborek', desc: 'Ukończono 1 pełny schemat', earned: true },
                { title: 'Kolekcjoner Mulin', desc: `${totalStashColors} kolorów w piórniku`, earned: true },
                { title: 'Nocny Marek', desc: 'Haftowanie w trybie OLED po 21:00', earned: true },
                { title: 'Maraton Igły', desc: '7 dni haftowania z rzędu', earned: true },
                { title: 'Mistrz Barw', desc: 'Projekt z ponad 50 kolorami', earned: false },
              ].map((badge, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.badgeItem,
                    { backgroundColor: theme.backgroundAlt, borderColor: theme.surfaceBorder },
                    !badge.earned && { opacity: 0.45 },
                  ]}
                >
                  <HoopIcon size={24} color={badge.earned ? theme.primary : theme.textMuted} style={{ marginBottom: 4 }} />
                  <Text style={[styles.badgeTitle, { color: theme.textPrimary }]}>{badge.title}</Text>
                  <Text style={[styles.badgeDesc, { color: theme.textSecondary }]}>{badge.desc}</Text>
                  {badge.earned ? (
                    <Text style={[styles.earnedBadge, { color: theme.sage }]}>Zdobyto ✓</Text>
                  ) : (
                    <Text style={[styles.earnedBadge, { color: theme.textMuted }]}>W trakcie</Text>
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Active Work In Progress (WIP) */}
          <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Moje Tamborki (Projekty WIP)</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ImagePicker')}>
                <Text style={[styles.addLink, { color: theme.primaryDark }]}>+ Nowy wzór</Text>
              </TouchableOpacity>
            </View>

            {patterns.length === 0 ? (
              <View style={styles.emptyWip}>
                <HoopIcon size={34} color={theme.primary} style={{ marginBottom: 6 }} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  Brak zapisanych projektów. Wybierz gotowy wzór lub zaimportuj plik .saga/.pdf!
                </Text>
                <TouchableOpacity
                  style={[styles.startBtn, { backgroundColor: theme.primary }]}
                  onPress={() => navigation.navigate('PatternEditor', { patternId: 'demo' })}
                >
                  <Text style={styles.startBtnText}>Otwórz wzór demonstracyjny ›</Text>
                </TouchableOpacity>
              </View>
            ) : (
              patterns.map((item) => (
                <TouchableOpacity
                  key={item.pattern_id}
                  style={[styles.wipCard, { backgroundColor: theme.backgroundAlt, borderColor: theme.surfaceBorder }]}
                  onPress={() => navigation.navigate('PatternEditor', { patternId: item.pattern_id })}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.wipName, { color: theme.textPrimary }]}>{item.name}</Text>
                    <Text style={[styles.wipDetails, { color: theme.textSecondary }]}>
                      {item.width_stitches}×{item.height_stitches} ściegów • {item.color_count} kolorów DMC
                    </Text>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${item.progress_percent}%`, backgroundColor: theme.sage }]} />
                    </View>
                  </View>
                  <View style={styles.percentBox}>
                    <Text style={[styles.percentText, { color: theme.primaryDark }]}>{item.progress_percent}%</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

        </View>
      </ScrollView>

      {/* Social Media Card Modal */}
      {showShareModal && (
        <View style={styles.modalBackdrop}>
          <View style={[styles.shareModalCard, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>✨ Karta na Instagram / TikTok</Text>
              <TouchableOpacity onPress={() => setShowShareModal(false)}>
                <Text style={{ fontSize: 18, color: theme.primaryDark, fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Pastel Aesthetic Social Story Preview */}
            <View style={styles.socialStoryCard}>
              <View style={styles.storyTop}>
                <Text style={styles.storyLogo}>Mu'Alina</Text>
                <Text style={styles.storyDate}>{new Date().toLocaleDateString('pl-PL')}</Text>
              </View>

              <View style={styles.storyArtContainer}>
                <HoopIcon size={52} color={theme.primary} />
                <Text style={styles.storyProjectName}>Górski Krajobraz (Haft Krzyżykowy)</Text>
              </View>

              <View style={styles.storyStatsGrid}>
                <View style={styles.storyStatItem}>
                  <Text style={styles.storyStatNum}>+{stitchesToday}</Text>
                  <Text style={styles.storyStatTxt}>Wkłuć dzisiaj</Text>
                </View>
                <View style={styles.storyStatItem}>
                  <Text style={styles.storyStatNum}>{streakDays} dni</Text>
                  <Text style={styles.storyStatTxt}>Seria haftu</Text>
                </View>
                <View style={styles.storyStatItem}>
                  <Text style={styles.storyStatNum}>65%</Text>
                  <Text style={styles.storyStatTxt}>Ukończono</Text>
                </View>
              </View>

              <Text style={styles.storyFooter}>Tworzone z miłością w aplikacji Mu'Alina</Text>
            </View>

            <TouchableOpacity
              style={[styles.shareActionBtn, { backgroundColor: theme.primary }]}
              onPress={handleShareStory}
            >
              <Text style={styles.shareActionBtnText}>Udostępnij na Stories / Zapisz</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  wrapper: {
    width: '100%',
    alignSelf: 'center',
  },
  tabletWrapper: {
    maxWidth: 880,
  },
  profileCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    ...shadows.card,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
  },
  levelBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  userBio: {
    fontSize: 13,
    marginTop: 4,
  },
  streakBanner: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 16,
  },
  streakBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    gap: 8,
  },
  streakEmoji: {
    fontSize: 22,
  },
  streakNumber: {
    fontSize: 15,
    fontWeight: '800',
  },
  streakLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  shareStoryBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    ...shadows.glowPrimary,
  },
  shareStoryBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionCard: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    ...shadows.card,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  addLink: {
    fontSize: 13,
    fontWeight: '700',
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badgeItem: {
    flex: 1,
    minWidth: 140,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  badgeTitle: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  badgeDesc: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 6,
  },
  earnedBadge: {
    fontSize: 11,
    fontWeight: '800',
  },
  emptyWip: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  startBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  startBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  wipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  wipName: {
    fontSize: 14,
    fontWeight: '700',
  },
  wipDetails: {
    fontSize: 11,
    marginVertical: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  percentBox: {
    marginLeft: 12,
  },
  percentText: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 999,
  },
  shareModalCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 22,
    padding: 20,
    ...shadows.cardHover,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  socialStoryCard: {
    backgroundColor: '#FCE4EC', // Powder pastel rose
    borderRadius: 18,
    padding: 20,
    borderWidth: 2,
    borderColor: '#ECC3C8',
    marginBottom: 16,
  },
  storyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storyLogo: {
    fontSize: 15,
    fontWeight: '900',
    color: '#A84C54',
  },
  storyDate: {
    fontSize: 11,
    color: '#6E6466',
    fontWeight: '600',
  },
  storyArtContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  storyProjectName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2D282A',
    marginTop: 6,
    textAlign: 'center',
  },
  storyStatsGrid: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  storyStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  storyStatNum: {
    fontSize: 16,
    fontWeight: '900',
    color: '#D9777F',
  },
  storyStatTxt: {
    fontSize: 10,
    color: '#6E6466',
    marginTop: 2,
  },
  storyFooter: {
    fontSize: 10,
    color: '#8E82B5',
    textAlign: 'center',
    fontWeight: '700',
  },
  shareActionBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    ...shadows.glowPrimary,
  },
  shareActionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
