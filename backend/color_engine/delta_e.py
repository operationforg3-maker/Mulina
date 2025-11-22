"""
Color Matching Engine
Wykorzystuje przestrzeń barw CIELAB (Delta E) do precyzyjnego dopasowania kolorów nici
"""
import math
from typing import Tuple, Dict, List, Optional
from dataclasses import dataclass

@dataclass
class Thread:
    """Reprezentacja nici hafciarskiej"""
    thread_id: str
    brand: str  # DMC, Anchor, Ariadna, Madeira
    color_code: str
    color_name: str
    rgb: Tuple[int, int, int]
    lab: Tuple[float, float, float]  # L*, a*, b*
    
def rgb_to_lab(rgb: Tuple[int, int, int]) -> Tuple[float, float, float]:
    """
    Konwersja RGB (0-255) do CIELAB
    Standard illuminant D65, observer 2°
    """
    # Normalizacja RGB do 0-1
    r, g, b = [x / 255.0 for x in rgb]
    
    # Gamma correction
    def gamma_correct(c):
        if c > 0.04045:
            return ((c + 0.055) / 1.055) ** 2.4
        else:
            return c / 12.92
    
    r = gamma_correct(r)
    g = gamma_correct(g)
    b = gamma_correct(b)
    
    # RGB to XYZ (sRGB with D65)
    x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375
    y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750
    z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041
    
    # XYZ to LAB
    # Reference white D65
    xn, yn, zn = 0.95047, 1.00000, 1.08883
    
    def f(t):
        delta = 6/29
        if t > delta**3:
            return t**(1/3)
        else:
            return t/(3 * delta**2) + 4/29
    
    fx = f(x / xn)
    fy = f(y / yn)
    fz = f(z / zn)
    
    L = 116 * fy - 16
    a = 500 * (fx - fy)
    b_val = 200 * (fy - fz)
    
    return (L, a, b_val)

def delta_e(lab1: Tuple[float, float, float], 
            lab2: Tuple[float, float, float]) -> float:
    """
    Oblicza Delta E (CIE76) - percepcyjną różnicę kolorów
    Wartość < 1.0 = różnica niewidoczna dla oka
    Wartość < 2.0 = różnica zauważalna tylko przy porównaniu
    Wartość < 5.0 = akceptowalna w większości zastosowań
    """
    L1, a1, b1 = lab1
    L2, a2, b2 = lab2
    
    return math.sqrt((L2 - L1)**2 + (a2 - a1)**2 + (b2 - b1)**2)

def find_closest_thread(
    target_rgb: Tuple[int, int, int],
    thread_database: List[Thread],
    brand_filter: Optional[str] = None,
    user_inventory: Optional[set] = None
) -> Dict:
    """
    Znajduje najbliższą nić dla danego koloru
    
    Args:
        target_rgb: Kolor docelowy (R, G, B)
        thread_database: Lista dostępnych nici
        brand_filter: Opcjonalny filtr marki ("DMC", "Anchor", etc.)
        user_inventory: Set thread_id które użytkownik posiada (priorytetyzacja)
    
    Returns:
        Dict z najlepszym dopasowaniem i metrykami
    """
    target_lab = rgb_to_lab(target_rgb)
    
    # Filtrowanie po marce
    candidates = thread_database
    if brand_filter:
        candidates = [t for t in candidates if t.brand == brand_filter]
    
    best_match = None
    best_delta = float('inf')
    
    for thread in candidates:
        de = delta_e(target_lab, thread.lab)
        
        # Bonus dla nici z inwentarza użytkownika (20% redukcja Delta E)
        if user_inventory and thread.thread_id in user_inventory:
            de *= 0.8
        
        if de < best_delta:
            best_delta = de
            best_match = thread
    
    if not best_match:
        raise ValueError("No matching thread found")
    
    return {
        "thread": best_match,
        "delta_e": best_delta,
        "quality": "excellent" if best_delta < 2.0 else 
                   "good" if best_delta < 5.0 else "acceptable",
        "from_inventory": best_match.thread_id in (user_inventory or set())
    }

def convert_brand(
    thread_code: str,
    from_brand: str,
    to_brand: str,
    thread_database: List[Thread]
) -> Optional[Thread]:
    """
    Konwertuje kod nici między markami (np. DMC → Anchor)
    Wykorzystuje dopasowanie kolorów przez Delta E
    """
    # Znajdź oryginalną nić
    source_thread = next(
        (t for t in thread_database 
         if t.brand == from_brand and t.color_code == thread_code),
        None
    )
    
    if not source_thread:
        return None
    
    # Znajdź najbliższy odpowiednik w docelowej marce
    result = find_closest_thread(
        source_thread.rgb,
        thread_database,
        brand_filter=to_brand
    )
    
    return result["thread"]

# Przykładowe użycie
if __name__ == "__main__":
    # Test konwersji RGB → LAB
    test_rgb = (185, 45, 72)
    lab = rgb_to_lab(test_rgb)
    print(f"RGB {test_rgb} → LAB {lab}")
    
    # Test Delta E
    lab1 = (50.0, 20.0, 10.0)
    lab2 = (51.0, 21.0, 11.0)
    de = delta_e(lab1, lab2)
    print(f"Delta E between {lab1} and {lab2}: {de:.2f}")
