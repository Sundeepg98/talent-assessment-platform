#!/bin/bash
# Test script for integrated services

echo "================================================"
echo "🧪 TESTING INTEGRATED SERVICES"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if backend is running
echo "📡 Checking backend status..."
if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is running on port 5000${NC}"
else
    echo -e "${YELLOW}⚠️  Backend not running. Starting it now...${NC}"
    cd backend && npm start &
    sleep 5
    if curl -s http://localhost:5000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend started successfully${NC}"
    else
        echo -e "${RED}❌ Failed to start backend${NC}"
        exit 1
    fi
fi

echo ""
echo "🔍 Testing Resume Analyzer (Integrated)..."
echo "========================================="

# Test resume analyzer health
echo "Testing /api/resume/health endpoint..."
RESUME_HEALTH=$(curl -s http://localhost:5000/api/resume/health 2>/dev/null)
if [[ $RESUME_HEALTH == *"integrated"* ]]; then
    echo -e "${GREEN}✅ Resume analyzer is using integrated service${NC}"
    echo "Response: $RESUME_HEALTH"
else
    echo -e "${RED}❌ Resume analyzer health check failed${NC}"
    echo "Response: $RESUME_HEALTH"
fi

echo ""
echo "🎤 Testing Interview Analyzer (Integrated)..."
echo "============================================"

# Test interview analyzer health
echo "Testing /api/interview/health endpoint..."
INTERVIEW_HEALTH=$(curl -s http://localhost:5000/api/interview/health 2>/dev/null)
if [[ $INTERVIEW_HEALTH == *"integrated"* ]]; then
    echo -e "${GREEN}✅ Interview analyzer is using integrated service${NC}"
    echo "Response: $INTERVIEW_HEALTH"
else
    echo -e "${RED}❌ Interview analyzer health check failed${NC}"
    echo "Response: $INTERVIEW_HEALTH"
fi

echo ""
echo "🔌 Checking Port 8000 (Should NOT be in use)..."
echo "=============================================="
if lsof -i:8000 > /dev/null 2>&1; then
    echo -e "${RED}❌ Port 8000 is still in use (old Python service?)${NC}"
    echo "Processes using port 8000:"
    lsof -i:8000
else
    echo -e "${GREEN}✅ Port 8000 is free (no external Python service)${NC}"
fi

echo ""
echo "📂 Checking ai_services4 folder..."
echo "==================================="
if [ -d "ai_services4" ]; then
    echo -e "${YELLOW}⚠️  ai_services4/ folder still exists${NC}"
    echo "Size: $(du -sh ai_services4 2>/dev/null | cut -f1)"
    echo "Contents:"
    ls -la ai_services4/ | head -5
else
    echo -e "${GREEN}✅ ai_services4/ folder has been removed${NC}"
fi

echo ""
echo "================================================"
echo "📊 INTEGRATION TEST SUMMARY"
echo "================================================"

# Count successes
SUCCESS_COUNT=0
if [[ $RESUME_HEALTH == *"integrated"* ]]; then
    ((SUCCESS_COUNT++))
fi
if [[ $INTERVIEW_HEALTH == *"integrated"* ]]; then
    ((SUCCESS_COUNT++))
fi
if ! lsof -i:8000 > /dev/null 2>&1; then
    ((SUCCESS_COUNT++))
fi

echo "Tests passed: $SUCCESS_COUNT/3"

if [ $SUCCESS_COUNT -eq 3 ]; then
    echo -e "${GREEN}✅ All integration tests passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Test with actual resume upload"
    echo "2. Test interview analysis"
    echo "3. Delete ai_services4 folder if everything works"
else
    echo -e "${YELLOW}⚠️  Some tests failed. Please fix issues before proceeding.${NC}"
fi

echo "================================================"