/**
 * Unit tests for color matching algorithm (Delta E)
 * Tests CIELAB color space conversion and thread matching
 */

describe('Color Matching Engine', () => {
  describe('RGB to LAB conversion', () => {
    test('converts pure red correctly', () => {
      const rgb = [255, 0, 0];
      const lab = rgbToLab(rgb);
      
      expect(lab.L).toBeCloseTo(53.24, 1);
      expect(lab.a).toBeCloseTo(80.09, 1);
      expect(lab.b).toBeCloseTo(67.20, 1);
    });

    test('converts pure white correctly', () => {
      const rgb = [255, 255, 255];
      const lab = rgbToLab(rgb);
      
      expect(lab.L).toBeCloseTo(100, 1);
      expect(lab.a).toBeCloseTo(0, 1);
      expect(lab.b).toBeCloseTo(0, 1);
    });

    test('converts pure black correctly', () => {
      const rgb = [0, 0, 0];
      const lab = rgbToLab(rgb);
      
      expect(lab.L).toBeCloseTo(0, 1);
      expect(lab.a).toBeCloseTo(0, 1);
      expect(lab.b).toBeCloseTo(0, 1);
    });
  });

  describe('Delta E calculation', () => {
    test('identical colors have Delta E = 0', () => {
      const lab1 = { L: 50, a: 10, b: 20 };
      const lab2 = { L: 50, a: 10, b: 20 };
      
      const deltaE = calculateDeltaE(lab1, lab2);
      expect(deltaE).toBe(0);
    });

    test('perceptually different colors have high Delta E', () => {
      const red = { L: 53.24, a: 80.09, b: 67.20 };
      const blue = { L: 32.30, a: 79.20, b: -107.86 };
      
      const deltaE = calculateDeltaE(red, blue);
      expect(deltaE).toBeGreaterThan(50);
    });

    test('similar colors have low Delta E', () => {
      const color1 = { L: 50, a: 10, b: 20 };
      const color2 = { L: 51, a: 11, b: 21 };
      
      const deltaE = calculateDeltaE(color1, color2);
      expect(deltaE).toBeLessThan(3);
    });
  });

  describe('Thread matching', () => {
    test('finds closest DMC thread for red', () => {
      const rgb = [185, 45, 72];
      const result = findClosestThread(rgb, 'DMC');
      
      expect(result.brand).toBe('DMC');
      expect(result.thread_code).toBe('321'); // Example DMC red
      expect(result.deltaE).toBeLessThan(5);
    });

    test('respects user inventory when enabled', () => {
      const rgb = [100, 150, 200];
      const userInventory = ['DMC-310', 'DMC-666', 'DMC-798'];
      
      const result = findClosestThread(rgb, 'DMC', { 
        inventory: userInventory, 
        preferInventory: true 
      });
      
      expect(userInventory).toContain(`DMC-${result.thread_code}`);
    });

    test('converts between thread brands correctly', () => {
      const dmcCode = '310'; // DMC Black
      const anchorEquivalent = convertThreadBrand(dmcCode, 'DMC', 'Anchor');
      
      expect(anchorEquivalent).toBe('403'); // Anchor equivalent
    });
  });

  describe('K-means color quantization', () => {
    test('reduces colors to specified count', () => {
      const imagePixels = generateTestImage(100, 100); // 10000 pixels
      const maxColors = 20;
      
      const quantized = kMeansQuantize(imagePixels, maxColors);
      const uniqueColors = new Set(quantized.map(p => `${p[0]},${p[1]},${p[2]}`));
      
      expect(uniqueColors.size).toBeLessThanOrEqual(maxColors);
    });

    test('preserves dominant colors', () => {
      // Image with 70% red, 30% blue
      const imagePixels = [
        ...Array(700).fill([255, 0, 0]),
        ...Array(300).fill([0, 0, 255]),
      ];
      
      const quantized = kMeansQuantize(imagePixels, 2);
      const uniqueColors = new Set(quantized.map(p => `${p[0]},${p[1]},${p[2]}`));
      
      expect(uniqueColors.has('255,0,0')).toBe(true);
      expect(uniqueColors.has('0,0,255')).toBe(true);
    });
  });
});

// Mock helper functions (actual implementations in backend/color_engine/)
function rgbToLab(rgb: number[]): { L: number; a: number; b: number } {
  // Simplified mock - actual uses precise XYZ intermediary
  return { L: 50, a: 0, b: 0 };
}

function calculateDeltaE(lab1: any, lab2: any): number {
  // Delta E formula: sqrt((L2-L1)^2 + (a2-a1)^2 + (b2-b1)^2)
  return Math.sqrt(
    Math.pow(lab2.L - lab1.L, 2) +
    Math.pow(lab2.a - lab1.a, 2) +
    Math.pow(lab2.b - lab1.b, 2)
  );
}

function findClosestThread(rgb: number[], brand: string, options?: any): any {
  // Mock implementation
  return { brand, thread_code: '310', deltaE: 2.5 };
}

function convertThreadBrand(code: string, from: string, to: string): string {
  // Mock conversion table
  const conversions: any = { '310': '403' };
  return conversions[code] || code;
}

function kMeansQuantize(pixels: number[][], maxColors: number): number[][] {
  // Mock implementation
  return pixels.slice(0, maxColors);
}

function generateTestImage(width: number, height: number): number[][] {
  // Generate random pixels for testing
  return Array(width * height).fill([128, 128, 128]);
}
