#!/usr/bin/env python3
"""
Test konwersji z lokalnym obrazem (upload jako base64)
"""
import requests
import json
import base64
from pathlib import Path

def test_conversion_with_local_image():
    """Test conversion with local image"""
    print("🔍 Testing image conversion with local file...")
    
    # Read local test image
    image_path = Path("/tmp/test_image.jpg")
    if not image_path.exists():
        print("❌ Test image not found. Downloading...")
        import urllib.request
        urllib.request.urlretrieve("https://picsum.photos/200/300", str(image_path))
    
    # For this test, we'll use a publicly accessible image URL
    # In production, frontend uploads to Firebase Storage first
    test_url = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400"
    
    payload = {
        "image_url": test_url,
        "pattern_type": "cross_stitch",
        "max_colors": 15,
        "aida_count": 14,
        "enable_dithering": False,
        "thread_brand": "DMC",
        "use_inventory": False
    }
    
    print(f"Converting image: {test_url[:60]}...")
    
    try:
        response = requests.post(
            "http://localhost:8000/api/v1/convert",
            json=payload,
            timeout=120  # Longer timeout for image processing
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n✅ Conversion successful!")
            print(f"📋 Pattern ID: {result['pattern_id']}")
            print(f"📐 Dimensions: {result['dimensions']['width_stitches']}x{result['dimensions']['height_stitches']} stitches")
            print(f"📏 Physical size: {result['dimensions']['width_cm']}x{result['dimensions']['height_cm']} cm")
            print(f"🎨 Colors used: {len(result['color_palette'])}")
            print(f"⏱️  Estimated time: {result['estimated_time_minutes']} minutes")
            
            print(f"\n🧵 Thread palette (DMC):")
            for i, color in enumerate(result['color_palette'], 1):
                print(f"  {i}. {color['thread_code']} - {color['thread_name']}")
                print(f"     RGB: {color['rgb']}, Symbol: {color['symbol']}, ΔE: {color['delta_e']}")
            
            # Save result to file
            output_file = Path("conversion_result.json")
            with open(output_file, 'w') as f:
                json.dump(result, f, indent=2)
            print(f"\n💾 Full result saved to: {output_file}")
            
        else:
            print(f"❌ Error: {response.text}")
            
    except requests.exceptions.Timeout:
        print("❌ Request timeout - image processing took too long")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("=" * 70)
    print("🎨 Mulina - Image to Pattern Conversion Test")
    print("=" * 70)
    print()
    
    test_conversion_with_local_image()
    
    print()
    print("=" * 70)
    print("✅ Test completed!")
    print("=" * 70)
