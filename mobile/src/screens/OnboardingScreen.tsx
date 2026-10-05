import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useResponsive } from '../theme/useResponsive';
import { shadows } from '../theme/colors';
import { saveAppPreferences } from '../services/appPreferences';
import {
  HoopIcon,
  NeedleIcon,
  CameraCraftIcon,
  FlossSkeinIcon,
  BirdIcon,
  FlowerIcon,
  RusticDivider,
} from '../components/RusticIcons';

interface Step {
  id: number;
  tag: string;
  title: string;
  subtitle: string;
  description: string;
  icon: (color: string) => React.ReactNode;
  tips: string[];
}

export default function OnboardingScreen() {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const { isTabletOrLarger } = useResponsive();
  const { width } = useWindowDimensions();

  const [currentStep, setCurrentStep] = useState(0);

  const steps: Step[] = [
    {
      id: 1,
      tag: 'WITAMY W PRACOWNI',
      title: "Cześć! Poznaj Mu'Alina",
      subtitle: 'Twój pastelowy tamborek do haftu krzyżykowego',
      description:
        'Aplikacja stworzona z sercem dla pasjonatów haftu. Zamienia zdjęcia w profesjonalne wzory mulin DMC, czyta pliki .saga / .xsd i pozwala zaznaczać postępy na ekranie telefonu i tabletu.',
      icon: (c) => <BirdIcon size={64} color={c} />,
      tips: [
        'Przełączaj pastelowy motyw na tryb nocny OLED lub czerwone światło',
        'Projektuj wzory z zachowaniem naturalnych proporcji fotografii',
        'Wszystkie dane zapisują się lokalnie i w Twojej chmurze',
      ],
    },
    {
      id: 2,
      tag: 'KREATOR AI ZE ZDJĘĆ',
      title: 'Zamień dowolne zdjęcie we wzór',
      subtitle: 'Precyzyjny dobór mulin DMC, Anchor i Ariadna',
      description:
        'Wgraj zdjęcie ze swojego telefonu lub zrób nowe. Nasz 3-krokowy kreator automatycznie dopasuje rozmiar tamborka, gęstość kanwy (Aida 11-18 ct) i oczyści samotne krzyżyki (funkcja anty-confetti).',
      icon: (c) => <CameraCraftIcon size={64} color={c} />,
      tips: [
        'Doradca proporcji (Advisor) chroni przed zniekształceniem zdjęcia',
        'Podgląd zapotrzebowania na pasemka muliny i koszt w PLN',
        'Obsługa tamborków okrągłych (10-30 cm) oraz ramek fotograficznych',
      ],
    },
    {
      id: 3,
      tag: 'CYFROWY TAMBOREK',
      title: 'Haftuj z podglądem na żywo',
      subtitle: 'Ochrona przed przypadkowym kliknięciem',
      description:
        'Powiększaj kanwę dwoma palcami bez ryzyka przypadkowego zaznaczenia krzyżyka. Chowaj lewy panel nici, zaznaczaj wykonane ściegi jednym dotknięciem i eksportuj schematy do gotowego wydruku PDF.',
      icon: (c) => <HoopIcon size={64} color={c} />,
      tips: [
        'Zwijany panel nici – maksymalna przestrzeń do haftu na małych ekranach',
        'Tryb dopasowania (Fit) oraz pełnego wypełnienia ekranu (Fill)',
        'Podgląd zaparkowanych nitek i konturów backstitch',
      ],
    },
    {
      id: 4,
      tag: 'SYNCHRONIZACJA & ZAPASY',
      title: 'Zarządzaj swoimi mulinami',
      subtitle: 'Piórnik z nićmi i kopia bezpieczeństwa w chmurze',
      description:
        'Kataloguj swoje zapasy nici z kodami kreskowymi, sprawdzaj brakujące kolory do projektów i synchronizuj wzory między iPadem, Androidem a laptopem dzięki bezpiecznej chmurze Firebase.',
      icon: (c) => <FlossSkeinIcon size={64} color={c} />,
      tips: [
        'Zaloguj się kontem Firebase lub korzystaj anonimowo w trybie offline',
        'Błyskawiczna kopia zapasowa kolekcji do pliku JSON lub chmury',
        'Karty postępów ze statystykami gotowe do udostępnienia na Instagram / TikTok',
      ],
    },
  ];

  const handleFinish = async (targetScreen?: string) => {
    await saveAppPreferences({ hasCompletedOnboarding: true });
    if (targetScreen === 'Settings') {
      navigation.replace('Settings');
    } else if (targetScreen === 'Login') {
      navigation.replace('Login');
    } else {
      navigation.replace('MainTabs');
    }
  };

  const current = steps[currentStep];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, isTabletOrLarger && styles.tabletScrollContent]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header bar with Skip */}
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <Image
              source={require('../../assets/mualina_logo.png')}
              style={styles.logoBadge}
              resizeMode="contain"
            />
            <View>
              <Text style={[styles.brandTitle, { color: theme.textPrimary }]}>Mu'Alina</Text>
              <Text style={[styles.brandSubtitle, { color: theme.textSecondary }]}>Przewodnik po pracowni</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.skipBtn, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}
            onPress={() => handleFinish()}
            activeOpacity={0.8}
          >
            <Text style={[styles.skipText, { color: theme.textSecondary }]}>Pomiń</Text>
          </TouchableOpacity>
        </View>

        {/* Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
          {/* Tag */}
          <View style={[styles.tagBadge, { backgroundColor: theme.primaryLight, borderColor: theme.primaryBorder }]}>
            <Text style={[styles.tagText, { color: theme.primaryDark }]}>{current.tag}</Text>
          </View>

          {/* Visual Showcase */}
          <View style={[styles.iconCircle, { backgroundColor: theme.backgroundAlt, borderColor: theme.surfaceBorder }]}>
            {current.icon(theme.primary)}
          </View>

          <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>{current.title}</Text>
          <Text style={[styles.stepSubtitle, { color: theme.primary }]}>{current.subtitle}</Text>
          <Text style={[styles.stepDesc, { color: theme.textSecondary }]}>{current.description}</Text>

          <RusticDivider color={theme.primary} secondaryColor={theme.sage} style={{ marginVertical: 18 }} />

          {/* Tips List */}
          <View style={styles.tipsContainer}>
            {current.tips.map((tip, idx) => (
              <View key={idx} style={styles.tipRow}>
                <View style={[styles.tipBullet, { backgroundColor: theme.sage }]}>
                  <Text style={styles.tipCheck}>✓</Text>
                </View>
                <Text style={[styles.tipText, { color: theme.textPrimary }]}>{tip}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Step Indicator dots */}
        <View style={styles.dotsRow}>
          {steps.map((_, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => setCurrentStep(idx)}
              style={[
                styles.dot,
                {
                  backgroundColor: currentStep === idx ? theme.primary : theme.surfaceBorder,
                  width: currentStep === idx ? 28 : 10,
                },
              ]}
            />
          ))}
        </View>

        {/* Bottom Actions */}
        <View style={styles.actionsContainer}>
          {currentStep < steps.length - 1 ? (
            <View style={styles.buttonsRow}>
              {currentStep > 0 && (
                <TouchableOpacity
                  style={[styles.prevBtn, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}
                  onPress={() => setCurrentStep((prev) => prev - 1)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.prevBtnText, { color: theme.textPrimary }]}>Wstecz</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.nextBtn, { backgroundColor: theme.primary }]}
                onPress={() => setCurrentStep((prev) => prev + 1)}
                activeOpacity={0.88}
              >
                <Text style={styles.nextBtnText}>Dalej ›</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.finishColumn}>
              <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: theme.primary }]}
                onPress={() => handleFinish()}
                activeOpacity={0.88}
              >
                <Text style={styles.primaryActionText}>🌸 Wejdź do Pracowni Haftu</Text>
              </TouchableOpacity>

              <View style={styles.secondaryActionsRow}>
                <TouchableOpacity
                  style={[styles.secondaryActionBtn, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}
                  onPress={() => handleFinish('Settings')}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.secondaryActionText, { color: theme.textPrimary }]}>⚙️ Dostosuj ustawienia</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.secondaryActionBtn, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}
                  onPress={() => handleFinish('Login')}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.secondaryActionText, { color: theme.textPrimary }]}>☁️ Zaloguj konto Firebase</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
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
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  skipBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  skipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  heroCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 20,
    ...shadows.cardHover,
  },
  tagBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  stepDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  tipsContainer: {
    width: '100%',
    gap: 10,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tipBullet: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipCheck: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  actionsContainer: {
    width: '100%',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  prevBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prevBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  nextBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glowPrimary,
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  finishColumn: {
    gap: 10,
    width: '100%',
  },
  primaryActionBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glowPrimary,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryActionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
