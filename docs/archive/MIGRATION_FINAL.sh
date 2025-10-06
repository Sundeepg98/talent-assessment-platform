#!/bin/bash
# FINAL MIGRATION - Move resume analyzer to backend and DELETE old location

echo "======================================"
echo "🚀 FINAL RESUME ANALYZER MIGRATION"
echo "======================================"
echo ""
echo "This will:"
echo "1. ✅ Copy all necessary files to backend/src/services/resumeAnalyzer/"
echo "2. 🗑️  DELETE the ai_services4/ folder completely"
echo "3. 🔧 Update backend to use integrated service"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Confirmation
echo -e "${YELLOW}⚠️  WARNING: This will DELETE ai_services4/ folder!${NC}"
read -p "Are you sure you want to proceed? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Migration cancelled."
    exit 0
fi

echo ""
echo "📦 Step 1: Creating backup..."
if [ ! -d "backups" ]; then
    mkdir -p backups
fi
timestamp=$(date +%Y%m%d_%H%M%S)
cp -r ai_services4 backups/ai_services4_final_backup_$timestamp
echo -e "${GREEN}✅ Backup created: backups/ai_services4_final_backup_$timestamp${NC}"

echo ""
echo "📋 Step 2: Copying analyzer files to backend..."

# Copy the main analyzer file
if [ -f "ai_services4/resume-analyzer/app.py" ]; then
    cp ai_services4/resume-analyzer/app.py backend/src/services/resumeAnalyzer/analyzer_full.py
    echo -e "${GREEN}✅ Copied app.py → analyzer_full.py${NC}"
fi

# Copy test files (for reference)
if [ -d "ai_services4/resume-analyzer/test-files" ]; then
    cp -r ai_services4/resume-analyzer/test-files backend/src/services/resumeAnalyzer/
    echo -e "${GREEN}✅ Copied test files${NC}"
fi

# Copy requirements for reference
if [ -f "ai_services4/resume-analyzer/requirements.txt" ]; then
    cp ai_services4/resume-analyzer/requirements.txt backend/src/services/resumeAnalyzer/python_requirements.txt
    echo -e "${GREEN}✅ Copied Python requirements${NC}"
fi

echo ""
echo "🔧 Step 3: Verifying integration files..."

if [ -f "backend/src/services/resumeAnalyzer/index.js" ]; then
    echo -e "${GREEN}✅ Node.js wrapper exists${NC}"
else
    echo -e "${RED}❌ Missing index.js - integration incomplete!${NC}"
    exit 1
fi

if [ -f "backend/src/services/resumeAnalyzer/analyzer.py" ]; then
    echo -e "${GREEN}✅ Python analyzer exists${NC}"
else
    echo -e "${RED}❌ Missing analyzer.py - integration incomplete!${NC}"
    exit 1
fi

echo ""
echo "🗑️  Step 4: DELETING ai_services4/ folder..."
read -p "Final confirmation to DELETE ai_services4/? (DELETE/cancel): " final_confirm

if [ "$final_confirm" == "DELETE" ]; then
    rm -rf ai_services4
    echo -e "${GREEN}✅ ai_services4/ folder DELETED${NC}"
else
    echo -e "${YELLOW}⚠️  Keeping ai_services4/ folder${NC}"
fi

echo ""
echo "📝 Step 5: Instructions to complete migration:"
echo ""
echo "1. Update backend/server.js or backend/src/app.js:"
echo "   ${YELLOW}Change:${NC}"
echo "   const resumeRoutes = require('./src/routes/resume');"
echo "   ${GREEN}To:${NC}"
echo "   const resumeRoutes = require('./src/routes/resumeIntegrated');"
echo ""
echo "2. Stop any Python service on port 8000:"
echo "   pkill -f 'python.*app.py'"
echo ""
echo "3. Restart backend:"
echo "   cd backend && npm start"
echo ""
echo "4. Test integrated service:"
echo "   curl http://localhost:5000/api/resume/health"
echo ""

# Final check
echo "======================================"
echo "📊 MIGRATION SUMMARY:"
echo "======================================"

if [ -d "ai_services4" ]; then
    echo -e "${YELLOW}⚠️  ai_services4/ still exists (not deleted)${NC}"
else
    echo -e "${GREEN}✅ ai_services4/ successfully removed${NC}"
fi

if [ -d "backend/src/services/resumeAnalyzer" ]; then
    echo -e "${GREEN}✅ Resume analyzer integrated in backend${NC}"
    echo "   Location: backend/src/services/resumeAnalyzer/"
    ls -la backend/src/services/resumeAnalyzer/ | head -10
else
    echo -e "${RED}❌ Integration directory not found!${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Migration complete!${NC}"
echo "   Resume analyzer is now properly integrated into the backend."
echo "   No more separate Python service needed!"
echo ""
echo "REMEMBER: Update your backend routes to use resumeIntegrated.js!"