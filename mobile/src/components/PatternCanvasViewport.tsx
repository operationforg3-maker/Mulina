import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Platform, useWindowDimensions, Text, TouchableOpacity } from 'react-native';

export interface ThreadItem {
  rgb: number[];
  thread_code: string;
  thread_brand: string;
  thread_name: string;
  symbol: string;
  delta_e?: number;
}

export interface BackstitchItem {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color_index: number;
  completed?: boolean;
}

export interface ParkedThreadItem {
  r: number;
  c: number;
  corner: 'NW' | 'NE' | 'SW' | 'SE';
  thread_code: string;
  color_index: number;
}

export interface PatternCanvasViewportProps {
  grid: number[][];
  width: number; // grid width in stitches
  height: number; // grid height in stitches
  colorPalette: ThreadItem[];
  completedStitches: boolean[][];
  selectedColorIndex: number;
  highlightColorIndex: number | null;
  viewMode: 'stitches' | 'symbols' | 'colors';
  activeTool: 'stitch' | 'box_select' | 'parking' | 'pencil' | 'eraser' | 'fill' | 'picker';
  stitchLock: boolean;
  parkingCorner: 'NW' | 'NE' | 'SW' | 'SE';
  parkedThreads: ParkedThreadItem[];
  backstitchLines: BackstitchItem[];
  showBackstitch: boolean;
  onCellClick: (r: number, c: number) => void;
  onCellDragMark: (cells: Array<{ r: number; c: number }>, mode: 'mark' | 'unmark') => void;
  onPickColor?: (colorIdx: number) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  themeMode?: 'light' | 'oled' | 'night' | 'cozy' | 'redlight';
}

export default function PatternCanvasViewport({
  grid,
  width: gridW,
  height: gridH,
  colorPalette,
  completedStitches,
  selectedColorIndex,
  highlightColorIndex,
  viewMode,
  activeTool,
  stitchLock,
  parkingCorner,
  parkedThreads,
  backstitchLines,
  showBackstitch,
  onCellClick,
  onCellDragMark,
  onPickColor,
  onUndo,
  onRedo,
  themeMode = 'light',
}: PatternCanvasViewportProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { width: winW, height: winH } = useWindowDimensions();

  // Viewport Transform Matrix: (zoom scale, pan offset in px)
  const [scale, setScale] = useState<number>(1.0);
  const [panX, setPanX] = useState<number>(40);
  const [panY, setPanY] = useState<number>(40);

  // Mutable refs for high-frequency interaction without re-render lag
  const transformRef = useRef({ scale: 1.0, panX: 40, panY: 40 });
  const isDraggingRef = useRef(false);
  const dragModeRef = useRef<'pan' | 'stitch' | 'pending'>('pan');
  const stitchDragActionRef = useRef<'mark' | 'unmark'>('mark');
  const visitedStitchCellsRef = useRef<Set<string>>(new Set());
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const initialFitDoneRef = useRef(false);

  // Multi-Touch & Anti-Accidental-Stitch Gesture Shield Refs
  const touchCountRef = useRef(0);
  const touchDistanceRef = useRef<number | null>(null);
  const lastTouchMidRef = useRef<{ x: number; y: number } | null>(null);
  const isMultiTouchGestureRef = useRef(false);
  const multiTouchCooldownUntilRef = useRef(0);
  const pendingTapRef = useRef<{ r: number; c: number; x: number; y: number; time: number; pointerId: number } | null>(null);

  // Sync state to ref
  useEffect(() => {
    transformRef.current = { scale, panX, panY };
  }, [scale, panX, panY]);

  // Base stitch cell size in virtual pixels
  const BASE_CELL = 24;

  // Fit to screen on initial mount
  useEffect(() => {
    if (!initialFitDoneRef.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const availW = rect.width > 0 ? rect.width : winW;
      const availH = rect.height > 0 ? rect.height : (winH - 260);

      const gridPixelW = gridW * BASE_CELL;
      const gridPixelH = gridH * BASE_CELL;

      const fitScale = Math.min((availW - 40) / gridPixelW, (availH - 40) / gridPixelH, 1.2);
      const initialScale = Math.max(0.15, fitScale);

      const initialPanX = Math.max(10, (availW - gridPixelW * initialScale) / 2);
      const initialPanY = Math.max(10, (availH - gridPixelH * initialScale) / 2);

      setScale(initialScale);
      setPanX(initialPanX);
      setPanY(initialPanY);
      transformRef.current = { scale: initialScale, panX: initialPanX, panY: initialPanY };
      if (rect.width > 50 && rect.height > 50) {
        initialFitDoneRef.current = true;
      }
    }
  }, [gridW, gridH, winW, winH]);

  // Main High-Performance Canvas Render Loop
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const { scale: curScale, panX: curPanX, panY: curPanY } = transformRef.current;

    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. Background fill
    if (themeMode === 'oled') {
      ctx.fillStyle = '#050505';
    } else if (themeMode === 'night') {
      ctx.fillStyle = '#1C1310';
    } else if (themeMode === 'redlight') {
      ctx.fillStyle = '#140303';
    } else {
      ctx.fillStyle = '#FAF7F2'; // Warm cozy Aida fabric hue
    }
    ctx.fillRect(0, 0, w, h);

    const cellSize = BASE_CELL * curScale;

    // Viewport Culling: calculate visible row and col range
    const startCol = Math.max(0, Math.floor(-curPanX / cellSize));
    const endCol = Math.min(gridW, Math.ceil((w - curPanX) / cellSize));
    const startRow = Math.max(0, Math.floor(-curPanY / cellSize));
    const endRow = Math.min(gridH, Math.ceil((h - curPanY) / cellSize));

    // 2. Draw fabric texture / stitches
    for (let r = startRow; r < endRow; r++) {
      for (let c = startCol; c < endCol; c++) {
        const colorIdx = grid[r]?.[c];
        if (colorIdx === undefined || colorIdx === -1 || colorIdx === null) {
          continue; // unstitched empty canvas margin
        }
        const thread = colorPalette[colorIdx];
        if (!thread) continue;
        const isDone = completedStitches[r]?.[c];
        const isIsolated = highlightColorIndex !== null;
        const isTargetColor = highlightColorIndex === colorIdx;

        const cellX = curPanX + c * cellSize;
        const cellY = curPanY + r * cellSize;

        if (!thread) continue;

        const [tr, tg, tb] = thread.rgb;

        // Apply dimming if color isolation is active
        ctx.save();
        if (isIsolated && !isTargetColor) {
          ctx.globalAlpha = themeMode === 'oled' ? 0.08 : 0.18;
        }

        if (viewMode === 'colors') {
          // Pure solid color mode
          ctx.fillStyle = `rgb(${tr}, ${tg}, ${tb})`;
          ctx.fillRect(cellX, cellY, cellSize, cellSize);
        } else if (viewMode === 'symbols') {
          // Clean symbol mode
          ctx.fillStyle = themeMode === 'oled' ? '#1A1A1A' : '#FFFFFF';
          ctx.fillRect(cellX, cellY, cellSize, cellSize);

          // Draw symbol
          if (cellSize >= 9) {
            const symColor = isDone
              ? (themeMode === 'oled' ? '#555555' : '#9CA3AF')
              : `rgb(${tr}, ${tg}, ${tb})`;
            ctx.fillStyle = symColor;
            ctx.font = `bold ${Math.max(8, Math.round(cellSize * 0.65))}px -apple-system, system-ui, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(thread.symbol || '●', cellX + cellSize / 2, cellY + cellSize / 2 + 1);
          }
        } else {
          // Realistic Cross-Stitch Mode
          ctx.fillStyle = `rgba(${tr}, ${tg}, ${tb}, 0.25)`;
          ctx.fillRect(cellX, cellY, cellSize, cellSize);

          if (cellSize >= 6) {
            // Draw ✕ stitch lines with thread shading
            ctx.strokeStyle = `rgb(${tr}, ${tg}, ${tb})`;
            ctx.lineWidth = Math.max(1.2, cellSize * 0.18);
            ctx.lineCap = 'round';

            const pad = cellSize * 0.15;
            // First diagonal \
            ctx.beginPath();
            ctx.moveTo(cellX + pad, cellY + pad);
            ctx.lineTo(cellX + cellSize - pad, cellY + cellSize - pad);
            ctx.stroke();

            // Second diagonal /
            ctx.beginPath();
            ctx.moveTo(cellX + cellSize - pad, cellY + pad);
            ctx.lineTo(cellX + pad, cellY + cellSize - pad);
            ctx.stroke();
          }
        }

        // Highlight border for targeted color
        if (isTargetColor) {
          ctx.strokeStyle = '#D9777F';
          ctx.lineWidth = Math.max(2, cellSize * 0.15);
          ctx.strokeRect(cellX + 1, cellY + 1, cellSize - 2, cellSize - 2);
        }

        // Completed Stitches Overlay (Soft Sage Green wash + Checkmark)
        if (isDone) {
          ctx.fillStyle = themeMode === 'oled' ? 'rgba(74, 120, 95, 0.4)' : 'rgba(167, 196, 178, 0.65)';
          ctx.fillRect(cellX, cellY, cellSize, cellSize);

          if (cellSize >= 12) {
            ctx.fillStyle = '#2E5A44';
            ctx.font = `bold ${Math.max(9, Math.round(cellSize * 0.55))}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('✓', cellX + cellSize / 2, cellY + cellSize / 2);
          }
        }

        ctx.restore();
      }
    }

    // 3. Draw Grid Lines (Thick lines every 10 stitches, thin every stitch)
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = themeMode === 'oled' ? '#222222' : '#E8DFD8';

    // Thin lines
    if (cellSize >= 7) {
      ctx.beginPath();
      for (let r = startRow; r <= endRow; r++) {
        const y = curPanY + r * cellSize;
        ctx.moveTo(curPanX + startCol * cellSize, y);
        ctx.lineTo(curPanX + endCol * cellSize, y);
      }
      for (let c = startCol; c <= endCol; c++) {
        const x = curPanX + c * cellSize;
        ctx.moveTo(x, curPanY + startRow * cellSize);
        ctx.lineTo(x, curPanY + endRow * cellSize);
      }
      ctx.stroke();
    }

    // Major 10-stitch bold lines
    ctx.lineWidth = 2.0;
    ctx.strokeStyle = themeMode === 'oled' ? '#4A4A4A' : '#736B63';
    ctx.beginPath();
    for (let r = 0; r <= gridH; r += 10) {
      if (r >= startRow && r <= endRow) {
        const y = curPanY + r * cellSize;
        ctx.moveTo(curPanX + Math.max(0, startCol) * cellSize, y);
        ctx.lineTo(curPanX + Math.min(gridW, endCol) * cellSize, y);
      }
    }
    for (let c = 0; c <= gridW; c += 10) {
      if (c >= startCol && c <= endCol) {
        const x = curPanX + c * cellSize;
        ctx.moveTo(x, curPanY + Math.max(0, startRow) * cellSize);
        ctx.lineTo(x, curPanY + Math.min(gridH, endRow) * cellSize);
      }
    }
    ctx.stroke();

    // 4. Draw Backstitch lines if enabled
    if (showBackstitch && backstitchLines && backstitchLines.length > 0) {
      for (const bs of backstitchLines) {
        const thread = colorPalette[bs.color_index] || colorPalette[0];
        const [br, bg, bb] = thread.rgb;

        const x1 = curPanX + bs.x1 * cellSize;
        const y1 = curPanY + bs.y1 * cellSize;
        const x2 = curPanX + bs.x2 * cellSize;
        const y2 = curPanY + bs.y2 * cellSize;

        ctx.save();
        ctx.strokeStyle = bs.completed ? '#9CA3AF' : `rgb(${br}, ${bg}, ${bb})`;
        ctx.lineWidth = Math.max(2.5, cellSize * 0.22);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 5. Draw Parked Thread Pins
    if (parkedThreads && parkedThreads.length > 0) {
      for (const pt of parkedThreads) {
        if (pt.r >= startRow && pt.r < endRow && pt.c >= startCol && pt.c < endCol) {
          const ptX = curPanX + pt.c * cellSize;
          const ptY = curPanY + pt.r * cellSize;
          const markerPad = Math.max(2, cellSize * 0.1);

          let px = ptX + markerPad;
          let py = ptY + markerPad;
          if (pt.corner === 'NE') { px = ptX + cellSize - markerPad - 8; }
          if (pt.corner === 'SW') { py = ptY + cellSize - markerPad - 8; }
          if (pt.corner === 'SE') {
            px = ptX + cellSize - markerPad - 8;
            py = ptY + cellSize - markerPad - 8;
          }

          ctx.font = `${Math.max(10, Math.round(cellSize * 0.5))}px sans-serif`;
          ctx.fillText('📍', px, py + 8);
        }
      }
    }

    // 6. Draw Coordinate Numbers Along Borders
    ctx.fillStyle = themeMode === 'oled' ? '#888888' : '#5E544C';
    ctx.font = 'bold 11px -apple-system, system-ui, sans-serif';

    // Top Rulers
    for (let c = 10; c <= gridW; c += 10) {
      const rx = curPanX + c * cellSize;
      if (rx > 30 && rx < w - 20) {
        ctx.textAlign = 'center';
        ctx.fillText(`${c}`, rx, Math.max(16, curPanY - 8));
      }
    }

    // Left Rulers
    for (let r = 10; r <= gridH; r += 10) {
      const ry = curPanY + r * cellSize;
      if (ry > 30 && ry < h - 20) {
        ctx.textAlign = 'right';
        ctx.fillText(`${r}`, Math.max(28, curPanX - 8), ry + 4);
      }
    }

    // 7. Minimap / Radar Thumbnail in corner
    const mmSize = 110;
    const mmX = w - mmSize - 16;
    const mmY = h - mmSize - 16;

    ctx.save();
    ctx.fillStyle = themeMode === 'oled' ? 'rgba(20,20,20,0.85)' : 'rgba(255,255,255,0.9)';
    ctx.strokeStyle = '#D9777F';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(mmX, mmY, mmSize, mmSize, 8) : ctx.rect(mmX, mmY, mmSize, mmSize);
    ctx.fill();
    ctx.stroke();

    const mmScale = Math.min((mmSize - 8) / gridW, (mmSize - 8) / gridH);
    const mmOffX = mmX + 4 + ((mmSize - 8) - gridW * mmScale) / 2;
    const mmOffY = mmY + 4 + ((mmSize - 8) - gridH * mmScale) / 2;

    for (let r = 0; r < gridH; r += Math.max(1, Math.floor(gridH / 40))) {
      for (let c = 0; c < gridW; c += Math.max(1, Math.floor(gridW / 40))) {
        const th = colorPalette[grid[r]?.[c]];
        if (th) {
          ctx.fillStyle = `rgb(${th.rgb[0]}, ${th.rgb[1]}, ${th.rgb[2]})`;
          ctx.fillRect(mmOffX + c * mmScale, mmOffY + r * mmScale, Math.max(1, mmScale), Math.max(1, mmScale));
        }
      }
    }

    // Draw Viewport Rect in Minimap
    const vpColStart = Math.max(0, -curPanX / cellSize);
    const vpColEnd = Math.min(gridW, (w - curPanX) / cellSize);
    const vpRowStart = Math.max(0, -curPanY / cellSize);
    const vpRowEnd = Math.min(gridH, (h - curPanY) / cellSize);

    ctx.strokeStyle = '#D9777F';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(
      mmOffX + vpColStart * mmScale,
      mmOffY + vpRowStart * mmScale,
      Math.max(4, (vpColEnd - vpColStart) * mmScale),
      Math.max(4, (vpRowEnd - vpRowStart) * mmScale)
    );
    ctx.restore();

    ctx.restore();
  }, [
    grid,
    gridW,
    gridH,
    colorPalette,
    completedStitches,
    highlightColorIndex,
    viewMode,
    backstitchLines,
    showBackstitch,
    parkedThreads,
    themeMode,
  ]);

  // Handle Resize and Canvas Buffer Dimensions
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      const w = rect.width > 0 ? rect.width : (winW || 360);
      const h = rect.height > 0 ? rect.height : (winH - 260 || 360);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      // If initial fit was triggered when rect had 0 dimensions, do the fit now
      if (!initialFitDoneRef.current && rect.width > 50 && rect.height > 50) {
        const gridPixelW = gridW * BASE_CELL;
        const gridPixelH = gridH * BASE_CELL;
        const fitScale = Math.min((rect.width - 40) / gridPixelW, (rect.height - 40) / gridPixelH, 1.2);
        const initialScale = Math.max(0.15, fitScale);
        const initialPanX = Math.max(10, (rect.width - gridPixelW * initialScale) / 2);
        const initialPanY = Math.max(10, (rect.height - gridPixelH * initialScale) / 2);

        setScale(initialScale);
        setPanX(initialPanX);
        setPanY(initialPanY);
        transformRef.current = { scale: initialScale, panX: initialPanX, panY: initialPanY };
        initialFitDoneRef.current = true;
      }

      renderCanvas();
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      ro = new ResizeObserver(() => {
        handleResize();
      });
      ro.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (ro) ro.disconnect();
    };
  }, [renderCanvas, gridW, gridH, winW, winH]);

  // Re-render when dependencies or transform change
  useEffect(() => {
    renderCanvas();
  }, [renderCanvas, scale, panX, panY]);

  // Native Wheel Event: Smooth Zoom Centered on Pointer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();

      const rect = container.getBoundingClientRect();
      const pointerX = e.clientX - rect.left;
      const pointerY = e.clientY - rect.top;

      const { scale: curScale, panX: curPanX, panY: curPanY } = transformRef.current;

      // Trackpad pinch gesture (e.ctrlKey) or standard wheel
      const zoomFactor = e.ctrlKey ? Math.exp(-e.deltaY * 0.015) : Math.exp(-e.deltaY * 0.002);
      const nextScale = Math.max(0.08, Math.min(12.0, curScale * zoomFactor));

      // Calculate new pan to keep point under mouse stationary
      const nextPanX = pointerX - (pointerX - curPanX) * (nextScale / curScale);
      const nextPanY = pointerY - (pointerY - curPanY) * (nextScale / curScale);

      transformRef.current = { scale: nextScale, panX: nextPanX, panY: nextPanY };
      setScale(nextScale);
      setPanX(nextPanX);
      setPanY(nextPanY);
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, []);

  // Web Pointer & Touch Event Handlers
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // If in gesture cooldown (e.g. within 400ms of lifting 2 fingers), reject!
    if (Date.now() < multiTouchCooldownUntilRef.current) {
      pendingTapRef.current = null;
      dragModeRef.current = 'pan';
      return;
    }

    // If 2+ touches are already on screen or multi-touch gesture is active, pan only!
    if (touchCountRef.current >= 2 || isMultiTouchGestureRef.current) {
      pendingTapRef.current = null;
      dragModeRef.current = 'pan';
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    lastPointerRef.current = { x, y };
    isDraggingRef.current = true;

    const isMouse = e.pointerType === 'mouse';
    // Pan mode condition: middle button, shift key, or inactive stitch tool
    const isPanMode = e.button === 1 || e.shiftKey || (!stitchLock && activeTool === 'stitch') || activeTool !== 'stitch';

    if (isPanMode) {
      dragModeRef.current = 'pan';
      pendingTapRef.current = null;
    } else {
      const { scale: curScale, panX: curPanX, panY: curPanY } = transformRef.current;
      const cellSize = BASE_CELL * curScale;

      const c = Math.floor((x - curPanX) / cellSize);
      const r = Math.floor((y - curPanY) / cellSize);

      const isValidCell = r >= 0 && r < gridH && c >= 0 && c < gridW && grid[r]?.[c] !== -1 && grid[r]?.[c] !== undefined;

      if (isMouse) {
        // Desktop mouse: standard immediate interaction
        dragModeRef.current = 'stitch';
        visitedStitchCellsRef.current.clear();

        if (isValidCell) {
          const currentlyDone = completedStitches[r]?.[c] || false;
          stitchDragActionRef.current = currentlyDone ? 'unmark' : 'mark';
          visitedStitchCellsRef.current.add(`${r}_${c}`);

          if (activeTool === 'stitch') {
            onCellClick(r, c);
          } else if (activeTool === 'picker' && onPickColor) {
            onPickColor(grid[r][c]);
          }
        }
      } else {
        // Mobile Touch: NEVER mark immediately on pointerdown!
        // Record pending tap candidate and confirm ONLY on clean pointerup
        dragModeRef.current = 'pending';
        if (isValidCell) {
          pendingTapRef.current = {
            r,
            c,
            x,
            y,
            time: Date.now(),
            pointerId: e.pointerId,
          };
        } else {
          pendingTapRef.current = null;
        }
      }
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;

    // Multi-touch shield: abort if multi-finger gesture active or cooldown
    if (touchCountRef.current >= 2 || isMultiTouchGestureRef.current || Date.now() < multiTouchCooldownUntilRef.current) {
      pendingTapRef.current = null;
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const dx = x - lastPointerRef.current.x;
    const dy = y - lastPointerRef.current.y;
    lastPointerRef.current = { x, y };

    if (dragModeRef.current === 'pan') {
      const nextPanX = transformRef.current.panX + dx;
      const nextPanY = transformRef.current.panY + dy;
      transformRef.current.panX = nextPanX;
      transformRef.current.panY = nextPanY;
      setPanX(nextPanX);
      setPanY(nextPanY);
    } else if (dragModeRef.current === 'pending') {
      // Touch is in pending tap state; check if user has moved finger > 10px
      if (pendingTapRef.current) {
        const distFromStart = Math.hypot(x - pendingTapRef.current.x, y - pendingTapRef.current.y);
        if (distFromStart > 10) {
          // Finger moved significantly: this is a DRAG, not a tap!
          const startCell = pendingTapRef.current;
          pendingTapRef.current = null;

          if (activeTool === 'stitch' && stitchLock) {
            // Intentional 1-finger drag-stitching
            dragModeRef.current = 'stitch';
            visitedStitchCellsRef.current.clear();
            const currentlyDone = completedStitches[startCell.r]?.[startCell.c] || false;
            stitchDragActionRef.current = currentlyDone ? 'unmark' : 'mark';
            visitedStitchCellsRef.current.add(`${startCell.r}_${startCell.c}`);
            onCellDragMark([{ r: startCell.r, c: startCell.c }], stitchDragActionRef.current);
          } else {
            // Pan mode
            dragModeRef.current = 'pan';
          }
        }
      }
    } else if (dragModeRef.current === 'stitch' && activeTool === 'stitch') {
      // Continuous paint marking along pointer path
      const { scale: curScale, panX: curPanX, panY: curPanY } = transformRef.current;
      const cellSize = BASE_CELL * curScale;

      const c = Math.floor((x - curPanX) / cellSize);
      const r = Math.floor((y - curPanY) / cellSize);

      if (r >= 0 && r < gridH && c >= 0 && c < gridW && grid[r]?.[c] !== -1 && grid[r]?.[c] !== undefined) {
        const key = `${r}_${c}`;
        if (!visitedStitchCellsRef.current.has(key)) {
          visitedStitchCellsRef.current.add(key);
          onCellDragMark([{ r, c }], stitchDragActionRef.current);
        }
      }
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;

    // Check if we have a valid, clean single-finger tap to execute
    if (
      pendingTapRef.current &&
      Date.now() >= multiTouchCooldownUntilRef.current &&
      !isMultiTouchGestureRef.current &&
      touchCountRef.current <= 1
    ) {
      const { r, c, time, x: startX, y: startY } = pendingTapRef.current;
      const duration = Date.now() - time;

      const rect = e.currentTarget.getBoundingClientRect();
      const endX = e.clientX - rect.left;
      const endY = e.clientY - rect.top;
      const dist = Math.hypot(endX - startX, endY - startY);

      // Clean tap threshold: < 400ms duration and < 12px total movement
      if (duration < 400 && dist < 12) {
        if (activeTool === 'stitch') {
          onCellClick(r, c);
        } else if (activeTool === 'picker' && onPickColor) {
          onPickColor(grid[r][c]);
        }
      }
    }

    pendingTapRef.current = null;
    dragModeRef.current = 'pan';
  };

  // Touch handlers for Mobile Pinch Zoom & 2-finger Pan
  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchCountRef.current = e.touches.length;

    if (e.touches.length >= 2) {
      // 2+ fingers detected: immediately cancel any pending tap or drag-stitch!
      pendingTapRef.current = null;
      isMultiTouchGestureRef.current = true;
      dragModeRef.current = 'pan';
      visitedStitchCellsRef.current.clear();

      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      touchDistanceRef.current = dist;

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        lastTouchMidRef.current = {
          x: (t1.clientX + t2.clientX) / 2 - rect.left,
          y: (t1.clientY + t2.clientY) / 2 - rect.top,
        };
      }
    } else if (e.touches.length === 3 && onRedo) {
      // 3 fingers tap = Redo
      pendingTapRef.current = null;
      multiTouchCooldownUntilRef.current = Date.now() + 500;
      onRedo();
    }
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && containerRef.current) {
      // Ensure multi-touch shield remains active
      pendingTapRef.current = null;
      isMultiTouchGestureRef.current = true;
      dragModeRef.current = 'pan';

      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const curDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

      const rect = containerRef.current.getBoundingClientRect();
      const curMidX = (t1.clientX + t2.clientX) / 2 - rect.left;
      const curMidY = (t1.clientY + t2.clientY) / 2 - rect.top;

      if (touchDistanceRef.current !== null && lastTouchMidRef.current !== null) {
        const prevDist = touchDistanceRef.current;
        const prevMid = lastTouchMidRef.current;

        // Pan delta from midpoint translation
        const deltaPanX = curMidX - prevMid.x;
        const deltaPanY = curMidY - prevMid.y;

        // Zoom scale ratio from pinch distance change
        const scaleRatio = prevDist > 5 ? (curDist / prevDist) : 1;
        const { scale: curScale, panX: curPanX, panY: curPanY } = transformRef.current;
        const nextScale = Math.max(0.08, Math.min(12.0, curScale * scaleRatio));

        // Combined: translate with two fingers + zoom centered on touch midpoint
        const nextPanX = curPanX + deltaPanX + (curMidX - curPanX) * (1 - nextScale / curScale);
        const nextPanY = curPanY + deltaPanY + (curMidY - curPanY) * (1 - nextScale / curScale);

        transformRef.current = { scale: nextScale, panX: nextPanX, panY: nextPanY };
        setScale(nextScale);
        setPanX(nextPanX);
        setPanY(nextPanY);
      }

      touchDistanceRef.current = curDist;
      lastTouchMidRef.current = { x: curMidX, y: curMidY };
    }
  };

  const onTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    touchCountRef.current = e.touches.length;

    if (isMultiTouchGestureRef.current) {
      // Multi-touch just ended or dropped to 1 finger
      // Set 400ms cooldown to completely swallow trailing finger release events!
      multiTouchCooldownUntilRef.current = Date.now() + 400;
      pendingTapRef.current = null;

      if (e.touches.length === 0) {
        isMultiTouchGestureRef.current = false;
        touchDistanceRef.current = null;
        lastTouchMidRef.current = null;
      }
    }
  };

  // Zoom Button Controls (+ / - / Fit)
  const handleZoomIn = () => {
    const next = Math.min(12.0, scale * 1.35);
    setScale(next);
    transformRef.current.scale = next;
  };

  const handleZoomOut = () => {
    const next = Math.max(0.08, scale / 1.35);
    setScale(next);
    transformRef.current.scale = next;
  };

  const handleZoomFit = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const fitScale = Math.min((rect.width - 60) / (gridW * BASE_CELL), (rect.height - 60) / (gridH * BASE_CELL), 1.2);
      const s = Math.max(0.12, fitScale);
      const px = Math.max(20, (rect.width - gridW * BASE_CELL * s) / 2);
      const py = Math.max(20, (rect.height - gridH * BASE_CELL * s) / 2);

      setScale(s);
      setPanX(px);
      setPanY(py);
      transformRef.current = { scale: s, panX: px, panY: py };
    }
  };

  return (
    <View style={styles.outerContainer}>
      {/* HTML5 Canvas Viewport on Web */}
      {Platform.OS === 'web' ? (
        <div
          ref={containerRef as any}
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
            cursor: activeTool === 'stitch' && stitchLock ? 'crosshair' : 'grab',
            touchAction: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
        >
          <canvas
            ref={canvasRef as any}
            style={{
              display: 'block',
              width: '100%',
              height: '100%',
            }}
          />

          {/* Quick HUD Navigation Pill (Zoom In, Zoom Out, Fit, Gestures hint) */}
          <div
            style={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(10px)',
              padding: '6px 12px',
              borderRadius: 24,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              border: '1px solid rgba(217, 119, 127, 0.25)',
              zIndex: 10,
            }}
          >
            <button
              onClick={handleZoomOut}
              style={hudBtnStyle}
              title="Oddal (kółko myszy / gest uszczypnięcia)"
            >
              🔍−
            </button>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#37474F', minWidth: 42, textAlign: 'center' }}>
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              style={hudBtnStyle}
              title="Przybliż (kółko myszy)"
            >
              🔍+
            </button>
            <button
              onClick={handleZoomFit}
              style={{ ...hudBtnStyle, padding: '4px 10px', fontSize: 11, fontWeight: 700 }}
              title="Dopasuj cały wzór do ekranu"
            >
              ⤢ Całość
            </button>
          </div>
        </div>
      ) : (
        <View style={styles.fallbackContainer}>
          <Text>Widok Tamborka (Canvas natywny)</Text>
        </View>
      )}
    </View>
  );
}

const hudBtnStyle: any = {
  background: '#FFF3F4',
  border: '1px solid #D9777F',
  borderRadius: 14,
  padding: '4px 8px',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: '800',
  color: '#D9777F',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#FAF7F2',
    position: 'relative',
    overflow: 'hidden',
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
