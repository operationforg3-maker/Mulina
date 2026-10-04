import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Platform,
  TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { savePattern } from '../services/patternStorage';
import { parsePatternFile } from '../services/parsers/patternParsers';
import { convertImageClient } from '../services/clientPatternConverter';
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
    name: '🐱 Rudzielec (5:4)',
    url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300',
    aspect: 1.25,
  },
  {
    id: 'landscape',
    name: '🏔️ Krajobraz (3:2 / 1.5:1)',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300',
    aspect: 0.67,
  },
];

export interface CanvasFormatItem {
  id: string;
  category: 'frame' | 'hoop';
  name: string;
  desc: string;
  widthCm: number;
  heightCm: number;
  icon: string;
  isRound?: boolean;
}

export const CANVAS_FORMATS: CanvasFormatItem[] = [
  // Ramki i standardowe formaty
  { id: 'frame_10_15', category: 'frame', name: '10 × 15 cm', desc: 'Klasyczna mała ramka foto', widthCm: 10, heightCm: 15, icon: '🖼️' },
  { id: 'frame_13_18', category: 'frame', name: '13 × 18 cm', desc: 'Popularna ramka średnia', widthCm: 13, heightCm: 18, icon: '🖼️' },
  { id: 'frame_15_20', category: 'frame', name: '15 × 20 cm', desc: 'Duża ramka stojąca', widthCm: 15, heightCm: 20, icon: '🖼️' },
  { id: 'frame_18_24', category: 'frame', name: '18 × 24 cm', desc: 'Średnia ramka ścienna', widthCm: 18, heightCm: 24, icon: '🖼️' },
  { id: 'frame_20_25', category: 'frame', name: '20 × 25 cm', desc: 'Portret lub kwadrat', widthCm: 20, heightCm: 25, icon: '🖼️' },
  { id: 'frame_21_30', category: 'frame', name: '21 × 30 cm (A4)', desc: 'Standardowy arkusz A4', widthCm: 21, heightCm: 29.7, icon: '📄' },
  { id: 'frame_30_40', category: 'frame', name: '30 × 40 cm', desc: 'Ścienny obraz dekoracyjny', widthCm: 30, heightCm: 40, icon: '🖼️' },
  { id: 'frame_40_50', category: 'frame', name: '40 × 50 cm', desc: 'Duży motyw wystawowy', widthCm: 40, heightCm: 50, icon: '🖼️' },
  { id: 'frame_50_70', category: 'frame', name: '50 × 70 cm', desc: 'Wielka reprodukcja / plakat', widthCm: 50, heightCm: 70, icon: '🏛️' },

  // Tamborki okrągłe
  { id: 'hoop_10', category: 'hoop', name: 'Tamborek 10 cm (4")', desc: 'Mini zawieszka / brelok', widthCm: 9, heightCm: 9, isRound: true, icon: '⭕' },
  { id: 'hoop_13', category: 'hoop', name: 'Tamborek 13 cm (5")', desc: 'Mały tamborek ozdobny', widthCm: 12, heightCm: 12, isRound: true, icon: '⭕' },
  { id: 'hoop_16', category: 'hoop', name: 'Tamborek 16 cm (6.5")', desc: 'Najpopularniejszy standard', widthCm: 15, heightCm: 15, isRound: true, icon: '⭕' },
  { id: 'hoop_18', category: 'hoop', name: 'Tamborek 18 cm (7")', desc: 'Średni tamborek bambusowy', widthCm: 17, heightCm: 17, isRound: true, icon: '⭕' },
  { id: 'hoop_20', category: 'hoop', name: 'Tamborek 20 cm (8")', desc: 'Duży motyw tamborkowy', widthCm: 19, heightCm: 19, isRound: true, icon: '⭕' },
  { id: 'hoop_25', category: 'hoop', name: 'Tamborek 25 cm (10")', desc: 'Bardzo duża kompozycja', widthCm: 24, heightCm: 24, isRound: true, icon: '⭕' },
  { id: 'hoop_30', category: 'hoop', name: 'Tamborek 30 cm (12")', desc: 'Maksymalny tamborek', widthCm: 28, heightCm: 28, isRound: true, icon: '⭕' },
];

export default function ImagePickerScreen() {
  const navigation = useNavigation<ImagePickerNavigationProp>();
  const { isTabletOrLarger } = useResponsive();
  const { theme } = useTheme();

  // Wizard Step: 1 = Zdjęcie, 2 = Płótno i Rozmiar, 3 = Nici DMC i Styl
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  const [selectedImage, setSelectedImage] = useState<string | null>(PRESET_IMAGES[0].url);
  const [loading, setLoading] = useState(false);

  // Proportions & Aspect Ratio Advisor State
  const [detectedAspect, setDetectedAspect] = useState<number>(1.0);
  const [fitMode, setFitMode] = useState<'natural' | 'contain' | 'cover'>('natural');
  const [showAspectAdvisor, setShowAspectAdvisor] = useState<boolean>(false);

  // 1. Sizing Mode & Dimensions
  const [sizeMode, setSizeMode] = useState<'formats' | 'cm' | 'stitches'>('formats');
  const [formatCategory, setFormatCategory] = useState<'all' | 'frame' | 'hoop'>('all');
  const [selectedFormatId, setSelectedFormatId] = useState<string>('frame_13_18');

  // Custom Dimensions in CM
  const [customWidthCmInput, setCustomWidthCmInput] = useState<string>('15');
  const [customHeightCmInput, setCustomHeightCmInput] = useState<string>('15');
  const [lockAspect, setLockAspect] = useState<boolean>(true);

  // Custom Dimensions in Stitches
  const [customWidthStitchesInput, setCustomWidthStitchesInput] = useState<string>('80');
  const [customHeightStitchesInput, setCustomHeightStitchesInput] = useState<string>('80');

  // Fast Presets
  const [targetWidthCm, setTargetWidthCm] = useState<number>(15);
  const [targetStitches, setTargetStitches] = useState<number>(80);

  // Uploaded Image aspect ratio
  const [customImageAspect, setCustomImageAspect] = useState<number>(1.0);

  // 2. Fabric / Canvas Options (Aida, Evenweave, Linen, Plastic, Custom)
  const [fabricType, setFabricType] = useState<'aida' | 'evenweave' | 'linen' | 'plastic' | 'custom'>('aida');
  const [aidaCount, setAidaCount] = useState<number>(14);
  const [isCustomCount, setIsCustomCount] = useState<boolean>(false);
  const [customCountInput, setCustomCountInput] = useState<string>('14');
  const [overTwoThreads, setOverTwoThreads] = useState<boolean>(false);
  const [canvasColor, setCanvasColor] = useState<'white' | 'cream' | 'black' | 'linen'>('white');
  const [marginCm, setMarginCm] = useState<number>(5);

  // 3. Thread & Palette Settings
  const [threadBrand, setThreadBrand] = useState<'DMC' | 'Anchor' | 'Ariadna' | 'Madeira' | 'CXC' | 'Dimensions'>('DMC');
  const [maxColors, setMaxColors] = useState<number>(30);
  const [cleanupConfetti, setCleanupConfetti] = useState<boolean>(true);

  // 4. Image Preprocessing Adjustments
  const [brightness, setBrightness] = useState<number>(1.0);
  const [contrast, setContrast] = useState<number>(1.0);

  // Automatic Image Dimension & Aspect Ratio Measurement
  useEffect(() => {
    if (!selectedImage) return;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const img = new (window as any).Image();
      img.onload = () => {
        if (img.naturalWidth && img.naturalHeight) {
          onImageDimensionsMeasured(img.naturalWidth, img.naturalHeight);
        }
      };
      img.src = selectedImage;
    } else {
      Image.getSize(
        selectedImage,
        (w, h) => onImageDimensionsMeasured(w, h),
        () => {}
      );
    }
  }, [selectedImage]);

  const onImageDimensionsMeasured = (w: number, h: number) => {
    const ratio = h / w;
    setCustomImageAspect(ratio);
    setDetectedAspect(ratio);

    // If ratio is visibly non-square (e.g. 1.5:1 or 0.67:1), show advisor to assist the user
    if (Math.abs(ratio - 1.0) > 0.05) {
      setShowAspectAdvisor(true);
    } else {
      setShowAspectAdvisor(false);
    }

    // Automatically recalculate target height to avoid squashing in natural mode:
    const curW = parseFloat(customWidthCmInput) || 15;
    setCustomHeightCmInput((curW * ratio).toFixed(1));

    const curStitches = parseInt(customWidthStitchesInput, 10) || 80;
    setCustomHeightStitchesInput(Math.round(curStitches * ratio).toString());
  };

  // Helper: Stitches per cm based on Fabric type and count
  const isOverTwo = fabricType === 'evenweave' || fabricType === 'linen' || (isCustomCount && overTwoThreads);
  const effectiveCount = isOverTwo ? aidaCount / 2 : aidaCount;
  const stitchesPerCm = effectiveCount / 2.54;

  // Real-time calculation of dimensions
  let estWidthStitches = 0;
  let estHeightStitches = 0;
  let estWidthCm = '0';
  let estHeightCm = '0';

  const currentPreset = PRESET_IMAGES.find((p) => p.url === selectedImage);
  const aspect = currentPreset ? currentPreset.aspect : customImageAspect;

  if (sizeMode === 'formats') {
    const chosenFormat = CANVAS_FORMATS.find((f) => f.id === selectedFormatId) || CANVAS_FORMATS[1];
    const formatAspect = chosenFormat.heightCm / chosenFormat.widthCm;
    let finalWidthCm = chosenFormat.widthCm;
    let finalHeightCm = chosenFormat.heightCm;

    if (fitMode === 'contain' || fitMode === 'cover') {
      // In contain (letterbox) or cover (crop), the canvas maintains the exact frame format
      estWidthCm = chosenFormat.widthCm.toFixed(1);
      estHeightCm = chosenFormat.heightCm.toFixed(1);
      estWidthStitches = Math.max(10, Math.round(chosenFormat.widthCm * stitchesPerCm));
      estHeightStitches = Math.max(10, Math.round(chosenFormat.heightCm * stitchesPerCm));
    } else {
      // Natural mode: fit image nicely into format boundary preserving aspect ratio without distortion
      if (aspect > formatAspect) {
        finalHeightCm = chosenFormat.heightCm;
        finalWidthCm = chosenFormat.heightCm / aspect;
      } else {
        finalWidthCm = chosenFormat.widthCm;
        finalHeightCm = chosenFormat.widthCm * aspect;
      }
      estWidthCm = finalWidthCm.toFixed(1);
      estHeightCm = finalHeightCm.toFixed(1);
      estWidthStitches = Math.max(10, Math.round(finalWidthCm * stitchesPerCm));
      estHeightStitches = Math.max(10, Math.round(finalHeightCm * stitchesPerCm));
    }
  } else if (sizeMode === 'cm') {
    const w = parseFloat(customWidthCmInput) || targetWidthCm || 15;
    const h = (fitMode === 'natural' || lockAspect) ? w * aspect : (parseFloat(customHeightCmInput) || w * aspect);
    estWidthCm = w.toFixed(1);
    estHeightCm = h.toFixed(1);
    estWidthStitches = Math.max(10, Math.round(w * stitchesPerCm));
    estHeightStitches = Math.max(10, Math.round(h * stitchesPerCm));
  } else {
    const wStitches = parseInt(customWidthStitchesInput, 10) || targetStitches || 80;
    const hStitches = (fitMode === 'natural' || lockAspect) ? Math.round(wStitches * aspect) : (parseInt(customHeightStitchesInput, 10) || Math.round(wStitches * aspect));
    estWidthStitches = Math.max(10, wStitches);
    estHeightStitches = Math.max(10, hStitches);
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
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.base64) {
          const mime = asset.uri.endsWith('.png') ? 'image/png' : 'image/jpeg';
          setSelectedImage(`data:${mime};base64,${asset.base64}`);
        } else if (Platform.OS === 'web' && asset.uri.startsWith('blob:')) {
          try {
            const blobRes = await fetch(asset.uri);
            const blob = await blobRes.blob();
            const reader = new FileReader();
            reader.onloadend = () => {
              if (typeof reader.result === 'string') {
                setSelectedImage(reader.result);
              } else {
                setSelectedImage(asset.uri);
              }
            };
            reader.readAsDataURL(blob);
          } catch {
            setSelectedImage(asset.uri);
          }
        } else {
          setSelectedImage(asset.uri);
        }
      }
    } catch (e: any) {
      console.error('Error picking image:', e);
      if (Platform.OS === 'web') {
        window.alert('Nie udało się wybrać zdjęcia: ' + e.message);
      } else {
        Alert.alert('Błąd', 'Nie udało się wybrać zdjęcia: ' + e.message);
      }
    }
  };

  const convertImage = async () => {
    if (!selectedImage) {
      if (Platform.OS === 'web') {
        window.alert('Wskaż motyw lub wgraj własne zdjęcie.');
      } else {
        Alert.alert('Wybierz zdjęcie', 'Wskaż motyw lub wgraj własne zdjęcie.');
      }
      return;
    }

    setLoading(true);

    try {
      const converted = await convertImageClient({
        imageUri: selectedImage,
        targetWidth: estWidthStitches,
        targetHeight: estHeightStitches,
        brand: threadBrand,
        maxColors: maxColors,
        cleanupConfetti: cleanupConfetti,
        brightness: brightness,
        contrast: contrast,
        aidaCount: aidaCount,
        widthCm: parseFloat(estWidthCm),
        heightCm: parseFloat(estHeightCm),
        canvasColor: canvasColor,
        marginCm: marginCm,
        fitMode: fitMode,
      });

      try {
        await savePattern(converted);
      } catch (saveErr) {
        console.warn('savePattern ignored storage error:', saveErr);
      }
      setLoading(false);

      navigation.navigate('PatternEditor', {
        patternId: converted.pattern_id,
        pattern: converted,
      });
    } catch (error: any) {
      setLoading(false);
      console.error('Conversion error:', error);
      const errMsg = `Błąd konwersji: ${error.message || 'Nieznany błąd'}`;
      if (Platform.OS === 'web') {
        window.alert(errMsg);
      } else {
        Alert.alert('Błąd konwersji', errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // STEP 1: Zdjęcie i Wzory
  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      {/* Direct Pattern File Import Banner */}
      <View style={[styles.fileImportBanner, { backgroundColor: theme.primaryLight, borderColor: theme.primaryBorder }]}>
        <View style={[styles.fileImportIconBox, { backgroundColor: theme.surface }]}>
          <Text style={{ fontSize: 24 }}>📥</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.fileImportTitle, { color: theme.primaryDark }]}>
            Masz gotowy plik haftu?
          </Text>
          <Text style={[styles.fileImportDesc, { color: theme.textSecondary }]}>
            Obsługa formatów .saga, .xsd, .pat, .oxs oraz cyfrowych i skanowanych PDF.
          </Text>
        </View>
        <TouchableOpacity style={[styles.fileImportBtn, { backgroundColor: theme.primary }]} onPress={handlePickPatternFile} activeOpacity={0.85}>
          <Text style={styles.fileImportBtnText}>Otwórz plik</Text>
        </TouchableOpacity>
      </View>

      {/* Preset selection card */}
      <View style={[styles.cozyCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
          📸 Wybierz lub wgraj zdjęcie do konwersji
        </Text>
        <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
          Wybierz jedną z gotowych grafik lub wgraj własne zdjęcie z galerii:
        </Text>

        <View style={styles.presetsRow}>
          {PRESET_IMAGES.map((preset) => (
            <TouchableOpacity
              key={preset.id}
              style={[
                styles.presetCard,
                selectedImage === preset.url && {
                  borderColor: theme.primary,
                  backgroundColor: theme.primaryLight,
                },
              ]}
              onPress={() => setSelectedImage(preset.url)}
              activeOpacity={0.85}
            >
              <Image source={{ uri: preset.url }} style={styles.presetImage} />
              <Text style={[styles.presetName, { color: theme.textPrimary }]}>{preset.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={[styles.uploadButton, { backgroundColor: theme.backgroundAlt, borderColor: theme.surfaceBorder }]} onPress={pickImage} activeOpacity={0.85}>
          <Text style={{ fontSize: 18, marginRight: 8 }}>📁</Text>
          <Text style={[styles.uploadButtonText, { color: theme.textPrimary }]}>Wgraj własne zdjęcie z galerii / dysku</Text>
        </TouchableOpacity>

        {selectedImage && (
          <View style={styles.previewContainer}>
            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
            <View style={styles.aspectBadge}>
              <Text style={styles.aspectBadgeText}>
                Proporcje: {detectedAspect > 1 ? `1 : ${detectedAspect.toFixed(2)} (pion)` : `${(1 / detectedAspect).toFixed(2)} : 1 (poziom)`}
              </Text>
            </View>
          </View>
        )}

        {/* Proportions Advisor Banner (When non-square image is detected) */}
        {showAspectAdvisor && (
          <View style={[styles.advisorCard, { backgroundColor: theme.primaryLight, borderColor: theme.primaryBorder }]}>
            <View style={styles.advisorHeader}>
              <Text style={{ fontSize: 22 }}>📐</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.advisorTitle, { color: theme.primaryDark }]}>
                  Wykryto prostokątne zdjęcie ({detectedAspect < 1 ? `${(1 / detectedAspect).toFixed(2)} : 1` : `1 : ${detectedAspect.toFixed(2)}`})
                </Text>
                <Text style={[styles.advisorSubtitle, { color: theme.textSecondary }]}>
                  Wybierz jak algorytm ma dopasować kadr, aby uniknąć rozciągania:
                </Text>
              </View>
            </View>

            <View style={styles.advisorButtonsCol}>
              <TouchableOpacity
                style={[
                  styles.advisorBtn,
                  fitMode === 'natural' && { backgroundColor: theme.surface, borderColor: theme.primary },
                ]}
                onPress={() => {
                  setFitMode('natural');
                  setLockAspect(true);
                }}
                activeOpacity={0.85}
              >
                <Text style={{ fontSize: 18, marginRight: 8 }}>📐</Text>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.advisorBtnTitle, fitMode === 'natural' && { color: theme.primary, fontWeight: '800' }]}>
                      Naturalny prostokąt
                    </Text>
                    <View style={[styles.recBadge, { backgroundColor: theme.primary }]}>
                      <Text style={styles.recBadgeText}>Zalecane</Text>
                    </View>
                  </View>
                  <Text style={[styles.advisorBtnDesc, { color: theme.textSecondary }]}>
                    Dopasuj siatkę do zdjęcia ({estWidthStitches} × {estHeightStitches} krz. / {estWidthCm} × {estHeightCm} cm). Cały kadr, zero zniekształceń.
                  </Text>
                </View>
                {fitMode === 'natural' && <Text style={{ color: theme.primary, fontWeight: '900', fontSize: 16 }}>✓</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.advisorBtn,
                  fitMode === 'contain' && { backgroundColor: theme.surface, borderColor: theme.primary },
                ]}
                onPress={() => setFitMode('contain')}
                activeOpacity={0.85}
              >
                <Text style={{ fontSize: 18, marginRight: 8 }}>🖼️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.advisorBtnTitle, fitMode === 'contain' && { color: theme.primary, fontWeight: '800' }]}>
                    Zostaw puste pola kanwy (Letterbox)
                  </Text>
                  <Text style={[styles.advisorBtnDesc, { color: theme.textSecondary }]}>
                    Wpisz motyw w wybraną ramkę. Puste krawędzie wokół motywu to czysta tkanina bez haftowania.
                  </Text>
                </View>
                {fitMode === 'contain' && <Text style={{ color: theme.primary, fontWeight: '900', fontSize: 16 }}>✓</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.advisorBtn,
                  fitMode === 'cover' && { backgroundColor: theme.surface, borderColor: theme.primary },
                ]}
                onPress={() => setFitMode('cover')}
                activeOpacity={0.85}
              >
                <Text style={{ fontSize: 18, marginRight: 8 }}>✂️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.advisorBtnTitle, fitMode === 'cover' && { color: theme.primary, fontWeight: '800' }]}>
                    Wypełnij i przytnij (Kadrowanie)
                  </Text>
                  <Text style={[styles.advisorBtnDesc, { color: theme.textSecondary }]}>
                    Wypełnij cały format bez rozciągania pikseli, przycinając delikatnie nadmiar krawędzi.
                  </Text>
                </View>
                {fitMode === 'cover' && <Text style={{ color: theme.primary, fontWeight: '900', fontSize: 16 }}>✓</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Quick Brightness & Contrast Toggles */}
        <View style={styles.filterSection}>
          <Text style={[styles.filterSectionTitle, { color: theme.textPrimary }]}>
            ✨ Szybka korekta tonalna zdjęcia:
          </Text>
          <View style={styles.filterRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.filterLabel, { color: theme.textSecondary }]}>Jasność:</Text>
              <View style={styles.chipRow}>
                {[
                  { label: '-20%', val: 0.8 },
                  { label: 'Standard', val: 1.0 },
                  { label: '+20%', val: 1.2 },
                ].map((b) => (
                  <TouchableOpacity
                    key={b.label}
                    style={[styles.smallChip, brightness === b.val && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                    onPress={() => setBrightness(b.val)}
                  >
                    <Text style={[styles.smallChipText, brightness === b.val && { color: '#ffffff', fontWeight: '800' }]}>
                      {b.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.filterLabel, { color: theme.textSecondary }]}>Kontrast:</Text>
              <View style={styles.chipRow}>
                {[
                  { label: 'Standard', val: 1.0 },
                  { label: 'Wyrazisty', val: 1.2 },
                ].map((c) => (
                  <TouchableOpacity
                    key={c.label}
                    style={[styles.smallChip, contrast === c.val && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                    onPress={() => setContrast(c.val)}
                  >
                    <Text style={[styles.smallChipText, contrast === c.val && { color: '#ffffff', fontWeight: '800' }]}>
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Next step CTA */}
        <TouchableOpacity
          style={[styles.stepNextBtn, { backgroundColor: theme.primary }]}
          onPress={() => setActiveStep(2)}
          activeOpacity={0.88}
        >
          <Text style={styles.stepNextBtnText}>Krok 2: Dobierz płótno i rozmiar ➔</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // STEP 2: Płótno i Rozmiar
  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      {/* Fabric choice card */}
      <View style={[styles.cozyCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
          🪡 Rodzaj kanwy i gęstość ściegów
        </Text>
        <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
          Wybierz tkaninę lub wpisz dowolny własny count:
        </Text>

        {/* Fabric Type Pills */}
        <View style={styles.fabricTypeRow}>
          {[
            { id: 'aida', label: 'Kanwa Aida', icon: '◻️' },
            { id: 'evenweave', label: 'Evenweave', icon: '🧵' },
            { id: 'linen', label: 'Len (Linen)', icon: '🌾' },
            { id: 'plastic', label: 'Plastikowa', icon: '🔲' },
            { id: 'custom', label: 'Własny count', icon: '✏️' },
          ].map((ft) => (
            <TouchableOpacity
              key={ft.id}
              style={[
                styles.fabricTypeBtn,
                fabricType === ft.id && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              onPress={() => {
                setFabricType(ft.id as any);
                if (ft.id === 'aida') { setAidaCount(14); setIsCustomCount(false); }
                else if (ft.id === 'evenweave') { setAidaCount(28); setIsCustomCount(false); }
                else if (ft.id === 'linen') { setAidaCount(32); setIsCustomCount(false); }
                else if (ft.id === 'plastic') { setAidaCount(14); setIsCustomCount(false); }
                else if (ft.id === 'custom') { setIsCustomCount(true); }
              }}
            >
              <Text style={{ fontSize: 13, marginRight: 4 }}>{ft.icon}</Text>
              <Text style={[styles.fabricTypeBtnText, fabricType === ft.id && { color: '#ffffff', fontWeight: '800' }]}>
                {ft.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Fabric Counts Buttons */}
        {!isCustomCount && (
          <View style={styles.buttonRow}>
            {fabricType === 'aida' &&
              [
                { count: 11, label: '11 ct', desc: '4.3 śc/cm' },
                { count: 14, label: '14 ct (Standard)', desc: '5.4 śc/cm' },
                { count: 16, label: '16 ct', desc: '6.3 śc/cm' },
                { count: 18, label: '18 ct', desc: '7.1 śc/cm' },
                { count: 20, label: '20 ct', desc: '7.9 śc/cm' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.count}
                  style={[
                    styles.fabricOptionButton,
                    aidaCount === item.count && styles.optionButtonActive,
                  ]}
                  onPress={() => setAidaCount(item.count)}
                >
                  <Text style={[styles.optionButtonText, aidaCount === item.count && styles.optionButtonTextActive]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.optionButtonSubtext, aidaCount === item.count && styles.optionButtonSubtextActive]}>
                    {item.desc}
                  </Text>
                </TouchableOpacity>
              ))}

            {fabricType === 'evenweave' &&
              [
                { count: 25, label: '25 ct', desc: '12.5ct eff. (4.9 śc/cm)' },
                { count: 28, label: '28 ct', desc: '14ct eff. (5.4 śc/cm)' },
                { count: 32, label: '32 ct', desc: '16ct eff. (6.3 śc/cm)' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.count}
                  style={[
                    styles.fabricOptionButton,
                    aidaCount === item.count && styles.optionButtonActive,
                  ]}
                  onPress={() => setAidaCount(item.count)}
                >
                  <Text style={[styles.optionButtonText, aidaCount === item.count && styles.optionButtonTextActive]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.optionButtonSubtext, aidaCount === item.count && styles.optionButtonSubtextActive]}>
                    {item.desc}
                  </Text>
                </TouchableOpacity>
              ))}

            {fabricType === 'linen' &&
              [
                { count: 28, label: '28 ct', desc: '14ct eff. (5.4 śc/cm)' },
                { count: 32, label: '32 ct', desc: '16ct eff. (6.3 śc/cm)' },
                { count: 36, label: '36 ct', desc: '18ct eff. (7.1 śc/cm)' },
                { count: 40, label: '40 ct', desc: '20ct eff. (7.9 śc/cm)' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.count}
                  style={[
                    styles.fabricOptionButton,
                    aidaCount === item.count && styles.optionButtonActive,
                  ]}
                  onPress={() => setAidaCount(item.count)}
                >
                  <Text style={[styles.optionButtonText, aidaCount === item.count && styles.optionButtonTextActive]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.optionButtonSubtext, aidaCount === item.count && styles.optionButtonSubtextActive]}>
                    {item.desc}
                  </Text>
                </TouchableOpacity>
              ))}

            {fabricType === 'plastic' &&
              [
                { count: 10, label: '10 ct', desc: '3.9 śc/cm' },
                { count: 14, label: '14 ct', desc: '5.4 śc/cm' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.count}
                  style={[
                    styles.fabricOptionButton,
                    aidaCount === item.count && styles.optionButtonActive,
                  ]}
                  onPress={() => setAidaCount(item.count)}
                >
                  <Text style={[styles.optionButtonText, aidaCount === item.count && styles.optionButtonTextActive]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.optionButtonSubtext, aidaCount === item.count && styles.optionButtonSubtextActive]}>
                    {item.desc}
                  </Text>
                </TouchableOpacity>
              ))}
          </View>
        )}

        {/* Custom Count Input */}
        {(isCustomCount || fabricType === 'custom') && (
          <View style={[styles.customCountBox, { backgroundColor: theme.backgroundAlt, borderColor: theme.surfaceBorder }]}>
            <Text style={[styles.customCountLabel, { color: theme.textPrimary }]}>
              Wpisz dowolną gęstość kanwy (count):
            </Text>
            <View style={styles.customCountInputRow}>
              <TextInput
                style={[styles.customCountInput, { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.surfaceBorder }]}
                keyboardType="numeric"
                value={customCountInput}
                onChangeText={(val) => {
                  setCustomCountInput(val);
                  const parsed = parseFloat(val);
                  if (!isNaN(parsed) && parsed > 0) {
                    setAidaCount(parsed);
                  }
                }}
              />
              <Text style={[styles.customCountUnit, { color: theme.textSecondary }]}>ct (ściegów na cal)</Text>
            </View>

            <TouchableOpacity
              style={styles.overTwoToggle}
              onPress={() => setOverTwoThreads(!overTwoThreads)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, overTwoThreads && { backgroundColor: theme.primary, borderColor: theme.primary }]}>
                {overTwoThreads && <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>✓</Text>}
              </View>
              <Text style={[styles.overTwoText, { color: theme.textSecondary }]}>
                Haft przez 2 nitki osnowy (efektywnie {(aidaCount / 2).toFixed(1)} ct)
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Canvas Color */}
        <Text style={[styles.sectionSubtitleSmall, { color: theme.textPrimary, marginTop: 14 }]}>
          Kolor kanwy / tła haftu:
        </Text>
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
              <View style={[styles.colorSwatch, { backgroundColor: c.color, borderColor: c.border }]} />
              <Text style={[styles.colorLabel, canvasColor === c.id && styles.colorLabelActive]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Sizing & Canvas Formats Card */}
      <View style={[styles.cozyCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
          📐 Rozmiar haftu i format oprawy
        </Text>
        <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
          Wybierz gotową ramkę, tamborek lub określ własne wymiary w cm bądź ściegach:
        </Text>

        {/* Fit Mode Selector Pills */}
        <View style={[styles.fitModeRow, { backgroundColor: theme.backgroundAlt, borderColor: theme.surfaceBorder }]}>
          {[
            { id: 'natural', label: '📐 Prostokąt zdjęcia', desc: 'Pełen kadr bez rozciągania' },
            { id: 'contain', label: '🖼️ Puste pole kanwy', desc: 'Brak haftu na marginesach' },
            { id: 'cover', label: '✂️ Przytnij krawędzie', desc: 'Wypełnij ramkę kadrując' },
          ].map((m) => (
            <TouchableOpacity
              key={m.id}
              style={[
                styles.fitModeBtn,
                fitMode === m.id && { backgroundColor: theme.surface, borderColor: theme.primary },
              ]}
              onPress={() => setFitMode(m.id as any)}
            >
              <Text style={[styles.fitModeBtnTitle, fitMode === m.id && { color: theme.primary, fontWeight: '800' }]}>
                {m.label}
              </Text>
              <Text style={[styles.fitModeBtnDesc, { color: theme.textMuted }]}>
                {m.desc}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sub-tabs for Sizing */}
        <View style={[styles.tabContainer, { backgroundColor: theme.backgroundAlt, marginTop: 12 }]}>
          <TouchableOpacity
            style={[styles.tab, sizeMode === 'formats' && styles.tabActive]}
            onPress={() => setSizeMode('formats')}
          >
            <Text style={[styles.tabText, sizeMode === 'formats' && styles.tabTextActive]}>
              🖼️ Formaty & tamborki
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, sizeMode === 'cm' && styles.tabActive]}
            onPress={() => setSizeMode('cm')}
          >
            <Text style={[styles.tabText, sizeMode === 'cm' && styles.tabTextActive]}>
              📏 Dowolne cm
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, sizeMode === 'stitches' && styles.tabActive]}
            onPress={() => setSizeMode('stitches')}
          >
            <Text style={[styles.tabText, sizeMode === 'stitches' && styles.tabTextActive]}>
              🔢 Liczba ściegów
            </Text>
          </TouchableOpacity>
        </View>

        {/* Mode 1: Formats */}
        {sizeMode === 'formats' && (
          <View>
            <View style={styles.formatFilterRow}>
              {[
                { id: 'all', label: 'Wszystkie' },
                { id: 'frame', label: '🖼️ Ramki foto' },
                { id: 'hoop', label: '⭕ Tamborki' },
              ].map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.formatFilterChip,
                    formatCategory === cat.id && styles.formatFilterChipActive,
                  ]}
                  onPress={() => setFormatCategory(cat.id as any)}
                >
                  <Text style={[styles.formatFilterChipText, formatCategory === cat.id && styles.formatFilterChipTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.formatsList}>
              {CANVAS_FORMATS.filter((f) => formatCategory === 'all' || f.category === formatCategory).map((fmt) => {
                const isSelected = selectedFormatId === fmt.id;
                const approxStitchesW = Math.round(fmt.widthCm * stitchesPerCm);
                const approxStitchesH = Math.round(fmt.heightCm * stitchesPerCm);

                return (
                  <TouchableOpacity
                    key={fmt.id}
                    style={[
                      styles.formatCard,
                      isSelected && {
                        borderColor: theme.primary,
                        backgroundColor: theme.backgroundAlt,
                      },
                    ]}
                    onPress={() => {
                      setSelectedFormatId(fmt.id);
                      setCustomWidthCmInput(fmt.widthCm.toString());
                      setCustomHeightCmInput(fmt.heightCm.toString());
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.formatCardTop}>
                      <Text style={{ fontSize: 18, marginRight: 8 }}>{fmt.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.formatCardTitle, isSelected && { color: theme.primary, fontWeight: '800' }]}>
                          {fmt.name}
                        </Text>
                        <Text style={styles.formatCardDesc}>{fmt.desc}</Text>
                      </View>
                      {isSelected && (
                        <View style={[styles.formatCheckmark, { backgroundColor: theme.primary }]}>
                          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900' }}>✓</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.formatCardFooter}>
                      <Text style={[styles.formatCardFooterText, { color: theme.textMuted }]}>
                        📐 Na wybranej kanwie {effectiveCount} ct: ok. {approxStitchesW} × {approxStitchesH} krz.
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Mode 2: Custom cm */}
        {sizeMode === 'cm' && (
          <View>
            <Text style={[styles.subRowLabel, { color: theme.textSecondary }]}>Szybki wybór szerokości:</Text>
            <View style={styles.buttonRow}>
              {[10, 15, 20, 25, 30, 40].map((val) => (
                <TouchableOpacity
                  key={val}
                  style={[
                    styles.smallOptionButton,
                    parseFloat(customWidthCmInput) === val && styles.optionButtonActive,
                  ]}
                  onPress={() => {
                    setTargetWidthCm(val);
                    setCustomWidthCmInput(val.toString());
                    if (lockAspect || fitMode === 'natural') {
                      setCustomHeightCmInput((val * aspect).toFixed(1));
                    }
                  }}
                >
                  <Text style={[styles.optionButtonText, parseFloat(customWidthCmInput) === val && styles.optionButtonTextActive]}>
                    {val} cm
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.customDimensionBox, { backgroundColor: theme.backgroundAlt, borderColor: theme.surfaceBorder }]}>
              <Text style={[styles.customDimensionHeader, { color: theme.textPrimary }]}>
                Wpisz dowolny rozmiar w centymetrach:
              </Text>
              <View style={styles.dimensionInputsRow}>
                <View style={styles.dimensionInputGroup}>
                  <Text style={[styles.dimInputLabel, { color: theme.textSecondary }]}>Szerokość</Text>
                  <View style={[styles.dimInputWrapper, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
                    <TextInput
                      style={[styles.dimTextInput, { color: theme.textPrimary }]}
                      keyboardType="numeric"
                      value={customWidthCmInput}
                      onChangeText={(val) => {
                        setCustomWidthCmInput(val);
                        const num = parseFloat(val);
                        if (!isNaN(num) && num > 0) {
                          setTargetWidthCm(num);
                          if (lockAspect || fitMode === 'natural') {
                            setCustomHeightCmInput((num * aspect).toFixed(1));
                          }
                        }
                      }}
                    />
                    <Text style={[styles.dimUnit, { color: theme.textMuted }]}>cm</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.aspectLockBtn, (lockAspect || fitMode === 'natural') && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                  onPress={() => setLockAspect(!lockAspect)}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 16 }}>{lockAspect ? '🔗' : '🔓'}</Text>
                  <Text style={[styles.aspectLockText, (lockAspect || fitMode === 'natural') && { color: '#ffffff' }]}>
                    {lockAspect ? 'Proporcje' : 'Swobodny'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.dimensionInputGroup}>
                  <Text style={[styles.dimInputLabel, { color: theme.textSecondary }]}>Wysokość</Text>
                  <View style={[styles.dimInputWrapper, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
                    <TextInput
                      style={[styles.dimTextInput, { color: theme.textPrimary }]}
                      keyboardType="numeric"
                      value={customHeightCmInput}
                      editable={!lockAspect && fitMode !== 'natural'}
                      onChangeText={(val) => {
                        setCustomHeightCmInput(val);
                      }}
                    />
                    <Text style={[styles.dimUnit, { color: theme.textMuted }]}>cm</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Mode 3: Custom Stitches */}
        {sizeMode === 'stitches' && (
          <View>
            <Text style={[styles.subRowLabel, { color: theme.textSecondary }]}>Szybki wybór liczby ściegów:</Text>
            <View style={styles.buttonRow}>
              {[
                { label: '45x (Mini)', val: 45 },
                { label: '60x (Mały)', val: 60 },
                { label: '80x (Standard)', val: 80 },
                { label: '120x (Duży)', val: 120 },
                { label: '160x (Master)', val: 160 },
              ].map((s) => (
                <TouchableOpacity
                  key={s.val}
                  style={[
                    styles.smallOptionButton,
                    parseInt(customWidthStitchesInput, 10) === s.val && styles.optionButtonActive,
                  ]}
                  onPress={() => {
                    setTargetStitches(s.val);
                    setCustomWidthStitchesInput(s.val.toString());
                    if (lockAspect || fitMode === 'natural') {
                      setCustomHeightStitchesInput(Math.round(s.val * aspect).toString());
                    }
                  }}
                >
                  <Text style={[styles.optionButtonText, parseInt(customWidthStitchesInput, 10) === s.val && styles.optionButtonTextActive]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.customDimensionBox, { backgroundColor: theme.backgroundAlt, borderColor: theme.surfaceBorder }]}>
              <Text style={[styles.customDimensionHeader, { color: theme.textPrimary }]}>
                Wpisz dokładną siatkę krzyżyków:
              </Text>
              <View style={styles.dimensionInputsRow}>
                <View style={styles.dimensionInputGroup}>
                  <Text style={[styles.dimInputLabel, { color: theme.textSecondary }]}>Szerokość</Text>
                  <View style={[styles.dimInputWrapper, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
                    <TextInput
                      style={[styles.dimTextInput, { color: theme.textPrimary }]}
                      keyboardType="numeric"
                      value={customWidthStitchesInput}
                      onChangeText={(val) => {
                        setCustomWidthStitchesInput(val);
                        const num = parseInt(val, 10);
                        if (!isNaN(num) && num > 0) {
                          setTargetStitches(num);
                          if (lockAspect || fitMode === 'natural') {
                            setCustomHeightStitchesInput(Math.round(num * aspect).toString());
                          }
                        }
                      }}
                    />
                    <Text style={[styles.dimUnit, { color: theme.textMuted }]}>krz.</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.aspectLockBtn, (lockAspect || fitMode === 'natural') && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                  onPress={() => setLockAspect(!lockAspect)}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 16 }}>{lockAspect ? '🔗' : '🔓'}</Text>
                  <Text style={[styles.aspectLockText, (lockAspect || fitMode === 'natural') && { color: '#ffffff' }]}>
                    {lockAspect ? 'Proporcje' : 'Swobodny'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.dimensionInputGroup}>
                  <Text style={[styles.dimInputLabel, { color: theme.textSecondary }]}>Wysokość</Text>
                  <View style={[styles.dimInputWrapper, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
                    <TextInput
                      style={[styles.dimTextInput, { color: theme.textPrimary }]}
                      keyboardType="numeric"
                      value={customHeightStitchesInput}
                      editable={!lockAspect && fitMode !== 'natural'}
                      onChangeText={(val) => {
                        setCustomHeightStitchesInput(val);
                      }}
                    />
                    <Text style={[styles.dimUnit, { color: theme.textMuted }]}>krz.</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Margin selector */}
        <Text style={[styles.subRowLabel, { color: theme.textSecondary, marginTop: 14 }]}>
          Margines płótna na oprawę (z każdej strony):
        </Text>
        <View style={styles.chipRow}>
          {[
            { label: '3 cm (tamborek)', val: 3 },
            { label: '5 cm (standard)', val: 5 },
            { label: '7 cm (passe-partout)', val: 7 },
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

        {/* Live Size Summary Bar */}
        <View style={[styles.sizeSummaryBanner, { backgroundColor: theme.backgroundAlt, borderColor: theme.surfaceBorder }]}>
          <Text style={{ fontSize: 18, marginRight: 10 }}>🎯</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sizeSummaryMain, { color: theme.textPrimary }]}>
              Haft: <Text style={{ fontWeight: '800', color: theme.primary }}>{estWidthCm} × {estHeightCm} cm</Text> ({estWidthStitches} × {estHeightStitches} krz.)
            </Text>
            <Text style={[styles.sizeSummarySub, { color: theme.textSecondary }]}>
              ✂️ Wytnij płótno: <Text style={{ fontWeight: '700', color: theme.textPrimary }}>{cutWidthCm} × {cutHeightCm} cm</Text> (+{marginCm} cm marginesu)
            </Text>
          </View>
        </View>

        {/* Next step CTA */}
        <TouchableOpacity
          style={[styles.stepNextBtn, { backgroundColor: theme.primary, marginTop: 16 }]}
          onPress={() => setActiveStep(3)}
          activeOpacity={0.88}
        >
          <Text style={styles.stepNextBtnText}>Krok 3: Wybierz nici DMC i styl ➔</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // STEP 3: Nici DMC i Styl
  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <View style={[styles.cozyCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
          🧵 Paleta mulin i stylizacja haftu
        </Text>
        <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
          Wybierz producenta nici oraz limit kolorów dla optymalnego odwzorowania:
        </Text>

        <Text style={[styles.subRowLabel, { color: theme.textSecondary }]}>Marka muliny:</Text>
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
              <Text style={[styles.optionButtonText, threadBrand === brand && styles.optionButtonTextActive]}>
                {brand}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.subRowLabel, { color: theme.textSecondary, marginTop: 14 }]}>
          Liczba kolorów w schemacie:
        </Text>
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
              <Text style={[styles.optionButtonText, maxColors === item.count && styles.optionButtonTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.subRowLabel, { color: theme.textSecondary, marginTop: 14 }]}>
          Redukcja szumów i pojedynczych krzyżyków (confetti):
        </Text>
        <View style={styles.chipRow}>
          <TouchableOpacity
            style={[styles.chip, cleanupConfetti && styles.chipActive]}
            onPress={() => setCleanupConfetti(true)}
          >
            <Text style={[styles.chipText, cleanupConfetti && styles.chipTextActive]}>
              🧹 Czyste plamy (usuń confetti)
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

      {/* Real-time Material Estimator Box */}
      <View style={[styles.estimatorCard, { backgroundColor: theme.surface, borderColor: colors.sageBorder }]}>
        <View style={styles.estimatorHeader}>
          <Text style={[styles.estimatorTitle, { color: theme.textPrimary }]}>
            📊 Podsumowanie materiałowe
          </Text>
          <View style={styles.livePill}>
            <Text style={styles.livePillText}>Na żywo</Text>
          </View>
        </View>

        <View style={styles.estimatorGrid}>
          <View style={[styles.estimatorItem, { backgroundColor: theme.background, borderColor: theme.surfaceBorder }]}>
            <Text style={styles.estimatorLabel}>Wymiary haftu:</Text>
            <Text style={[styles.estimatorValueBold, { color: theme.textPrimary }]}>
              {estWidthCm} × {estHeightCm} cm
            </Text>
            <Text style={styles.estimatorSub}>{estWidthStitches} × {estHeightStitches} ściegów</Text>
          </View>

          <View style={styles.estimatorItemHighlight}>
            <Text style={styles.estimatorLabelHighlight}>✂️ Wytnij płótno:</Text>
            <Text style={styles.estimatorValueHighlight}>
              {cutWidthCm} × {cutHeightCm} cm
            </Text>
            <Text style={styles.estimatorSubHighlight}>+{marginCm} cm z każdej strony na oprawę</Text>
          </View>

          <View style={[styles.estimatorItem, { backgroundColor: theme.background, borderColor: theme.surfaceBorder }]}>
            <Text style={styles.estimatorLabel}>Nici muliny:</Text>
            <Text style={[styles.estimatorValueBold, { color: theme.textPrimary }]}>
              ~{estSkeins} szt. {threadBrand}
            </Text>
            <Text style={styles.estimatorSub}>koszt: ok. {estCostPln} zł</Text>
          </View>

          <View style={[styles.estimatorItem, { backgroundColor: theme.background, borderColor: theme.surfaceBorder }]}>
            <Text style={styles.estimatorLabel}>Łącznie ściegów:</Text>
            <Text style={[styles.estimatorValueBold, { color: theme.textPrimary }]}>
              {totalEstStitches.toLocaleString('pl-PL')}
            </Text>
            <Text style={styles.estimatorSub}>czas: ok. {estHours} godz.</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <GlobalLoader visible={loading} message="Pikselizacja w przestrzeni CIELAB, redukcja confetti i dobór mulin..." />

      {/* Top 3-Step Wizard Header */}
      <View style={[styles.wizardHeader, { backgroundColor: theme.surface, borderBottomColor: theme.surfaceBorder }]}>
        <TouchableOpacity
          style={[styles.wizardTab, activeStep === 1 && styles.wizardTabActive]}
          onPress={() => setActiveStep(1)}
          activeOpacity={0.8}
        >
          <View style={[styles.stepNumCircle, activeStep === 1 && { backgroundColor: theme.primary }]}>
            <Text style={[styles.stepNumText, activeStep === 1 && { color: '#ffffff' }]}>1</Text>
          </View>
          <Text style={[styles.wizardStepTitle, activeStep === 1 && { color: theme.primary, fontWeight: '800' }]}>
            Zdjęcie
          </Text>
        </TouchableOpacity>

        <View style={[styles.wizardDivider, { backgroundColor: theme.surfaceBorder }]} />

        <TouchableOpacity
          style={[styles.wizardTab, activeStep === 2 && styles.wizardTabActive]}
          onPress={() => setActiveStep(2)}
          activeOpacity={0.8}
        >
          <View style={[styles.stepNumCircle, activeStep === 2 && { backgroundColor: theme.primary }]}>
            <Text style={[styles.stepNumText, activeStep === 2 && { color: '#ffffff' }]}>2</Text>
          </View>
          <Text style={[styles.wizardStepTitle, activeStep === 2 && { color: theme.primary, fontWeight: '800' }]}>
            Płótno & Wymiar
          </Text>
        </TouchableOpacity>

        <View style={[styles.wizardDivider, { backgroundColor: theme.surfaceBorder }]} />

        <TouchableOpacity
          style={[styles.wizardTab, activeStep === 3 && styles.wizardTabActive]}
          onPress={() => setActiveStep(3)}
          activeOpacity={0.8}
        >
          <View style={[styles.stepNumCircle, activeStep === 3 && { backgroundColor: theme.primary }]}>
            <Text style={[styles.stepNumText, activeStep === 3 && { color: '#ffffff' }]}>3</Text>
          </View>
          <Text style={[styles.wizardStepTitle, activeStep === 3 && { color: theme.primary, fontWeight: '800' }]}>
            Nici DMC
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Scroll Content */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.mainWrapper, isTabletOrLarger && styles.tabletContainer]}>
          {activeStep === 1 && renderStep1()}
          {activeStep === 2 && renderStep2()}
          {activeStep === 3 && renderStep3()}
        </View>
      </ScrollView>

      {/* Persistent Floating Bottom Action Bar */}
      <View style={[styles.stickyBottomBar, { backgroundColor: theme.surface, borderTopColor: theme.surfaceBorder }]}>
        <View style={styles.summaryBadge}>
          <Text style={[styles.summaryBadgeTextBold, { color: theme.textPrimary }]}>
            📐 {estWidthCm} × {estHeightCm} cm • {fitMode === 'contain' ? 'Letterbox' : (fitMode === 'cover' ? 'Crop' : 'Prostokąt')}
          </Text>
          <Text style={[styles.summaryBadgeTextSub, { color: theme.textSecondary }]}>
            {estWidthStitches}×{estHeightStitches} krz. • {threadBrand} • {maxColors === 0 ? 'Bez limitu' : `${maxColors} kol.`}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.convertFloatingBtn, { backgroundColor: theme.primary }]}
          onPress={convertImage}
          activeOpacity={0.88}
        >
          <Text style={styles.convertFloatingBtnText}>✨ Wygeneruj haft</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  wizardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    ...shadows.card,
    zIndex: 10,
  },
  wizardTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 12,
    gap: 6,
  },
  wizardTabActive: {
    backgroundColor: 'rgba(232, 114, 150, 0.08)',
  },
  stepNumCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  wizardStepTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  wizardDivider: {
    width: 1,
    height: 20,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  mainWrapper: {
    width: '100%',
    padding: 14,
  },
  tabletContainer: {
    maxWidth: 820,
    alignSelf: 'center',
    paddingTop: 16,
  },
  stepContainer: {
    gap: 14,
  },
  cozyCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    ...shadows.card,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 14,
  },
  fileImportBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  fileImportIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.card,
  },
  fileImportTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  fileImportDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  fileImportBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  fileImportBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  presetCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 6,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetImage: {
    width: '100%',
    height: 65,
    borderRadius: 8,
    marginBottom: 4,
  },
  presetName: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  uploadButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  previewContainer: {
    width: '100%',
    height: 220,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    marginBottom: 12,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  aspectBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  aspectBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  advisorCard: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    marginBottom: 12,
    gap: 10,
  },
  advisorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  advisorTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  advisorSubtitle: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 1,
  },
  advisorButtonsCol: {
    gap: 8,
  },
  advisorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  advisorBtnTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  recBadge: {
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  recBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  advisorBtnDesc: {
    fontSize: 10,
    lineHeight: 14,
    marginTop: 2,
  },
  fitModeRow: {
    flexDirection: 'row',
    gap: 6,
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 6,
  },
  fitModeBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  fitModeBtnTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
  },
  fitModeBtnDesc: {
    fontSize: 9,
    textAlign: 'center',
    marginTop: 2,
  },
  filterSection: {
    marginTop: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  filterSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  smallChip: {
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  smallChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  stepNextBtn: {
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    ...shadows.card,
  },
  stepNextBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  fabricTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  fabricTypeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  fabricTypeBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  fabricOptionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8FAFC',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  optionButton: {
    flex: 1,
    minWidth: 70,
    backgroundColor: '#F8FAFC',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  smallOptionButton: {
    flex: 1,
    minWidth: 65,
    backgroundColor: '#F8FAFC',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  optionButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  optionButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  optionButtonTextActive: {
    color: colors.primaryDark,
  },
  optionButtonSubtext: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  optionButtonSubtextActive: {
    color: colors.primaryDark,
    fontWeight: '600',
  },
  customCountBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
    gap: 8,
  },
  customCountLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  customCountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customCountInput: {
    width: 80,
    fontSize: 16,
    fontWeight: '800',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    textAlign: 'center',
  },
  customCountUnit: {
    fontSize: 12,
    fontWeight: '600',
  },
  overTwoToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overTwoText: {
    fontSize: 11,
    flex: 1,
  },
  sectionSubtitleSmall: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  canvasColorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  colorCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  colorCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  colorSwatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  tabActive: {
    backgroundColor: '#ffffff',
    ...shadows.card,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: colors.primaryDark,
    fontWeight: '800',
  },
  formatFilterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  formatFilterChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  formatFilterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  formatFilterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  formatFilterChipTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  formatsList: {
    gap: 8,
  },
  formatCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  formatCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  formatCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  formatCardDesc: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  formatCheckmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  formatCardFooter: {
    marginTop: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  formatCardFooterText: {
    fontSize: 10,
  },
  customDimensionBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
  },
  customDimensionHeader: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
  },
  dimensionInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dimensionInputGroup: {
    flex: 1,
  },
  dimInputLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
  },
  dimInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 8,
    height: 38,
  },
  dimTextInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  dimUnit: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  aspectLockBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginTop: 14,
  },
  aspectLockText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 1,
  },
  subRowLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryBorder,
  },
  chipText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.primaryDark,
    fontWeight: '800',
  },
  sizeSummaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
  },
  sizeSummaryMain: {
    fontSize: 12,
    fontWeight: '600',
  },
  sizeSummarySub: {
    fontSize: 10,
    marginTop: 2,
  },
  estimatorCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    ...shadows.card,
  },
  estimatorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  estimatorTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  livePill: {
    backgroundColor: colors.sageLight,
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.sageBorder,
  },
  livePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.sageDark,
  },
  estimatorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  estimatorItem: {
    flex: 1,
    minWidth: '46%',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  estimatorItemHighlight: {
    width: '100%',
    backgroundColor: colors.sageLight,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.sageBorder,
  },
  estimatorLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: 1,
  },
  estimatorLabelHighlight: {
    fontSize: 11,
    color: colors.sageDark,
    fontWeight: '700',
    marginBottom: 1,
  },
  estimatorValueBold: {
    fontSize: 14,
    fontWeight: '800',
  },
  estimatorValueHighlight: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.sageDark,
  },
  estimatorSub: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 1,
  },
  estimatorSubHighlight: {
    fontSize: 10,
    color: colors.sageDark,
    marginTop: 1,
  },
  stickyBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    ...shadows.card,
  },
  summaryBadge: {
    flex: 1,
    marginRight: 10,
  },
  summaryBadgeTextBold: {
    fontSize: 13,
    fontWeight: '800',
  },
  summaryBadgeTextSub: {
    fontSize: 10,
    marginTop: 2,
  },
  convertFloatingBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    ...shadows.glowPrimary,
  },
  convertFloatingBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
