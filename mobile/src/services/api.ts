/**
 * Firebase service for mobile app
 */
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

export interface ConversionRequest {
  imageUrl: string;
  patternType: 'cross_stitch' | 'outline';
  maxColors: number;
  aidaCount: 14 | 16 | 18 | 20;
  enableDithering: boolean;
  threadBrand: 'DMC' | 'Anchor' | 'Ariadna' | 'Madeira';
  useInventory: boolean;
}

export interface Pattern {
  patternId: string;
  status: string;
  gridData?: any;
  colorPalette: any[];
  dimensions: {
    widthStitches: number;
    heightStitches: number;
    widthCm: number;
    heightCm: number;
  };
  estimatedTimeMinutes: number;
}

export interface Thread {
  threadId: string;
  brand: string;
  colorCode: string;
  colorName: string;
  rgb: [number, number, number];
  hexColor: string;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_URL;
  }

  /**
   * Convert image to embroidery pattern
   */
  async convertImage(request: ConversionRequest): Promise<Pattern> {
    const response = await axios.post<Pattern>(
      `${this.baseUrl}/api/v1/convert`,
      request
    );
    return response.data;
  }

  /**
   * Get available threads
   */
  async getThreads(brand?: string): Promise<Thread[]> {
    const response = await axios.get<Thread[]>(
      `${this.baseUrl}/api/v1/threads`,
      { params: { brand } }
    );
    return response.data;
  }

  /**
   * Get pattern by ID
   */
  async getPattern(patternId: string): Promise<Pattern> {
    const response = await axios.get<Pattern>(
      `${this.baseUrl}/api/v1/patterns/${patternId}`
    );
    return response.data;
  }

  /**
   * Export pattern to PDF
   */
  async exportPdf(patternId: string): Promise<Blob> {
    const response = await axios.post(
      `${this.baseUrl}/api/v1/patterns/${patternId}/export-pdf`,
      {},
      { responseType: 'blob' }
    );
    return response.data;
  }

  /**
   * Get user's thread inventory
   */
  async getUserInventory(): Promise<string[]> {
    const response = await axios.get<{ threads: string[] }>(
      `${this.baseUrl}/api/v1/user/inventory`
    );
    return response.data.threads;
  }
}

const apiService = new ApiService();
export default apiService;

// Export axios instance for direct usage
export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});
