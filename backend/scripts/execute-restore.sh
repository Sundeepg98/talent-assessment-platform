#!/bin/bash

echo "🔄 EXECUTING RESTORE SCRIPT"
echo "============================================================"

cd /var/projects/Others/talent-assessment-platform/backend

# Run the restoration
node scripts/restore-all-tdd-tests.js

echo ""
echo "📊 Running coverage test..."
echo "============================================================"

# Run coverage and capture output
npm run test:coverage 2>&1 | tee coverage-output.txt

# Extract coverage percentages
echo ""
echo "📈 Coverage Summary:"
echo "============================================================"
grep -E "^\s*(Lines|Branches|Functions|Statements)" coverage-output.txt || echo "No coverage data found"

echo ""
echo "✅ Restoration complete!"