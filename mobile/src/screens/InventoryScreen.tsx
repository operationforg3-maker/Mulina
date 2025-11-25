import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Linking } from 'react-native';
import ListSkeleton from '../components/ListSkeleton';
import apiService, { Thread } from '../services/api';
import { useNavigation } from '@react-navigation/native';

export default function InventoryScreen() {
  const navigation = useNavigation();
  const [inventory, setInventory] = useState<string[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const inv = await apiService.getUserInventory();
      setInventory(inv);
      const allThreads = await apiService.getThreads('DMC'); // Można dodać wybór marki
      setThreads(allThreads);
    } catch (e) {
      Alert.alert('Błąd', 'Nie udało się pobrać inwentarza.');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyThread = (thread: Thread) => {
    // Przykładowy link partnerski DMC (można podmienić na realny)
    const url = `https://www.amazon.pl/s?k=DMC+${thread.colorCode}`;
    Linking.openURL(url);
  };

  const renderThread = ({ item }: { item: Thread }) => {
    const owned = inventory.includes(item.threadId);
    return (
      <View style={[styles.threadRow, owned && styles.ownedRow]}>
        <View style={styles.colorSwatch}>
          <View style={{ backgroundColor: item.hexColor, width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: '#ddd' }} />
        </View>
        <View style={styles.threadInfo}>
          <Text style={styles.threadName}>{item.colorName}</Text>
          <Text style={styles.threadCode}>{item.brand} {item.colorCode}</Text>
        </View>
        <TouchableOpacity style={styles.buyButton} onPress={() => handleBuyThread(item)}>
          <Text style={styles.buyButtonText}>Kup</Text>
        </TouchableOpacity>
        {owned && <Text style={styles.ownedLabel}>✔</Text>}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inwentarz nici</Text>
      <Text style={styles.desc}>Zaznacz posiadane kolory. Twój inwentarz wpływa na dobór kolorów przy generowaniu wzorów. Kliknij „Kup”, aby zamówić brakujące nici przez link partnerski.</Text>
      {loading ? <ListSkeleton rows={12} height={48} /> : (
        <FlatList
          data={threads}
          keyExtractor={item => item.threadId}
          renderItem={renderThread}
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}
      <TouchableOpacity style={styles.homeButton} onPress={() => navigation.navigate('Home' as never)}>
        <Text style={styles.homeButtonText}>← Strona główna</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8, color: '#1e293b' },
  desc: { fontSize: 15, color: '#334155', marginBottom: 16 },
  threadRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  ownedRow: { backgroundColor: '#e0f2fe' },
  colorSwatch: { marginRight: 12 },
  threadInfo: { flex: 1 },
  threadName: { fontSize: 16, fontWeight: '500', color: '#0f172a' },
  threadCode: { fontSize: 13, color: '#64748b' },
  buyButton: { backgroundColor: '#fbbf24', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginLeft: 8 },
  buyButtonText: { color: '#78350f', fontWeight: '600' },
  ownedLabel: { marginLeft: 8, color: '#059669', fontWeight: 'bold', fontSize: 18 },
  homeButton: { marginTop: 16, alignSelf: 'flex-start', backgroundColor: '#e0e7ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  homeButtonText: { color: '#3730a3', fontWeight: '600', fontSize: 14 },
});
