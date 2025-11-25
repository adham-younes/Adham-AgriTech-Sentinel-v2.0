import pytest
import asyncio
import aiohttp
import json
from datetime import datetime, timedelta

# Test configuration
BASE_URL = "http://localhost:3000/api"
TEST_COORDINATES = {"latitude": 30.0444, "longitude": 31.2357}

class TestAdhamAgritechAPI:
    """Test suite for Adham AgriTech API endpoints"""
    
    async def test_user_farm_field_creation(self):
        """Test Case A: Create user, farm, and field relationships"""
        
        async with aiohttp.ClientSession() as session:
            # Step 1: Create user
            user_data = {
                "email": f"test_{datetime.now().isoformat()}@example.com",
                "full_name": "Test User",
                "role": "farmer"
            }
            
            async with session.post(f"{BASE_URL}/auth/signup", json=user_data) as resp:
                assert resp.status == 200
                user_result = await resp.json()
                user_id = user_result.get("user", {}).get("id")
                assert user_id is not None
            
            # Step 2: Create farm
            farm_data = {
                "name": "Test Farm API",
                "latitude": TEST_COORDINATES["latitude"],
                "longitude": TEST_COORDINATES["longitude"],
                "total_area": 100.5
            }
            
            headers = {"Authorization": f"Bearer {user_result.get('token')}"}
            async with session.post(f"{BASE_URL}/farms", json=farm_data, headers=headers) as resp:
                assert resp.status == 200
                farm_result = await resp.json()
                farm_id = farm_result.get("id")
                assert farm_id is not None
            
            # Step 3: Create field
            field_data = {
                "name": "Test Field API",
                "farm_id": farm_id,
                "area": 50.0,
                "latitude": TEST_COORDINATES["latitude"],
                "longitude": TEST_COORDINATES["longitude"]
            }
            
            async with session.post(f"{BASE_URL}/fields", json=field_data, headers=headers) as resp:
                assert resp.status == 200
                field_result = await resp.json()
                field_id = field_result.get("id")
                assert field_id is not None
            
            # Verify relationships
            async with session.get(f"{BASE_URL}/fields/{field_id}", headers=headers) as resp:
                assert resp.status == 200
                field_detail = await resp.json()
                assert field_detail.get("farm_id") == farm_id
                
            print("✅ PASS: User-Farm-Field relationships working correctly")
            return True

    async def test_satellite_tile_api(self):
        """Test Case B: Fetch satellite tiles and verify latency"""
        
        async with aiohttp.ClientSession() as session:
            start_time = datetime.now()
            
            # Test satellite imagery endpoint
            params = {
                "lat": TEST_COORDINATES["latitude"],
                "lng": TEST_COORDINATES["longitude"],
                "z": 12,
                "x": 1405,
                "y": 1082
            }
            
            async with session.get(f"{BASE_URL}/sentinel/tiles/12/1405/1082", params=params) as resp:
                end_time = datetime.now()
                latency = (end_time - start_time).total_seconds()
                
                # Should respond quickly (< 3 seconds)
                assert latency < 3.0, f"API latency too high: {latency}s"
                
                # Should return valid response (either image data or error)
                assert resp.status in [200, 404, 400]
                
                if resp.status == 200:
                    content_type = resp.headers.get('content-type', '')
                    assert 'image' in content_type or 'json' in content_type
                
            print(f"✅ PASS: Satellite API latency: {latency:.2f}s")
            return True

    async def test_critical_soil_moisture_ui(self):
        """Test Case C: Critical soil moisture triggers UI changes"""
        
        async with aiohttp.ClientSession() as session:
            # Insert critical moisture reading
            critical_data = {
                "field_id": "test-field-id",
                "sensor_type": "moisture",
                "value": 15.5,  # Critical level
                "unit": "%",
                "timestamp": datetime.now().isoformat()
            }
            
            async with session.post(f"{BASE_URL}/sensors/ingest", json=critical_data) as resp:
                assert resp.status == 200
            
            # Fetch soil analysis to verify UI state
            async with session.get(f"{BASE_URL}/soil-analysis/dynamic?fieldId=test-field-id") as resp:
                assert resp.status == 200
                analysis = await resp.json()
                
                # Should indicate critical moisture
                moisture_status = analysis.get("metrics", {}).get("moisture", {}).get("status")
                assert moisture_status in ["critical", "dry"], f"Expected critical status, got {moisture_status}"
                
            print("✅ PASS: Critical soil moisture properly flagged")
            return True

    async def test_esoda_integration_fidelity(self):
        """Test ESODA API integration status"""
        
        async with aiohttp.ClientSession() as session:
            # Test EOSDA endpoint
            params = {
                "latitude": TEST_COORDINATES["latitude"],
                "longitude": TEST_COORDINATES["longitude"],
                "hours": 24
            }
            
            async with session.get(f"{BASE_URL}/eosda", params=params) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    
                    # Check if real data or simulation
                    is_simulation = data.get("simulation", True)
                    data_points = len(data.get("snapshots", []))
                    
                    if is_simulation:
                        print("⚠️  WARNING: Still using simulation data")
                        return False
                    else:
                        print(f"✅ PASS: Real EOSDA data ({data_points} points)")
                        return True
                else:
                    print("❌ FAIL: EOSDA endpoint not responding")
                    return False

async def run_all_tests():
    """Execute all test cases"""
    
    test_suite = TestAdhamAgritechAPI()
    results = {
        "user_farm_field": False,
        "satellite_api": False,
        "soil_moisture_ui": False,
        "esoda_integration": False
    }
    
    try:
        results["user_farm_field"] = await test_suite.test_user_farm_field_creation()
    except Exception as e:
        print(f"❌ FAIL: User/Farm/Field test: {e}")
    
    try:
        results["satellite_api"] = await test_suite.test_satellite_tile_api()
    except Exception as e:
        print(f"❌ FAIL: Satellite API test: {e}")
    
    try:
        results["soil_moisture_ui"] = await test_suite.test_critical_soil_moisture_ui()
    except Exception as e:
        print(f"❌ FAIL: Soil moisture UI test: {e}")
    
    try:
        results["esoda_integration"] = await test_suite.test_esoda_integration_fidelity()
    except Exception as e:
        print(f"❌ FAIL: EOSDA integration test: {e}")
    
    # Summary
    passed = sum(results.values())
    total = len(results)
    
    print(f"\n📊 Test Results: {passed}/{total} passed")
    print("=" * 50)
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_name}: {status}")
    
    return passed == total

if __name__ == "__main__":
    asyncio.run(run_all_tests())
