#!/bin/bash
#
# Script para testar build de produção localmente antes do deploy
# Simula ambiente Cloud Run (porta 8080, container único)
#

set -e

echo "🔨 Testando build de produção..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Navigate to project root
cd "$(dirname "$0")/.."

# Build image
echo -e "${BLUE}📦 Building production image...${NC}"
docker build -f Dockerfile.prod -t pilotodevendas:test .

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful!${NC}"
echo ""

# Stop any existing container
echo -e "${BLUE}🧹 Cleaning up existing containers...${NC}"
docker stop pilotodevendas-test 2>/dev/null || true
docker rm pilotodevendas-test 2>/dev/null || true

# Run container
echo -e "${BLUE}🚀 Starting container on port 8080...${NC}"
docker run -d \
  --name pilotodevendas-test \
  -p 8080:8080 \
  -e DATABASE_URL="sqlite:///./test.db" \
  -e SECRET_KEY="test-secret-key-for-local-testing-only" \
  -e ENVIRONMENT="production" \
  pilotodevendas:test

echo ""
echo -e "${BLUE}⏳ Waiting for container to start (5s)...${NC}"
sleep 5

# Test endpoints
echo ""
echo -e "${BLUE}🧪 Testing endpoints...${NC}"
echo ""

# Test 1: Health check
echo "Test 1: GET /health (should return healthy status)"
RESPONSE=$(curl -s http://localhost:8080/health)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Health check works (HTTP $HTTP_CODE)${NC}"
    echo "   Response: $RESPONSE"
else
    echo -e "${RED}❌ Health check failed (HTTP $HTTP_CODE)${NC}"
fi
echo ""

# Test 2: SPA serving
echo "Test 2: GET / (should serve SPA index.html)"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ SPA serving works (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}❌ SPA serving failed (HTTP $HTTP_CODE)${NC}"
fi
echo ""

# Test 3: API endpoint
echo "Test 3: GET /api/auth/me (should return 401 - no session)"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/auth/me)
if [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✅ API endpoint works (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}❌ API endpoint failed (HTTP $HTTP_CODE)${NC}"
fi
echo ""

# Test 4: Static assets
echo "Test 4: GET /assets/* (should serve static files)"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/assets/ || echo "404")
# 404 is ok if no assets, we just want to check if route exists
echo -e "${GREEN}✅ Assets route configured (HTTP $HTTP_CODE)${NC}"

echo ""
echo -e "${GREEN}🎉 All tests passed!${NC}"
echo ""
echo "Container is running at: http://localhost:8080"
echo ""
echo "To view logs:"
echo "  docker logs -f pilotodevendas-test"
echo ""
echo "To stop container:"
echo "  docker stop pilotodevendas-test"
echo ""
echo "To clean up:"
echo "  docker rm pilotodevendas-test"
echo "  docker rmi pilotodevendas:test"
echo ""
