import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { savePattern, StoredPattern } from '../services/patternStorage';
import { parsePatternFile } from '../services/parsers/patternParsers';
import { DEMO_PATTERN } from '../services/demoPattern';
import GlobalLoader from '../components/GlobalLoader';
import { colors, shadows } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { useResponsive } from '../theme/useResponsive';

type RootStackParamList = {
  Home: undefined;
  ImagePicker: undefined;
  PatternEditor: { patternId: string; pattern?: any };
};

type ImagePickerNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ImagePicker'>;

const PRESET_IMAGES = [
  {
    id: 'rose',
    name: '🌹 Czerwona Róża',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300',
    aspect: 1.0,
  },
  {
    id: 'cat',
    name: '🐱 Rudzielec',
    url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300',
    aspect: 1.25,
  },
  {
    id: 'landscape',
    name: '🏔️ Krajobraz Górski',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300',
    aspect: 0.67,
  },
];

export default function ImagePickerScreen() {
  const navigation = useNavigation<ImagePickerNavigationProp>();
  const { isTabletOrLarger } = useResponsive();

  const { theme } = useTheme();
  const [selectedImage, setSelectedImage] = useState<string | null>(PRESET_IMAGES[0].url);
  const [loading, setLoading] = useState(false);

  // 1. Sizing Mode & Dimensions
  const [sizeMode, setSizeMode] = useState<'cm' | 'stitches'>('cm');
  const [targetWidthCm, setTargetWidthCm] = useState<number>(15);
  const [targetStitches, setTargetStitches] = useState<number>(75);

  // 2. Fabric / Canvas Options (Aida 11-18ct and Evenweave 28-32ct)
  const [aidaCount, setAidaCount] = useState<11 | 14 | 16 | 18 | 28 | 32>(14);
  const [canvasColor, setCanvasColor] = useState<'white' | 'cream' | 'black' | 'linen'>('white');
  const [marginCm, setMarginCm] = useState<number>(5);

  // 3. Thread & Palette Settings (DMC, Anchor, CXC, Ariadna, Madeira, Dimensions)
  const [threadBrand, setThreadBrand] = useState<'DMC' | 'Anchor' | 'Ariadna' | 'Madeira' | 'CXC' | 'Dimensions'>('DMC');
  const [maxColors, setMaxColors] = useState<number>(30);
  const [cleanupConfetti, setCleanupConfetti] = useState<boolean>(true);

  // 4. Image Preprocessing Adjustments
  const [brightness, setBrightness] = useState<number>(1.0);
  const [contrast, setContrast] = useState<number>(1.0);

  // Helper: Stitches per cm based on Aida / Evenweave count (for 28/32ct worked over 2 threads: 14/16ct effective)
  const effectiveCount = aidaCount === 28 ? 14 : aidaCount === 32 ? 16 : aidaCount;
  const stitchesPerCm = effectiveCount / 2.54;

  // Real-time calculation of dimensions
  let estWidthStitches = 0;
  let estHeightStitches = 0;
  let estWidthCm = '0';
  let estHeightCm = '0';

  const currentPreset = PRESET_IMAGES.find((p) => p.url === selectedImage);
  const aspect = currentPreset ? currentPreset.aspect : 1.0;

  if (sizeMode === 'cm') {
    estWidthCm = targetWidthCm.toFixed(1);
    estHeightCm = (targetWidthCm * aspect).toFixed(1);
    estWidthStitches = Math.round(targetWidthCm * stitchesPerCm);
    estHeightStitches = Math.round(targetWidthCm * aspect * stitchesPerCm);
  } else {
    estWidthStitches = targetStitches;
    estHeightStitches = Math.round(targetStitches * aspect);
    estWidthCm = (estWidthStitches / stitchesPerCm).toFixed(1);
    estHeightCm = (estHeightStitches / stitchesPerCm).toFixed(1);
  }

  // Recommended fabric cut (pattern + 2 * margin)
  const cutWidthCm = (parseFloat(estWidthCm) + 2 * marginCm).toFixed(1);
  const cutHeightCm = (parseFloat(estHeightCm) + 2 * marginCm).toFixed(1);

  // Material estimates
  const totalEstStitches = estWidthStitches * estHeightStitches;
  const colorsForEstimate = maxColors === 0 ? 50 : maxColors;
  const estSkeins = Math.max(3, Math.round(colorsForEstimate * 1.2));
  const estCostPln = (estSkeins * 4.2).toFixed(0);
  const estHours = Math.round(totalEstStitches / 80);

  // Direct Pattern File Import (.saga, .xsd, .pat, .oxs, .pdf)
  const handlePickPatternFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['*/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setLoading(true);

        let content = '';
        if (Platform.OS === 'web') {
          const fileObj = (asset as any).file;
          if (fileObj) {
            content = await fileObj.text();
          }
        }

        const parseRes = await parsePatternFile(asset.name, content);
        if (parseRes.success && parseRes.pattern) {
          await savePattern(parseRes.pattern);
          setLoading(false);
          Alert.alert(
            'Wczytano wzór!',
            `Pomyślnie zaimportowano plik ${asset.name} (${parseRes.sourceFormat.toUpperCase()}). Otwieram tamborek!`
          );
          navigation.navigate('PatternEditor', {
            patternId: parseRes.pattern.pattern_id,
            pattern: parseRes.pattern,
          });
        } else {
          setLoading(false);
          Alert.alert('Błąd importu', parseRes.error || 'Nie udało się sparsować pliku.');
        }
      }
    } catch (err: any) {
      setLoading(false);
      console.error('Error picking pattern file:', err);
      Alert.alert('Błąd', 'Nie udało się wczytać pliku: ' + err.message);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Brak uprawnień', 'Potrzebujemy dostępu do galerii, aby wgrać zdjęcie.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.base64) {
          const mime = asset.uri.endsWith('.png') ? 'image/png' : 'image/jpeg';
          setSelectedImage(`data:${mime};base64,${asset.base64}`);
        } else {
          setSelectedImage(asset.uri);
        }
      }
    } catch (e: any) {
      console.error('Error picking image:', e);
      Alert.alert('Błąd', 'Nie udało się wybrać zdjęcia: ' + e.message);
    }
  };

  const convertImage = async () => {
    if (!selectedImage) {
      Alert.alert('Wybierz zdjęcie', 'Wskaż motyw lub wgraj własne zdjęcie.');
      return;
    }

    setLoading(true);

    try {
      const backendUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
      const endpointsToTry = [
        backendUrl,
        'http://127.0.0.1:8000',
        'http://localhost:8000',
      ];

      let data: any = null;
      let lastError: any = null;

      let imagePayload = selectedImage;
      if (selectedImage.startsWith('blob:')) {
        try {
          const blobRes = await fetch(selectedImage);
          const blob = await blobRes.blob();
          const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          imagePayload = base64Data;
        } catch (bErr) {
          console.warn('Could not convert blob to base64, passing original URI:', bErr);
        }
      }

      const payload = {
        image_url: imagePayload,
        target_width: estWidthStitches,
        target_height: estHeightStitches,
        thread_brand: threadBrand,
        max_colors: maxColors,
        target_width_cm: parseFloat(estWidthCm),
        target_height_cm: parseFloat(estHeightCm),
        aida_count: aidaCount,
        canvas_color: canvasColor,
        margin_cm: marginCm,
        brightness: brightness,
        contrast: contrast,
        cleanup_confetti: cleanupConfetti,
        enable_dithering: false,
        use_inventory: false,
      };

      for (const endpoint of endpointsToTry) {
        try {
          const response = await fetch(`${endpoint}/api/v1/convert`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          if (response.ok) {
            data = await response.json();
            break;
          } else {
            const errText = await response.text();
            lastError = new Error(`HTTP ${response.status}: ${errText}`);
          }
        } catch (err: any) {
          lastError = err;
        }
      }

      if (!data) {
        console.warn('Backend unavailable, fallback to demo pattern:', lastError);
        data = {
          ...DEMO_PATTERN,
          pattern_id: `pattern_${Date.now()}`,
        };
        Alert.alert(
          'Tryb demonstracyjny',
          'Serwer przetwarzania obrazów jest offline. Załadowano wzór demonstracyjny z pełną paletą DMC.'
        );
      }

      const storedPattern: StoredPattern = {
        pattern_id: data.pattern_id || `pattern_${Date.now()}`,
        name: `Wzór ${new Date().toLocaleDateString('pl-PL')} (${threadBrand})`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        grid_data: data.grid_data,
        color_palette: data.color_palette,
        dimensions: data.dimensions || {
          width_stitches: data.grid_data?.width || 50,
          height_stitches: data.grid_data?.height || 50,
          width_cm: parseFloat(estWidthCm),
          height_cm: parseFloat(estHeightCm),
          aida_count: aidaCount,
          canvas_color: canvasColor,
          margin_cm: marginCm,
          recommended_cut_width_cm: parseFloat(cutWidthCm),
          recommended_cut_height_cm: parseFloat(cutHeightCm),
        },
        materials_summary: data.materials_summary,
        estimated_time: data.estimated_time_minutes || data.estimated_time || 0,
        image_url: selectedImage,
        progress: {
          completed_stitches: Array(data.grid_data?.height || 0)
            .fill(null)
            .map(() => Array(data.grid_data?.width || 0).fill(false)),
          current_color_index: 0,
          last_worked: new Date().toISOString(),
        },
      };

      await savePattern(storedPattern);

      navigation.navigate('PatternEditor', { 
        patternId: storedPattern.pattern_id,
        pattern: storedPattern,
      });
    } catch (error: any) {
      console.error('Conversion error:', error);
      Alert.alert(
        'Błąd',
        `Nie udało się otworzyć wzoru: ${error.message || 'Nieznany błąd'}`
      );
    } finally {
      setLoading(false);
    }
  };

  // Content for Section 1: Image Selection
  const renderImageSection = () => (
    <View style={styles.section}>
      {/* Direct Pattern File Import Banner (.saga, .xsd, .pat, .oxs, .pdf) */}
      <View style={[styles.fileImportBanner, { backgroundColor: theme.primaryLight, borderColor: theme.primaryBorder }]}>
        <View style={styles.fileImportIconBox}>
          <Text style={{ fontSize: 26 }}>📥</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.fileImportTitle, { color: theme.primaryDark }]}>
            Masz już gotowy wzór (.saga, .xsd, .pat, .oxs, .pdf)?
          </Text>
          <Text style={[styles.fileImportDesc, { color: theme.textSecondary }]}>
            Otwórz schemat wyeksportowany z Cross Stitch Saga, Pattern Maker, PCStitch lub PDF.
          </Text>
        </View>
        <TouchableOpacity style={[styles.fileImportBtn, { backgroundColor: theme.primary }]} onPress={handlePickPatternFile} activeOpacity={0.85}>
          <Text style={styles.fileImportBtnText}>Otwórz plik</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>📸 1. Lub przekonwertuj grafikę na haft</Text>
      <Text style={styles.helperText}>Wybierz gotowy motyw lub wgraj własne zdjęcie z dysku/galerii:</Text>
      
      <View style={styles.presetsRow}>
        {PRESET_IMAGES.map((preset) => (
          <TouchableOpacity
            key={preset.id}
            style={[
              styles.presetCard,
              selectedImage === preset.url && styles.presetCardActive,
            ]}
            onPress={() => setSelectedImage(preset.url)}
          >
            <Image source={{ uri: preset.url }} style={styles.presetImage} />
            <Text style={styles.presetName}>{preset.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedImage && (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
        </View>
      )}

      <TouchableOpacity style={styles.pickButton} onPress={pickImage} activeOpacity={0.85}>
        <Text style={styles.pickButtonText}>📁 Wgraj własne zdjęcie z galerii</Text>
      </TouchableOpacity>

      {/* Brightness & Contrast Quick Adjustments */}
      <View style={styles.subRowContainer}>
        <View style={styles.subRowItem}>
          <Text style={styles.subRowLabel}>☀️ Jasność:</Text>
          <View style={styles.chipRow}>
            {[
              { label: '-20%', val: 0.8 },
              { label: 'Normalna', val: 1.0 },
              { label: '+20%', val: 1.2 },
            ].map((b) => (
              <TouchableOpacity
                key={b.label}
                style={[styles.chip, brightness === b.val && styles.chipActive]}
                onPress={() => setBrightness(b.val)}
              >
                <Text style={[styles.chipText, brightness === b.val && styles.chipTextActive]}>
                  {b.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.subRowItem}>
          <Text style={styles.subRowLabel}>🌓 Kontrast:</Text>
          <View style={styles.chipRow}>
            {[
              { label: 'Normalny', val: 1.0 },
              { label: 'Wyrazisty (+20%)', val: 1.2 },
            ].map((c) => (
              <TouchableOpacity
                key={c.label}
                style={[styles.chip, contrast === c.val && styles.chipActive]}
                onPress={() => setContrast(c.val)}
              >
                <Text style={[styles.chipText, contrast === c.val && styles.chipTextActive]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );

  // Content for Configuration Sections (Fabric, Sizing, Colors, Estimator, CTA)
  const renderConfigSections = () => (
    <>
      {/* Section 2: Canvas Parameters */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🪡 2. Parametry płótna (Kanwa & Gęstość)</Text>
        <Text style={styles.helperText}>
          Gęstość kanwy (count = liczba ściegów na cal) decyduje o wielkości i precyzji haftu:
        </Text>

        <View style={styles.buttonRow}>
          {[
            { count: 11, label: 'Aida 11 ct', desc: 'Duże krzyżyki (4.3 śc/cm)' },
            { count: 14, label: 'Aida 14 ct', desc: 'Najpopularniejsza (5.4 śc/cm)' },
            { count: 16, label: 'Aida 16 ct', desc: 'Drobny splot (6.3 śc/cm)' },
            { count: 18, label: 'Aida 18 ct', desc: 'Bardzo drobny (7.1 śc/cm)' },
            { count: 28, label: 'Evenweave 28 ct', desc: 'Przez 2 nitki = 14ct (5.4 śc/cm)' },
            { count: 32, label: 'Evenweave 32 ct', desc: 'Przez 2 nitki = 16ct (6.3 śc/cm)' },
          ].map((item) => (
            <TouchableOpacity
              key={item.count}
              style={[
                styles.fabricOptionButton,
                aidaCount === item.count && styles.optionButtonActive,
              ]}
              onPress={() => setAidaCount(item.count as any)}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  aidaCount === item.count && styles.optionButtonTextActive,
                ]}
              >
                {item.label}
              </Text>
              <Text
                style={[
                  styles.optionButtonSubtext,
                  aidaCount === item.count && styles.optionButtonSubtextActive,
                ]}
              >
                {item.desc}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Canvas Color Selection */}
        <Text style={[styles.subRowLabel, { marginTop: 14 }]}>Kolor podkładu / kanwy:</Text>
        <View style={styles.canvasColorRow}>
          {[
            { id: 'white', label: 'Biała', color: '#FFFFFF', border: '#E2E8F0' },
            { id: 'cream', label: 'Kremowa / Ecru', color: '#FDF6EC', border: '#EAD7BA' },
            { id: 'linen', label: 'Naturalny len', color: '#D6C7AE', border: '#B8A88E' },
            { id: 'black', label: 'Czarna', color: '#1E293B', border: '#0F172A' },
          ].map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[
                styles.colorCard,
                canvasColor === c.id && styles.colorCardActive,
              ]}
              onPress={() => setCanvasColor(c.id as any)}
            >
              <View
                style={[
                  styles.colorSwatch,
                  { backgroundColor: c.color, borderColor: c.border },
                ]}
              />
              <Text
                style={[
                  styles.colorLabel,
                  canvasColor === c.id && styles.colorLabelActive,
                ]}
              >
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Fabric Margin for framing */}
        <Text style={[styles.subRowLabel, { marginTop: 14 }]}>Margines na oprawę (z każdej strony):</Text>
        <View style={styles.chipRow}>
          {[
            { label: '3 cm (mały tamborek)', val: 3 },
            { label: '5 cm (zalecany standard)', val: 5 },
            { label: '7 cm (do ramki passe-partout)', val: 7 },
          ].map((m) => (
            <TouchableOpacity
              key={m.val}
              style={[styles.chip, marginCm === m.val && styles.chipActive]}
              onPress={() => setMarginCm(m.val)}
            >
              <Text style={[styles.chipText, marginCm === m.val && styles.chipTextActive]}>
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Section 3: Sizing Mode */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📐 3. Dobór rozmiaru haftu</Text>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, sizeMode === 'cm' && styles.tabActive]}
            onPress={() => setSizeMode('cm')}
          >
            <Text style={[styles.tabText, sizeMode === 'cm' && styles.tabTextActive]}>
              📏 W centymetrach (cm)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, sizeMode === 'stitches' && styles.tabActive]}
            onPress={() => setSizeMode('stitches')}
          >
            <Text style={[styles.tabText, sizeMode === 'stitches' && styles.tabTextActive]}>
              🔢 W liczbie ściegów
            </Text>
          </TouchableOpacity>
        </View>

        {sizeMode === 'cm' ? (
          <View style={styles.modeContent}>
            <Text style={styles.helperText}>
              Wskaż pożądaną szerokość gotowego haftu na kanwie {aidaCount} ct:
            </Text>
            <View style={styles.buttonRow}>
              {[
                { label: '10 cm', val: 10 },
                { label: '15 cm', val: 15 },
                { label: '20 cm', val: 20 },
                { label: '25 cm', val: 25 },
              ].map((item) => (
                <TouchableOpacity
                  key={item.val}
                  style={[
                    styles.smallOptionButton,
                    targetWidthCm === item.val && styles.optionButtonActive,
                  ]}
                  onPress={() => setTargetWidthCm(item.val)}
                >
                  <Text style={[styles.optionButtonText, targetWidthCm === item.val && styles.optionButtonTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.modeContent}>
            <Text style={styles.helperText}>
              Wybierz dokładną liczbę ściegów na dłuższym boku wzoru:
            </Text>
            <View style={styles.buttonRow}>
              {[
                { label: '⚡ Mini (45x)', val: 45 },
                { label: '🧵 Mały (60x)', val: 60 },
                { label: '🧵 Standard (75x)', val: 75 },
                { label: 'Duży (100x)', val: 100 },
              ].map((s) => (
                <TouchableOpacity
                  key={s.val}
                  style={[
                    styles.smallOptionButton,
                    targetStitches === s.val && styles.optionButtonActive,
                  ]}
                  onPress={() => setTargetStitches(s.val)}
                >
                  <Text style={[styles.optionButtonText, targetStitches === s.val && styles.optionButtonTextActive]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Section 4: Thread Brand & Colors */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🧵 4. Paleta nici i styl haftu</Text>
        
        <Text style={styles.subRowLabel}>Producent nici:</Text>
        <View style={styles.buttonRow}>
          {(['DMC', 'Anchor', 'CXC', 'Ariadna', 'Madeira', 'Dimensions'] as const).map((brand) => (
            <TouchableOpacity
              key={brand}
              style={[
                styles.optionButton,
                threadBrand === brand && styles.optionButtonActive,
              ]}
              onPress={() => setThreadBrand(brand as any)}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  threadBrand === brand && styles.optionButtonTextActive,
                ]}
              >
                {brand}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.subRowLabel, { marginTop: 14 }]}>Liczba kolorów w schemacie:</Text>
        <View style={styles.buttonRow}>
          {[
            { count: 15, label: '15 (Kameralny)' },
            { count: 30, label: '30 (Standard)' },
            { count: 60, label: '60 (Szczegółowy)' },
            { count: 100, label: '100 (Bogaty)' },
            { count: 150, label: '150 (Zaawansowany)' },
            { count: 0, label: '∞ Brak limitu' },
          ].map((item) => (
            <TouchableOpacity
              key={item.count}
              style={[
                styles.smallOptionButton,
                maxColors === item.count && styles.optionButtonActive,
              ]}
              onPress={() => setMaxColors(item.count)}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  maxColors === item.count && styles.optionButtonTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.subRowLabel, { marginTop: 14 }]}>Czystość schematu (redukcja szumu):</Text>
        <View style={styles.chipRow}>
          <TouchableOpacity
            style={[styles.chip, cleanupConfetti && styles.chipActive]}
            onPress={() => setCleanupConfetti(true)}
          >
            <Text style={[styles.chipText, cleanupConfetti && styles.chipTextActive]}>
              🧹 Czyste plamy (usuń pojedyncze piksele confetti)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chip, !cleanupConfetti && styles.chipActive]}
            onPress={() => setCleanupConfetti(false)}
          >
            <Text style={[styles.chipText, !cleanupConfetti && styles.chipTextActive]}>
              🎨 Płynne cieniowanie fotograficzne
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Section 5: Real-time Material & Canvas Estimator Box */}
      <View style={styles.estimatorCard}>
        <View style={styles.estimatorHeader}>
          <Text style={styles.estimatorTitle}>📊 Podsumowanie materiałów i wymiarów</Text>
          <View style={styles.livePill}>
            <Text style={styles.livePillText}>Na żywo</Text>
          </View>
        </View>

        <View style={styles.estimatorGrid}>
          <View style={styles.estimatorItem}>
            <Text style={styles.estimatorLabel}>Wymiary haftu:</Text>
            <Text style={styles.estimatorValueBold}>
              {estWidthCm} × {estHeightCm} cm
            </Text>
            <Text style={styles.estimatorSub}>{estWidthStitches} × {estHeightStitches} ściegów</Text>
          </View>

          <View style={styles.estimatorItemHighlight}>
            <Text style={styles.estimatorLabelHighlight}>✂️ Wymiar płótna do ucięcia:</Text>
            <Text style={styles.estimatorValueHighlight}>
              {cutWidthCm} × {cutHeightCm} cm
            </Text>
            <Text style={styles.estimatorSubHighlight}>(zapas +{marginCm} cm z każdej strony)</Text>
          </View>

          <View style={styles.estimatorItem}>
            <Text style={styles.estimatorLabel}>Nici i pasemka:</Text>
            <Text style={styles.estimatorValueBold}>
              ~{estSkeins} szt. {threadBrand}
            </Text>
            <Text style={styles.estimatorSub}>koszt: ok. {estCostPln} zł</Text>
          </View>

          <View style={styles.estimatorItem}>
            <Text style={styles.estimatorLabel}>Łącznie ściegów:</Text>
            <Text style={styles.estimatorValueBold}>
              {totalEstStitches.toLocaleString('pl-PL')}
            </Text>
            <Text style={styles.estimatorSub}>czas: ok. {estHours} godz.</Text>
          </View>
        </View>
      </View>

      {/* Convert CTA Button */}
      <TouchableOpacity
        style={styles.convertButton}
        onPress={convertImage}
        activeOpacity={0.88}
      >
        <Text style={styles.convertButtonText}>
          ✨ Przekonwertuj na wzór haftu krzyżykowego
        </Text>
      </TouchableOpacity>
    </>
  );

  return (
    <>
      <GlobalLoader visible={loading} message="Pikselizacja, redukcja confetti i dobór mulin DMC..." />
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.mainWrapper, isTabletOrLarger && styles.tabletContainer]}>
          
          {isTabletOrLarger ? (
            /* Tablet / iPad Two-Column Side-by-Side Layout */
            <View style={styles.twoColumnRow}>
              <View style={styles.leftColumn}>
                {renderImageSection()}
              </View>
              <View style={styles.rightColumn}>
                {renderConfigSections()}
              </View>
            </View>
          ) : (
            /* Mobile Single Column Layout */
            <View style={styles.content}>
              {renderImageSection()}
              {renderConfigSections()}
            </View>
          )}

        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 50,
  },
  mainWrapper: {
    width: '100%',
    alignSelf: 'center',
  },
  tabletContainer: {
    maxWidth: 1100,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  twoColumnRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
  },
  leftColumn: {
    flex: 1,
    maxWidth: '46%',
  },
  rightColumn: {
    flex: 1.2,
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: colors.surface,
    padding: 18,
    borderRadius: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    ...shadows.card,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  helperText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  presetCard: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 6,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  presetImage: {
    width: '100%',
    height: 70,
    borderRadius: 8,
    marginBottom: 6,
  },
  presetName: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  imagePreviewContainer: {
    width: '100%',
    height: 220,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  pickButton: {
    backgroundColor: colors.backgroundAlt,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  pickButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subRowContainer: {
    gap: 12,
    marginTop: 6,
  },
  subRowItem: {},
  subRowLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  chipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryBorder,
  },
  chipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fabricOptionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.background,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.surfaceBorder,
  },
  optionButton: {
    flex: 1,
    minWidth: 70,
    backgroundColor: colors.background,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
  },
  smallOptionButton: {
    flex: 1,
    minWidth: 65,
    backgroundColor: colors.background,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
  },
  optionButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  optionButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  optionButtonTextActive: {
    color: colors.primaryDark,
  },
  optionButtonSubtext: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  optionButtonSubtextActive: {
    color: colors.primaryDark,
    fontWeight: '500',
  },
  canvasColorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  colorCard: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.surfaceBorder,
    gap: 4,
  },
  colorCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  colorSwatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
  },
  colorLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  colorLabelActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 9,
  },
  tabActive: {
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  modeContent: {},
  estimatorCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: colors.sageBorder,
    ...shadows.card,
  },
  estimatorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  estimatorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  livePill: {
    backgroundColor: colors.sageLight,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.sageBorder,
  },
  livePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.sageDark,
  },
  estimatorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  estimatorItem: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  estimatorItemHighlight: {
    width: '100%',
    backgroundColor: colors.sageLight,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.sageBorder,
  },
  estimatorLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  estimatorLabelHighlight: {
    fontSize: 12,
    color: colors.sageDark,
    fontWeight: '700',
    marginBottom: 2,
  },
  estimatorValueBold: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  estimatorValueHighlight: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.sageDark,
  },
  estimatorSub: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  estimatorSubHighlight: {
    fontSize: 11,
    color: colors.sageDark,
    marginTop: 2,
  },
  convertButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    ...shadows.glowPrimary,
  },
  convertButtonText: {
    color: colors.textInverted,
    fontSize: 15,
    fontWeight: '800',
  },
  fileImportBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  fileImportIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileImportTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  fileImportDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
  fileImportBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  fileImportBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
