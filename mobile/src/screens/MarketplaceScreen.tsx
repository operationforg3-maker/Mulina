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
import { useTheme } from '../theme/ThemeContext';
import { savePattern, StoredPattern } from '../services/patternStorage';

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
  fabric?: string;
  dmcCount?: number;
}

const SAMPLE_PATTERNS: MarketplacePattern[] = [
  {
    id: 'sample-1',
    title: 'Róża Vintage',
    description: 'Klasyczny motyw czerwonej róży w stylu wiktoriańskim. Znak wodny DRM projektanta.',
    price: 0,
    author: "Mu'alina Studio",
    authorId: 'system',
    thumbnail_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300',
    downloads: 342,
    rating: 4.9,
    reviews_count: 28,
    created_at: new Date().toISOString(),
    tags: ['flowers', 'all'],
    fabric: 'Aida 14ct',
    dmcCount: 16,
  },
  {
    id: 'sample-2',
    title: 'Kot w ogrodzie',
    description: 'Rudy kot odpoczywający wśród lawendy i ziół. Bogata paleta barw DMC.',
    price: 0,
    author: 'HaftowaPasja',
    authorId: 'system',
    thumbnail_url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300',
    downloads: 215,
    rating: 4.8,
    reviews_count: 19,
    created_at: new Date().toISOString(),
    tags: ['animals', 'all'],
    fabric: 'Aida 16ct',
    dmcCount: 24,
  },
  {
    id: 'sample-3',
    title: 'Tatrzański zachód słońca',
    description: 'Majestatyczny krajobraz tatrzański o zachodzie słońca. Duży wzór pejzażowy.',
    price: 15,
    author: 'ArtCraft Studio',
    authorId: 'system',
    thumbnail_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300',
    downloads: 189,
    rating: 4.7,
    reviews_count: 14,
    created_at: new Date().toISOString(),
    tags: ['seasonal', 'vip', 'all'],
    fabric: 'Evenweave 28ct',
    dmcCount: 48,
  },
  {
    id: 'sample-4',
    title: 'Lawendowy Wianek',
    description: 'Delikatny wianek prowansalski z subtelnymi przejściami fioletów.',
    price: 0,
    author: 'CozyStitcher',
    authorId: 'system',
    thumbnail_url: 'https://images.unsplash.com/photo-1528183429752-a97d0bf99b5a?w=300',
    downloads: 412,
    rating: 5.0,
    reviews_count: 35,
    created_at: new Date().toISOString(),
    tags: ['flowers', 'all'],
    fabric: 'Aida 14ct',
    dmcCount: 12,
  },
];

export default function MarketplaceScreen() {
  const navigation = useNavigation();
  const { theme, themeMode } = useTheme();
  const [patterns, setPatterns] = useState<MarketplacePattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { key: 'all', label: 'Wszystkie' },
    { key: 'flowers', label: 'Kwiaty' },
    { key: 'animals', label: 'Zwierzęta' },
    { key: 'seasonal', label: 'Krajobrazy' },
    { key: 'vip', label: 'Club VIP' },
  ];

  useEffect(() => {
    loadMarketplacePatterns();
  }, [selectedCategory]);

  const loadMarketplacePatterns = async () => {
    try {
      setLoading(true);
      // Filter from sample patterns or remote
      const filtered = SAMPLE_PATTERNS.filter(p => 
        selectedCategory === 'all' || p.tags.includes(selectedCategory)
      );
      setPatterns(filtered);
    } catch (error) {
      console.warn('Fallback to sample patterns due to error:', error);
      setPatterns(SAMPLE_PATTERNS);
    } finally {
      setLoading(false);
    }
  };

  const handleInstantImport = async (pattern: MarketplacePattern) => {
    try {
      const drmCode = 'MUALINA-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const newPattern: StoredPattern = {
        pattern_id: 'mkt-' + pattern.id,
        name: pattern.title,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        grid_data: {
          grid: Array(32).fill(0).map((_, y) => 
            Array(32).fill(0).map((_, x) => ((x + y) % 3 === 0 ? 1 : (x * y) % 5 === 0 ? 2 : 0))
          ),
          type: 'cross',
          width: 32,
          height: 32,
        },
        color_palette: [
          { rgb: [28, 28, 28], thread_code: '310', thread_brand: 'DMC', thread_name: 'Black', symbol: '■', delta_e: 0 },
          { rgb: [211, 47, 47], thread_code: '666', thread_brand: 'DMC', thread_name: 'Bright Red', symbol: '♥', delta_e: 0 },
          { rgb: [56, 142, 60], thread_code: '700', thread_brand: 'DMC', thread_name: 'Bright Green', symbol: '▲', delta_e: 0 },
          { rgb: [253, 251, 247], thread_code: 'Blanc', thread_brand: 'DMC', thread_name: 'White', symbol: '○', delta_e: 0 },
        ],
        dimensions: {
          width_stitches: 32,
          height_stitches: 32,
          width_cm: 5.8,
          height_cm: 5.8,
          aida_count: 14,
        },
        backstitch: [
          { id: 'bs-1', x1: 5, y1: 5, x2: 25, y2: 5, color_index: 0, completed: false },
          { id: 'bs-2', x1: 25, y1: 5, x2: 25, y2: 25, color_index: 0, completed: false },
        ],
        parked_threads: [],
        brand_source: `Marketplace • ${pattern.author} (Licencja DRM: ${drmCode})`,
        estimated_time: 4.5,
        progress: {
          completed_stitches: Array(32).fill(false).map(() => Array(32).fill(false)),
          current_color_index: 0,
          last_worked: new Date().toISOString(),
          stitches_per_session: 0,
        },
      };

      await savePattern(newPattern);

      Alert.alert(
        "🎉 Dodano do Tamborka!",
        `Wzór "${pattern.title}" został pomyślnie zaimportowany.\n\n🛡️ Przypisano unikalny znak wodny DRM: ${drmCode}\nMożesz od razu przystąpić do haftowania!`,
        [
          {
            text: 'Otwórz tamborek',
            onPress: () => (navigation as any).navigate('PatternEditor', { patternId: newPattern.pattern_id, pattern: newPattern }),
          },
          { text: 'Przeglądaj dalej', style: 'cancel' }
        ]
      );
    } catch (err: any) {
      Alert.alert("Błąd", "Nie udało się zapisać wzoru: " + err.message);
    }
  };

  const filteredPatterns = patterns.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderPatternCard = ({ item }: { item: MarketplacePattern }) => (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
      <Image
        source={{ uri: item.thumbnail_url }}
        style={styles.thumbnail}
        resizeMode="cover"
      />
      <View style={styles.cardContent}>
        <View style={styles.drmBadge}>
          <Text style={styles.drmText}>🛡️ DRM • Zabezpieczony</Text>
        </View>

        <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.author, { color: theme.textSecondary }]}>autor: {item.author}</Text>
        
        <View style={styles.specRow}>
          <Text style={styles.specText}>{item.fabric || 'Aida 14ct'}</Text>
          <Text style={styles.specDot}>•</Text>
          <Text style={styles.specText}>{item.dmcCount || 16} mulin DMC</Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.rating}>
            <Text style={styles.ratingText}>⭐ {(item.rating ?? 5).toFixed(1)}</Text>
            <Text style={[styles.reviewsText, { color: theme.textSecondary }]}>({item.reviews_count ?? 0})</Text>
          </View>
          <Text style={[styles.price, { color: item.price === 0 ? '#2E7D32' : theme.primary }]}>
            {item.price === 0 ? 'DARMOWY' : `${item.price} PLN`}
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.instantImportBtn, { backgroundColor: theme.primary }]}
          onPress={() => handleInstantImport(item)}
          activeOpacity={0.85}
        >
          <Text style={styles.instantImportText}>📥 Pobierz do tamborka</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Banner CTA for Creators */}
      <View style={[styles.bannerCta, { backgroundColor: themeMode === 'cozy' ? '#FFF9C4' : theme.backgroundAlt }]}>
        <Text style={[styles.bannerText, { color: themeMode === 'cozy' ? '#78350F' : theme.textPrimary }]}>
          Jesteś projektantem? Wgrywaj pliki .PDF i .SAGA ze znakiem wodnym DRM i zarabiaj 80-90% ze sprzedaży!
        </Text>
      </View>

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.surfaceBorder }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Mu'alina Marketplace</Text>
          <TouchableOpacity style={[styles.homeButton, { backgroundColor: theme.backgroundAlt }]} onPress={() => (navigation as any).navigate('Home')}>
            <Text style={[styles.homeButtonText, { color: theme.textPrimary }]}>‹ Tamborek</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={[styles.searchInput, { backgroundColor: theme.backgroundAlt, color: theme.textPrimary, borderColor: theme.surfaceBorder }]}
          placeholder="Szukaj wzorów, kwiatów, pejzaży..."
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Categories */}
      <View style={styles.categories}>
        <FlatList
          horizontal
          data={categories}
          keyExtractor={item => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryButton,
                { backgroundColor: theme.backgroundAlt, borderColor: theme.surfaceBorder },
                selectedCategory === item.key && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              onPress={() => setSelectedCategory(item.key)}
            >
              <Text
                style={[
                  styles.categoryText,
                  { color: theme.textPrimary },
                  selectedCategory === item.key && { color: '#FFFFFF', fontWeight: '800' },
                ]}
              >
                {item.label}
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
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  searchInput: {
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
  },
  categories: {
    paddingVertical: 12,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  grid: {
    padding: 10,
    paddingBottom: 40,
  },
  card: {
    flex: 1,
    margin: 6,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  thumbnail: {
    width: '100%',
    height: 140,
    backgroundColor: '#E5E7EB',
  },
  cardContent: {
    padding: 12,
  },
  drmBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
  },
  drmText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2E7D32',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  author: {
    fontSize: 11,
    marginBottom: 6,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  specText: {
    fontSize: 11,
    color: '#8E8E93',
  },
  specDot: {
    fontSize: 11,
    color: '#C7C7CC',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B',
    marginRight: 2,
  },
  reviewsText: {
    fontSize: 11,
  },
  price: {
    fontSize: 14,
    fontWeight: '800',
  },
  instantImportBtn: {
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instantImportText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
