/**
 * Client-Side AI Image-to-Pattern Converter Engine
 * Runs 100% in-browser and on-device without needing external backend.
 */

import { StoredPattern } from './patternStorage';
import { findClosestThread, ThreadDef, THREAD_CATALOG } from './threadDatabase';

export interface ConvertOptions {
  imageUri: string;
  targetWidth: number; // in stitches
  targetHeight: number; // in stitches
  brand: 'DMC' | 'Anchor' | 'Ariadna' | 'Madeira' | 'CXC' | 'Dimensions';
  maxColors: number; // e.g. 15, 30, 45, 60, or 0 (unlimited)
  cleanupConfetti: boolean;
  brightness: number; // 0.5 to 1.5 (default 1.0)
  contrast: number; // 0.5 to 1.5 (default 1.0)
  aidaCount: number;
  widthCm: number;
  heightCm: number;
  canvasColor?: string;
  marginCm?: number;
}

const SYMBOLS = [
  '●', '▲', '■', '◆', '★', '✚', '✦', '♠', '♣', '♥',
  '♦', '✕', '✶', '✿', '❄', '✪', '✱', '✜', '✤', '✥',
  '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A',
  'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L',
  'M', 'N', 'P', 'R', 'S', 'T', 'U', 'W', 'X', 'Y',
];

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Loads an image URL/dataURI into an HTMLImageElement
 */
function loadImage(uri: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (typeof Image === 'undefined') {
      reject(new Error('HTML Image is not supported in this environment'));
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Nie udało się załadować obrazu: ' + e));
    img.src = uri;
  });
}

/**
 * Clean up isolated confetti stitches (single pixels surrounded by a different color)
 */
function removeConfetti(grid: number[][], width: number, height: number): number[][] {
  const newGrid = grid.map((row) => [...row]);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const current = grid[y][x];
      const neighbors: Record<number, number> = {};
      let diffCount = 0;

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const n = grid[y + dy][x + dx];
          if (n !== current) diffCount++;
          neighbors[n] = (neighbors[n] || 0) + 1;
        }
      }

      // If at least 7 of 8 neighbors are different, replace with most common neighbor
      if (diffCount >= 7) {
        let maxCount = 0;
        let bestNeighbor = current;
        for (const [k, count] of Object.entries(neighbors)) {
          if (count > maxCount) {
            maxCount = count;
            bestNeighbor = parseInt(k, 10);
          }
        }
        newGrid[y][x] = bestNeighbor;
      }
    }
  }

  return newGrid;
}

/**
 * Converts image directly into cross-stitch pattern
 */
export async function convertImageClient(options: ConvertOptions): Promise<StoredPattern> {
  const {
    imageUri,
    targetWidth,
    targetHeight,
    brand,
    maxColors,
    cleanupConfetti,
    brightness,
    contrast,
    aidaCount,
    widthCm,
    heightCm,
    canvasColor = 'white',
    marginCm = 5,
  } = options;

  const w = Math.max(10, Math.min(250, targetWidth));
  const h = Math.max(10, Math.min(250, targetHeight));

  // 1. Render and extract pixels using canvas
  let pixelData: Uint8ClampedArray;

  if (typeof document !== 'undefined') {
    const img = await loadImage(imageUri);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas 2D context not available');
    }

    // High quality scaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, w, h);

    const imgData = ctx.getImageData(0, 0, w, h);
    pixelData = imgData.data;
  } else {
    throw new Error('Środowisko nie obsługuje Canvas (użyj wersji web lub backend)');
  }

  // 2. Map every pixel to closest thread & track frequencies
  const rawThreadGrid: ThreadDef[][] = [];
  const threadUsageMap = new Map<string, { thread: ThreadDef; count: number }>();

  for (let y = 0; y < h; y++) {
    const row: ThreadDef[] = [];
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      let r = pixelData[idx];
      let g = pixelData[idx + 1];
      let b = pixelData[idx + 2];
      const a = pixelData[idx + 3];

      // Handle transparency by blending over canvas color
      if (a < 255) {
        const bgR = canvasColor === 'black' ? 0 : 255;
        const bgG = canvasColor === 'black' ? 0 : 255;
        const bgB = canvasColor === 'black' ? 0 : 255;
        const alpha = a / 255;
        r = r * alpha + bgR * (1 - alpha);
        g = g * alpha + bgG * (1 - alpha);
        b = b * alpha + bgB * (1 - alpha);
      }

      // Brightness adjustment
      r = clamp(r * brightness, 0, 255);
      g = clamp(g * brightness, 0, 255);
      b = clamp(b * brightness, 0, 255);

      // Contrast adjustment
      r = clamp((r - 128) * contrast + 128, 0, 255);
      g = clamp((g - 128) * contrast + 128, 0, 255);
      b = clamp((b - 128) * contrast + 128, 0, 255);

      const matched = findClosestThread(r, g, b, brand);
      row.push(matched);

      const key = `${matched.brand}_${matched.code}`;
      const existing = threadUsageMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        threadUsageMap.set(key, { thread: matched, count: 1 });
      }
    }
    rawThreadGrid.push(row);
  }

  // 3. Palette Limit & Quantization
  // Sort threads by popularity
  const sortedThreads = Array.from(threadUsageMap.values()).sort(
    (a, b) => b.count - a.count
  );

  let finalThreads: ThreadDef[] = [];
  if (maxColors > 0 && sortedThreads.length > maxColors) {
    // Keep only top maxColors
    finalThreads = sortedThreads.slice(0, maxColors).map((item) => item.thread);
  } else {
    finalThreads = sortedThreads.map((item) => item.thread);
  }

  // Build palette map: "brand_code" -> paletteIndex
  const paletteIndexMap = new Map<string, number>();
  finalThreads.forEach((th, idx) => {
    paletteIndexMap.set(`${th.brand}_${th.code}`, idx);
  });

  // 4. Construct numeric grid (remapping pixels to allowed palette)
  let numericGrid: number[][] = [];
  for (let y = 0; y < h; y++) {
    const row: number[] = [];
    for (let x = 0; x < w; x++) {
      const th = rawThreadGrid[y][x];
      const key = `${th.brand}_${th.code}`;

      if (paletteIndexMap.has(key)) {
        row.push(paletteIndexMap.get(key)!);
      } else {
        // Remap to the closest among the allowed finalThreads
        let minD = Infinity;
        let bestIdx = 0;
        for (let i = 0; i < finalThreads.length; i++) {
          const cand = finalThreads[i];
          const dR = cand.r - th.r;
          const dG = cand.g - th.g;
          const dB = cand.b - th.b;
          const d = dR * dR + dG * dG + dB * dB;
          if (d < minD) {
            minD = d;
            bestIdx = i;
          }
        }
        row.push(bestIdx);
      }
    }
    numericGrid.push(row);
  }

  // 5. Confetti cleanup if enabled
  if (cleanupConfetti) {
    numericGrid = removeConfetti(numericGrid, w, h);
  }

  // 6. Build color_palette structure
  const colorPalette = finalThreads.map((th, idx) => ({
    rgb: [th.r, th.g, th.b],
    thread_code: th.code,
    thread_brand: th.brand,
    thread_name: th.name,
    symbol: SYMBOLS[idx % SYMBOLS.length],
    delta_e: 0,
  }));

  const totalStitches = w * h;
  const estimatedSkeins = Math.max(1, Math.ceil(totalStitches / 1800));

  const patternId = `mualina_${Date.now()}`;
  const patternName = `Własny Haft • ${brand} (${w}×${h})`;

  const pattern: StoredPattern = {
    pattern_id: patternId,
    name: patternName,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    grid_data: {
      grid: numericGrid,
      type: 'cross',
      width: w,
      height: h,
    },
    color_palette: colorPalette,
    dimensions: {
      width_stitches: w,
      height_stitches: h,
      width_cm: widthCm,
      height_cm: heightCm,
      aida_count: aidaCount,
      canvas_color: canvasColor,
      margin_cm: marginCm,
      recommended_cut_width_cm: widthCm + marginCm * 2,
      recommended_cut_height_cm: heightCm + marginCm * 2,
    },
    materials_summary: {
      total_stitches: totalStitches,
      total_skeins: estimatedSkeins,
      estimated_cost_pln: estimatedSkeins * 4.8,
      fabric_cut_size: `${(widthCm + marginCm * 2).toFixed(1)} × ${(heightCm + marginCm * 2).toFixed(1)} cm`,
      fabric_type: `Aida ${aidaCount}ct`,
      canvas_color: canvasColor,
    },
    estimated_time: Math.round(totalStitches / 135) * 60, // ~135 stitches per hour
    image_url: imageUri,
    progress: {
      completed_stitches: Array(h).fill(null).map(() => Array(w).fill(false)),
      current_color_index: 0,
      last_worked: new Date().toISOString(),
      stitches_per_session: 0,
    },
  };

  return pattern;
}
