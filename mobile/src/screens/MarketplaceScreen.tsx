import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import ListSkeleton from '../components/ListSkeleton';
import { useNavigation } from '@react-navigation/native';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { firebaseDb } from '../services/firebase';

interface MarketplacePattern {
  id: string;
  title: string;
  description: string;
  price: number;
  author: string;
  authorId: string;
  thumbnail_url: string;
  downloads: number;
  rating: number;
  reviews_count: number;
  created_at: string;
  tags: string[];
}

export default function MarketplaceScreen() {
  const navigation = useNavigation();
  const [patterns, setPatterns] = useState<MarketplacePattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = ['all', 'animals', 'flowers', 'geometric', 'portraits', 'seasonal'];

  useEffect(() => {
    loadMarketplacePatterns();
  }, [selectedCategory]);

  const loadMarketplacePatterns = async () => {
    try {
      setLoading(true);
      const db = firebaseDb();
      if (!db) throw new Error('Firestore not initialized');

      let q = query(
        collection(db, 'marketplace_patterns'),
        orderBy('downloads', 'desc'),
        limit(50)
      );

      if (selectedCategory !== 'all') {
        q = query(
          collection(db, 'marketplace_patterns'),
          where('tags', 'array-contains', selectedCategory),
          orderBy('downloads', 'desc'),
          limit(50)
        );
      }

      const snapshot = await getDocs(q);
      const patternsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as MarketplacePattern[];

      setPatterns(patternsData);
    } catch (error) {
      console.error('Error loading marketplace:', error);
      Alert.alert('Błąd', 'Nie udało się załadować wzorów');
    } finally {
      setLoading(false);
    }
  };

  const handlePatternPress = (pattern: MarketplacePattern) => {
    (navigation as any).navigate('PatternDetail', { patternId: pattern.id });
  };

  const filteredPatterns = patterns.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderPatternCard = ({ item }: { item: MarketplacePattern }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handlePatternPress(item)}
    >
      <Image
        source={{ uri: item.thumbnail_url }}
        style={styles.thumbnail}
        resizeMode="cover"
      />
      <View style={styles.cardContent}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.author}>by {item.author}</Text>
        <View style={styles.cardFooter}>
          <View style={styles.rating}>
            <Text style={styles.ratingText}>⭐ {item.rating.toFixed(1)}</Text>
            <Text style={styles.reviewsText}>({item.reviews_count})</Text>
          </View>
          <Text style={styles.price}>
            {item.price === 0 ? 'FREE' : `$${item.price.toFixed(2)}`}
          </Text>
        </View>
        <View style={styles.stats}>
          <Text style={styles.statsText}>📥 {item.downloads} downloads</Text>
        </View>
      </View>
    </TouchableOpacity>
  );


  return (
    <View style={styles.container}>
      {/* Banner CTA */}
      <View style={styles.bannerCta}>
        <Text style={styles.bannerText}>Chcesz zarabiać na swoich wzorach? Dodaj własny wzór do Marketplace!</Text>
      </View>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🧵 Marketplace</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search patterns..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.homeButton} onPress={() => (navigation as any).navigate('Home')}>
          <Text style={styles.homeButtonText}>← Strona główna</Text>
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <View style={styles.categories}>
        <FlatList
          horizontal
          data={categories}
          keyExtractor={item => item}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryButton,
                selectedCategory === item && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === item && styles.categoryTextActive,
                ]}
              >
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Patterns Grid */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ListSkeleton rows={8} height={180} />
          <Text style={styles.loadingText}>Ładowanie wzorów...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPatterns}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          renderItem={renderPatternCard}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Brak wzorów w tej kategorii.</Text>
              <Text style={styles.emptyCta}>Bądź pierwszy! Dodaj swój wzór do Marketplace.</Text>
            </View>
          }
        />
      )}

      {/* FAB Dodaj wzór */}
      <TouchableOpacity style={styles.fab} onPress={() => (navigation as any).navigate('ImagePicker')}>
        <Text style={styles.fabIcon}>＋</Text>
        <Text style={styles.fabLabel}>Dodaj wzór</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bannerCta: {
    backgroundColor: '#fbbf24',
    padding: 12,
    alignItems: 'center',
  },
  bannerText: {
    color: '#78350f',
    fontWeight: '600',
    fontSize: 15,
    textAlign: 'center',
  },
  homeButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  homeButtonText: {
    color: '#3730a3',
    fontWeight: '600',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    backgroundColor: '#7C3AED',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    gap: 8,
  },
  fabIcon: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  fabLabel: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  emptyCta: {
    fontSize: 15,
    color: '#7C3AED',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  categories: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  categoryButtonActive: {
    backgroundColor: '#7C3AED',
  },
  categoryText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#fff',
  },
  grid: {
    padding: 8,
  },
  card: {
    flex: 1,
    margin: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbnail: {
    width: '100%',
    height: 150,
    backgroundColor: '#E5E7EB',
  },
  cardContent: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  author: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginRight: 4,
  },
  reviewsText: {
    fontSize: 12,
    color: '#6B7280',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7C3AED',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    fontSize: 12,
    color: '#6B7280',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
});
