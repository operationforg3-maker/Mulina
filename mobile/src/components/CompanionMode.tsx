import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { StoredPattern } from '../services/patternStorage';

interface CompanionModeProps {
  pattern: StoredPattern;
  onUpdateProgress: (completedStitches: boolean[][], currentColorIndex: number) => void;
  onClose: () => void;
}

export default function CompanionMode({ pattern, onUpdateProgress, onClose }: CompanionModeProps) {
  const [completedStitches, setCompletedStitches] = useState<boolean[][]>(
    pattern.progress?.completed_stitches ||
      Array(pattern.grid_data.height)
        .fill(null)
        .map(() => Array(pattern.grid_data.width).fill(false))
  );
  const [currentColorIndex, setCurrentColorIndex] = useState(
    pattern.progress?.current_color_index || 0
  );
  const [highlightMode, setHighlightMode] = useState<'all' | 'current'>('current');

  const currentThread = pattern.color_palette[currentColorIndex];
  const totalStitches = pattern.grid_data.height * pattern.grid_data.width;
  const completedCount = completedStitches.flat().filter(Boolean).length;
  const progressPercent = Math.round((completedCount / totalStitches) * 100);

  // Count stitches for current color
  const currentColorStitches = pattern.grid_data.grid.flat().filter(
    (colorIdx) => colorIdx === currentColorIndex
  ).length;
  const currentColorCompleted = pattern.grid_data.grid.reduce((count, row, rowIdx) => {
    return (
      count +
      row.filter((colorIdx, colIdx) => {
        return colorIdx === currentColorIndex && completedStitches[rowIdx]?.[colIdx];
      }).length
    );
  }, 0);

  const handleCellTap = (row: number, col: number) => {
    const newCompleted = completedStitches.map((r, rIdx) =>
      r.map((c, cIdx) => (rIdx === row && cIdx === col ? !c : c))
    );
    setCompletedStitches(newCompleted);
    onUpdateProgress(newCompleted, currentColorIndex);
  };

  const handleNextColor = () => {
    if (currentColorIndex < pattern.color_palette.length - 1) {
      const newColorIndex = currentColorIndex + 1;
      setCurrentColorIndex(newColorIndex);
      onUpdateProgress(completedStitches, newColorIndex);
    } else {
      Alert.alert('Gratulacje!', 'Ukończyłeś wszystkie kolory! 🎉');
    }
  };

  const handlePrevColor = () => {
    if (currentColorIndex > 0) {
      const newColorIndex = currentColorIndex - 1;
      setCurrentColorIndex(newColorIndex);
      onUpdateProgress(completedStitches, newColorIndex);
    }
  };

  const renderGrid = () => {
    const { grid } = pattern.grid_data;
    const cellSize = 16;

    return (
      <View style={styles.gridContainer}>
        {grid.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.gridRow}>
            {row.map((colorIndex, colIndex) => {
              const isCompleted = completedStitches[rowIndex]?.[colIndex];
              const isCurrentColor = colorIndex === currentColorIndex;
              const thread = pattern.color_palette[colorIndex];
              
              // Show only current color stitches in 'current' mode
              if (highlightMode === 'current' && !isCurrentColor) {
                return (
                  <View
                    key={`cell-${rowIndex}-${colIndex}`}
                    style={[
                      styles.gridCell,
                      {
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: '#f3f4f6',
                        opacity: isCompleted ? 0.3 : 1,
                      },
                    ]}
                  />
                );
              }

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
                      borderWidth: isCurrentColor ? 2 : 0.5,
                      borderColor: isCurrentColor ? '#6366f1' : '#d1d5db',
                      opacity: isCompleted ? 0.4 : 1,
                    },
                  ]}
                  onPress={() => handleCellTap(rowIndex, colIndex)}
                >
                  {isCompleted && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tryb Companion</Text>
        </View>
        <TouchableOpacity
          onPress={() => setHighlightMode(highlightMode === 'all' ? 'current' : 'all')}
          style={styles.modeButton}
        >
          <Text style={styles.modeButtonText}>
            {highlightMode === 'current' ? '🎨 Bieżący kolor' : '🌈 Wszystkie'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Current Color Info */}
      <View style={styles.colorInfo}>
        <View
          style={[
            styles.colorSwatch,
            {
              backgroundColor: `rgb(${currentThread.rgb[0]}, ${currentThread.rgb[1]}, ${currentThread.rgb[2]})`,
            },
          ]}
        >
          <Text
            style={[
              styles.colorSymbol,
              {
                color:
                  (0.299 * currentThread.rgb[0] +
                    0.587 * currentThread.rgb[1] +
                    0.114 * currentThread.rgb[2]) /
                    255 >
                  0.5
                    ? '#000'
                    : '#fff',
              },
            ]}
          >
            {currentThread.symbol}
          </Text>
        </View>
        <View style={styles.colorDetails}>
          <Text style={styles.colorName}>{currentThread.thread_name}</Text>
          <Text style={styles.colorCode}>
            {currentThread.thread_brand} {currentThread.thread_code}
          </Text>
          <Text style={styles.colorProgress}>
            {currentColorCompleted} / {currentColorStitches} ściegów (
            {Math.round((currentColorCompleted / currentColorStitches) * 100)}%)
          </Text>
        </View>
      </View>

      {/* Color Navigation */}
      <View style={styles.colorNav}>
        <TouchableOpacity
          onPress={handlePrevColor}
          disabled={currentColorIndex === 0}
          style={[
            styles.navButton,
            currentColorIndex === 0 && styles.navButtonDisabled,
          ]}
        >
          <Text style={styles.navButtonText}>← Poprzedni</Text>
        </TouchableOpacity>
        <Text style={styles.colorCounter}>
          Kolor {currentColorIndex + 1} / {pattern.color_palette.length}
        </Text>
        <TouchableOpacity
          onPress={handleNextColor}
          disabled={currentColorIndex === pattern.color_palette.length - 1}
          style={[
            styles.navButton,
            currentColorIndex === pattern.color_palette.length - 1 &&
              styles.navButtonDisabled,
          ]}
        >
          <Text style={styles.navButtonText}>Następny →</Text>
        </TouchableOpacity>
      </View>

      {/* Overall Progress */}
      <View style={styles.overallProgress}>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${progressPercent}%` }]}
          />
        </View>
        <Text style={styles.progressText}>
          Całkowity postęp: {completedCount} / {totalStitches} ({progressPercent}%)
        </Text>
      </View>

      {/* Grid */}
      <ScrollView style={styles.gridScroll} bounces={false}>
        <ScrollView horizontal bounces={false}>
          {renderGrid()}
        </ScrollView>
      </ScrollView>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsText}>
          💡 Dotknij ściegu aby oznaczyć jako ukończony
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#6366f1',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  modeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  modeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  colorInfo: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 16,
  },
  colorSwatch: {
    width: 64,
    height: 64,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  colorSymbol: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  colorDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  colorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  colorCode: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  colorProgress: {
    fontSize: 13,
    color: '#6366f1',
    fontWeight: '600',
  },
  colorNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  navButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#6366f1',
    borderRadius: 8,
  },
  navButtonDisabled: {
    backgroundColor: '#d1d5db',
    opacity: 0.5,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  colorCounter: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  overallProgress: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  gridScroll: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  gridContainer: {
    padding: 16,
  },
  gridRow: {
    flexDirection: 'row',
  },
  gridCell: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: 'bold',
  },
  instructions: {
    padding: 12,
    backgroundColor: '#fffbeb',
    borderTopWidth: 1,
    borderTopColor: '#fef3c7',
  },
  instructionsText: {
    fontSize: 13,
    color: '#92400e',
    textAlign: 'center',
  },
});
