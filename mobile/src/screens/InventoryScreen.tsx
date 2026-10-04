import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import apiService, { Thread } from '../services/api';
import { getUserStash, saveUserStash, StashItem } from '../services/patternStorage';
import { colors, shadows } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { useResponsive } from '../theme/useResponsive';
import ListSkeleton from '../components/ListSkeleton';
import { FlossSkeinIcon, CameraCraftIcon, RusticDivider } from '../components/RusticIcons';

const BRAND_OPTIONS = ['Wszystkie', 'DMC', 'Anchor', 'Ariadna', 'Madeira', 'CXC'] as const;

// Barcode lookup database for DMC threads (UPC/EAN-13 mapping)
const BARCODE_DB: Record<string, { brand: string; code: string; name: string; rgb: number[] }> = {
  '07754005310': { brand: 'DMC', code: '310', name: 'Black', rgb: [0, 0, 0] },
  '07754005666': { brand: 'DMC', code: '666', name: 'Bright Red', rgb: [227, 28, 61] },
  '07754005001': { brand: 'DMC', code: 'BLANC', name: 'White', rgb: [255, 255, 255] },
  '07754005002': { brand: 'DMC', code: 'ECRU', name: 'Ecru', rgb: [240, 234, 218] },
  '07754005415': { brand: 'DMC', code: '415', name: 'Pearl Gray', rgb: [211, 211, 214] },
  '07754005700': { brand: 'DMC', code: '700', name: 'Bright Green', rgb: [7, 115, 47] },
  '07754005742': { brand: 'DMC', code: '742', name: 'Light Tangerine', rgb: [255, 191, 55] },
  '07754005796': { brand: 'DMC', code: '796', name: 'Dark Royal Blue', rgb: [17, 65, 126] },
  '07754005814': { brand: 'DMC', code: '814', name: 'Dark Garnet', rgb: [123, 17, 39] },
  '07754005498': { brand: 'DMC', code: '498', name: 'Dark Red', rgb: [167, 19, 41] },
  '07754005702': { brand: 'DMC', code: '702', name: 'Kelly Green', rgb: [71, 167, 59] },
  '07754005704': { brand: 'DMC', code: '704', name: 'Chartreuse', rgb: [159, 212, 60] },
};

export default function InventoryScreen() {
  const navigation = useNavigation();
  const { isTabletOrLarger } = useResponsive();
  const { theme, themeMode } = useTheme();

  const [stash, setStash] = useState<Record<string, StashItem>>({});
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [selectedBrand, setSelectedBrand] = useState<string>('Wszystkie');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyOwned, setOnlyOwned] = useState(false);

  // Barcode Scanner Modal
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [manualBarcodeInput, setManualBarcodeInput] = useState('');

  // WIP Assignment Modal
  const [editingWipThread, setEditingWipThread] = useState<StashItem | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const userStashData = await getUserStash();
      setStash(userStashData);

      const allThreads = await apiService.getThreads();
      if (allThreads && allThreads.length > 0) {
        setThreads(allThreads);
      } else {
        // Fallback default threads if API is offline
        const fallback = Object.values(BARCODE_DB).map((t, idx) => ({
          threadId: `${t.brand}_${t.code}`,
          brand: t.brand,
          colorCode: t.code,
          colorName: t.name,
          rgb: t.rgb as [number, number, number],
          hexColor: `rgb(${t.rgb[0]},${t.rgb[1]},${t.rgb[2]})`,
        }));
        setThreads(fallback);
      }
    } catch (e) {
      console.warn('Failed to fetch threads or stash:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSkeins = async (brand: string, code: string, delta: number, fallbackThread?: Thread) => {
    const key = `${brand}_${code}`;
    const current = stash[key];
    const newCount = Math.max(0, Math.round(((current?.skeins || 0) + delta) * 10) / 10);

    const updated = { ...stash };
    if (newCount === 0) {
      delete updated[key];
    } else {
      updated[key] = {
        brand,
        code,
        name: current?.name || fallbackThread?.colorName || `Kolor ${code}`,
        rgb: current?.rgb || fallbackThread?.rgb || [128, 128, 128],
        skeins: newCount,
        assigned_wip: current?.assigned_wip || 'Wolna nitka',
      };
    }

    setStash(updated);
    await saveUserStash(updated);
  };

  const handleSetWip = async (key: string, wipName: string) => {
    if (!stash[key]) return;
    const updated = {
      ...stash,
      [key]: {
        ...stash[key],
        assigned_wip: wipName,
      },
    };
    setStash(updated);
    await saveUserStash(updated);
    setEditingWipThread(null);
  };

  // Barcode Scanner Action
  const handleProcessBarcode = async (barcode: string) => {
    const clean = barcode.trim();
    const found = BARCODE_DB[clean];

    if (found) {
      await handleUpdateSkeins(found.brand, found.code, 1);
      Alert.alert(
        '📷 Zeskanowano kod kreskowy!',
        `Rozpoznano motek ${found.brand} #${found.code} (${found.name}).\nDodano 1 szt. do Twojego piórnika!`
      );
      setShowScannerModal(false);
      setManualBarcodeInput('');
    } else {
      // Check if it ends with known DMC code
      const matchDmc = clean.match(/(\d{2,4})$/);
      if (matchDmc) {
        const code = matchDmc[1];
        await handleUpdateSkeins('DMC', code, 1);
        Alert.alert(
          '📷 Zeskanowano kod!',
          `Dopasowano do nici DMC #${code}.\nDodano 1 szt. do piórnika!`
        );
        setShowScannerModal(false);
        setManualBarcodeInput('');
      } else {
        Alert.alert('Nieznany kod', `Kod ${clean} nie został odnaleziony w bazie EAN DMC.`);
      }
    }
  };

  const handleBuyThread = (thread: Thread) => {
    const url = `https://pasmanteria-partner.pl/szukaj?q=${thread.brand}+${thread.colorCode}&partner=mualina`;
    Linking.openURL(url);
  };

  // Filtered thread list
  const filteredThreads = useMemo(() => {
    return threads.filter((t) => {
      const key = `${t.brand}_${t.colorCode}`;
      const isOwned = (stash[key]?.skeins || 0) > 0;

      if (onlyOwned && !isOwned) return false;
      if (selectedBrand !== 'Wszystkie' && t.brand !== selectedBrand) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = t.colorCode.toLowerCase().includes(q);
        const matchName = t.colorName.toLowerCase().includes(q);
        return matchCode || matchName;
      }
      return true;
    });
  }, [threads, stash, selectedBrand, searchQuery, onlyOwned]);

  const totalSkeinsOwned = useMemo(() => {
    return Object.values(stash).reduce((sum, item) => sum + (item.skeins || 0), 0);
  }, [stash]);

  const renderItem = ({ item }: { item: Thread }) => {
    const key = `${item.brand}_${item.colorCode}`;
    const stashItem = stash[key];
    const skeins = stashItem?.skeins || 0;
    const isOwned = skeins > 0;
    const hex = item.hexColor || `rgb(${item.rgb[0]},${item.rgb[1]},${item.rgb[2]})`;

    return (
      <View style={[styles.threadRow, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }, isOwned && { backgroundColor: theme.surfaceHover, borderColor: theme.sageBorder }]}>
        <View style={[styles.colorSwatch, { backgroundColor: hex }]}>
          {isOwned && <Text style={styles.swatchCheck}>✓</Text>}
        </View>

        <View style={styles.threadInfo}>
          <Text style={[styles.threadName, { color: theme.textPrimary }]}>{item.colorName}</Text>
          <Text style={[styles.threadCode, { color: theme.textSecondary }]}>
            {item.brand} {item.colorCode}
            {isOwned && stashItem?.assigned_wip && (
              <Text style={{ color: theme.primaryDark, fontWeight: '700' }}> • WIP: {stashItem.assigned_wip}</Text>
            )}
          </Text>
        </View>

        {/* Skein Counter Controls */}
        <View style={styles.counterRow}>
          <TouchableOpacity
            style={[styles.counterBtn, { backgroundColor: theme.backgroundAlt, borderColor: theme.surfaceBorder }]}
            onPress={() => handleUpdateSkeins(item.brand, item.colorCode, -0.5, item)}
            disabled={skeins <= 0}
          >
            <Text style={[styles.counterBtnText, skeins <= 0 && { color: theme.textMuted }]}>−</Text>
          </TouchableOpacity>

          <View style={styles.counterValueBox}>
            <Text style={[styles.counterValueText, { color: isOwned ? theme.sageDark : theme.textMuted }]}>
              {skeins > 0 ? `${skeins} szt.` : '0 szt.'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.counterBtn, { backgroundColor: theme.backgroundAlt, borderColor: theme.surfaceBorder }]}
            onPress={() => handleUpdateSkeins(item.brand, item.colorCode, 0.5, item)}
          >
            <Text style={styles.counterBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* WIP assign or Buy */}
        {isOwned ? (
          <TouchableOpacity
            style={[styles.wipBtn, { backgroundColor: theme.sageLight, borderColor: theme.sageBorder }]}
            onPress={() => setEditingWipThread(stashItem)}
          >
            <Text style={[styles.wipBtnText, { color: theme.sageDark }]}>WIP</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.buyBtn, { backgroundColor: theme.caramelLight, borderColor: theme.caramelBorder }]}
            onPress={() => handleBuyThread(item)}
          >
            <Text style={[styles.buyBtnText, { color: theme.caramelDark }]}>Kup</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.innerWrapper, isTabletOrLarger && styles.tabletWrapper]}>
        
        {/* Header & Stats Banner */}
        <View style={[styles.headerCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={[styles.title, { color: theme.textPrimary }]}>Cyfrowy Piórnik & Zapas</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Twój magazyn mulin DMC, Anchor, Ariadna i Madeira z kalkulatorem motków i skanerem kodów EAN.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.scanBtn, { backgroundColor: theme.primary, flexDirection: 'row', alignItems: 'center' }]}
              onPress={() => setShowScannerModal(true)}
              activeOpacity={0.85}
            >
              <CameraCraftIcon size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.scanBtnText}>Skanuj motek</Text>
            </TouchableOpacity>
          </View>

          {/* Stash summary stats */}
          <View style={styles.statsRow}>
            <View style={[styles.statBadge, { backgroundColor: theme.backgroundAlt }]}>
              <Text style={styles.statLabel}>Unikalnych kolorów</Text>
              <Text style={[styles.statValue, { color: theme.textPrimary }]}>{Object.keys(stash).length}</Text>
            </View>
            <View style={[styles.statBadge, { backgroundColor: theme.sageLight }]}>
              <Text style={styles.statLabel}>Łącznie motków</Text>
              <Text style={[styles.statValue, { color: theme.sageDark }]}>{totalSkeinsOwned.toFixed(1)} szt.</Text>
            </View>
            <TouchableOpacity 
              style={[styles.statBadge, onlyOwned ? { backgroundColor: theme.primaryLight } : { backgroundColor: theme.backgroundAlt }]}
              onPress={() => setOnlyOwned(!onlyOwned)}
            >
              <Text style={styles.statLabel}>Filtr</Text>
              <Text style={[styles.statValue, { color: onlyOwned ? theme.primaryDark : theme.textSecondary }]}>
                {onlyOwned ? 'Tylko posiadane ✓' : 'Wszystkie'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar & Brand Chips */}
        <View style={styles.searchSection}>
          <TextInput
            style={[styles.searchInput, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder, color: theme.textPrimary }]}
            placeholder="Szukaj po kodzie (np. 310, Blanc) lub nazwie..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.brandsScroll}>
            {BRAND_OPTIONS.map((brand) => {
              const isSelected = selectedBrand === brand;
              return (
                <TouchableOpacity
                  key={brand}
                  style={[
                    styles.brandChip,
                    { backgroundColor: theme.surface, borderColor: theme.surfaceBorder },
                    isSelected && { backgroundColor: theme.primary, borderColor: theme.primary },
                  ]}
                  onPress={() => setSelectedBrand(brand)}
                >
                  <Text style={[styles.brandChipText, { color: theme.textSecondary }, isSelected && { color: '#ffffff' }]}>
                    {brand}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* List of Threads */}
        {loading ? (
          <ListSkeleton rows={8} height={56} />
        ) : (
          <FlatList
            data={filteredThreads}
            keyExtractor={(item) => `${item.brand}_${item.colorCode}`}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 60 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>🧵</Text>
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  Brak nici spełniających podane kryteria.
                </Text>
              </View>
            }
          />
        )}

      </View>

      {/* Barcode Scanner Modal */}
      <Modal visible={showScannerModal} animationType="slide" transparent={true}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>📷 Skaner Kodów Kreskowych Mulin</Text>
              <TouchableOpacity onPress={() => setShowScannerModal(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Zeskanuj kod UPC/EAN z papierowej opaski motka DMC lub wybierz przykładowy motek:
            </Text>

            {/* Quick barcode simulation chips */}
            <Text style={[styles.simTitle, { color: theme.textPrimary }]}>Szybkie przetestowanie skanera:</Text>
            <View style={styles.presetBarcodesRow}>
              {Object.entries(BARCODE_DB).slice(0, 4).map(([code, item]) => (
                <TouchableOpacity
                  key={code}
                  style={[styles.simBadge, { backgroundColor: theme.backgroundAlt, borderColor: theme.surfaceBorder }]}
                  onPress={() => handleProcessBarcode(code)}
                >
                  <Text style={styles.simBadgeText}>{item.brand} #{item.code} ({item.name})</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Manual input */}
            <Text style={[styles.simTitle, { color: theme.textPrimary, marginTop: 14 }]}>Lub wpisz kod z etykiety:</Text>
            <View style={styles.manualBarcodeRow}>
              <TextInput
                style={[styles.manualInput, { backgroundColor: theme.backgroundAlt, borderColor: theme.surfaceBorder, color: theme.textPrimary }]}
                placeholder="np. 07754005310 lub 310"
                placeholderTextColor={theme.textMuted}
                value={manualBarcodeInput}
                onChangeText={setManualBarcodeInput}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={[styles.manualSubmitBtn, { backgroundColor: theme.sage }]}
                onPress={() => handleProcessBarcode(manualBarcodeInput)}
              >
                <Text style={styles.manualSubmitText}>Zatwierdź</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* WIP Assignment Modal */}
      {editingWipThread && (
        <Modal visible={true} animationType="fade" transparent={true}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { backgroundColor: theme.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Przypisz do projektu (WIP)</Text>
                <TouchableOpacity onPress={() => setEditingWipThread(null)}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                Dla nici {editingWipThread.brand} #{editingWipThread.code} ({editingWipThread.name}):
              </Text>

              <View style={{ gap: 8, marginVertical: 14 }}>
                {['Wolna nitka (w szkatułce)', 'Górski Krajobraz (Aktywny WIP)', 'Czerwona Róża (WIP)', 'Nowy projekt...'].map((proj) => (
                  <TouchableOpacity
                    key={proj}
                    style={[
                      styles.wipOptionItem,
                      { backgroundColor: theme.backgroundAlt, borderColor: theme.surfaceBorder },
                      editingWipThread.assigned_wip === proj && { backgroundColor: theme.sageLight, borderColor: theme.sageBorder },
                    ]}
                    onPress={() => handleSetWip(`${editingWipThread.brand}_${editingWipThread.code}`, proj)}
                  >
                    <Text style={[styles.wipOptionText, { color: theme.textPrimary }]}>{proj}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerWrapper: {
    flex: 1,
    padding: 16,
    width: '100%',
    alignSelf: 'center',
  },
  tabletWrapper: {
    maxWidth: 900,
    paddingHorizontal: 24,
  },
  headerCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
    ...shadows.card,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    maxWidth: 520,
  },
  scanBtn: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 12,
    ...shadows.glowPrimary,
  },
  scanBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  statBadge: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  searchSection: {
    marginBottom: 12,
  },
  searchInput: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    marginBottom: 10,
  },
  brandsScroll: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  brandChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 8,
  },
  brandChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  threadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    ...shadows.card,
  },
  colorSwatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  swatchCheck: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 14,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 2,
    textShadowOffset: { width: 0, height: 1 },
  },
  threadInfo: {
    flex: 1,
  },
  threadName: {
    fontSize: 14,
    fontWeight: '700',
  },
  threadCode: {
    fontSize: 12,
    marginTop: 2,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginHorizontal: 8,
  },
  counterBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  counterValueBox: {
    minWidth: 44,
    alignItems: 'center',
  },
  counterValueText: {
    fontSize: 12,
    fontWeight: '700',
  },
  wipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  wipBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  buyBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  buyBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 20,
    padding: 20,
    ...shadows.cardHover,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  modalSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  simTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  presetBarcodesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  simBadge: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  simBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  manualBarcodeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  manualInput: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  manualSubmitBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualSubmitText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  wipOptionItem: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  wipOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
