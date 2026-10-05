import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { shadows } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { useResponsive } from '../theme/useResponsive';
import {
  HoopIcon,
  NeedleIcon,
  CameraCraftIcon,
  FlossSkeinIcon,
  FlowerIcon,
  RusticDivider,
} from '../components/RusticIcons';

const FAQScreen = () => {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const { isTabletOrLarger } = useResponsive();

  const faqs = [
    {
      icon: (c: string) => <NeedleIcon size={20} color={c} />,
      q: 'Jak działa bezpieczne zaznaczanie krzyżyków?',
      a: 'W edytorze wzoru kłódeczka i wykrywanie gestów zabezpieczają przed omyłkowym zaznaczeniem. Gdy wykonujesz gest pinch-to-zoom lub przesuwasz kanwę dwoma palcami, aplikacja automatycznie blokuje zaznaczanie ściegów. Możesz bezpiecznie powiększać drobne detale!',
    },
    {
      icon: (c: string) => <HoopIcon size={20} color={c} />,
      q: 'Jak zainstalować aplikację na iPadzie lub Androidzie jako PWA?',
      a: 'Na iPadzie/iPhone: otwórz aplikację w Safari, kliknij ikonę Udostępnij [ 📤 ] i wybierz „Do ekranu początkowego”. Na Androidzie: kliknij menu trzech kropek [ ⋮ ] w Chrome i kliknij „Zainstaluj aplikację”. Mu\'Alina uruchamia się w pełnoekranowym trybie natywnym.',
    },
    {
      icon: (c: string) => <CameraCraftIcon size={20} color={c} />,
      q: 'Jak dobrać gęstość kanwy (Aida 11, 14, 16, 18 ct)?',
      a: 'Liczba ct (count) oznacza liczbę krzyżyków na 1 cal (2.54 cm). Aida 14 ct to najbardziej uniwersalna kanwa (5.4 ściegu/cm). Jeśli chcesz większe, łatwiejsze ściegi – wybierz Aida 11 ct. Przy drobnych, wyrazistych portretach – wybierz Aida 16 lub 18 ct.',
    },
    {
      icon: (c: string) => <FlossSkeinIcon size={20} color={c} />,
      q: 'Czy mogę wyeksportować schemat do wydruku PDF?',
      a: 'Tak! W edytorze wzoru kliknij przycisk „📄 PDF”. Aplikacja wygeneruje arkusz z okładką, tabelą zakupową mulin DMC z podziałem na metry/pasemka oraz czytelnym schematem symboli z siatką 10×10.',
    },
    {
      icon: (c: string) => <FlowerIcon size={20} color={c} />,
      q: 'Czym jest funkcja usuwania confetti (anty-confetti)?',
      a: 'Pojedyncze, odosobnione krzyżyki o unikalnym kolorze (tzw. confetti) są uciążliwe przy haftowaniu, ponieważ wymagają ciągłej zmiany igły i nitek. Nasz algorytm zastępuje samotne piksele dominującym kolorem otoczenia, drastycznie ułatwiając pracę.',
    },
    {
      icon: (c: string) => <HoopIcon size={20} color={c} />,
      q: 'Jak działa synchronizacja w chmurze Firebase?',
      a: 'Po zalogowaniu w Profilu możesz jednym kliknięciem zapisać całą swoją bibliotekę wzorów i stan wyhaftowanych kratek w bezpiecznej bazie Firebase Firestore. Na drugim urządzeniu kliknij „Pobierz z chmury”, a wzory natychmiast się połączą.',
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.innerWrapper, isTabletOrLarger && styles.tabletWrapper]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Poradnik & Najczęstsze Pytania</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Kompendium wiedzy o hafcie, doborze mulin i cyfrowym tamborku
          </Text>
        </View>

        {/* Quick Help Strip */}
        <View style={styles.quickHelpStrip}>
          <TouchableOpacity
            style={[styles.helpStripBtn, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}
            onPress={() => navigation.navigate('Onboarding')}
            activeOpacity={0.8}
          >
            <Text style={[styles.helpStripBtnText, { color: theme.primary }]}>📖 Otwórz Samouczek (Walkthrough)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.helpStripBtn, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.8}
          >
            <Text style={[styles.helpStripBtnText, { color: theme.textPrimary }]}>⚙️ Kreator Ustawień</Text>
          </TouchableOpacity>
        </View>

        <RusticDivider color={theme.primary} secondaryColor={theme.sage} style={{ marginVertical: 14 }} />

        {/* FAQ Items */}
        {faqs.map((faq, idx) => (
          <View
            key={idx}
            style={[
              styles.qaBox,
              { backgroundColor: theme.surface, borderColor: theme.surfaceBorder },
            ]}
          >
            <View style={styles.qaHeaderRow}>
              <View style={[styles.qaIconCircle, { backgroundColor: theme.primaryLight }]}>
                {faq.icon(theme.primary)}
              </View>
              <Text style={[styles.q, { color: theme.textPrimary }]}>{faq.q}</Text>
            </View>
            <Text style={[styles.a, { color: theme.textSecondary }]}>{faq.a}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
  },
  content: { 
    padding: 20, 
    paddingBottom: 40, 
  },
  innerWrapper: {
    width: '100%',
    alignSelf: 'center',
  },
  tabletWrapper: {
    maxWidth: 820,
    paddingHorizontal: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { 
    fontSize: 22, 
    fontWeight: '800', 
    marginBottom: 4, 
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  quickHelpStrip: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  },
  helpStripBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  helpStripBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  qaBox: { 
    marginBottom: 14, 
    borderRadius: 18, 
    padding: 18,
    borderWidth: 1,
    ...shadows.card,
  },
  qaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  qaIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  q: { 
    flex: 1,
    fontWeight: '800', 
    fontSize: 14, 
    lineHeight: 20,
  },
  a: { 
    fontSize: 13, 
    lineHeight: 20,
    paddingLeft: 48,
  },
});

export default FAQScreen;
