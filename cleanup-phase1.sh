#!/bin/bash

echo "=== PHASE 1 CLEANUP SCRIPT ==="
echo "This script will remove 2.0 MB of redundant files (264 files total)"
echo

# Safety check
if [ ! -d "backend/.junk-files" ]; then
    echo "ERROR: backend/.junk-files not found. Are you in the right directory?"
    exit 1
fi

echo "Files to be removed:"
echo "1. backend/.junk-files/ (2.0 MB, 255 files)"
echo "2. 7 empty Python placeholder files"
echo "3. 2 empty JavaScript placeholder files"
echo "4. 1 empty frontend component"
echo

read -p "Proceed with cleanup? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Cleanup cancelled."
    exit 0
fi

echo
echo "Starting cleanup..."
echo

# Remove .junk-files directory
echo "Removing backend/.junk-files/..."
rm -rf backend/.junk-files/
echo "✓ Removed .junk-files/ (2.0 MB, 255 files)"

# Remove empty Python placeholder files
echo
echo "Removing empty Python placeholder files..."
rm -f backend/src/services/interview/interviewAnalyzer/utils/nlp_pipeline.py
rm -f backend/src/services/interview/interviewAnalyzer/utils/embeddings.py
rm -f backend/src/services/interview/interviewAnalyzer/models/feedback_generator.py
rm -f backend/src/services/interview/interviewAnalyzer/services/question_context.py
rm -f backend/src/services/interview/interviewAnalyzer/services/analysis_validator.py
echo "✓ Removed 5 empty Python files"

# Remove empty JavaScript placeholder files
echo
echo "Removing empty JavaScript placeholder files..."
rm -f backend/src/services/processing/textAnalysis/feedbackGenerator.js
rm -f backend/src/services/processing/textAnalysis/analysisOrchestrator.js
echo "✓ Removed 2 empty JavaScript files"

# Remove empty frontend component
echo
echo "Removing empty frontend component..."
rm -f frontend/src/components/coding/TestRunner.jsx
echo "✓ Removed 1 empty frontend component"

# Clean up empty directories
echo
echo "Removing empty directories..."
find backend/src -type d -empty -delete 2>/dev/null
find frontend/src -type d -empty -delete 2>/dev/null
echo "✓ Removed empty directories"

echo
echo "=== CLEANUP COMPLETE ==="
echo
echo "Summary:"
echo "- Removed: 264 files"
echo "- Space saved: ~2.0 MB"
echo "- Empty directories cleaned up"
echo
echo "Next steps:"
echo "1. Run tests: cd backend && npm test"
echo "2. Verify git status: git status"
echo "3. Commit changes: git add -A && git commit -m 'Cleanup: Remove junk files and empty placeholders'"
echo
