import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  PanResponder,
  Linking,
} from 'react-native';
import Svg, { Line, Circle as SvgCircle } from 'react-native-svg';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { loadPattern as loadPatternFromStorage, savePattern, renamePattern, StoredPattern, getUserStash, StashItem } from '../services/patternStorage';
import { DEMO_PATTERN } from '../services/demoPattern';
import { colors, shadows } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { useResponsive } from '../theme/useResponsive';
import PatternCanvasViewport, { PatternCanvasViewportRef } from '../components/PatternCanvasViewport';
import {
  FlowerIcon,
  CraftShopIcon,
  PdfStitchIcon,
  NeedleIcon,
  FrameBoxIcon,
  PearlPinIcon,
  LockCraftIcon,
  ZoomMagnifierIcon,
  PencilCraftIcon,
  EraserCraftIcon,
  FillBucketIcon,
  CrossStitchIcon,
  SymbolGlyphIcon,
  ColorPaletteIcon,
  FlossSkeinIcon,
  StitchHistoryIcon,
  WandIcon,
} from '../components/RusticIcons';

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
  stitch_count?: number;
  skeins_needed?: number;
}

export interface BackstitchLine {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color_index: number;
  completed?: boolean;
}

export interface ParkedThread {
  r: number;
  c: number;
  corner: 'NW' | 'NE' | 'SW' | 'SE';
  thread_code: string;
  color_index: number;
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
  backstitch?: BackstitchLine[];
  parked_threads?: ParkedThread[];
  estimated_time?: number;
  image_url?: string;
  progress?: {
    completed_stitches: boolean[][];
    completed_backstitch?: string[];
    current_color_index: number;
    last_worked: string;
  };
}

export default function PatternEditorScreen() {
  const route = useRoute<PatternEditorRouteProp>();
  const navigation = useNavigation<PatternEditorNavigationProp>();
  const { patternId, pattern: initialPattern } = route.params || {};
  const { isTabletOrLarger } = useResponsive();
  const { theme, themeMode, toggleTheme } = useTheme();

  const [pattern, setPattern] = useState<Pattern | null>(initialPattern || (DEMO_PATTERN as any));
  const [loading, setLoading] = useState(false);
  
  // Cross-Stitch Display Settings
  const [cellSize, setCellSize] = useState(20);
  const [viewMode, setViewMode] = useState<'stitches' | 'symbols' | 'colors'>('stitches');
  const [highlightColorIndex, setHighlightColorIndex] = useState<number | null>(null);
  
  // Thread Panel visibility (Collapsible left sidebar on tablet/desktop, collapsible bottom bar on mobile)
  const [showThreadPanel, setShowThreadPanel] = useState(true);

  // Fullscreen / Focus Mode (hides top headers to allow pattern to fill 100% of display)
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Canvas Viewport Ref for hardware-accelerated zoom/fit/fill controls
  const viewportRef = useRef<PatternCanvasViewportRef>(null);

  // Tools: stitch, box_select, parking, picker, pencil, eraser, fill
  const [activeTool, setActiveTool] = useState<'stitch' | 'box_select' | 'parking' | 'pencil' | 'eraser' | 'fill' | 'picker'>('stitch');
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [showLegendModal, setShowLegendModal] = useState(false);
  const [showShopModal, setShowShopModal] = useState(false);
  const [stitchLock, setStitchLock] = useState(true); // true = drag marks stitches, false = scroll mode

  // Backstitch & Parking State
  const [showBackstitch, setShowBackstitch] = useState(true);
  const [backstitchLines, setBackstitchLines] = useState<BackstitchLine[]>([]);
  const [parkedThreads, setParkedThreads] = useState<ParkedThread[]>([]);
  const [parkingCorner, setParkingCorner] = useState<'NW' | 'NE' | 'SW' | 'SE'>('NE');

  // Box Selection State
  const [boxStart, setBoxStart] = useState<{ r: number; c: number } | null>(null);
  const [boxEnd, setBoxEnd] = useState<{ r: number; c: number } | null>(null);
  const [isBoxSelecting, setIsBoxSelecting] = useState(false);

  // Gesture Toast Notification
  const [gestureToast, setGestureToast] = useState<string | null>(null);

  // Stash data for 1-Click shopping
  const [userStash, setUserStash] = useState<Record<string, StashItem>>({});

  // Completed stitches state
  const [completedStitches, setCompletedStitches] = useState<boolean[][]>([]);

  // History for Undo/Redo
  const [history, setHistory] = useState<number[][][]>([]);
  const [historyStep, setHistoryStep] = useState(-1);

  // Multi-touch tracking
  const touchStartRef = useRef<{ time: number; count: number }>({ time: 0, count: 0 });
  const longPressTimerRef = useRef<any>(null);

  // Drag-to-mark state (multi-cell stitch marking by dragging finger/pointer)
  const isDraggingRef = useRef(false);
  const dragModeRef = useRef<'mark' | 'unmark'>('mark');
  const dragVisitedRef = useRef<Set<string>>(new Set());
  const gridContainerRef = useRef<View>(null);
  const gridLayoutRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const scrollOffsetRef = useRef({ x: 0, y: 0 });
  const completedStitchesRef = useRef<boolean[][]>(completedStitches);
  
  // Keep ref in sync with state
  useEffect(() => {
    completedStitchesRef.current = completedStitches;
  }, [completedStitches]);

  // Initialize pattern & progress
  useEffect(() => {
    if (initialPattern) {
      setPattern(initialPattern);
    } else if (patternId) {
      (async () => {
        setLoading(true);
        const saved = await loadPatternFromStorage(patternId);
        if (saved) {
          setPattern(saved as any);
        } else {
          setPattern(DEMO_PATTERN as any);
        }
        setLoading(false);
      })();
    }
  }, [patternId, initialPattern]);

  useEffect(() => {
    if (pattern && pattern.grid_data) {
      const h = pattern.grid_data.height;
      const w = pattern.grid_data.width;
      if (pattern.progress?.completed_stitches && pattern.progress.completed_stitches.length === h) {
        setCompletedStitches(pattern.progress.completed_stitches);
      } else {
        const init = Array(h).fill(null).map(() => Array(w).fill(false));
        setCompletedStitches(init);
      }
      if (pattern.backstitch) {
        setBackstitchLines(pattern.backstitch);
      }
      if (pattern.parked_threads) {
        setParkedThreads(pattern.parked_threads);
      }
      setHistory([pattern.grid_data.grid]);
      setHistoryStep(0);
    }
  }, [pattern?.pattern_id]);

  // Load user stash
  useEffect(() => {
    (async () => {
      try {
        const stash = await getUserStash();
        setUserStash(stash);
      } catch (e) {
        console.warn('Failed to load user stash', e);
      }
    })();
  }, []);

  if (loading || !pattern) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Ładowanie wzoru haftu...</Text>
      </View>
    );
  }

  const { grid, width, height } = pattern.grid_data;
  const { color_palette } = pattern;

  // Calculate statistics
  let totalStitches = width * height;
  let totalCompleted = 0;
  let colorStitchesTotal = 0;
  let colorStitchesCompleted = 0;

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const isDone = completedStitches[r]?.[c];
      if (isDone) totalCompleted++;
      if (grid[r]?.[c] === selectedColorIndex) {
        colorStitchesTotal++;
        if (isDone) colorStitchesCompleted++;
      }
    }
  }

  const overallPercent = Math.round((totalCompleted / (totalStitches || 1)) * 100);
  const colorPercent = Math.round((colorStitchesCompleted / (colorStitchesTotal || 1)) * 100);

  // Combined check: stitch tool active AND lock mode on (drag marks stitches)
  const isDragStitchMode = activeTool === 'stitch' && stitchLock;

  // Cell Click Handler (for single click or editing tools)
  const handleCellClick = (r: number, c: number) => {
    if (activeTool === 'stitch') {
      const nextCompleted = completedStitches.map(row => [...row]);
      nextCompleted[r][c] = !nextCompleted[r][c];
      setCompletedStitches(nextCompleted);

      const updated = {
        ...pattern,
        progress: {
          completed_stitches: nextCompleted,
          current_color_index: selectedColorIndex,
          last_worked: new Date().toISOString(),
        },
      };
      savePattern(updated as any);
      return;
    }

    if (activeTool === 'parking') {
      const existingIdx = parkedThreads.findIndex(pt => pt.r === r && pt.c === c);
      if (existingIdx >= 0) {
        const next = parkedThreads.filter((_, i) => i !== existingIdx);
        setParkedThreads(next);
        setGestureToast('Usunięto zaparkowaną nitkę');
      } else {
        const t = color_palette[selectedColorIndex];
        const next = [
          ...parkedThreads,
          {
            r,
            c,
            corner: parkingCorner,
            thread_code: t.thread_code,
            color_index: selectedColorIndex,
          },
        ];
        setParkedThreads(next);
        setGestureToast(`Zaparkowano nitkę ${t.thread_brand} ${t.thread_code} (${parkingCorner})`);
      }
      setTimeout(() => setGestureToast(null), 1500);
      return;
    }

    if (activeTool === 'box_select') {
      if (!isBoxSelecting) {
        setIsBoxSelecting(true);
        setBoxStart({ r, c });
        setBoxEnd({ r, c });
      } else if (boxStart) {
        handleBoxSelectFinish(boxStart.r, boxStart.c, r, c);
      }
      return;
    }

    if (activeTool === 'picker') {
      const pickedColor = grid[r][c];
      if (pickedColor >= 0 && pickedColor < color_palette.length) {
        setSelectedColorIndex(pickedColor);
        setHighlightColorIndex(pickedColor);
        setActiveTool('stitch');
      }
      return;
    }

    // Grid Editing
    const newGrid = grid.map(row => [...row]);
    let modified = false;

    if (activeTool === 'pencil') {
      newGrid[r][c] = selectedColorIndex;
      modified = true;
    } else if (activeTool === 'eraser') {
      newGrid[r][c] = -1;
      modified = true;
    } else if (activeTool === 'fill') {
      const target = newGrid[r][c];
      if (target !== selectedColorIndex) {
        floodFill(newGrid, r, c, target, selectedColorIndex);
        modified = true;
      }
    }

    if (modified) {
      const newHistory = history.slice(0, historyStep + 1);
      newHistory.push(newGrid);
      setHistory(newHistory);
      setHistoryStep(newHistory.length - 1);
      setPattern({
        ...pattern,
        grid_data: {
          ...pattern.grid_data,
          grid: newGrid,
        },
      });
    }
  };

  // ===== DRAG-TO-MARK: Multi-cell stitch marking by dragging =====
  const RULER_LEFT_WIDTH = 28;
  const RULER_TOP_HEIGHT = 18;

  const getCellFromPageCoords = useCallback((pageX: number, pageY: number): { r: number; c: number } | null => {
    const layout = gridLayoutRef.current;
    const scroll = scrollOffsetRef.current;
    
    const relX = pageX - layout.x + scroll.x - RULER_LEFT_WIDTH;
    const relY = pageY - layout.y + scroll.y - RULER_TOP_HEIGHT;
    
    const c = Math.floor(relX / cellSize);
    const r = Math.floor(relY / cellSize);
    
    if (r < 0 || r >= height || c < 0 || c >= width) return null;
    return { r, c };
  }, [cellSize, width, height]);

  const applyStitchAtCell = useCallback((r: number, c: number, mode: 'mark' | 'unmark') => {
    const key = `${r},${c}`;
    if (dragVisitedRef.current.has(key)) return;
    dragVisitedRef.current.add(key);

    setCompletedStitches(prev => {
      const next = prev.map(row => [...row]);
      next[r][c] = mode === 'mark';
      return next;
    });
  }, []);

  const handleDragStart = useCallback((pageX: number, pageY: number) => {
    if (!isDragStitchMode) return;
    
    const cell = getCellFromPageCoords(pageX, pageY);
    if (!cell) return;

    isDraggingRef.current = true;
    dragVisitedRef.current = new Set();
    
    const currentlyDone = completedStitchesRef.current[cell.r]?.[cell.c];
    dragModeRef.current = currentlyDone ? 'unmark' : 'mark';
    
    applyStitchAtCell(cell.r, cell.c, dragModeRef.current);
  }, [isDragStitchMode, getCellFromPageCoords, applyStitchAtCell]);

  const handleDragMove = useCallback((pageX: number, pageY: number) => {
    if (!isDraggingRef.current || !isDragStitchMode) return;
    
    const cell = getCellFromPageCoords(pageX, pageY);
    if (!cell) return;
    
    applyStitchAtCell(cell.r, cell.c, dragModeRef.current);
  }, [isDragStitchMode, getCellFromPageCoords, applyStitchAtCell]);

  const handleDragEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    dragVisitedRef.current = new Set();
    
    if (pattern) {
      const updated = {
        ...pattern,
        progress: {
          completed_stitches: completedStitchesRef.current,
          current_color_index: selectedColorIndex,
          last_worked: new Date().toISOString(),
        },
      };
      savePattern(updated as any);
    }
  }, [pattern, selectedColorIndex]);

  // Web pointer event handlers
  const webPointerHandlers = Platform.OS === 'web' ? {
    onPointerDown: (e: any) => {
      if (!isDragStitchMode) return;
      e.preventDefault?.();
      handleDragStart(e.nativeEvent?.pageX ?? e.pageX, e.nativeEvent?.pageY ?? e.pageY);
    },
    onPointerMove: (e: any) => {
      if (!isDraggingRef.current) return;
      e.preventDefault?.();
      handleDragMove(e.nativeEvent?.pageX ?? e.pageX, e.nativeEvent?.pageY ?? e.pageY);
    },
    onPointerUp: () => handleDragEnd(),
    onPointerLeave: () => handleDragEnd(),
  } : {};

  // Native PanResponder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isDragStitchMode,
      onMoveShouldSetPanResponder: () => isDragStitchMode,
      onPanResponderGrant: (evt) => handleDragStart(evt.nativeEvent.pageX, evt.nativeEvent.pageY),
      onPanResponderMove: (evt) => handleDragMove(evt.nativeEvent.pageX, evt.nativeEvent.pageY),
      onPanResponderRelease: () => handleDragEnd(),
      onPanResponderTerminate: () => handleDragEnd(),
    })
  ).current;

  const onGridLayout = useCallback(() => {
    if (gridContainerRef.current) {
      (gridContainerRef.current as any).measureInWindow?.((x: number, y: number, w: number, h: number) => {
        gridLayoutRef.current = { x, y, width: w, height: h };
      });
    }
  }, []);

  const floodFill = (g: number[][], r: number, c: number, target: number, replacement: number) => {
    if (r < 0 || r >= g.length || c < 0 || c >= g[0].length) return;
    if (g[r][c] !== target) return;
    g[r][c] = replacement;
    floodFill(g, r + 1, c, target, replacement);
    floodFill(g, r - 1, c, target, replacement);
    floodFill(g, r, c + 1, target, replacement);
    floodFill(g, r, c - 1, target, replacement);
  };

  const handleUndo = useCallback(() => {
    if (historyStep > 0) {
      const prev = history[historyStep - 1];
      setPattern(prevPat => prevPat ? { ...prevPat, grid_data: { ...prevPat.grid_data, grid: prev } } : null);
      setHistoryStep(prevStep => prevStep - 1);
      setGestureToast('Cofnięto (Undo)');
      setTimeout(() => setGestureToast(null), 1800);
    }
  }, [history, historyStep]);

  const handleRedo = useCallback(() => {
    if (historyStep < history.length - 1) {
      const next = history[historyStep + 1];
      setPattern(prevPat => prevPat ? { ...prevPat, grid_data: { ...prevPat.grid_data, grid: next } } : null);
      setHistoryStep(prevStep => prevStep + 1);
      setGestureToast('Ponowiono (Redo)');
      setTimeout(() => setGestureToast(null), 1800);
    }
  }, [history, historyStep]);

  const toggleBackstitch = (id: string) => {
    setBackstitchLines(prev => {
      const updated = prev.map(line => line.id === id ? { ...line, completed: !line.completed } : line);
      if (pattern) {
        savePattern({
          ...pattern,
          backstitch: updated,
        } as any);
      }
      return updated;
    });
    setGestureToast('Przełączono obrys (backstitch)');
    setTimeout(() => setGestureToast(null), 1500);
  };

  const handleBoxSelectFinish = (startR: number, startC: number, endR: number, endC: number) => {
    const minR = Math.max(0, Math.min(startR, endR));
    const maxR = Math.min(height - 1, Math.max(startR, endR));
    const minC = Math.max(0, Math.min(startC, endC));
    const maxC = Math.min(width - 1, Math.max(startC, endC));

    let count = 0;
    const nextCompleted = completedStitches.map(row => [...row]);

    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        if (grid[r][c] === selectedColorIndex || highlightColorIndex === null) {
          nextCompleted[r][c] = true;
          count++;
        }
      }
    }

    setCompletedStitches(nextCompleted);
    if (pattern) {
      const updated = {
        ...pattern,
        progress: {
          completed_stitches: nextCompleted,
          current_color_index: selectedColorIndex,
          last_worked: new Date().toISOString(),
        },
      };
      savePattern(updated as any);
    }
    setGestureToast(`Zaznaczono ramką: ${count} ściegów`);
    setTimeout(() => setGestureToast(null), 2000);
    setIsBoxSelecting(false);
    setBoxStart(null);
    setBoxEnd(null);
  };

  // Web keyboard shortcuts (Ctrl+Z, Ctrl+Y)
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleKeyDown = (e: any) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
          e.preventDefault?.();
          handleUndo();
        } else if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
          e.preventDefault?.();
          handleRedo();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleUndo, handleRedo]);

  const handleRemoveConfetti = () => {
    const newGrid = grid.map(row => [...row]);
    let cleaned = 0;
    for (let r = 1; r < height - 1; r++) {
      for (let c = 1; c < width - 1; c++) {
        const val = newGrid[r][c];
        const neighbors = [
          newGrid[r - 1][c], newGrid[r + 1][c],
          newGrid[r][c - 1], newGrid[r][c + 1]
        ];
        if (!neighbors.includes(val)) {
          newGrid[r][c] = neighbors[0];
          cleaned++;
        }
      }
    }
    if (cleaned > 0) {
      setPattern({ ...pattern, grid_data: { ...pattern.grid_data, grid: newGrid } });
      Alert.alert('Usunięto confetti', `Wyczyszczono ${cleaned} pojedynczych ściegów.`);
    } else {
      Alert.alert('Brak confetti', 'Wzór nie posiada odosobnionych ściegów.');
    }
  };

  const handleExportPdf = async () => {
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
      if (Platform.OS === 'web') {
        const res = await fetch(`${apiUrl}/api/v1/patterns/${pattern.pattern_id}/export-pdf`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pattern }),
        });
        if (!res.ok) {
          throw new Error(`Błąd serwera (${res.status}): ${await res.text()}`);
        }
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const cleanName = (pattern.name || 'wzor_mulina').replace(/[^a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ_-]/g, '_');
        a.download = `${cleanName}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        Alert.alert('Eksport PDF', `Generowanie PDF dla wzoru: ${pattern.name}`);
      }
    } catch (e: any) {
      console.error('PDF export error:', e);
      Alert.alert('Błąd eksportu', e.message || 'Nie udało się pobrać pliku PDF');
    }
  };

  const handleRenamePattern = () => {
    if (!pattern) return;
    if (Platform.OS === 'web') {
      const newName = window.prompt('Zmień nazwę wzoru:', pattern.name);
      if (newName && newName.trim() && newName.trim() !== pattern.name) {
        const trimmed = newName.trim();
        setPattern(prev => prev ? { ...prev, name: trimmed } : null);
        renamePattern(pattern.pattern_id, trimmed);
      }
    } else {
      Alert.prompt?.(
        'Zmień nazwę wzoru',
        'Wpisz nową nazwę:',
        [
          { text: 'Anuluj', style: 'cancel' },
          {
            text: 'Zapisz',
            onPress: (text?: string) => {
              if (text && text.trim()) {
                const trimmed = text.trim();
                setPattern(prev => prev ? { ...prev, name: trimmed } : null);
                renamePattern(pattern.pattern_id, trimmed);
              }
            }
          }
        ],
        'plain-text',
        pattern.name
      );
    }
  };

  const selectedThread = color_palette[selectedColorIndex] || color_palette[0];

  // Render High-Performance Hardware-Accelerated Canvas Viewport
  const renderCanvasGrid = () => (
    <PatternCanvasViewport
      ref={viewportRef}
      grid={grid}
      width={width}
      height={height}
      colorPalette={color_palette}
      completedStitches={completedStitches}
      selectedColorIndex={selectedColorIndex}
      highlightColorIndex={highlightColorIndex}
      viewMode={viewMode}
      activeTool={activeTool}
      stitchLock={stitchLock}
      parkingCorner={parkingCorner}
      parkedThreads={parkedThreads}
      backstitchLines={backstitchLines}
      showBackstitch={showBackstitch}
      onCellClick={handleCellClick}
      onCellDragMark={(cells, mode) => {
        const nextCompleted = completedStitches.map(row => [...row]);
        let changed = false;
        for (const { r, c } of cells) {
          if (r >= 0 && r < height && c >= 0 && c < width) {
            const newVal = mode === 'mark';
            if (nextCompleted[r][c] !== newVal) {
              nextCompleted[r][c] = newVal;
              changed = true;
            }
          }
        }
        if (changed) {
          setCompletedStitches(nextCompleted);
          const updated = {
            ...pattern,
            progress: {
              completed_stitches: nextCompleted,
              current_color_index: selectedColorIndex,
              last_worked: new Date().toISOString(),
            },
          };
          savePattern(updated as any);
        }
      }}
      onPickColor={(colorIdx) => {
        setSelectedColorIndex(colorIdx);
        setHighlightColorIndex(colorIdx);
      }}
      onUndo={handleUndo}
      onRedo={handleRedo}
      themeMode={themeMode}
    />
  );

  return (
    <View style={styles.container}>
      {/* Top Header - Soft Pastel Embroidery Atmosphere with Theme & 1-Click Shop (Hidden in Fullscreen for 100% canvas) */}
      {!isFullScreen ? (
        <View style={[styles.header, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              style={[styles.backBtn, { backgroundColor: theme.backgroundAlt, borderColor: theme.surfaceBorder }]} 
              activeOpacity={0.8}
              accessibilityLabel="Powrót"
            >
              <Text style={[styles.backBtnText, { color: theme.textPrimary }]}>
                {isTabletOrLarger ? '← Wróć' : '←'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.titleContainer}
              onPress={handleRenamePattern}
              activeOpacity={0.75}
              accessibilityLabel="Kliknij aby zmienić nazwę wzoru"
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.headerTitle, { color: theme.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">
                  {pattern.name}
                </Text>
                <PencilCraftIcon size={12} color={theme.textMuted} />
              </View>
              <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">
                {width}×{height} ({pattern.dimensions.width_cm}×{pattern.dimensions.height_cm} cm) • {color_palette.length} kol. (kliknij by zmienić nazwę)
              </Text>
            </TouchableOpacity>

            <View style={styles.headerActionsGroup}>
              {/* Theme switcher (Cozy / OLED Dark / Eye Guard) */}
              <TouchableOpacity 
                style={[styles.headerThemeBtn, { backgroundColor: theme.backgroundAlt, borderColor: theme.surfaceBorder, flexDirection: 'row', alignItems: 'center', gap: 4 }]} 
                onPress={toggleTheme}
                activeOpacity={0.8}
                accessibilityLabel="Zmień motyw"
              >
                <FlowerIcon size={14} color={theme.primary} />
                {isTabletOrLarger && (
                  <Text style={[styles.headerThemeBtnText, { color: theme.textPrimary }]}>
                    {themeMode === 'cozy' ? 'Pastel' : themeMode === 'oled' ? 'OLED' : 'Ochrona'}
                  </Text>
                )}
              </TouchableOpacity>

              {/* 1-Click Shopping / Stash comparator */}
              <TouchableOpacity 
                style={[styles.headerShopBtn, { backgroundColor: theme.sage, flexDirection: 'row', alignItems: 'center', gap: 4 }]} 
                onPress={() => setShowShopModal(true)} 
                activeOpacity={0.85}
                accessibilityLabel="Kup nici"
              >
                <CraftShopIcon size={15} color="#FFFFFF" />
                {isTabletOrLarger && (
                  <Text style={styles.headerShopBtnText}>Kup nici</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.pdfBtn, { backgroundColor: theme.primary, flexDirection: 'row', alignItems: 'center', gap: 4 }]} 
                onPress={handleExportPdf} 
                activeOpacity={0.85}
                accessibilityLabel="Pobierz PDF"
              >
                <PdfStitchIcon size={15} color="#FFFFFF" />
                {isTabletOrLarger && (
                  <Text style={styles.pdfBtnText}>PDF</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Cross-Stitch Progress Tracker */}
          <View style={styles.progressContainer}>
            <View style={styles.progressRow}>
              <Text style={[styles.progressLabel, { color: theme.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">
                Ukończono: <Text style={[styles.progressBold, { color: theme.primaryDark }]}>{totalCompleted}/{totalStitches}</Text> ({overallPercent}%)
              </Text>
              <Text style={[styles.progressLabel, { color: theme.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">
                {selectedThread.thread_brand} {selectedThread.thread_code}: <Text style={[styles.progressBold, { color: theme.primaryDark }]}>{colorStitchesCompleted}/{colorStitchesTotal}</Text> ({colorPercent}%)
              </Text>
            </View>
            <View style={[styles.progressBarTrack, { backgroundColor: theme.backgroundAlt }]}>
              <View style={[styles.progressBarFill, { width: `${overallPercent}%`, backgroundColor: theme.sage }]} />
            </View>
          </View>
        </View>
      ) : (
        /* Floating mini banner when in full screen */
        <View style={styles.floatingFullscreenHeader}>
          <TouchableOpacity
            style={styles.floatingExitFullscreenBtn}
            onPress={() => setIsFullScreen(false)}
            activeOpacity={0.85}
            accessibilityLabel="Wyjdź z pełnego ekranu"
          >
            <Text style={styles.floatingExitFullscreenText}>✕ Wyjdź z pełnego ekranu</Text>
          </TouchableOpacity>
          <View style={styles.floatingFullscreenStats}>
            <Text style={styles.floatingFullscreenStatsText}>
              {pattern.name} • {overallPercent}%
            </Text>
          </View>
        </View>
      )}

      {/* Floating Gesture Toast */}
      {gestureToast && (
        <View style={styles.toastFloating}>
          <Text style={styles.toastFloatingText}>{gestureToast}</Text>
        </View>
      )}

      {/* Cross-Stitch Tools Bar - Scrollable horizontally on mobile, clean dock */}
      <View style={[styles.toolbarWrapper, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.toolbarScrollContent}
        >
          <View style={styles.toolGroup}>
            <TouchableOpacity
              style={[styles.toolBtn, activeTool === 'stitch' && styles.toolBtnActive]}
              onPress={() => setActiveTool('stitch')}
            >
              <NeedleIcon size={16} color={activeTool === 'stitch' ? colors.primaryDark : colors.textSecondary} />
              <Text style={[styles.toolText, activeTool === 'stitch' && styles.toolTextActive]}>Haftuj</Text>
            </TouchableOpacity>

            {/* Box Area Selection (1-finger long press or tool click) */}
            <TouchableOpacity
              style={[styles.toolBtn, activeTool === 'box_select' && styles.toolBtnActive]}
              onPress={() => {
                setActiveTool('box_select');
                setIsBoxSelecting(false);
                setBoxStart(null);
              }}
            >
              <FrameBoxIcon size={16} color={activeTool === 'box_select' ? colors.primaryDark : colors.textSecondary} />
              <Text style={[styles.toolText, activeTool === 'box_select' && styles.toolTextActive]}>Ramka</Text>
            </TouchableOpacity>

            {/* Parking Mode */}
            <TouchableOpacity
              style={[styles.toolBtn, activeTool === 'parking' && styles.toolBtnActive]}
              onPress={() => {
                if (activeTool === 'parking') {
                  // Cycle corner
                  const corners: Array<'NW'|'NE'|'SW'|'SE'> = ['NE', 'SE', 'SW', 'NW'];
                  const nextIdx = (corners.indexOf(parkingCorner) + 1) % corners.length;
                  setParkingCorner(corners[nextIdx]);
                } else {
                  setActiveTool('parking');
                }
              }}
            >
              <PearlPinIcon size={16} color={activeTool === 'parking' ? colors.primaryDark : colors.textSecondary} />
              <Text style={[styles.toolText, activeTool === 'parking' && styles.toolTextActive]}>
                Parkuj ({parkingCorner})
              </Text>
            </TouchableOpacity>

            {/* Drag / Scroll Lock Switcher */}
            {activeTool === 'stitch' && (
              <TouchableOpacity
                style={[styles.lockBtn, stitchLock ? styles.lockBtnActive : styles.lockBtnInactive]}
                onPress={() => setStitchLock(!stitchLock)}
                activeOpacity={0.85}
              >
                <LockCraftIcon size={14} locked={stitchLock} color={stitchLock ? colors.sageDark : colors.textMuted} />
                <Text style={[styles.lockText, stitchLock && styles.lockTextActive]}>
                  {stitchLock ? 'Przeciągaj' : 'Przewijaj'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.toolBtn, activeTool === 'picker' && styles.toolBtnActive]}
              onPress={() => setActiveTool('picker')}
            >
              <ZoomMagnifierIcon size={16} type="in" color={activeTool === 'picker' ? colors.primaryDark : colors.textSecondary} />
              <Text style={[styles.toolText, activeTool === 'picker' && styles.toolTextActive]}>Pipeta</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toolBtn, activeTool === 'pencil' && styles.toolBtnActive]}
              onPress={() => setActiveTool('pencil')}
            >
              <PencilCraftIcon size={16} color={activeTool === 'pencil' ? colors.primaryDark : colors.textSecondary} />
              <Text style={[styles.toolText, activeTool === 'pencil' && styles.toolTextActive]}>Rysuj</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toolBtn, activeTool === 'eraser' && styles.toolBtnActive]}
              onPress={() => setActiveTool('eraser')}
            >
              <EraserCraftIcon size={16} color={activeTool === 'eraser' ? colors.primaryDark : colors.textSecondary} />
              <Text style={[styles.toolText, activeTool === 'eraser' && styles.toolTextActive]}>Gumka</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toolBtn, activeTool === 'fill' && styles.toolBtnActive]}
              onPress={() => setActiveTool('fill')}
            >
              <FillBucketIcon size={16} color={activeTool === 'fill' ? colors.primaryDark : colors.textSecondary} />
              <Text style={[styles.toolText, activeTool === 'fill' && styles.toolTextActive]}>Wypełnij</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.toolSeparator} />

          {/* View Mode Switcher */}
          <View style={styles.toolGroup}>
            <TouchableOpacity
              style={[styles.smallModeBtn, viewMode === 'stitches' && styles.smallModeBtnActive]}
              onPress={() => setViewMode('stitches')}
            >
              <CrossStitchIcon size={13} color={viewMode === 'stitches' ? colors.textInverted : colors.textSecondary} />
              <Text style={[styles.modeText, viewMode === 'stitches' && styles.modeTextActive]}>Krzyżyki</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.smallModeBtn, viewMode === 'symbols' && styles.smallModeBtnActive]}
              onPress={() => setViewMode('symbols')}
            >
              <SymbolGlyphIcon size={13} color={viewMode === 'symbols' ? colors.textInverted : colors.textSecondary} />
              <Text style={[styles.modeText, viewMode === 'symbols' && styles.modeTextActive]}>Symbole</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.smallModeBtn, viewMode === 'colors' && styles.smallModeBtnActive]}
              onPress={() => setViewMode('colors')}
            >
              <ColorPaletteIcon size={13} color={viewMode === 'colors' ? colors.textInverted : colors.textSecondary} />
              <Text style={[styles.modeText, viewMode === 'colors' && styles.modeTextActive]}>Kolory</Text>
            </TouchableOpacity>

            {/* Backstitch Toggle */}
            {backstitchLines.length > 0 && (
              <TouchableOpacity
                style={[styles.smallModeBtn, showBackstitch && styles.smallModeBtnActive]}
                onPress={() => setShowBackstitch(!showBackstitch)}
              >
                <FlossSkeinIcon size={13} color={showBackstitch ? colors.textInverted : colors.textSecondary} />
                <Text style={[styles.modeText, showBackstitch && styles.modeTextActive]}>
                  Obrys ({backstitchLines.filter(b => b.completed).length}/{backstitchLines.length})
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.toolSeparator} />

          {/* Panel & Viewport Layout Controls */}
          <View style={styles.toolGroup}>
            <TouchableOpacity
              style={[styles.smallModeBtn, showThreadPanel && styles.smallModeBtnActive]}
              onPress={() => setShowThreadPanel(!showThreadPanel)}
              accessibilityLabel="Pokaż lub ukryj panel z nićmi"
            >
              <FlossSkeinIcon size={13} color={showThreadPanel ? colors.textInverted : colors.textSecondary} />
              <Text style={[styles.modeText, showThreadPanel && styles.modeTextActive]}>
                {showThreadPanel ? 'Ukryj nici' : 'Pokaż nici'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.smallModeBtn}
              onPress={() => viewportRef.current?.zoomFit()}
              accessibilityLabel="Dopasuj wzór do okna"
            >
              <FrameBoxIcon size={13} color={colors.textSecondary} />
              <Text style={styles.modeText}>Dopasuj</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.smallModeBtn, { backgroundColor: '#EAF7EE', borderColor: colors.sageBorder }]}
              onPress={() => viewportRef.current?.zoomFill()}
              accessibilityLabel="Wypełnij całość obszaru"
            >
              <FrameBoxIcon size={13} color={colors.sageDark} />
              <Text style={[styles.modeText, { color: colors.sageDark, fontWeight: '700' }]}>Wypełnij</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.smallModeBtn, isFullScreen && styles.smallModeBtnActive]}
              onPress={() => setIsFullScreen(!isFullScreen)}
              accessibilityLabel="Tryb pełnoekranowy"
            >
              <FrameBoxIcon size={13} color={isFullScreen ? colors.textInverted : colors.textSecondary} />
              <Text style={[styles.modeText, isFullScreen && styles.modeTextActive]}>
                {isFullScreen ? 'Okno' : 'Pełny ekran'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.toolSeparator} />

          {/* Zoom & History Controls */}
          <View style={styles.toolGroup}>
            <TouchableOpacity 
              style={styles.iconBtn} 
              onPress={() => viewportRef.current?.zoomOut()} 
              accessibilityLabel="Pomniejsz"
            >
              <ZoomMagnifierIcon size={15} type="out" color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.iconBtn} 
              onPress={() => viewportRef.current?.zoomIn()} 
              accessibilityLabel="Powiększ"
            >
              <ZoomMagnifierIcon size={15} type="in" color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={handleUndo} disabled={historyStep <= 0} accessibilityLabel="Cofnij">
              <StitchHistoryIcon size={15} direction="undo" color={historyStep <= 0 ? colors.textMuted : colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={handleRedo} disabled={historyStep >= history.length - 1} accessibilityLabel="Ponów">
              <StitchHistoryIcon size={15} direction="redo" color={historyStep >= history.length - 1 ? colors.textMuted : colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={handleRemoveConfetti} accessibilityLabel="Usuń pojedyncze krzyżyki">
              <WandIcon size={15} color={colors.primaryDark} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* Main Workspace Area: Split for Tablet / iPad or Stacked for Mobile */}
      {isTabletOrLarger ? (
        /* Tablet / iPad Side-by-Side Workspace with Collapsible Left Threads Panel */
        <View style={styles.tabletWorkspaceRow}>
          {/* Left Sidebar: Floss Palette & Thread Focus (Collapsible) */}
          {showThreadPanel && (
            <View style={[styles.tabletSidebar, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
              {/* Header inside left sidebar with collapse button */}
              <View style={styles.sidebarTopHeader}>
                <View style={styles.sidebarTopTitleRow}>
                  <FlossSkeinIcon size={16} color={colors.primary} />
                  <Text style={[styles.sidebarTopTitle, { color: theme.textPrimary }]}>
                    Nici DMC ({color_palette.length})
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.sidebarCollapseBtn, { backgroundColor: theme.backgroundAlt, borderColor: theme.surfaceBorder }]}
                  onPress={() => setShowThreadPanel(false)}
                  accessibilityLabel="Schowaj panel z nićmi"
                >
                  <Text style={[styles.sidebarCollapseBtnText, { color: theme.textPrimary }]}>◂ Ukryj panel</Text>
                </TouchableOpacity>
              </View>

              {/* Active Thread Card */}
              <View style={styles.sidebarActiveCard}>
                <View style={styles.sidebarActiveHeader}>
                  <View 
                    style={[
                      styles.sidebarLargeSwatch, 
                      { backgroundColor: `rgb(${selectedThread.rgb[0]}, ${selectedThread.rgb[1]}, ${selectedThread.rgb[2]})` }
                    ]}
                  >
                    <Text style={styles.sidebarLargeSymbol}>{selectedThread.symbol}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sidebarActiveCode}>
                      {selectedThread.thread_brand} {selectedThread.thread_code}
                    </Text>
                    <Text style={styles.sidebarActiveName} numberOfLines={1}>
                      {selectedThread.thread_name || 'Kolor podstawowy'}
                    </Text>
                  </View>
                </View>

                <View style={styles.sidebarProgressRow}>
                  <Text style={styles.sidebarProgressText}>
                    Wyhaftowano: <Text style={{ fontWeight: '700', color: colors.primaryDark }}>{colorStitchesCompleted}/{colorStitchesTotal}</Text> ({colorPercent}%)
                  </Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: `${colorPercent}%`, backgroundColor: colors.primary }]} />
                </View>

                <TouchableOpacity
                  style={[
                    styles.sidebarHighlightBtn,
                    highlightColorIndex === selectedColorIndex && styles.sidebarHighlightBtnActive,
                  ]}
                  onPress={() => setHighlightColorIndex(highlightColorIndex === selectedColorIndex ? null : selectedColorIndex)}
                >
                  <Text style={[styles.sidebarHighlightBtnText, highlightColorIndex === selectedColorIndex && styles.sidebarHighlightBtnTextActive]}>
                    {highlightColorIndex === selectedColorIndex ? 'Pokaż wszystkie kolory' : 'Skup się na tym kolorze (izoluj)'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* List of All Threads in Pattern */}
              <View style={styles.sidebarListHeader}>
                <Text style={styles.sidebarListTitle}>Paleta wzoru ({color_palette.length} nici):</Text>
                <TouchableOpacity onPress={() => setShowLegendModal(true)}>
                  <Text style={styles.sidebarListLink}>Zakupy</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.sidebarListScroll} showsVerticalScrollIndicator={true}>
                {color_palette.map((thread, idx) => {
                  const isSelected = selectedColorIndex === idx;
                  const isHighlighted = highlightColorIndex === idx;
                  const bg = `rgb(${thread.rgb[0]}, ${thread.rgb[1]}, ${thread.rgb[2]})`;

                  return (
                    <TouchableOpacity
                      key={`side-floss-${idx}`}
                      style={[
                        styles.sidebarFlossItem,
                        isSelected && styles.sidebarFlossItemSelected,
                        isHighlighted && styles.sidebarFlossItemHighlighted,
                      ]}
                      onPress={() => {
                        setSelectedColorIndex(idx);
                        if (highlightColorIndex !== null) {
                          setHighlightColorIndex(idx);
                        }
                      }}
                    >
                      <View style={[styles.sidebarSwatch, { backgroundColor: bg }]}>
                        <Text style={styles.sidebarItemSymbol}>{thread.symbol}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.sidebarItemCode}>
                          {thread.thread_brand} {thread.thread_code}
                        </Text>
                        <Text style={styles.sidebarItemCount}>
                          {thread.stitch_count || 0} ściegów
                        </Text>
                      </View>
                      {isSelected && (
                        <View style={styles.activeDot} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Right / Center: Canvas Area fills remaining / 100% space! */}
          <View style={styles.tabletCanvasArea}>
            {renderCanvasGrid()}

            {/* Floating button on the left edge to restore left panel when hidden */}
            {!showThreadPanel && (
              <TouchableOpacity
                style={[styles.floatingRestoreSidebarBtn, { backgroundColor: theme.primary }]}
                onPress={() => setShowThreadPanel(true)}
                activeOpacity={0.88}
                accessibilityLabel="Pokaż panel nici"
              >
                <FlossSkeinIcon size={15} color="#FFFFFF" />
                <Text style={styles.floatingRestoreSidebarText}>Pokaż nici ({color_palette.length})</Text>
                <Text style={styles.floatingRestoreChevron}>▸</Text>
              </TouchableOpacity>
            )}

            {/* Active Thread Mini Pill when left panel is hidden */}
            {!showThreadPanel && (
              <TouchableOpacity
                style={[styles.floatingActiveThreadPill, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}
                onPress={() => setShowThreadPanel(true)}
                activeOpacity={0.85}
              >
                <View style={[styles.floatingThreadSwatch, { backgroundColor: `rgb(${selectedThread.rgb[0]}, ${selectedThread.rgb[1]}, ${selectedThread.rgb[2]})` }]}>
                  <Text style={styles.floatingThreadSymbol}>{selectedThread.symbol}</Text>
                </View>
                <View style={{ marginRight: 6 }}>
                  <Text style={[styles.floatingThreadCode, { color: theme.textPrimary }]}>{selectedThread.thread_brand} {selectedThread.thread_code}</Text>
                  <Text style={[styles.floatingThreadStats, { color: theme.textSecondary }]}>{colorStitchesCompleted}/{colorStitchesTotal} krz.</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : (
        /* Mobile Stacked Workspace with Collapsible Bottom Palette */
        <View style={styles.mobileWorkspace}>
          <View style={styles.mobileCanvasContainer}>
            {renderCanvasGrid()}

            {/* Floating button to restore bottom palette when hidden on mobile */}
            {!showThreadPanel && (
              <TouchableOpacity
                style={[styles.mobileFloatingRestoreBtn, { backgroundColor: theme.primary }]}
                onPress={() => setShowThreadPanel(true)}
                activeOpacity={0.88}
                accessibilityLabel="Pokaż nici"
              >
                <FlossSkeinIcon size={14} color="#FFFFFF" />
                <Text style={styles.mobileFloatingRestoreText}>Nici ({color_palette.length})</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Bottom Floss Palette Bar (Collapsible) */}
          {showThreadPanel && (
            <View style={[styles.paletteBar, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
              <View style={styles.paletteHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <FlossSkeinIcon size={14} color={colors.primary} />
                  <Text style={styles.paletteTitle}>
                    Nici ({color_palette.length} kolorów DMC):
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TouchableOpacity
                    style={styles.legendToggleBtn}
                    onPress={() => setShowLegendModal(!showLegendModal)}
                  >
                    <Text style={styles.legendToggleText}>
                      {showLegendModal ? 'Ukryj listę' : 'Pełna lista & metry'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.legendToggleBtn, { backgroundColor: theme.backgroundAlt }]}
                    onPress={() => setShowThreadPanel(false)}
                    accessibilityLabel="Schowaj pasek nici"
                  >
                    <Text style={[styles.legendToggleText, { color: theme.textSecondary }]}>
                      ▾ Schowaj
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.paletteScroll}>
                {color_palette.map((thread, idx) => {
                  const isSelected = selectedColorIndex === idx;
                  const isHighlighted = highlightColorIndex === idx;
                  const bg = `rgb(${thread.rgb[0]}, ${thread.rgb[1]}, ${thread.rgb[2]})`;

                  return (
                    <TouchableOpacity
                      key={`pal-${idx}`}
                      style={[
                        styles.flossChip,
                        isSelected && styles.flossChipSelected,
                        isHighlighted && styles.flossChipHighlighted,
                      ]}
                      onPress={() => {
                        setSelectedColorIndex(idx);
                        setHighlightColorIndex(highlightColorIndex === idx ? null : idx);
                      }}
                    >
                      <View style={[styles.flossSwatch, { backgroundColor: bg }]}>
                        <Text style={styles.flossSymbol}>{thread.symbol}</Text>
                      </View>
                      <View style={styles.flossDetails}>
                        <Text style={styles.flossCode}>{thread.thread_brand} {thread.thread_code}</Text>
                        <Text style={styles.flossCount}>{thread.stitch_count || 0} ściegów</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>
      )}

      {/* Full Thread Legend Modal Drawer */}
      {showLegendModal && (
        <View style={[styles.legendDrawer, { backgroundColor: theme.surface }]}>
          <View style={styles.drawerHeader}>
            <Text style={[styles.drawerTitle, { color: theme.textPrimary }]}>Wykaz mulin i zapotrzebowanie (DMC)</Text>
            <TouchableOpacity onPress={() => setShowLegendModal(false)}>
              <Text style={styles.drawerClose}>✕ Zamknij</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.legendList}>
            {color_palette.map((thread, idx) => (
              <View key={`leg-${idx}`} style={styles.legendItem}>
                <View style={[styles.legendSwatch, { backgroundColor: `rgb(${thread.rgb[0]}, ${thread.rgb[1]}, ${thread.rgb[2]})` }]}>
                  <Text style={styles.legendItemSymbol}>{thread.symbol}</Text>
                </View>
                <View style={styles.legendItemInfo}>
                  <Text style={[styles.legendItemName, { color: theme.textPrimary }]}>{thread.thread_brand} {thread.thread_code} - {thread.thread_name}</Text>
                  <Text style={[styles.legendItemStats, { color: theme.textSecondary }]}>
                    Ściegów: {thread.stitch_count || 0} • Potrzebne pasemka: ~{thread.skeins_needed || 1} szt. (8m)
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.highlightBtn, highlightColorIndex === idx && styles.highlightBtnActive]}
                  onPress={() => {
                    setSelectedColorIndex(idx);
                    setHighlightColorIndex(highlightColorIndex === idx ? null : idx);
                  }}
                >
                  <Text style={[styles.highlightBtnText, highlightColorIndex === idx && styles.highlightBtnTextActive]}>
                    {highlightColorIndex === idx ? 'Ukryj' : 'Podświetl'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* 1-Click Shopping & Stash Comparator Modal Drawer */}
      {showShopModal && (() => {
        const items = color_palette.map(t => {
          const key = `${t.thread_brand || 'DMC'}_${t.thread_code}`;
          const owned = userStash[key]?.skeins || 0;
          const needed = t.skeins_needed || 1;
          const missing = Math.max(0, Math.ceil(needed - owned));
          return { ...t, owned, needed, missing, cost: missing * 4.20 };
        });
        const totalMissing = items.reduce((acc, it) => acc + it.missing, 0);
        const totalCost = (totalMissing * 4.20).toFixed(2);

        return (
          <View style={[styles.legendDrawer, { height: '70%', backgroundColor: theme.surface }]}>
            <View style={styles.drawerHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.drawerTitle, { color: theme.textPrimary }]}>Koszyk Mulin (1-Click Buy)</Text>
                <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
                  Porównano z Twoim piórnikiem: brakuje {totalMissing} pasemek (~{totalCost} zł)
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowShopModal(false)}>
                <Text style={styles.drawerClose}>✕ Zamknij</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.shopStatsRow}>
              <View style={[styles.shopStatBox, { backgroundColor: theme.backgroundAlt }]}>
                <Text style={styles.shopStatLabel}>Potrzebne</Text>
                <Text style={[styles.shopStatValue, { color: theme.textPrimary }]}>{items.length} kolorów</Text>
              </View>
              <View style={[styles.shopStatBox, { backgroundColor: theme.sageLight }]}>
                <Text style={styles.shopStatLabel}>Masz w piórniku</Text>
                <Text style={[styles.shopStatValue, { color: theme.sageDark }]}>{items.filter(it => it.owned >= it.needed).length}</Text>
              </View>
              <View style={[styles.shopStatBox, { backgroundColor: theme.primaryLight }]}>
                <Text style={styles.shopStatLabel}>Do dokupienia</Text>
                <Text style={[styles.shopStatValue, { color: theme.primaryDark }]}>{totalMissing} szt.</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.shopBuyBtn, { backgroundColor: theme.sage }]}
              onPress={() => {
                Linking.openURL('https://pasmanteria-partner.pl/koszyk?partner=mualina');
                Alert.alert('1-Click Shopping', 'Przekierowano do partnerskiej pasmanterii z naliczonym kodem rabatowym Mu\'alina Club!');
              }}
              activeOpacity={0.88}
            >
              <Text style={styles.shopBuyBtnText}>🛒 Zamów brakujące {totalMissing} szt. za {totalCost} zł (1-Click)</Text>
            </TouchableOpacity>

            <ScrollView style={styles.legendList}>
              {items.map((it, idx) => (
                <View key={`shop-${idx}`} style={styles.legendItem}>
                  <View style={[styles.legendSwatch, { backgroundColor: `rgb(${it.rgb[0]}, ${it.rgb[1]}, ${it.rgb[2]})` }]}>
                    <Text style={styles.legendItemSymbol}>{it.symbol}</Text>
                  </View>
                  <View style={styles.legendItemInfo}>
                    <Text style={[styles.legendItemName, { color: theme.textPrimary }]}>
                      {it.thread_brand} {it.thread_code} - {it.thread_name}
                    </Text>
                    <Text style={[styles.legendItemStats, { color: theme.textSecondary }]}>
                      Potrzebne: {it.needed} motek • W piórniku: {it.owned} szt.
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    {it.missing === 0 ? (
                      <Text style={{ fontSize: 12, fontWeight: '700', color: theme.sage }}>✓ Komplet</Text>
                    ) : (
                      <Text style={{ fontSize: 12, fontWeight: '700', color: theme.danger }}>Kup: {it.missing} szt.</Text>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        );
      })()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: colors.primary,
    fontWeight: '600',
  },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: colors.surfaceBorder,
    flexShrink: 0,
    ...shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  titleContainer: {
    flex: 1,
    minWidth: 0,
    marginRight: 4,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  headerActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  pdfBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.glowPrimary,
  },
  pdfBtnText: {
    color: colors.textInverted,
    fontSize: 12,
    fontWeight: '700',
  },
  progressContainer: {
    marginTop: 6,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 8,
  },
  progressLabel: {
    fontSize: 10.5,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  progressBold: {
    fontWeight: '700',
    color: colors.primaryDark,
  },
  progressBarTrack: {
    height: 5,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.sage,
    borderRadius: 3,
  },
  toolbarWrapper: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.surfaceBorder,
    flexShrink: 0,
  },
  toolbarScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 6,
  },
  mobileWorkspace: {
    flex: 1,
    width: '100%',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  mobileCanvasContainer: {
    flex: 1,
    width: '100%',
    minHeight: 180,
    position: 'relative',
    overflow: 'hidden',
  },
  toolGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toolSeparator: {
    width: 1,
    height: 24,
    backgroundColor: colors.surfaceBorder,
    marginHorizontal: 4,
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 9,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    gap: 4,
  },
  toolBtnActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryBorder,
  },
  toolIcon: {
    fontSize: 14,
  },
  toolText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  toolTextActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  lockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 9,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
  },
  lockBtnActive: {
    backgroundColor: colors.sageLight,
    borderColor: colors.sageBorder,
  },
  lockBtnInactive: {
    backgroundColor: colors.background,
    borderColor: colors.surfaceBorder,
  },
  lockIcon: {
    fontSize: 12,
  },
  lockText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  lockTextActive: {
    color: colors.sageDark,
    fontWeight: '700',
  },
  smallModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  smallModeBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modeTextActive: {
    color: colors.textInverted,
    fontWeight: '700',
  },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  disabledText: {
    color: colors.textMuted,
  },
  zoomLabel: {
    fontSize: 11,
    color: colors.textMuted,
    minWidth: 28,
    textAlign: 'center',
    fontWeight: '600',
  },
  tabletWorkspaceRow: {
    flex: 1,
    flexDirection: 'row',
    position: 'relative',
    overflow: 'hidden',
  },
  tabletCanvasArea: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
    position: 'relative',
    overflow: 'hidden',
  },
  tabletSidebar: {
    width: 310,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: 12,
  },
  sidebarTopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  sidebarTopTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sidebarTopTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sidebarCollapseBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.backgroundAlt,
  },
  sidebarCollapseBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  floatingRestoreSidebarBtn: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    zIndex: 20,
    ...shadows.glowPrimary,
  },
  floatingRestoreSidebarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  floatingRestoreChevron: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  floatingActiveThreadPill: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 5,
    paddingRight: 10,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    zIndex: 20,
    ...shadows.card,
  },
  floatingThreadSwatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  floatingThreadSymbol: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  floatingThreadCode: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  floatingThreadStats: {
    fontSize: 9.5,
    color: colors.textSecondary,
  },
  mobileFloatingRestoreBtn: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    zIndex: 20,
    ...shadows.glowPrimary,
  },
  mobileFloatingRestoreText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  floatingFullscreenHeader: {
    position: 'absolute',
    top: 10,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 50,
  },
  floatingExitFullscreenBtn: {
    backgroundColor: 'rgba(55, 65, 81, 0.88)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    ...shadows.card,
  },
  floatingExitFullscreenText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  floatingFullscreenStats: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    ...shadows.card,
  },
  floatingFullscreenStatsText: {
    color: colors.textPrimary,
    fontSize: 11.5,
    fontWeight: '700',
  },
  sidebarActiveCard: {
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 14,
  },
  sidebarActiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  sidebarLargeSwatch: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  sidebarLargeSymbol: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  sidebarActiveCode: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sidebarActiveName: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  sidebarProgressRow: {
    marginBottom: 6,
  },
  sidebarProgressText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  sidebarHighlightBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  sidebarHighlightBtnActive: {
    backgroundColor: colors.warning,
    borderColor: colors.warning,
  },
  sidebarHighlightBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sidebarHighlightBtnTextActive: {
    color: '#ffffff',
  },
  sidebarListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sidebarListTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sidebarListLink: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  sidebarListScroll: {
    flex: 1,
  },
  sidebarFlossItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 10,
    backgroundColor: colors.background,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    gap: 10,
  },
  sidebarFlossItemSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryBorder,
  },
  sidebarFlossItemHighlighted: {
    backgroundColor: '#FEF3C7',
    borderColor: colors.warning,
    borderWidth: 1.5,
  },
  sidebarSwatch: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  sidebarItemSymbol: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  sidebarItemCode: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sidebarItemCount: {
    fontSize: 10,
    color: colors.textMuted,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  horizontalScroll: {
    flex: 1,
  },
  verticalScroll: {
    flex: 1,
  },
  canvasWrapper: {
    padding: 16,
    backgroundColor: '#EFE8DE', // Warm natural linen color
  },
  canvasWrapperStitchMode: {
    borderWidth: 2,
    borderColor: colors.sage,
    borderStyle: 'dashed',
  },
  topRulerRow: {
    flexDirection: 'row',
    height: 18,
    alignItems: 'center',
  },
  rulerCell: {
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftRulerCell: {
    width: 28,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 6,
  },
  rulerText: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: colors.textSecondary,
    fontWeight: '700',
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stitchCell: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  targetColorGlow: {
    borderColor: colors.warning,
    borderWidth: 1.5,
    zIndex: 2,
  },
  completedCellOverlay: {
    backgroundColor: '#E2DBD2',
  },
  crossStitchTexture: {
    fontWeight: '900',
    lineHeight: 20,
    textAlign: 'center',
  },
  symbolText: {
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  doneCheckmark: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  paletteBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexShrink: 0,
  },
  paletteHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paletteTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  legendToggleBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  legendToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  paletteScroll: {
    flexDirection: 'row',
  },
  flossChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 10,
    padding: 6,
    marginRight: 8,
    gap: 8,
  },
  flossChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  flossChipHighlighted: {
    borderColor: colors.warning,
    borderWidth: 2,
    backgroundColor: '#FEF3C7',
  },
  flossSwatch: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  flossSymbol: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  flossDetails: {
    justifyContent: 'center',
  },
  flossCode: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  flossCount: {
    fontSize: 10,
    color: colors.textMuted,
  },
  legendDrawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    ...shadows.cardHover,
    padding: 16,
    borderTopWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  drawerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  drawerClose: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  legendList: {
    flex: 1,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: colors.surfaceBorder,
    gap: 12,
  },
  legendSwatch: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  legendItemSymbol: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  legendItemInfo: {
    flex: 1,
  },
  legendItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  legendItemStats: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  highlightBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  highlightBtnActive: {
    backgroundColor: colors.warning,
    borderColor: colors.warning,
  },
  highlightBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  highlightBtnTextActive: {
    color: '#ffffff',
  },
  headerThemeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  headerThemeBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  headerShopBtn: {
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 8,
  },
  headerShopBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  toastFloating: {
    position: 'absolute',
    top: 64,
    alignSelf: 'center',
    zIndex: 999,
    backgroundColor: 'rgba(30, 25, 28, 0.92)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    ...shadows.cardHover,
  },
  toastFloatingText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  parkingMarker: {
    position: 'absolute',
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  parkingMarkerText: {
    fontSize: 5,
    color: '#ffffff',
  },
  boxSelectionRect: {
    position: 'absolute',
    backgroundColor: 'rgba(217, 119, 127, 0.25)',
    borderWidth: 2,
    borderColor: '#D9777F',
    borderStyle: 'dashed',
    zIndex: 5,
  },
  shopStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 10,
  },
  shopStatBox: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  shopStatLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  shopStatValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  shopBuyBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    ...shadows.card,
  },
  shopBuyBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
