import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';

export default function ImagePickerScreen() {
  const navigation = useNavigation();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Pattern settings
  const [patternType, setPatternType] = useState<'cross_stitch' | 'outline'>('cross_stitch');
  const [maxColors, setMaxColors] = useState(30);
  const [aidaCount, setAidaCount] = useState<14 | 16 | 18 | 20>(14);
  const [threadBrand, setThreadBrand] = useState<'DMC' | 'Anchor' | 'Ariadna'>('DMC');

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Brak uprawnień',
        'Potrzebujemy dostępu do galerii, aby wybrać zdjęcie.'
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Brak uprawnień',
        'Potrzebujemy dostępu do aparatu, aby zrobić zdjęcie.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const convertImage = async () => {
    if (!selectedImage) {
      Alert.alert('Błąd', 'Najpierw wybierz zdjęcie');
      return;
    }

    setLoading(true);

    try {
      // TODO: Upload real image to Firebase Storage
      // For now, use picsum.photos as demo image URL
      const demoImageUrl = 'https://picsum.photos/400/300';

      const response = await fetch('http://127.0.0.1:8000/api/v1/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: demoImageUrl,
          pattern_type: patternType,
          thread_brand: threadBrand,
          max_colors: maxColors,
          aida_count: aidaCount,
          max_width: 200,
          max_height: 200,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      Alert.alert(
        '✅ Wzór wygenerowany!',
        `ID: ${data.pattern_id}\n` +
          `Rozmiar: ${data.dimensions.width_stitches}x${data.dimensions.height_stitches} ściegów\n` +
          `Kolory: ${data.color_palette.length} nici DMC\n` +
          `Wymiary: ${data.dimensions.width_cm}x${data.dimensions.height_cm} cm`,
        [
          {
            text: 'OK',
            onPress: () => {
              // TODO: Navigate to PatternEditor when implemented
              // navigation.navigate('PatternEditor', { patternId: data.pattern_id });
            },
          },
        ]
      );
    } catch (error) {
      console.error('Conversion error:', error);
      Alert.alert(
        'Błąd połączenia',
        'Nie udało się przetworzyć obrazu. Sprawdź czy backend działa (port 8000).'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Image Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wybierz zdjęcie</Text>

          {selectedImage ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.changeImageButton}
                onPress={pickImage}
              >
                <Text style={styles.changeImageText}>Zmień zdjęcie</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderIcon}>🖼️</Text>
              <Text style={styles.placeholderText}>Brak wybranego zdjęcia</Text>
            </View>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.pickButton} onPress={pickImage}>
              <Text style={styles.pickButtonIcon}>📁</Text>
              <Text style={styles.pickButtonText}>Galeria</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.pickButton} onPress={takePhoto}>
              <Text style={styles.pickButtonIcon}>📷</Text>
              <Text style={styles.pickButtonText}>Aparat</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pattern Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Typ wzoru</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                patternType === 'cross_stitch' && styles.optionButtonActive,
              ]}
              onPress={() => setPatternType('cross_stitch')}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  patternType === 'cross_stitch' && styles.optionButtonTextActive,
                ]}
              >
                Cross-Stitch
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionButton,
                patternType === 'outline' && styles.optionButtonActive,
              ]}
              onPress={() => setPatternType('outline')}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  patternType === 'outline' && styles.optionButtonTextActive,
                ]}
              >
                Outline (Surface)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Thread Brand */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Marka nici</Text>
          <View style={styles.buttonRow}>
            {(['DMC', 'Anchor', 'Ariadna'] as const).map((brand) => (
              <TouchableOpacity
                key={brand}
                style={[
                  styles.brandButton,
                  threadBrand === brand && styles.brandButtonActive,
                ]}
                onPress={() => setThreadBrand(brand)}
              >
                <Text
                  style={[
                    styles.brandButtonText,
                    threadBrand === brand && styles.brandButtonTextActive,
                  ]}
                >
                  {brand}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {patternType === 'cross_stitch' && (
          <>
            {/* Aida Count */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Liczba Aida</Text>
              <View style={styles.buttonRow}>
                {[14, 16, 18, 20].map((count) => (
                  <TouchableOpacity
                    key={count}
                    style={[
                      styles.countButton,
                      aidaCount === count && styles.countButtonActive,
                    ]}
                    onPress={() => setAidaCount(count as 14 | 16 | 18 | 20)}
                  >
                    <Text
                      style={[
                        styles.countButtonText,
                        aidaCount === count && styles.countButtonTextActive,
                      ]}
                    >
                      {count}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Max Colors */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Maksymalna liczba kolorów: {maxColors}
              </Text>
              <View style={styles.colorButtonsRow}>
                {[15, 20, 30, 40, 50].map((count) => (
                  <TouchableOpacity
                    key={count}
                    style={[
                      styles.colorButton,
                      maxColors === count && styles.colorButtonActive,
                    ]}
                    onPress={() => setMaxColors(count)}
                  >
                    <Text
                      style={[
                        styles.colorButtonText,
                        maxColors === count && styles.colorButtonTextActive,
                      ]}
                    >
                      {count}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        {/* Convert Button */}
        <TouchableOpacity
          style={[styles.convertButton, !selectedImage && styles.convertButtonDisabled]}
          onPress={convertImage}
          disabled={!selectedImage || loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Text style={styles.convertButtonText}>
                Konwertuj na wzór
              </Text>
              <Text style={styles.convertButtonIcon}>✨</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.helpText}>
          💡 Wybierz zdjęcie o wysokim kontraście dla lepszych rezultatów
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  imagePlaceholder: {
    height: 200,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  placeholderIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 14,
    color: '#6b7280',
  },
  imagePreviewContainer: {
    marginBottom: 12,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  changeImageButton: {
    backgroundColor: '#e0e7ff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  changeImageText: {
    color: '#4338ca',
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pickButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  pickButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  pickButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  optionButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  optionButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  optionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  optionButtonTextActive: {
    color: '#ffffff',
  },
  brandButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  brandButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  brandButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  brandButtonTextActive: {
    color: '#ffffff',
  },
  countButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  countButtonActive: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  countButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  countButtonTextActive: {
    color: '#ffffff',
  },
  colorButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  colorButtonActive: {
    backgroundColor: '#ec4899',
    borderColor: '#ec4899',
  },
  colorButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  colorButtonTextActive: {
    color: '#ffffff',
  },
  convertButton: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  convertButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
  },
  convertButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginRight: 8,
  },
  convertButtonIcon: {
    fontSize: 20,
  },
  helpText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
