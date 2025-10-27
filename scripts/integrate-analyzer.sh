#!/bin/bash
# Script to integrate resume analyzer into backend

echo "🔧 Resume Analyzer Integration Script"
echo "====================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check current directory
if [ ! -d "backend" ] || [ ! -d "ai_services4" ]; then
    echo -e "${RED}❌ Error: Run this script from the project root directory${NC}"
    exit 1
fi

echo "📋 Current Status:"
echo "------------------"

# Check if Python service is running
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}⚠️  Python service is running on port 8000${NC}"
    PY_PID=$(lsof -Pi :8000 -sTCP:LISTEN -t)
    echo "   PID: $PY_PID"
else
    echo -e "${GREEN}✅ No Python service running on port 8000${NC}"
fi

# Check if backend is running
if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${GREEN}✅ Backend is running on port 5000${NC}"
else
    echo -e "${YELLOW}⚠️  Backend is not running${NC}"
fi

echo ""
echo "🚀 Integration Steps:"
echo "---------------------"

# Step 1: Create backup
echo "1. Creating backup of ai_services4..."
if [ ! -d "backups" ]; then
    mkdir -p backups
fi
cp -r ai_services4 backups/ai_services4_backup_$(date +%Y%m%d_%H%M%S)
echo -e "${GREEN}   ✅ Backup created${NC}"

# Step 2: Check if integration files exist
echo "2. Checking integration files..."
if [ -f "backend/src/services/resumeAnalyzer/index.js" ]; then
    echo -e "${GREEN}   ✅ Integration service exists${NC}"
else
    echo -e "${RED}   ❌ Integration service missing${NC}"
    echo "   Creating integration service..."
    mkdir -p backend/src/services/resumeAnalyzer
    echo "   Run the integration commands to create the files"
fi

# Step 3: Offer to stop Python service
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
    echo ""
    echo -e "${YELLOW}3. Stop Python service on port 8000?${NC}"
    read -p "   Stop it now? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill $PY_PID
        echo -e "${GREEN}   ✅ Python service stopped${NC}"
    else
        echo "   Keeping Python service running"
    fi
else
    echo "3. Python service already stopped"
fi

# Step 4: Update route imports
echo ""
echo "4. Updating backend routes..."
echo -e "${YELLOW}   ⚠️  Manual step required:${NC}"
echo "   Edit backend/server.js or backend/src/app.js:"
echo "   Change:"
echo "     const resumeRoutes = require('./src/routes/resume');"
echo "   To:"
echo "     const resumeRoutes = require('./src/routes/resumeIntegrated');"

# Step 5: Test
echo ""
echo "5. Testing integrated service..."
echo -e "${YELLOW}   Run these commands to test:${NC}"
echo "   cd backend && npm start"
echo "   # In another terminal:"
echo "   curl -X POST http://localhost:5000/api/resume/health"

echo ""
echo "📊 Summary:"
echo "-----------"
echo "✅ Backup created in backups/"
echo "✅ Integration files ready in backend/src/services/resumeAnalyzer/"
echo "⚠️  Remember to update route imports in backend"
echo "⚠️  Test the integrated service before removing ai_services4/"

echo ""
echo -e "${GREEN}🎉 Integration preparation complete!${NC}"
echo "   Next steps:"
echo "   1. Update backend routes"
echo "   2. Restart backend"
echo "   3. Test integrated endpoints"
echo "   4. Remove ai_services4/ when confirmed working"