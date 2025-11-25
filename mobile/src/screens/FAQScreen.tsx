import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

const FAQScreen = () => (
  <ScrollView style={styles.container} contentContainerStyle={styles.content}>
    <Text style={styles.title}>FAQ – Najczęstsze pytania</Text>
    <View style={styles.qaBox}>
      <Text style={styles.q}>Jak działa Mulina?</Text>
      <Text style={styles.a}>Aplikacja pozwala zamienić zdjęcie w profesjonalny wzór haftu, dobrać kolory nici i zarządzać projektami offline.</Text>
    </View>
    <View style={styles.qaBox}>
      <Text style={styles.q}>Czy muszę mieć internet?</Text>
      <Text style={styles.a}>Nie! Wszystkie funkcje edycji i przeglądania wzorów działają offline.</Text>
    </View>
    <View style={styles.qaBox}>
      <Text style={styles.q}>Jak kupić tokeny?</Text>
      <Text style={styles.a}>Przejdź do sekcji „Kup Tokeny” na ekranie głównym i wybierz pakiet.</Text>
    </View>
    <View style={styles.qaBox}>
      <Text style={styles.q}>Jak dodać własne nici do inwentarza?</Text>
      <Text style={styles.a}>W sekcji „Moje nitki” możesz wyszukać i dodać posiadane kolory do swojej kolekcji.</Text>
    </View>
    <View style={styles.qaBox}>
      <Text style={styles.q}>Jak udostępnić lub sprzedać wzór?</Text>
      <Text style={styles.a}>Wygeneruj wzór i opublikuj go w Marketplace. Inni użytkownicy mogą go kupić lub pobrać.</Text>
    </View>
    <View style={styles.qaBox}>
      <Text style={styles.q}>Gdzie zgłosić problem lub sugestię?</Text>
      <Text style={styles.a}>Napisz na support@mulina.app lub skorzystaj z formularza w ustawieniach.</Text>
    </View>
  </ScrollView>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 24, color: '#6366f1', textAlign: 'center' },
  qaBox: { marginBottom: 20, backgroundColor: '#f3f4f6', borderRadius: 12, padding: 16 },
  q: { fontWeight: 'bold', fontSize: 16, marginBottom: 6, color: '#374151' },
  a: { fontSize: 15, color: '#222' },
});

export default FAQScreen;
