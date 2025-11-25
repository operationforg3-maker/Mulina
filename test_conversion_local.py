#!/usr/bin/env python3
"""
Test lokalnej konwersji obrazu przez API
"""
import requests
import json

# Test image URL (przykładowy obraz)
TEST_IMAGE_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/280px-PNG_transparency_demonstration_1.png"

def test_health():
    """Test health endpoint"""
    print("🔍 Testing health endpoint...")
    response = requests.get("http://localhost:8000/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_threads():
    """Test threads endpoint"""
    print("🔍 Testing threads endpoint...")
    response = requests.get("http://localhost:8000/api/v1/threads?brand=DMC")
    print(f"Status: {response.status_code}")
    threads = response.json()
    print(f"Threads loaded: {len(threads)}")
    print(f"Sample thread: {threads[0] if threads else 'None'}")
    print()

def test_conversion():
    """Test image conversion"""
    print("🔍 Testing image conversion...")
    
    payload = {
        "image_url": TEST_IMAGE_URL,
        "pattern_type": "cross_stitch",
        "max_colors": 10,
        "aida_count": 14,
        "enable_dithering": False,
        "thread_brand": "DMC",
        "use_inventory": False
    }
    
    print(f"Request payload: {json.dumps(payload, indent=2)}")
    
    response = requests.post(
        "http://localhost:8000/api/v1/convert",
        json=payload,
        timeout=60
    )
    
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Conversion successful!")
        print(f"Pattern ID: {result['pattern_id']}")
        print(f"Dimensions: {result['dimensions']}")
        print(f"Colors: {len(result['color_palette'])}")
        print(f"Estimated time: {result['estimated_time_minutes']} min")
        print(f"\nColor palette:")
        for color in result['color_palette'][:5]:  # Show first 5 colors
            print(f"  - {color['thread_brand']} {color['thread_code']}: {color['thread_name']} (ΔE: {color['delta_e']})")
    else:
        print(f"❌ Error: {response.text}")
    print()

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 Mulina API Test Suite")
    print("=" * 60)
    print()
    
    try:
        test_health()
        test_threads()
        test_conversion()
        
        print("=" * 60)
        print("✅ All tests completed!")
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
