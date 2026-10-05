import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useResponsive } from '../theme/useResponsive';
import { shadows } from '../theme/colors';
import {
  getAppPreferences,
  saveAppPreferences,
  resetAppPreferences,
  AppPreferences,
  DEFAULT_PREFERENCES,
} from '../services/appPreferences';
import { useAuth } from '../services/authContext';
import {
  HoopIcon,
  NeedleIcon,
  FlossSkeinIcon,
  FlowerIcon,
  BirdIcon,
  RusticDivider,
} from '../components/RusticIcons';

export default function SettingsWizardScreen() {
  const navigation = useNavigation<any>();
  const { theme, themeMode, setThemeMode } = useTheme();
  const { isTabletOrLarger } = useResponsive();
  const { user, logout } = useAuth();

  const [prefs, setPrefs] = useState<AppPreferences>(DEFAULT_PREFERENCES);
  const [savedBadge, setSavedBadge] = useState(false);

  useEffect(() => {
    (async () => {
      const p = await getAppPreferences();
      setPrefs(p);
    })();
  }, []);

  const updatePreference = async <K extends keyof AppPreferences>(
    key: K,
    value: AppPreferences[K]
  ) => {
    const updated = await saveAppPreferences({ [key]: value });
    setPrefs(updated);
    setSavedBadge(true);
    setTimeout(() => setSavedBadge(false), 1500);
  };

  const handleResetDefaults = () => {
    Alert.alert(
      'Reset ustawień',
      'Czy na pewno chcesz przywrócić domyślne ustawienia pracowni?',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Przywróć',
          style: 'destructive',
          onPress: async () => {
            const reset = await resetAppPreferences();
            setPrefs(reset);
            setThemeMode('cozy');
            Alert.alert('Sukces', 'Przywrócono domyślne ustawienia.');
          },
        },
      ]
    );
  };

  const fabricOptions: Array<{ id: AppPreferences['defaultFabric']; name: string; desc: string }> = [
    { id: 'aida', name: 'Aida', desc: 'Klasyczna tkanina z wyraźnymi kwadratami' },
    { id: 'evenweave', name: 'Evenweave', desc: 'Gładki splot równomierny (np. Lugana)' },
    { id: 'linen', name: 'Len (Linen)', desc: 'Naturalny, rustykalny splot' },
    { id: 'plastic', name: 'Kanwa Plastikowa', desc: 'Sztywna do zawieszek i breloków' },
  ];

  const brandOptions: Array<AppPreferences['defaultThreadBrand']> = [
    'DMC',
    'Anchor',
    'Ariadna',
    'Madeira',
    'CXC',
    'Dimensions',
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, isTabletOrLarger && styles.tabletScrollContent]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>
              Kreator & Ustawienia Pracowni
            </Text>
            <Text style={[styles.screenSubtitle, { color: theme.textSecondary }]}>
              Dostosuj cyfrowy tamborek pod swój styl haftowania i tablet
            </Text>
          </View>
          {savedBadge && (
            <View style={[styles.savedBadge, { backgroundColor: '#E8F5E9', borderColor: '#C8E6C9' }]}>
              <Text style={styles.savedBadgeText}>Zapisano ✓</Text>
            </View>
          )}
        </View>

        {/* SECTION 1: Theme & Visual Ergonomics */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
          <View style={styles.cardHeaderRow}>
            <FlowerIcon size={20} color={theme.primary} />
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Motyw i ergonomia wzroku</Text>
          </View>
          <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
            Zmień paletę barw, aby chronić wzrok podczas wieczornego haftowania
          </Text>

          <View style={styles.themeSelectorRow}>
            {[
              {
                id: 'cozy' as const,
                title: 'Pastel Cozy',
                desc: 'Ciepły róż & krem Aliny',
                badgeBg: '#FAF7F2',
                badgeBorder: '#D9777F',
                dot: '#D9777F',
              },
              {
                id: 'oled' as const,
                title: 'OLED Czerń',
                desc: 'Głęboka czerń, oszczędza baterię',
                badgeBg: '#121212',
                badgeBorder: '#38D9A9',
                dot: '#38D9A9',
              },
              {
                id: 'redlight' as const,
                title: 'Czerwone Światło',
                desc: 'Maksymalna ochrona melatoniny',
                badgeBg: '#1A0000',
                badgeBorder: '#FF4D4D',
                dot: '#FF4D4D',
              },
            ].map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.themeOptionCard,
                  {
                    backgroundColor: t.badgeBg,
                    borderColor: themeMode === t.id ? t.badgeBorder : theme.surfaceBorder,
                    borderWidth: themeMode === t.id ? 2 : 1,
                  },
                ]}
                onPress={() => setThemeMode(t.id)}
                activeOpacity={0.85}
              >
                <View style={[styles.colorDot, { backgroundColor: t.dot }]} />
                <Text
                  style={[
                    styles.themeOptionTitle,
                    { color: t.id === 'cozy' ? '#2D282A' : '#F5F5F7' },
                  ]}
                >
                  {t.title}
                </Text>
                <Text
                  style={[
                    styles.themeOptionDesc,
                    { color: t.id === 'cozy' ? '#6E6466' : '#A1A1A6' },
                  ]}
                >
                  {t.desc}
                </Text>
                {themeMode === t.id && (
                  <View style={[styles.selectedCheckBadge, { backgroundColor: t.dot }]}>
                    <Text style={styles.selectedCheckText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* SECTION 2: Tamborek i Gesty Dotykowe */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
          <View style={styles.cardHeaderRow}>
            <HoopIcon size={20} color={theme.primary} />
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
              Cyfrowy Tamborek i Gesty Dotykowe
            </Text>
          </View>
          <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
            Zabezpieczenia przed przypadkowym dotknięciem na ekranie dotykowym
          </Text>

          <View style={styles.settingRow}>
            <View style={styles.settingTextCol}>
              <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>
                Blokada gestów dwoma palcami
              </Text>
              <Text style={[styles.settingDesc, { color: theme.textSecondary }]}>
                Zaznaczanie krzyżyka działa tylko jednym palcem. Zoom i przesuwanie dwoma palcami nigdy nie zaznacza ściegów.
              </Text>
            </View>
            <Switch
              value={prefs.twoFingerGesturesOnly}
              onValueChange={(val) => updatePreference('twoFingerGesturesOnly', val)}
              trackColor={{ false: theme.surfaceBorder, true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <RusticDivider color={theme.surfaceBorder} secondaryColor={theme.surfaceBorder} style={{ marginVertical: 8 }} />

          <View style={styles.settingRow}>
            <View style={styles.settingTextCol}>
              <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>
                Domyślne dopasowanie kanwy
              </Text>
              <Text style={[styles.settingDesc, { color: theme.textSecondary }]}>
                Jak nowy wzór ma się otwierać na tamborku
              </Text>
            </View>
            <View style={styles.modePillRow}>
              {[
                { id: 'natural' as const, label: 'Naturalny' },
                { id: 'contain' as const, label: 'Dopasuj' },
                { id: 'cover' as const, label: 'Wypełnij' },
              ].map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={[
                    styles.modePill,
                    {
                      backgroundColor: prefs.defaultFitMode === m.id ? theme.primary : theme.backgroundAlt,
                      borderColor: theme.surfaceBorder,
                    },
                  ]}
                  onPress={() => updatePreference('defaultFitMode', m.id)}
                >
                  <Text
                    style={[
                      styles.modePillText,
                      { color: prefs.defaultFitMode === m.id ? '#FFFFFF' : theme.textPrimary },
                    ]}
                  >
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <RusticDivider color={theme.surfaceBorder} secondaryColor={theme.surfaceBorder} style={{ marginVertical: 8 }} />

          <View style={styles.settingRow}>
            <View style={styles.settingTextCol}>
              <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>
                Wysoki kontrast siatki 10×10
              </Text>
              <Text style={[styles.settingDesc, { color: theme.textSecondary }]}>
                Pogrubia linie kwadratów 10×10 dla łatwiejszego liczenia krzyżyków
              </Text>
            </View>
            <Switch
              value={prefs.highContrastGrid}
              onValueChange={(val) => updatePreference('highContrastGrid', val)}
              trackColor={{ false: theme.surfaceBorder, true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <RusticDivider color={theme.surfaceBorder} secondaryColor={theme.surfaceBorder} style={{ marginVertical: 8 }} />

          <View style={styles.settingRow}>
            <View style={styles.settingTextCol}>
              <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>
                Linijka współrzędnych i numery kratek
              </Text>
              <Text style={[styles.settingDesc, { color: theme.textSecondary }]}>
                Pokazuj numerację kolumn i wierszy na brzegach kanwy
              </Text>
            </View>
            <Switch
              value={prefs.rulerVisible}
              onValueChange={(val) => updatePreference('rulerVisible', val)}
              trackColor={{ false: theme.surfaceBorder, true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* SECTION 3: Domyślne Parametry Wzoru */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
          <View style={styles.cardHeaderRow}>
            <NeedleIcon size={20} color={theme.primary} />
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
              Domyślna tkanina i gęstość kanwy
            </Text>
          </View>
          <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
            Ustawienia podpowiadane automatycznie podczas konwertowania nowego zdjęcia
          </Text>

          {/* Fabric Type Selector */}
          <View style={styles.fabricGrid}>
            {fabricOptions.map((f) => (
              <TouchableOpacity
                key={f.id}
                style={[
                  styles.fabricOptionCard,
                  {
                    backgroundColor: prefs.defaultFabric === f.id ? theme.primaryLight : theme.backgroundAlt,
                    borderColor: prefs.defaultFabric === f.id ? theme.primary : theme.surfaceBorder,
                  },
                ]}
                onPress={() => updatePreference('defaultFabric', f.id)}
              >
                <Text
                  style={[
                    styles.fabricOptionTitle,
                    { color: prefs.defaultFabric === f.id ? theme.primaryDark : theme.textPrimary },
                  ]}
                >
                  {f.name}
                </Text>
                <Text style={[styles.fabricOptionDesc, { color: theme.textSecondary }]}>{f.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Aida Count Pill Selector */}
          <Text style={[styles.subSectionTitle, { color: theme.textPrimary }]}>
            Domyślny splot (Aida Count):
          </Text>
          <View style={styles.countPillsRow}>
            {[11, 14, 16, 18, 20, 22].map((cnt) => (
              <TouchableOpacity
                key={cnt}
                style={[
                  styles.countPill,
                  {
                    backgroundColor: prefs.defaultCount === cnt ? theme.primary : theme.backgroundAlt,
                    borderColor: theme.surfaceBorder,
                  },
                ]}
                onPress={() => updatePreference('defaultCount', cnt)}
              >
                <Text
                  style={[
                    styles.countPillText,
                    { color: prefs.defaultCount === cnt ? '#FFFFFF' : theme.textPrimary },
                  ]}
                >
                  {cnt} ct
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* SECTION 4: Nici i Paleta */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
          <View style={styles.cardHeaderRow}>
            <FlossSkeinIcon size={20} color={theme.primary} />
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Domyślny producent mulin</Text>
          </View>
          <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
            Baza barw używana do cyfrowego dopasowania kolorów (Delta-E)
          </Text>

          <View style={styles.brandPillsGrid}>
            {brandOptions.map((brand) => (
              <TouchableOpacity
                key={brand}
                style={[
                  styles.brandPill,
                  {
                    backgroundColor: prefs.defaultThreadBrand === brand ? theme.primary : theme.backgroundAlt,
                    borderColor: theme.surfaceBorder,
                  },
                ]}
                onPress={() => updatePreference('defaultThreadBrand', brand)}
              >
                <Text
                  style={[
                    styles.brandPillText,
                    { color: prefs.defaultThreadBrand === brand ? '#FFFFFF' : theme.textPrimary },
                  ]}
                >
                  {brand}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* SECTION 5: Konto i Chmura Firebase */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
          <View style={styles.cardHeaderRow}>
            <BirdIcon size={20} color={theme.primary} />
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Konto i Chmura Firebase</Text>
          </View>
          <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
            {user
              ? `Zalogowano jako: ${user.displayName || user.email || 'Gość anonimowy'}`
              : 'Nie jesteś zalogowany. Twoje wzory zapisują się w pamięci tego urządzenia.'}
          </Text>

          <View style={styles.accountButtonsRow}>
            {user ? (
              <>
                <TouchableOpacity
                  style={[styles.accountBtn, { backgroundColor: theme.primaryLight, borderColor: theme.primaryBorder }]}
                  onPress={() => navigation.navigate('Profile')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.accountBtnText, { color: theme.primaryDark }]}>Mój Profil & Synchronizacja</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.accountBtn, { backgroundColor: '#FFEBEE', borderColor: '#FFCDD2' }]}
                  onPress={async () => {
                    await logout();
                    Alert.alert('Wylogowano', 'Do zobaczenia w pracowni!');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.accountBtnText, { color: '#C62828' }]}>Wyloguj</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.loginBtn, { backgroundColor: theme.primary }]}
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.88}
              >
                <Text style={styles.loginBtnText}>Zaloguj się lub Załóż konto w chmurze</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Quick Launchers / Navigation Helper */}
        <View style={styles.footerRow}>
          <TouchableOpacity
            style={[styles.footerActionBtn, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}
            onPress={() => navigation.navigate('Onboarding')}
            activeOpacity={0.8}
          >
            <Text style={[styles.footerActionText, { color: theme.textPrimary }]}>📖 Otwórz samouczek</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.footerActionBtn, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}
            onPress={handleResetDefaults}
            activeOpacity={0.8}
          >
            <Text style={[styles.footerActionText, { color: theme.textSecondary }]}>🔄 Przywróć domyślne</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  tabletScrollContent: {
    maxWidth: 760,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  screenSubtitle: {
    fontSize: 12,
    marginTop: 3,
  },
  savedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  savedBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2E7D32',
  },
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    marginBottom: 16,
    ...shadows.card,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  cardSubtitle: {
    fontSize: 12,
    marginBottom: 16,
    lineHeight: 16,
  },
  themeSelectorRow: {
    flexDirection: 'row',
    gap: 10,
  },
  themeOptionCard: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    position: 'relative',
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginBottom: 8,
  },
  themeOptionTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  themeOptionDesc: {
    fontSize: 10,
    lineHeight: 13,
  },
  selectedCheckBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCheckText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  settingTextCol: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  settingDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  modePillRow: {
    flexDirection: 'row',
    gap: 6,
  },
  modePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  modePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  subSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 8,
  },
  fabricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fabricOptionCard: {
    width: '48%',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  fabricOptionTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  fabricOptionDesc: {
    fontSize: 10,
    lineHeight: 13,
  },
  countPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  countPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  countPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  brandPillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  brandPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  brandPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  accountButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  accountBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  loginBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glowPrimary,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 8,
  },
  footerActionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
