import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, shadows } from '../theme/colors';
import { useResponsive } from '../theme/useResponsive';

const FAQScreen = () => {
  const { isTabletOrLarger } = useResponsive();

  const faqs = [
    {
      q: 'Jak działa zaznaczanie wielu kratek na raz (drag-to-mark)?',
      a: 'W edytorze wzoru upewnij się, że masz aktywne narzędzie 🪡 Haftuj oraz włączony tryb 🔒 Przeciąganie palcem. Wystarczy przesunąć palcem lub rysikiem (Apple Pencil / S-Pen) po kratkach, aby błyskawicznie oznaczyć wyhaftowane fragmenty! Gdy chcesz przesunąć płótno, kliknij kłódeczkę, aby przełączyć na 🔓 Przewijanie.',
    },
    {
      q: 'Jak zainstalować aplikację na iPadzie lub Androidzie?',
      a: 'Na iPadzie: otwórz stronę w Safari, kliknij ikonę Udostępnij [ 📤 ] i wybierz „Do ekranu początkowego”. Na Androidzie: kliknij menu trzech kropek [ ⋮ ] w Chrome i kliknij „Zainstaluj aplikację”. Mulina uruchamia się w trybie pełnoekranowym bez pasków przeglądarki.',
    },
    {
      q: 'Jak dobrać gęstość kanwy (Aida 11, 14, 16, 18 ct)?',
      a: 'Liczba ct (count) to liczba krzyżyków na jeden cal (2.54 cm). Aida 14 ct to najbardziej uniwersalna kanwa (5.4 ściegu/cm). Jeśli chcesz większe, łatwiejsze ściegi – wybierz Aida 11 ct. Jeśli zależy Ci na dużej szczegółowości – wybierz Aida 16 lub 18 ct.',
    },
    {
      q: 'Czy mogę wyeksportować wzór do wydruku PDF?',
      a: 'Tak! W edytorze wzoru kliknij przycisk „📄 PDF Wzoru” w prawym górnym rogu. Aplikacja wygeneruje profesjonalny arkusz z okładką, tabelą zakupową mulin DMC z podziałem na pasemka oraz czytelnym schematem symboli z siatką 10×10 i linijkami współrzędnych.',
    },
    {
      q: 'Czy aplikacja działa offline bez dostępu do sieci?',
      a: 'Tak! Dzięki technologii PWA (Progressive Web App) i lokalnemu zapisowi, po załadowaniu wzoru możesz haftować offline w podróży, w parku czy w samolocie.',
    },
    {
      q: 'Czym jest funkcja „Usuń confetti” (🪄)?',
      a: 'Pojedyncze, odosobnione krzyżyki o unikalnym kolorze (tzw. confetti) są uciążliwe przy haftowaniu, ponieważ wymagają częstej zmiany nitki. Narzędzie różdżki 🪄 zastępuje samotne ściegi najbardziej dominującym kolorem otoczenia.',
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.innerWrapper, isTabletOrLarger && styles.tabletWrapper]}>
        <Text style={styles.title}>❓ Poradnik & Najczęstsze pytania</Text>
        <Text style={styles.subtitle}>Wskazówki dla hafciarek korzystających z tabletu i telefonu</Text>

        {faqs.map((faq, idx) => (
          <View key={idx} style={styles.qaBox}>
            <Text style={styles.q}>• {faq.q}</Text>
            <Text style={styles.a}>{faq.a}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background, 
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
    paddingHorizontal: 20,
  },
  title: { 
    fontSize: 22, 
    fontWeight: '800', 
    marginBottom: 4, 
    color: colors.textPrimary, 
    textAlign: 'center' 
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  qaBox: { 
    marginBottom: 14, 
    backgroundColor: colors.surface, 
    borderRadius: 16, 
    padding: 18,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    ...shadows.card,
  },
  q: { 
    fontWeight: '700', 
    fontSize: 15, 
    marginBottom: 8, 
    color: colors.primaryDark,
    lineHeight: 21,
  },
  a: { 
    fontSize: 13, 
    color: colors.textSecondary, 
    lineHeight: 20 
  },
});

export default FAQScreen;
