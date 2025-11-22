#!/usr/bin/env python3
"""
Test skrypt dla API
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_endpoints():
    print("🧪 Testowanie SmartStitch API...\n")
    
    # Test 1: Root endpoint
    print("1. Test root endpoint (GET /)...")
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {json.dumps(response.json(), indent=2)}")
        print("   ✅ OK\n")
    except Exception as e:
        print(f"   ❌ Error: {e}\n")
    
    # Test 2: Health check
    print("2. Test health check (GET /health)...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {json.dumps(response.json(), indent=2)}")
        print("   ✅ OK\n")
    except Exception as e:
        print(f"   ❌ Error: {e}\n")
    
    # Test 3: Threads endpoint
    print("3. Test threads endpoint (GET /api/v1/threads)...")
    try:
        response = requests.get(f"{BASE_URL}/api/v1/threads")
        print(f"   Status: {response.status_code}")
        data = response.json()
        print(f"   Returned {len(data)} threads")
        if len(data) > 0:
            print(f"   Sample: {json.dumps(data[0], indent=2)}")
        print("   ✅ OK\n")
    except Exception as e:
        print(f"   ❌ Error: {e}\n")
    
    # Test 4: OpenAPI docs
    print("4. Check OpenAPI docs (GET /docs)...")
    try:
        response = requests.get(f"{BASE_URL}/docs")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ Swagger UI available at http://127.0.0.1:8000/docs\n")
    except Exception as e:
        print(f"   ❌ Error: {e}\n")

if __name__ == "__main__":
    test_endpoints()
