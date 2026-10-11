import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
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
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [faqSearch, setFaqSearch] = useState('');

  const faqs = [
    {
      icon: (c: string) => <NeedleIcon size={20} color={c} />,
      question: 'Jak działa bezpieczne zaznaczanie krzyżyków?',
      answer: 'W edytorze wzoru kłódeczka i wykrywanie gestów zabezpieczają przed omyłkowym zaznaczeniem. Gdy wykonujesz gest pinch-to-zoom lub przesuwasz kanwę dwoma palcami, aplikacja automatycznie blokuje zaznaczanie ściegów. Możesz bezpiecznie powiększać drobne detale!',
    },
    {
      icon: (c: string) => <HoopIcon size={20} color={c} />,
      question: 'Jak zainstalować aplikację na iPadzie lub Androidzie jako PWA?',
      answer: 'Na iPadzie/iPhone: otwórz aplikację w Safari, kliknij ikonę Udostępnij [ 📤 ] i wybierz „Do ekranu początkowego”. Na Androidzie: kliknij menu trzech kropek [ ⋮ ] w Chrome i kliknij „Zainstaluj aplikację”. Mu\'Alina uruchamia się w pełnoekranowym trybie natywnym.',
    },
    {
      icon: (c: string) => <CameraCraftIcon size={20} color={c} />,
      question: 'Jak dobrać gęstość kanwy (Aida 11, 14, 16, 18 ct)?',
      answer: 'Liczba ct (count) oznacza liczbę krzyżyków na 1 cal (2.54 cm). Aida 14 ct to najbardziej uniwersalna kanwa (5.4 ściegu/cm). Jeśli chcesz większe, łatwiejsze ściegi – wybierz Aida 11 ct. Przy drobnych, wyrazistych portretach – wybierz Aida 16 lub 18 ct.',
    },
    {
      icon: (c: string) => <FlossSkeinIcon size={20} color={c} />,
      question: 'Czy mogę wyeksportować schemat do wydruku PDF?',
      answer: 'Tak! W edytorze wzoru kliknij przycisk „📄 PDF”. Aplikacja wygeneruje arkusz z okładką, tabelą zakupową mulin DMC z podziałem na metry/pasemka oraz czytelnym schematem symboli z siatką 10×10.',
    },
    {
      icon: (c: string) => <FlowerIcon size={20} color={c} />,
      question: 'Czym jest funkcja usuwania confetti (anty-confetti)?',
      answer: 'Pojedyncze, odosobnione krzyżyki o unikalnym kolorze (tzw. confetti) są uciążliwe przy haftowaniu, ponieważ wymagają ciągłej zmiany igły i nitek. Nasz algorytm zastępuje samotne piksele dominującym kolorem otoczenia, drastycznie ułatwiając pracę.',
    },
    {
      icon: (c: string) => <HoopIcon size={20} color={c} />,
      question: 'Jak działa synchronizacja w chmurze Firebase?',
      answer: 'Po zalogowaniu w Profilu możesz jednym kliknięciem zapisać całą swoją bibliotekę wzorów i stan wyhaftowanych kratek w bezpiecznej bazie Firebase Firestore. Na drugim urządzeniu kliknij „Pobierz z chmury”, a wzory natychmiast się połączą.',
    },
  ];

  const filteredFaqs = faqs.filter(
    (faq) =>
      !faqSearch ||
      faq.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
      faq.answer.toLowerCase().includes(faqSearch.toLowerCase())
  );

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

        {/* Search Bar */}
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: theme.surface, borderColor: theme.surfaceBorder },
          ]}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder="Szukaj w poradniku..."
            placeholderTextColor={theme.textSecondary}
            value={faqSearch}
            onChangeText={(text) => {
              setFaqSearch(text);
              setExpandedFaq(null);
            }}
          />
          {faqSearch.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setFaqSearch('');
                setExpandedFaq(null);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.clearSearchText, { color: theme.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* FAQ Accordion Items */}
        {filteredFaqs.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Nie znaleziono tematów dla „{faqSearch}”.
            </Text>
          </View>
        ) : (
          filteredFaqs.map((faq, index) => {
            const isExpanded = expandedFaq === index;
            return (
              <View
                key={index}
                style={[
                  styles.qaBox,
                  { backgroundColor: theme.surface, borderColor: theme.surfaceBorder },
                ]}
              >
                <TouchableOpacity
                  onPress={() => setExpandedFaq(isExpanded ? null : index)}
                  activeOpacity={0.7}
                >
                  <View style={styles.faqQuestionRow}>
                    <View style={[styles.qaIconCircle, { backgroundColor: theme.primaryLight }]}>
                      {faq.icon(theme.primary)}
                    </View>
                    <Text style={[styles.faqQuestion, { color: theme.textPrimary }]}>
                      {faq.question}
                    </Text>
                    <Text style={[styles.arrowIcon, { color: theme.primary }]}>
                      {isExpanded ? '▼' : '▶'}
                    </Text>
                  </View>
                </TouchableOpacity>
                {isExpanded && (
                  <Text style={[styles.faqAnswer, { color: theme.textSecondary }]}>
                    {faq.answer}
                  </Text>
                )}
              </View>
            );
          })
        )}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    marginBottom: 16,
    ...shadows.card,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 4,
  },
  clearSearchText: {
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 6,
  },
  emptyContainer: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginVertical: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  qaBox: { 
    marginBottom: 14, 
    borderRadius: 18, 
    padding: 16,
    borderWidth: 1,
    ...shadows.card,
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qaIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faqQuestion: { 
    flex: 1,
    fontWeight: '800', 
    fontSize: 14, 
    lineHeight: 20,
  },
  arrowIcon: {
    fontSize: 15,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  faqAnswer: { 
    fontSize: 13, 
    lineHeight: 20,
    paddingLeft: 48,
    paddingRight: 8,
    paddingTop: 10,
  },
});

export default FAQScreen;
