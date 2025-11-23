#!/usr/bin/env python3
"""
Test script for image conversion endpoint
"""
import requests
import json
import sys

API_URL = "http://127.0.0.1:8000"

def test_conversion():
    # Sample image URL (public domain test image)
    test_image_url = "https://picsum.photos/400/300"
    
    payload = {
        "image_url": test_image_url,
        "pattern_type": "cross_stitch",
        "max_colors": 20,
        "aida_count": 14,
        "enable_dithering": False,
        "thread_brand": "DMC",
        "use_inventory": False
    }
    
    print("🧪 Testing image conversion endpoint...")
    print(f"📸 Image URL: {test_image_url}")
    print(f"⚙️  Settings: {payload['max_colors']} colors, Aida {payload['aida_count']}, {payload['thread_brand']}")
    print()
    
    try:
        response = requests.post(
            f"{API_URL}/api/v1/convert",
            json=payload,
            timeout=60
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Conversion successful!")
            print()
            print(f"📊 Pattern ID: {data['pattern_id']}")
            print(f"📏 Dimensions: {data['dimensions']['width_stitches']}x{data['dimensions']['height_stitches']} stitches")
            print(f"📐 Physical size: {data['dimensions']['width_cm']}x{data['dimensions']['height_cm']} cm")
            print(f"🎨 Colors: {len(data['color_palette'])} threads")
            print(f"⏱️  Estimated time: {data['estimated_time_minutes']} minutes")
            print()
            print("🧵 Color palette:")
            for color in data['color_palette'][:5]:  # Show first 5
                print(f"  {color['symbol']} - {color['thread_brand']} {color['thread_code']} ({color['thread_name']})")
            if len(data['color_palette']) > 5:
                print(f"  ... and {len(data['color_palette']) - 5} more")
            print()
            print(f"💾 Full response saved to: conversion_result.json")
            
            with open('conversion_result.json', 'w') as f:
                json.dump(data, f, indent=2)
            
            return True
        else:
            print(f"❌ Error {response.status_code}: {response.text}")
            return False
            
    except requests.Timeout:
        print("❌ Request timeout (>60s)")
        return False
    except requests.RequestException as e:
        print(f"❌ Request failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def test_health():
    """Quick health check"""
    try:
        response = requests.get(f"{API_URL}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Backend healthy: {data['threads']} threads loaded")
            return True
        else:
            print(f"❌ Backend unhealthy: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend not reachable: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("Mulina API - Conversion Test")
    print("=" * 60)
    print()
    
    # Health check first
    if not test_health():
        print()
        print("💡 Make sure backend is running:")
        print("   cd backend && source venv/bin/activate")
        print("   python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000")
        sys.exit(1)
    
    print()
    
    # Test conversion
    success = test_conversion()
    
    print()
    print("=" * 60)
    sys.exit(0 if success else 1)
