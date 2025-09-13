#!/bin/bash

echo "🧪 Testing CORS Configuration..."
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:5000"

echo -e "\n${YELLOW}Test 1: Health Check${NC}"
if curl -s -f "$BASE_URL/api/health" > /dev/null; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed - Is the server running?${NC}"
fi

echo -e "\n${YELLOW}Test 2: CORS Test Endpoint${NC}"
RESPONSE=$(curl -s -H "Origin: http://localhost:3000" "$BASE_URL/api/cors-test" 2>/dev/null)
if [[ $? -eq 0 ]] && [[ $RESPONSE == *"CORS is working"* ]]; then
    echo -e "${GREEN}✅ CORS test endpoint passed${NC}"
else
    echo -e "${RED}❌ CORS test endpoint failed${NC}"
fi

echo -e "\n${YELLOW}Test 3: Preflight OPTIONS Request${NC}"
PREFLIGHT_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X OPTIONS \
    -H "Origin: http://localhost:3000" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type,Authorization" \
    "$BASE_URL/api/auth/login" 2>/dev/null)

if [[ $PREFLIGHT_RESPONSE -eq 204 ]] || [[ $PREFLIGHT_RESPONSE -eq 200 ]]; then
    echo -e "${GREEN}✅ Preflight request passed (HTTP $PREFLIGHT_RESPONSE)${NC}"
else
    echo -e "${RED}❌ Preflight request failed (HTTP $PREFLIGHT_RESPONSE)${NC}"
fi

echo -e "\n${YELLOW}Test 4: Check CORS Headers${NC}"
CORS_HEADERS=$(curl -s -I -H "Origin: http://localhost:3000" "$BASE_URL/api/cors-test" 2>/dev/null | grep -i "access-control")
if [[ -n $CORS_HEADERS ]]; then
    echo -e "${GREEN}✅ CORS headers present:${NC}"
    echo "$CORS_HEADERS"
else
    echo -e "${RED}❌ No CORS headers found${NC}"
fi

echo -e "\n📋 ${YELLOW}CORS Test Summary:${NC}"
echo "- Backend should be running on http://localhost:5000"
echo "- Frontend should be running on http://localhost:3000"
echo "- Check server logs for detailed CORS debug information"
echo "- All tests should pass for proper CORS functionality"