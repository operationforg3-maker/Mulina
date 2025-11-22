"""
Unit tests for color matching engine
"""
import pytest
from backend.color_engine.delta_e import (
    rgb_to_lab, 
    delta_e, 
    find_closest_thread,
    Thread
)

def test_rgb_to_lab_white():
    """Test conversion of pure white"""
    rgb = (255, 255, 255)
    lab = rgb_to_lab(rgb)
    
    # White should have L* = 100, a* ≈ 0, b* ≈ 0
    assert lab[0] == pytest.approx(100.0, abs=1.0)
    assert lab[1] == pytest.approx(0.0, abs=1.0)
    assert lab[2] == pytest.approx(0.0, abs=1.0)

def test_rgb_to_lab_black():
    """Test conversion of pure black"""
    rgb = (0, 0, 0)
    lab = rgb_to_lab(rgb)
    
    # Black should have L* = 0
    assert lab[0] == pytest.approx(0.0, abs=1.0)

def test_delta_e_identical_colors():
    """Delta E between identical colors should be 0"""
    lab1 = (50.0, 25.0, -10.0)
    lab2 = (50.0, 25.0, -10.0)
    
    de = delta_e(lab1, lab2)
    assert de == pytest.approx(0.0)

def test_delta_e_perceptual_difference():
    """Test known Delta E values"""
    # Slightly different colors
    lab1 = (50.0, 0.0, 0.0)
    lab2 = (51.0, 0.0, 0.0)
    
    de = delta_e(lab1, lab2)
    assert de == pytest.approx(1.0)

def test_find_closest_thread():
    """Test finding closest thread match"""
    # Sample thread database
    threads = [
        Thread("dmc_310", "DMC", "310", "Black", (0, 0, 0), (0.0, 0.0, 0.0)),
        Thread("dmc_blanc", "DMC", "BLANC", "White", (255, 255, 255), (100.0, 0.0, 0.0)),
        Thread("dmc_321", "DMC", "321", "Red", (199, 44, 72), rgb_to_lab((199, 44, 72))),
    ]
    
    # Find closest to dark red
    target_rgb = (180, 35, 50)
    result = find_closest_thread(target_rgb, threads)
    
    assert result["thread"].color_code == "321"
    assert result["delta_e"] < 10.0  # Should be reasonably close

def test_find_closest_thread_with_inventory():
    """Test inventory prioritization"""
    threads = [
        Thread("dmc_310", "DMC", "310", "Black", (0, 0, 0), (0.0, 0.0, 0.0)),
        Thread("dmc_blanc", "DMC", "BLANC", "White", (255, 255, 255), (100.0, 0.0, 0.0)),
    ]
    
    # Gray color - equidistant from black and white
    # But with inventory, should prefer white (20% bonus)
    target_rgb = (128, 128, 128)
    user_inventory = {"dmc_blanc"}
    
    result = find_closest_thread(target_rgb, threads, user_inventory=user_inventory)
    
    assert result["from_inventory"] == True

def test_find_closest_thread_brand_filter():
    """Test brand filtering"""
    threads = [
        Thread("dmc_310", "DMC", "310", "Black", (0, 0, 0), (0.0, 0.0, 0.0)),
        Thread("anchor_403", "Anchor", "403", "Black", (0, 0, 0), (0.0, 0.0, 0.0)),
    ]
    
    target_rgb = (10, 10, 10)
    result = find_closest_thread(target_rgb, threads, brand_filter="Anchor")
    
    assert result["thread"].brand == "Anchor"
    assert result["thread"].color_code == "403"

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
