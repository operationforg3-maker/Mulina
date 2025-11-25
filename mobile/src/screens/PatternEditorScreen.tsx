import React, { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
  // Onboarding/tutorial logic
  const TUTORIAL_STEPS = [
    {
      key: 'tool',
      title: 'Wybierz narzędzie',
      description: 'Kliknij jedno z narzędzi powyżej, aby rozpocząć edycję wzoru. Dłuższe przytrzymanie pokaże podpowiedź.'
    },
    {
      key: 'palette',
      title: 'Paleta kolorów',
      description: 'Wybierz kolor z palety poniżej, aby rysować wybranym odcieniem nici.'
    },
    {
      key: 'undo',
      title: 'Cofnij/Zrób ponownie',
      description: 'Użyj strzałek ↶ ↷, aby cofnąć lub powtórzyć ostatnią zmianę.'
    },
    {
      key: 'save',
      title: 'Zapis i eksport',
      description: 'Zmiany zapisują się automatycznie. Możesz wyeksportować wzór do PDF lub innych formatów.'
    },
  ];
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  useEffect(() => {
    (async () => {
      const seen = await AsyncStorage.getItem('patternEditorTutorialSeen');
      if (!seen) {
        setShowTutorial(true);
      }
    })();
  }, []);
  const handleNextTutorial = async () => {
    if (tutorialStep < TUTORIAL_STEPS.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      setShowTutorial(false);
      await AsyncStorage.setItem('patternEditorTutorialSeen', '1');
    }
  };
  const renderTutorial = () => {
    if (!showTutorial) return null;
    const step = TUTORIAL_STEPS[tutorialStep];
    return (
      <View style={styles.tutorialOverlay} pointerEvents="box-none">
        <View style={styles.tutorialBox}>
          <Text style={styles.tutorialTitle}>{step.title}</Text>
          <Text style={styles.tutorialDesc}>{step.description}</Text>
          <TouchableOpacity style={styles.tutorialButton} onPress={handleNextTutorial}>
            <Text style={styles.tutorialButtonText}>{tutorialStep < TUTORIAL_STEPS.length - 1 ? 'Dalej' : 'Zamknij'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
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
  Image,
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
  name: string;
  created_at: string;
  updated_at: string;
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
  image_url?: string;
  progress?: {
    completed_stitches: boolean[][];
    current_color_index: number;
    last_worked: string;
  };
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
  const [selectedTool, setSelectedTool] = useState<'view' | 'pencil' | 'eraser' | 'fill' | 'backstitch'>('view');
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [showGrid, setShowGrid] = useState(true);
  const [showSymbols, setShowSymbols] = useState(true);
  const [companionMode, setCompanionMode] = useState(false);
  const [editHistory, setEditHistory] = useState<number[][][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [backstitch, setBackstitch] = useState<Array<{start: [number, number], end: [number, number], color: number}>>([]);

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
                <TouchableOpacity
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
                  onPress={() => handleCellPress(rowIndex, colIndex)}
                  activeOpacity={selectedTool === 'view' ? 1 : 0.7}
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
                </TouchableOpacity>
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

  const handleCellPress = (rowIndex: number, colIndex: number) => {
    if (!pattern || selectedTool === 'view') return;
    const newGrid = pattern.grid_data.grid.map(row => [...row]);
    let changed = false;
    if (selectedTool === 'pencil') {
      newGrid[rowIndex][colIndex] = selectedColorIndex;
      changed = true;
    } else if (selectedTool === 'eraser') {
      newGrid[rowIndex][colIndex] = -1;
      changed = true;
    } else if (selectedTool === 'fill') {
      floodFill(newGrid, rowIndex, colIndex, newGrid[rowIndex][colIndex], selectedColorIndex);
      changed = true;
    }
    if (changed) {
      saveToHistory(newGrid);
      setPattern({...pattern, grid_data: {...pattern.grid_data, grid: newGrid}});
      Alert.alert('Zapisano', 'Zmiany zostały zapisane');
    }
  };

  const floodFill = (grid: number[][], row: number, col: number, targetColor: number, replacementColor: number) => {
    if (row < 0 || row >= grid.length || col < 0 || col >= grid[0].length) return;
    if (grid[row][col] !== targetColor || targetColor === replacementColor) return;
    grid[row][col] = replacementColor;
    floodFill(grid, row + 1, col, targetColor, replacementColor);
    floodFill(grid, row - 1, col, targetColor, replacementColor);
    floodFill(grid, row, col + 1, targetColor, replacementColor);
    floodFill(grid, row, col - 1, targetColor, replacementColor);
  };

  const saveToHistory = (newGrid: number[][]) => {
    const newHistory = editHistory.slice(0, historyIndex + 1);
    newHistory.push(newGrid);
    setEditHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0 && pattern) {
      const prevGrid = editHistory[historyIndex - 1];
      setPattern({...pattern, grid_data: {...pattern.grid_data, grid: prevGrid}});
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < editHistory.length - 1 && pattern) {
      const nextGrid = editHistory[historyIndex + 1];
      setPattern({...pattern, grid_data: {...pattern.grid_data, grid: nextGrid}});
      setHistoryIndex(historyIndex + 1);
    }
  };

  const removeConfetti = () => {
    if (!pattern) return;
    const newGrid = pattern.grid_data.grid.map(row => [...row]);
    const visited = newGrid.map(row => row.map(() => false));
    
    for (let r = 0; r < newGrid.length; r++) {
      for (let c = 0; c < newGrid[0].length; c++) {
        if (!visited[r][c] && newGrid[r][c] !== -1) {
          const cluster: [number, number][] = [];
          const stack: [number, number][] = [[r, c]];
          const color = newGrid[r][c];
          
          while (stack.length > 0) {
            const [row, col] = stack.pop()!;
            if (row < 0 || row >= newGrid.length || col < 0 || col >= newGrid[0].length) continue;
            if (visited[row][col] || newGrid[row][col] !== color) continue;
            visited[row][col] = true;
            cluster.push([row, col]);
            stack.push([row+1, col], [row-1, col], [row, col+1], [row, col-1]);
          }
          
          if (cluster.length === 1) {
            newGrid[cluster[0][0]][cluster[0][1]] = -1;
          }
        }
      }
    }
    
    saveToHistory(newGrid);
    setPattern({...pattern, grid_data: {...pattern.grid_data, grid: newGrid}});
    Alert.alert('Sukces', 'Usunięto pojedyncze ściegi (confetti)');
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
    const tooltips = {
      view: 'Podgląd',
      pencil: 'Rysuj',
      eraser: 'Gumka',
      fill: 'Wypełnij',
      backstitch: 'Backstitch',
    };
    return (
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={[styles.toolButton, styles.toolButtonLarge, selectedTool === 'view' && styles.toolButtonActive]}
          onPress={() => setSelectedTool('view')}
          onLongPress={() => Alert.alert('Podgląd', 'Tryb podglądu wzoru')}
        >
          <Text style={styles.toolButtonText}>👁️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toolButton, styles.toolButtonLarge, selectedTool === 'pencil' && styles.toolButtonActive]}
          onPress={() => setSelectedTool('pencil')}
          onLongPress={() => Alert.alert('Rysuj', 'Rysuj wybranym kolorem')}
        >
          <Text style={styles.toolButtonText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toolButton, styles.toolButtonLarge, selectedTool === 'eraser' && styles.toolButtonActive]}
          onPress={() => setSelectedTool('eraser')}
          onLongPress={() => Alert.alert('Gumka', 'Usuń ścieg z komórki')}
        >
          <Text style={styles.toolButtonText}>🧹</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toolButton, styles.toolButtonLarge, selectedTool === 'fill' && styles.toolButtonActive]}
          onPress={() => setSelectedTool('fill')}
          onLongPress={() => Alert.alert('Wypełnij', 'Wypełnij obszar kolorem')}
        >
          <Text style={styles.toolButtonText}>🪣</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toolButton, styles.toolButtonLarge, selectedTool === 'backstitch' && styles.toolButtonActive]}
          onPress={() => setSelectedTool('backstitch')}
          onLongPress={() => Alert.alert('Backstitch', 'Dodaj linię konturową')}
        >
          <Text style={styles.toolButtonText}>╱</Text>
        </TouchableOpacity>

        <View style={styles.toolbarSeparator} />

        <TouchableOpacity
          style={styles.toolButton}
          onPress={handleUndo}
          disabled={historyIndex <= 0}
        >
          <Text style={styles.toolButtonText}>↶</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolButton}
          onPress={handleRedo}
          disabled={historyIndex >= editHistory.length - 1}
        >
          <Text style={styles.toolButtonText}>↷</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolButton}
          onPress={removeConfetti}
        >
          <Text style={styles.toolButtonText}>🎊</Text>
        </TouchableOpacity>

        <View style={styles.toolbarSeparator} />

        <TouchableOpacity
          style={styles.toolButton}
          onPress={async () => {
            try {
              const DocumentPicker = (await import('expo-document-picker')).default;
              const result = await DocumentPicker.getDocumentAsync({
                type: 'application/json',
                copyToCacheDirectory: true,
              });

              if (!result.canceled && result.assets && result.assets.length > 0) {
                const { importFromJson } = await import('../services/patternExport');
                const imported = await importFromJson(result.assets[0].uri);
                
                setPattern(imported);
                await savePattern(imported);
                Alert.alert('Sukces', 'Wzór zaimportowany');
              }
            } catch (err) {
              Alert.alert('Błąd importu', 'Nie udało się zaimportować wzoru');
            }
          }}
        >
          <Text style={styles.toolButtonText}>📥</Text>
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

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Ładowanie wzoru...</Text>
        </View>
      ) : pattern ? (
        <>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>{pattern.name}</Text>
              <Text style={styles.headerSubtitle}>
                {pattern.dimensions.width_stitches} x {pattern.dimensions.height_stitches} ściegów
              </Text>
            </View>
          </View>
          {renderToolbar()}
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {renderGrid()}
          </ScrollView>
          {/* Paleta zawsze widoczna pod gridem */}
          {renderColorPalette()}
          {renderTutorial()}
        </>
      ) : (
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Nie znaleziono wzoru.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
    tutorialOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 100,
    },
    tutorialBox: {
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: 28,
      maxWidth: 320,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    tutorialTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#6366f1',
      marginBottom: 8,
      textAlign: 'center',
    },
    tutorialDesc: {
      fontSize: 15,
      color: '#222',
      marginBottom: 18,
      textAlign: 'center',
    },
    tutorialButton: {
      backgroundColor: '#6366f1',
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 28,
    },
    tutorialButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  toolButtonLarge: {
    minWidth: 56,
    minHeight: 56,
    padding: 12,
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
  },
});

