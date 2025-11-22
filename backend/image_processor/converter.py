"""
Image Processing Pipeline
Konwersja obrazów na wzory hafciarskie
"""
import cv2
import numpy as np
from PIL import Image
from typing import Tuple, List, Optional
from sklearn.cluster import KMeans

class ImageProcessor:
    """Główny procesor obrazów"""
    
    def __init__(self, image_path: str):
        self.image = cv2.imread(image_path)
        if self.image is None:
            raise ValueError(f"Cannot load image: {image_path}")
        self.image_rgb = cv2.cvtColor(self.image, cv2.COLOR_BGR2RGB)
    
    def preprocess(self, 
                   target_width: Optional[int] = None,
                   enhance_contrast: bool = False) -> np.ndarray:
        """
        Pre-processing obrazu przed konwersją
        """
        img = self.image_rgb.copy()
        
        # Resize jeśli określono szerokość
        if target_width:
            height = int(img.shape[0] * target_width / img.shape[1])
            img = cv2.resize(img, (target_width, height), 
                           interpolation=cv2.INTER_AREA)
        
        # Poprawa kontrastu (CLAHE)
        if enhance_contrast:
            lab = cv2.cvtColor(img, cv2.COLOR_RGB2LAB)
            l, a, b = cv2.split(lab)
            clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
            l = clahe.apply(l)
            img = cv2.merge([l, a, b])
            img = cv2.cvtColor(img, cv2.COLOR_LAB2RGB)
        
        return img
    
    def pixelize_for_cross_stitch(self,
                                   aida_count: int = 14,
                                   target_width_cm: float = 20.0) -> np.ndarray:
        """
        Pikselizacja dla haftu krzyżykowego
        
        Args:
            aida_count: Gęstość kanwy (14, 16, 18, 20 ściegów/cal)
            target_width_cm: Docelowa szerokość wzoru w centymetrach
        
        Returns:
            Spikselizowany obraz
        """
        # Przeliczenie wymiarów
        # 1 cal = 2.54 cm
        stitches_per_cm = aida_count / 2.54
        target_stitches = int(target_width_cm * stitches_per_cm)
        
        img = self.preprocess(target_width=target_stitches)
        
        # Pixelate effect (każdy piksel = 1 ścieg)
        height, width = img.shape[:2]
        return img
    
    def reduce_colors(self, 
                      img: np.ndarray,
                      max_colors: int = 50,
                      enable_dithering: bool = False) -> Tuple[np.ndarray, List]:
        """
        Redukcja liczby kolorów przy użyciu K-means clustering
        
        Returns:
            (reduced_image, color_palette)
        """
        # Reshape do listy pikseli
        pixels = img.reshape(-1, 3)
        
        # K-means clustering
        kmeans = KMeans(n_clusters=max_colors, 
                       random_state=42,
                       n_init=10)
        kmeans.fit(pixels)
        
        # Paleta kolorów (centroids)
        palette = kmeans.cluster_centers_.astype(np.uint8)
        
        # Przypisanie każdego piksela do najbliższego koloru
        labels = kmeans.labels_
        reduced_pixels = palette[labels]
        reduced_img = reduced_pixels.reshape(img.shape)
        
        # Opcjonalny dithering (Floyd-Steinberg)
        if enable_dithering:
            reduced_img = self._apply_floyd_steinberg(img, palette)
        
        return reduced_img, palette.tolist()
    
    def _apply_floyd_steinberg(self, 
                               img: np.ndarray, 
                               palette: np.ndarray) -> np.ndarray:
        """
        Floyd-Steinberg dithering dla lepszych przejść tonalnych
        """
        result = img.copy().astype(np.float32)
        height, width = img.shape[:2]
        
        for y in range(height):
            for x in range(width):
                old_pixel = result[y, x]
                
                # Znajdź najbliższy kolor z palety
                distances = np.sum((palette - old_pixel)**2, axis=1)
                new_pixel = palette[np.argmin(distances)]
                result[y, x] = new_pixel
                
                # Oblicz błąd kwantyzacji
                quant_error = old_pixel - new_pixel
                
                # Rozproś błąd na sąsiednie piksele
                if x + 1 < width:
                    result[y, x + 1] += quant_error * 7/16
                if y + 1 < height:
                    if x > 0:
                        result[y + 1, x - 1] += quant_error * 3/16
                    result[y + 1, x] += quant_error * 5/16
                    if x + 1 < width:
                        result[y + 1, x + 1] += quant_error * 1/16
        
        return np.clip(result, 0, 255).astype(np.uint8)
    
    def detect_edges_for_outline(self, 
                                  low_threshold: int = 50,
                                  high_threshold: int = 150) -> np.ndarray:
        """
        Wykrywanie krawędzi dla haftu konturowego (Canny edge detection)
        """
        gray = cv2.cvtColor(self.image_rgb, cv2.COLOR_RGB2GRAY)
        
        # Gaussian blur dla redukcji szumu
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Canny edge detection
        edges = cv2.Canny(blurred, low_threshold, high_threshold)
        
        return edges
    
    def generate_cross_stitch_pattern(self,
                                      aida_count: int = 14,
                                      max_colors: int = 50,
                                      target_width_cm: float = 20.0,
                                      enable_dithering: bool = False) -> dict:
        """
        Kompletny pipeline generowania wzoru krzyżykowego
        
        Returns:
            Dict z grid_data, palette, dimensions
        """
        # 1. Pixelizacja
        pixelized = self.pixelize_for_cross_stitch(aida_count, target_width_cm)
        
        # 2. Redukcja kolorów
        reduced, palette = self.reduce_colors(pixelized, max_colors, enable_dithering)
        
        # 3. Konwersja do grid data (macierz indeksów kolorów)
        height, width = reduced.shape[:2]
        grid = np.zeros((height, width), dtype=np.uint8)
        
        for idx, color in enumerate(palette):
            mask = np.all(reduced == color, axis=2)
            grid[mask] = idx
        
        return {
            "grid": grid.tolist(),
            "palette": palette,
            "dimensions": {
                "width_stitches": width,
                "height_stitches": height,
                "width_cm": target_width_cm,
                "height_cm": target_width_cm * height / width
            }
        }

# Przykładowe użycie
if __name__ == "__main__":
    # Test processing
    # processor = ImageProcessor("test_image.jpg")
    # pattern = processor.generate_cross_stitch_pattern(
    #     aida_count=14,
    #     max_colors=30,
    #     target_width_cm=20
    # )
    # print(f"Generated pattern: {pattern['dimensions']}")
    print("Image processor module loaded")
