import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { loadPattern as loadPatternFromStorage, savePattern, StoredPattern, updatePatternProgress } from '../services/patternStorage';
import CompanionMode from '../components/CompanionMode';

type RootStackParamList = {
  Home: undefined;
  ImagePicker: undefined;
  PatternEditor: { patternId: string; pattern?: any };
};

type PatternEditorRouteProp = RouteProp<RootStackParamList, 'PatternEditor'>;
type PatternEditorNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PatternEditor'>;

interface Thread {
  rgb: number[];
  thread_code: string;
  thread_brand: string;
  thread_name: string;
  symbol: string;
  delta_e: number;
}

interface Pattern {
  pattern_id: string;
  grid_data: {
    grid: number[][];
    type: string;
    width: number;
    height: number;
  };
  color_palette: Thread[];
  dimensions: {
    width_stitches: number;
    height_stitches: number;
    width_cm: number;
    height_cm: number;
  };
  estimated_time: number;
}

const CELL_SIZE = 20; // pixels per stitch
const MIN_CELL_SIZE = 10;
const MAX_CELL_SIZE = 40;

export default function PatternEditorScreen() {
  const route = useRoute<PatternEditorRouteProp>();
  const navigation = useNavigation<PatternEditorNavigationProp>();
  const { patternId, pattern: initialPattern } = route.params;

  const [pattern, setPattern] = useState<Pattern | null>(initialPattern || null);
  const [loading, setLoading] = useState(!initialPattern);
  const [cellSize, setCellSize] = useState(CELL_SIZE);
  const [selectedTool, setSelectedTool] = useState<'view' | 'pencil' | 'eraser'>('view');
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [showGrid, setShowGrid] = useState(true);
  const [showSymbols, setShowSymbols] = useState(true);
  const [companionMode, setCompanionMode] = useState(false);

  useEffect(() => {
    if (!initialPattern) {
      loadPattern();
    }
  }, [patternId, initialPattern]);

  const loadPattern = async () => {
    try {
      const savedPattern = await loadPatternFromStorage(patternId);
      
      if (savedPattern) {
        setPattern(savedPattern);
      } else {
        throw new Error('Pattern not found in storage');
      }
    } catch (error) {
      console.error('Load pattern error:', error);
      Alert.alert(
        'Błąd',
        'Nie udało się załadować wzoru.',
        [
          {
            text: 'Wróć',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const renderGrid = () => {
    if (!pattern) return null;

    const { grid } = pattern.grid_data;
    const { color_palette } = pattern;

    return (
      <View style={styles.gridContainer}>
        {grid.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.gridRow}>
            {row.map((colorIndex, colIndex) => {
              const thread = color_palette[colorIndex];
              const backgroundColor = thread
                ? `rgb(${thread.rgb[0]}, ${thread.rgb[1]}, ${thread.rgb[2]})`
                : '#fff';

              return (
                <View
                  key={`cell-${rowIndex}-${colIndex}`}
                  style={[
                    styles.gridCell,
                    {
                      width: cellSize,
                      height: cellSize,
                      backgroundColor,
                      borderWidth: showGrid ? 0.5 : 0,
                    },
                  ]}
                >
                  {showSymbols && thread && cellSize >= 15 && (
                    <Text
                      style={[
                        styles.symbolText,
                        {
                          fontSize: Math.max(8, cellSize * 0.5),
                          color: getContrastColor(thread.rgb),
                        },
                      ]}
                    >
                      {thread.symbol}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  const getContrastColor = (rgb: number[]): string => {
    // Calculate luminance and return black or white for best contrast
    const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
    return luminance > 0.5 ? '#000' : '#fff';
  };

  const handleUpdateProgress = async (
    completedStitches: boolean[][],
    currentColorIndex: number
  ) => {
    try {
      await updatePatternProgress(patternId, completedStitches, currentColorIndex);
      // Reload pattern to get updated data
      const updated = await loadPatternFromStorage(patternId);
      if (updated) {
        setPattern(updated);
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  if (companionMode && pattern) {
    return (
      <CompanionMode
        pattern={pattern}
        onUpdateProgress={handleUpdateProgress}
        onClose={() => setCompanionMode(false)}
      />
    );
  }

  const renderColorPalette = () => {
    if (!pattern) return null;

    return (
      <ScrollView
        horizontal
        style={styles.paletteContainer}
        contentContainerStyle={styles.paletteContent}
        showsHorizontalScrollIndicator={false}
      >
        {pattern.color_palette.map((thread, index) => (
          <TouchableOpacity
            key={`color-${index}`}
            style={[
              styles.paletteItem,
              selectedColorIndex === index && styles.paletteItemSelected,
            ]}
            onPress={() => setSelectedColorIndex(index)}
          >
            <View
              style={[
                styles.paletteColor,
                {
                  backgroundColor: `rgb(${thread.rgb[0]}, ${thread.rgb[1]}, ${thread.rgb[2]})`,
                },
              ]}
            >
              <Text style={[styles.paletteSymbol, { color: getContrastColor(thread.rgb) }]}>
                {thread.symbol}
              </Text>
            </View>
            <Text style={styles.paletteCode} numberOfLines={1}>
              {thread.thread_brand} {thread.thread_code}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderToolbar = () => {
    return (
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={[styles.toolButton, selectedTool === 'view' && styles.toolButtonActive]}
          onPress={() => setSelectedTool('view')}
        >
          <Text style={styles.toolButtonText}>👁️</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolButton, selectedTool === 'pencil' && styles.toolButtonActive]}
          onPress={() => setSelectedTool('pencil')}
        >
          <Text style={styles.toolButtonText}>✏️</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolButton, selectedTool === 'eraser' && styles.toolButtonActive]}
          onPress={() => setSelectedTool('eraser')}
        >
          <Text style={styles.toolButtonText}>🧹</Text>
        </TouchableOpacity>

        <View style={styles.toolbarSeparator} />

        <TouchableOpacity
          style={styles.toolButton}
          onPress={() => setShowGrid(!showGrid)}
        >
          <Text style={styles.toolButtonText}>{showGrid ? '🔲' : '⬜'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolButton}
          onPress={() => setShowSymbols(!showSymbols)}
        >
          <Text style={styles.toolButtonText}>{showSymbols ? 'AB' : 'ab'}</Text>
        </TouchableOpacity>

        <View style={styles.toolbarSeparator} />

        <TouchableOpacity
          style={styles.toolButton}
          onPress={() => setCellSize(Math.max(MIN_CELL_SIZE, cellSize - 5))}
          disabled={cellSize <= MIN_CELL_SIZE}
        >
          <Text style={styles.toolButtonText}>🔍-</Text>
        </TouchableOpacity>

        <Text style={styles.zoomText}>{Math.round((cellSize / CELL_SIZE) * 100)}%</Text>

        <TouchableOpacity
          style={styles.toolButton}
          onPress={() => setCellSize(Math.min(MAX_CELL_SIZE, cellSize + 5))}
          disabled={cellSize >= MAX_CELL_SIZE}
        >
          <Text style={styles.toolButtonText}>🔍+</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Ładowanie wzoru...</Text>
      </View>
    );
  }

  if (!pattern) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Nie znaleziono wzoru</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Wróć</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Info */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Wzór {pattern.pattern_id}</Text>
          <Text style={styles.headerSubtitle}>
            {pattern.dimensions.width_stitches} × {pattern.dimensions.height_stitches} ściegów
            {' • '}
            {pattern.color_palette.length} kolorów
            {' • '}
            {pattern.dimensions.width_cm.toFixed(1)} × {pattern.dimensions.height_cm.toFixed(1)} cm
          </Text>
        </View>
      </View>

      {/* Toolbar */}
      {renderToolbar()}

      {/* Color Palette */}
      {renderColorPalette()}

      {/* Grid ScrollView */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        showsHorizontalScrollIndicator={true}
        bounces={false}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          bounces={false}
        >
          {renderGrid()}
        </ScrollView>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonSecondary]}
          onPress={() => setCompanionMode(true)}
        >
          <Text style={styles.actionButtonText}>🧵 Companion Mode</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonPrimary]}
          onPress={() => {
            Alert.alert('Export', 'PDF export będzie dostępny wkrótce');
          }}
        >
          <Text style={[styles.actionButtonText, { color: '#fff' }]}>📄 PDF</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    marginBottom: 16,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#6366f1',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerInfo: {
    gap: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 8,
  },
  toolButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    minWidth: 40,
    alignItems: 'center',
  },
  toolButtonActive: {
    backgroundColor: '#6366f1',
  },
  toolButtonText: {
    fontSize: 16,
  },
  toolbarSeparator: {
    width: 1,
    height: 24,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 4,
  },
  zoomText: {
    fontSize: 12,
    color: '#6b7280',
    minWidth: 40,
    textAlign: 'center',
  },
  paletteContainer: {
    backgroundColor: '#fff',
    maxHeight: 100,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  paletteContent: {
    padding: 12,
    gap: 8,
  },
  paletteItem: {
    alignItems: 'center',
    gap: 4,
    padding: 4,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paletteItemSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
  },
  paletteColor: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  paletteSymbol: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  paletteCode: {
    fontSize: 10,
    color: '#6b7280',
    maxWidth: 60,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  gridContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  gridRow: {
    flexDirection: 'row',
  },
  gridCell: {
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#e5e7eb',
  },
  symbolText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  bottomActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonPrimary: {
    backgroundColor: '#6366f1',
  },
  actionButtonSecondary: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
});
