#!/bin/bash

echo "🎯 CHECKING TEST STATUS FOR 100% COMPLIANCE"
echo "==========================================="

# Count total test files
total_files=$(find tests -name "*.test.js" 2>/dev/null | wc -l)
echo "Total test files found: $total_files"
echo ""

# Service tests
echo "📁 SERVICE TESTS:"
echo "-----------------"
for file in tests/unit/services/*.test.js; do
  if [ -f "$file" ]; then
    basename=$(basename "$file")
    result=$(npx jest --config jest.config.js "$file" --no-coverage --json 2>/dev/null | jq -r '.success' 2>/dev/null)
    if [ "$result" = "true" ]; then
      tests=$(npx jest --config jest.config.js "$file" --no-coverage --json 2>/dev/null | jq -r '.numTotalTests' 2>/dev/null)
      echo "✅ $basename: $tests tests passing"
    else
      echo "❌ $basename: FAILING"
    fi
  fi
done

echo ""
echo "📁 USE CASE TESTS:"
echo "------------------"
for file in tests/unit/useCases/*.test.js; do
  if [ -f "$file" ]; then
    basename=$(basename "$file")
    result=$(npx jest --config jest.config.js "$file" --no-coverage --json 2>/dev/null | jq -r '.success' 2>/dev/null)
    if [ "$result" = "true" ]; then
      tests=$(npx jest --config jest.config.js "$file" --no-coverage --json 2>/dev/null | jq -r '.numTotalTests' 2>/dev/null)
      echo "✅ $basename: $tests tests passing"
    else
      echo "❌ $basename: FAILING"
    fi
  fi
done

echo ""
echo "📁 OTHER TESTS:"
echo "---------------"
for file in tests/*.test.js; do
  if [ -f "$file" ]; then
    basename=$(basename "$file")
    result=$(npx jest --config jest.config.js "$file" --no-coverage --json 2>/dev/null | jq -r '.success' 2>/dev/null)
    if [ "$result" = "true" ]; then
      tests=$(npx jest --config jest.config.js "$file" --no-coverage --json 2>/dev/null | jq -r '.numTotalTests' 2>/dev/null)
      echo "✅ $basename: $tests tests passing"
    else
      echo "❌ $basename: FAILING"
    fi
  fi
done

# Summary
echo ""
echo "==========================================="
echo "📊 CALCULATING OVERALL STATUS..."
result=$(npx jest --config jest.config.js --no-coverage --json 2>/dev/null | jq -r '.numTotalTests, .numPassedTests, .numFailedTests' 2>/dev/null | tr '\n' ' ')
echo "Overall: $result"