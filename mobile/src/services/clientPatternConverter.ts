/**
 * Client-Side AI Image-to-Pattern Converter Engine
 * Runs 100% in-browser and on-device without needing external backend.
 */

import { StoredPattern } from './patternStorage';
import { findClosestThread, ThreadDef, THREAD_CATALOG, rgbToLab, deltaE } from './threadDatabase';

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
  fitMode?: 'natural' | 'contain' | 'cover' | 'stretch';
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
 * Loads an image URL/dataURI into an HTMLImageElement safely without tainting canvas
 */
async function loadImage(uri: string): Promise<HTMLImageElement> {
  let effectiveSrc = uri;

  // On Web, if it's an external HTTP/HTTPS URL, try fetching as Blob -> DataURL
  // to guarantee that HTML5 Canvas never gets tainted by cross-origin security rules!
  if (typeof window !== 'undefined' && (uri.startsWith('http://') || uri.startsWith('https://'))) {
    try {
      const response = await fetch(uri, { mode: 'cors' });
      if (response.ok) {
        const blob = await response.blob();
        effectiveSrc = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => resolve(uri);
          reader.readAsDataURL(blob);
        });
      }
    } catch {
      // Fallback to direct URL if fetch mode cors fails
      effectiveSrc = uri;
    }
  }

  return new Promise((resolve, reject) => {
    if (typeof Image === 'undefined') {
      reject(new Error('Canvas Image nie jest obsługiwany w tym środowisku'));
      return;
    }

    const img = new Image();
    // Only set crossOrigin on remote HTTP/HTTPS URLs, never on data: or blob:
    if (effectiveSrc.startsWith('http://') || effectiveSrc.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => resolve(img);
    img.onerror = () => {
      // If anonymous failed, retry once without crossOrigin
      if (img.crossOrigin) {
        const fallback = new Image();
        fallback.onload = () => resolve(fallback);
        fallback.onerror = (e) => reject(new Error('Nie udało się załadować obrazu: ' + e));
        fallback.src = effectiveSrc;
      } else {
        reject(new Error('Nie udało się załadować obrazu. Upewnij się, że plik to poprawny JPG/PNG.'));
      }
    };

    img.src = effectiveSrc;
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
      if (current === -1) continue; // Keep empty margin unstitched

      const neighbors: Record<number, number> = {};
      let diffCount = 0;

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const n = grid[y + dy][x + dx];
          if (n !== current) diffCount++;
          if (n !== -1) {
            neighbors[n] = (neighbors[n] || 0) + 1;
          }
        }
      }

      // If at least 7 of 8 neighbors are different, replace with most common neighbor
      if (diffCount >= 7 && Object.keys(neighbors).length > 0) {
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
    fitMode = 'natural',
  } = options;

  let w = Math.max(10, Math.min(250, targetWidth));
  let h = Math.max(10, Math.min(250, targetHeight));

  // 1. Render and extract pixels using canvas
  let pixelData: Uint8ClampedArray;
  let thumbnailDataUrl: string | undefined;
  let finalWidthCm = widthCm;
  let finalHeightCm = heightCm;

  let dx = 0;
  let dy = 0;
  let drawW = w;
  let drawH = h;

  if (typeof document !== 'undefined') {
    const img = await loadImage(imageUri);
    const naturalW = (img as any).naturalWidth || img.width || 100;
    const naturalH = (img as any).naturalHeight || img.height || 100;
    const imgRatio = naturalH / naturalW;

    if (fitMode === 'natural') {
      // Natural mode: recalculate height strictly matching photo aspect ratio
      h = Math.max(10, Math.min(250, Math.round(w * imgRatio)));
      drawW = w;
      drawH = h;
      dx = 0;
      dy = 0;

      const stitchesPerCm = aidaCount / 2.54;
      finalWidthCm = parseFloat((w / stitchesPerCm).toFixed(1));
      finalHeightCm = parseFloat((h / stitchesPerCm).toFixed(1));
    } else if (fitMode === 'contain') {
      // Letterbox mode: keep selected frame w x h, center image, leave borders unstitched
      const targetRatio = h / w;
      if (imgRatio > targetRatio) {
        drawH = h;
        drawW = Math.max(1, Math.round(h / imgRatio));
        dx = Math.floor((w - drawW) / 2);
        dy = 0;
      } else {
        drawW = w;
        drawH = Math.max(1, Math.round(w * imgRatio));
        dy = Math.floor((h - drawH) / 2);
        dx = 0;
      }
    } else if (fitMode === 'cover') {
      // Crop mode: fill entire w x h without stretching
      drawW = w;
      drawH = h;
    }

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas 2D context not available');
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (fitMode === 'cover') {
      const targetRatio = h / w;
      let sW = naturalW;
      let sH = naturalH;
      let sx = 0;
      let sy = 0;
      if (imgRatio > targetRatio) {
        sW = naturalW;
        sH = Math.round(naturalW * targetRatio);
        sy = Math.floor((naturalH - sH) / 2);
      } else {
        sH = naturalH;
        sW = Math.round(naturalH / targetRatio);
        sx = Math.floor((naturalW - sW) / 2);
      }
      ctx.drawImage(img, sx, sy, sW, sH, 0, 0, w, h);
    } else if (fitMode === 'contain') {
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, dx, dy, drawW, drawH);
    } else {
      ctx.drawImage(img, 0, 0, w, h);
    }

    const imgData = ctx.getImageData(0, 0, w, h);
    pixelData = imgData.data;

    try {
      thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.6);
    } catch {
      // ignore
    }
  } else {
    throw new Error('Środowisko nie obsługuje Canvas (użyj wersji web lub backend)');
  }

  // 2. Preprocess pixels and convert to CIELAB space
  interface PixelInfo {
    r: number;
    g: number;
    b: number;
    l: number;
    a: number;
    b_val: number;
    isEmpty?: boolean;
  }

  const pixelGrid: PixelInfo[][] = [];
  const uniqueColorSamples: PixelInfo[] = [];
  const sampleMap = new Set<string>();

  for (let y = 0; y < h; y++) {
    const row: PixelInfo[] = [];
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const a = pixelData[idx + 3];

      // In contain mode, pixels outside the drawn box are marked empty unstitched
      const isOutsideContainBox = fitMode === 'contain' && (x < dx || x >= dx + drawW || y < dy || y >= dy + drawH);
      if (isOutsideContainBox || a === 0) {
        row.push({ r: 255, g: 255, b: 255, l: 100, a: 0, b_val: 0, isEmpty: true });
        continue;
      }

      let r = pixelData[idx];
      let g = pixelData[idx + 1];
      let b = pixelData[idx + 2];

      // Blend transparency over canvas color if semi-transparent
      if (a < 255) {
        const bgR = canvasColor === 'black' ? 0 : 255;
        const bgG = canvasColor === 'black' ? 0 : 255;
        const bgB = canvasColor === 'black' ? 0 : 255;
        const alpha = a / 255;
        r = r * alpha + bgR * (1 - alpha);
        g = g * alpha + bgG * (1 - alpha);
        b = b * alpha + bgB * (1 - alpha);
      }

      // Brightness & Contrast adjustment
      r = clamp(r * brightness, 0, 255);
      g = clamp(g * brightness, 0, 255);
      b = clamp(b * brightness, 0, 255);

      r = clamp((r - 128) * contrast + 128, 0, 255);
      g = clamp((g - 128) * contrast + 128, 0, 255);
      b = clamp((b - 128) * contrast + 128, 0, 255);

      const [L, A, B] = rgbToLab(r, g, b);
      const pixel: PixelInfo = { r, g, b, l: L, a: A, b_val: B };
      row.push(pixel);

      // Quantize key for sampling
      const colorKey = `${Math.round(r / 6)}_${Math.round(g / 6)}_${Math.round(b / 6)}`;
      if (!sampleMap.has(colorKey)) {
        sampleMap.add(colorKey);
        uniqueColorSamples.push(pixel);
      }
    }
    pixelGrid.push(row);
  }

  // 3. Perceptual CIELAB Palette Clustering (k-Means++)
  let finalThreads: ThreadDef[] = [];
  const targetK = maxColors > 0 ? Math.min(maxColors, 150) : 0;

  if (targetK > 0 && uniqueColorSamples.length > targetK) {
    // k-means++ in CIELAB space
    const centroids: PixelInfo[] = [];
    centroids.push(uniqueColorSamples[Math.floor(uniqueColorSamples.length / 2)]);

    while (centroids.length < targetK) {
      let maxDist = -1;
      let bestCand = uniqueColorSamples[0];
      const step = Math.max(1, Math.floor(uniqueColorSamples.length / 200));

      for (let i = 0; i < uniqueColorSamples.length; i += step) {
        const p = uniqueColorSamples[i];
        let minDist = Infinity;
        for (const c of centroids) {
          const dL = p.l - c.l;
          const dA = p.a - c.a;
          const dB = p.b_val - c.b_val;
          const dist = dL * dL + dA * dA + dB * dB;
          if (dist < minDist) minDist = dist;
        }
        if (minDist > maxDist) {
          maxDist = minDist;
          bestCand = p;
        }
      }
      centroids.push({ ...bestCand });
    }

    // 8 Iterations of k-means clustering
    for (let iter = 0; iter < 8; iter++) {
      const clusters: PixelInfo[][] = Array.from({ length: targetK }, () => []);
      for (const p of uniqueColorSamples) {
        let minDist = Infinity;
        let bestIdx = 0;
        for (let j = 0; j < targetK; j++) {
          const c = centroids[j];
          const dL = p.l - c.l;
          const dA = p.a - c.a;
          const dB = p.b_val - c.b_val;
          const dist = dL * dL + dA * dA + dB * dB;
          if (dist < minDist) {
            minDist = dist;
            bestIdx = j;
          }
        }
        clusters[bestIdx].push(p);
      }

      for (let j = 0; j < targetK; j++) {
        const cl = clusters[j];
        if (cl.length > 0) {
          let sumL = 0, sumA = 0, sumB = 0, sumR = 0, sumG = 0, sumB_rgb = 0;
          for (const item of cl) {
            sumL += item.l;
            sumA += item.a;
            sumB += item.b_val;
            sumR += item.r;
            sumG += item.g;
            sumB_rgb += item.b;
          }
          centroids[j] = {
            l: sumL / cl.length,
            a: sumA / cl.length,
            b_val: sumB / cl.length,
            r: Math.round(sumR / cl.length),
            g: Math.round(sumG / cl.length),
            b: Math.round(sumB_rgb / cl.length),
          };
        }
      }
    }

    // Map centroids to distinct threads
    const chosenCodes = new Set<string>();
    for (const c of centroids) {
      const th = findClosestThread(c.r, c.g, c.b, brand);
      if (!chosenCodes.has(th.code)) {
        chosenCodes.add(th.code);
        finalThreads.push(th);
      }
    }

    // If duplicates left us with fewer than targetK, fill with next best threads
    if (finalThreads.length < targetK) {
      const allBrandThreads = THREAD_CATALOG.filter((t) => t.brand === brand);
      for (const t of allBrandThreads) {
        if (!chosenCodes.has(t.code)) {
          chosenCodes.add(t.code);
          finalThreads.push(t);
          if (finalThreads.length >= targetK) break;
        }
      }
    }
  } else {
    // Unlimited mode or small palette
    const chosenCodes = new Set<string>();
    for (const p of uniqueColorSamples) {
      const th = findClosestThread(p.r, p.g, p.b, brand);
      if (!chosenCodes.has(th.code)) {
        chosenCodes.add(th.code);
        finalThreads.push(th);
        if (maxColors > 0 && finalThreads.length >= maxColors) break;
      }
    }
  }

  // Precompute CIELAB coordinates for final palette for fast distance checks
  const paletteLab = finalThreads.map((t) => {
    const [l, a, b_val] = rgbToLab(t.r, t.g, t.b);
    return { l: t.l ?? l, a: t.a ?? a, b: t.b_val ?? b_val };
  });

  // 4. Construct Numeric Grid (mapping every pixel to closest thread in CIELAB space)
  let numericGrid: number[][] = [];
  let totalStitches = 0;

  for (let y = 0; y < h; y++) {
    const row: number[] = [];
    for (let x = 0; x < w; x++) {
      const p = pixelGrid[y][x];

      if (p.isEmpty) {
        row.push(-1);
        continue;
      }

      let minDist = Infinity;
      let bestIdx = 0;

      for (let i = 0; i < finalThreads.length; i++) {
        const tLab = paletteLab[i];
        const dL = p.l - tLab.l;
        const dA = p.a - tLab.a;
        const dB = p.b_val - tLab.b;
        const dist = dL * dL + dA * dA + dB * dB;

        if (dist < minDist) {
          minDist = dist;
          bestIdx = i;
        }
      }
      row.push(bestIdx);
      totalStitches++;
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
      width_cm: finalWidthCm,
      height_cm: finalHeightCm,
      aida_count: aidaCount,
      canvas_color: canvasColor,
      margin_cm: marginCm,
      recommended_cut_width_cm: parseFloat((finalWidthCm + marginCm * 2).toFixed(1)),
      recommended_cut_height_cm: parseFloat((finalHeightCm + marginCm * 2).toFixed(1)),
    },
    materials_summary: {
      total_stitches: totalStitches,
      total_skeins: estimatedSkeins,
      estimated_cost_pln: estimatedSkeins * 4.8,
      fabric_cut_size: `${(finalWidthCm + marginCm * 2).toFixed(1)} × ${(finalHeightCm + marginCm * 2).toFixed(1)} cm`,
      fabric_type: `Aida ${aidaCount}ct`,
      canvas_color: canvasColor,
    },
    estimated_time: Math.round(totalStitches / 135) * 60, // ~135 stitches per hour
    thumbnail: thumbnailDataUrl,
    image_url: imageUri && !imageUri.startsWith('data:') ? imageUri : thumbnailDataUrl,
    progress: {
      completed_stitches: Array(h).fill(null).map(() => Array(w).fill(false)),
      current_color_index: 0,
      last_worked: new Date().toISOString(),
      stitches_per_session: 0,
    },
  };

  return pattern;
}
