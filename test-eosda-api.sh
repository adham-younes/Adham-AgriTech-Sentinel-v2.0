#!/bin/bash
# EOSDA API Comprehensive Test Script
# Tests all EOSDA services with the provided API key

set -e

API_KEY="apk.cefa9921669b0857be282894813d1213ed88c5e8299e29a5e91db105464aa232"
BASE_URL="https://api-connect.eos.com"
TEST_BBOX="32.5,25.2,32.6,25.3"  # Cairo, Egypt area

echo "🔍 EOSDA API Comprehensive Testing"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

test_result() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}: $2"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ FAIL${NC}: $2"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

echo "📋 Test 1: API Key Validation"
echo "------------------------------"
response=$(curl -s -w "\n%{http_code}" \
    -H "X-Api-Key: $API_KEY" \
    "$BASE_URL/api/search" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [32.55, 25.25]
            }
        }]
    }')

http_code=$(echo "$response" | tail -n1)
if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
    test_result 0 "API Key is valid"
else
    test_result 1 "API Key validation failed (HTTP $http_code)"
fi
echo ""

echo "📋 Test 2: Scene Search API"
echo "----------------------------"
IFS=',' read -r west south east north <<< "$TEST_BBOX"

search_response=$(curl -s -w "\n%{http_code}" \
    -H "X-Api-Key: $API_KEY" \
    "$BASE_URL/api/search" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "{
        \"type\": \"FeatureCollection\",
        \"features\": [{
            \"type\": \"Feature\",
            \"geometry\": {
                \"type\": \"Polygon\",
                \"coordinates\": [[
                    [$west, $north],
                    [$east, $north],
                    [$east, $south],
                    [$west, $south],
                    [$west, $north]
                ]]
            }
        }],
        \"filters\": {
            \"cloudCoverage\": {
                \"lte\": 30
            }
        },
        \"limit\": 5
    }")

http_code=$(echo "$search_response" | tail -n1)
search_body=$(echo "$search_response" | head -n -1)

if [ "$http_code" = "200" ]; then
    scene_count=$(echo "$search_body" | jq -r '.results | length' 2>/dev/null || echo "0")
    if [ "$scene_count" -gt 0 ]; then
        test_result 0 "Scene Search successful ($scene_count scenes found)"
        
        # Extract first scene for further testing
        SCENE_ID=$(echo "$search_body" | jq -r '.results[0].id' 2>/dev/null || echo "")
        echo "   → First scene ID: $SCENE_ID"
    else
        test_result 1 "Scene Search returned no results"
    fi
else
    test_result 1 "Scene Search API failed (HTTP $http_code)"
fi
echo ""

if [ -n "$SCENE_ID" ] && [ "$SCENE_ID" != "null" ]; then
    echo "📋 Test 3: Render API - NDVI Tile"
    echo "----------------------------------"
    
    # Test render API for NDVI
    tile_response=$(curl -s -w "\n%{http_code}" \
        -H "X-Api-Key: $API_KEY" \
        "$BASE_URL/api/render/$SCENE_ID/NDVI/10/550/350?COLORMAP=a9bc6eceeef2a13bb88a7f641dca3aa0&MIN_MAX=-1,1" \
        -o /tmp/test_tile.png)
    
    http_code=$(echo "$tile_response" | tail -n1)
    
    if [ "$http_code" = "200" ]; then
        # Check if file is actually an image
        if file /tmp/test_tile.png | grep -q "PNG image"; then
            file_size=$(stat -f%z /tmp/test_tile.png 2>/dev/null || stat -c%s /tmp/test_tile.png 2>/dev/null)
            test_result 0 "NDVI Tile rendered successfully (${file_size} bytes)"
            echo "   → Saved to: /tmp/test_tile.png"
        else
            test_result 1 "NDVI Tile is not a valid PNG image"
        fi
    else
        test_result 1 "NDVI Tile rendering failed (HTTP $http_code)"
    fi
    echo ""
    
    echo "📋 Test 4: Render API - True Color Tile"
    echo "---------------------------------------"
    
    # Test true color tile
    rgb_response=$(curl -s -w "\n%{http_code}" \
        -H "X-Api-Key: $API_KEY" \
        "$BASE_URL/api/render/$SCENE_ID/B04,B03,B02/10/550/350" \
        -o /tmp/test_tile_rgb.png)
    
    http_code=$(echo "$rgb_response" | tail -n1)
    
    if [ "$http_code" = "200" ]; then
        if file /tmp/test_tile_rgb.png | grep -q "PNG image"; then
            file_size=$(stat -f%z /tmp/test_tile_rgb.png 2>/dev/null || stat -c%s /tmp/test_tile_rgb.png 2>/dev/null)
            test_result 0 "True Color Tile rendered successfully (${file_size} bytes)"
            echo "   → Saved to: /tmp/test_tile_rgb.png"
        else
            test_result 1 "True Color Tile is not a valid PNG image"
        fi
    else
        test_result 1 "True Color Tile rendering failed (HTTP $http_code)"
    fi
    echo ""
else
    echo -e "${YELLOW}⚠️  Skipping Render API tests - no scene ID available${NC}"
    echo ""
fi

echo "📋 Test 5: Rate Limiting Check"
echo "-------------------------------"
# Test multiple requests to check rate limiting
for i in {1..3}; do
    ping_response=$(curl -s -w "%{http_code}" -o /dev/null \
        -H "X-Api-Key: $API_KEY" \
        "$BASE_URL/api/search" \
        -X POST \
        -H "Content-Type: application/json" \
        -d '{"type": "FeatureCollection", "features": []}')
    
    if [ "$ping_response" != "429" ]; then
        test_result 0 "Request $i within rate limits"
    else
        test_result 1 "Request $i hit rate limit (429)"
        break
    fi
done
echo ""

echo "=================================="
echo "📊 Test Summary"
echo "=================================="
echo -e "Total Tests:  $TOTAL_TESTS"
echo -e "${GREEN}Passed:       $PASSED_TESTS${NC}"
echo -e "${RED}Failed:       $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
    echo -e "API key is working correctly with all EOSDA services"
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo -e "Please check the errors above"
    exit 1
fi
