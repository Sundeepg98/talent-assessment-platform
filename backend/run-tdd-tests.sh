#!/bin/bash

# TDD Test Runner - Validates TDD Compliance
# This script runs all tests and checks coverage

echo "================================================"
echo "🧪 RUNNING TDD COMPLIANCE TESTS"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if we're in backend directory
if [ ! -f "package.json" ]; then
    cd backend 2>/dev/null || {
        echo -e "${RED}❌ Error: Not in backend directory${NC}"
        exit 1
    }
fi

echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install 2>/dev/null

echo ""
echo -e "${BLUE}🔍 Checking test files exist...${NC}"
echo "================================"

TEST_DIR="tests/unit/services"
REQUIRED_TESTS=(
    "emailVerification.test.js"
    "passwordReset.test.js"
    "twoFactorAuth.test.js"
    "videoInterview.test.js"
)

MISSING_TESTS=()
for test in "${REQUIRED_TESTS[@]}"; do
    if [ -f "$TEST_DIR/$test" ]; then
        echo -e "${GREEN}✅ $test${NC}"
    else
        echo -e "${RED}❌ $test - MISSING${NC}"
        MISSING_TESTS+=($test)
    fi
done

if [ ${#MISSING_TESTS[@]} -gt 0 ]; then
    echo ""
    echo -e "${RED}❌ Missing ${#MISSING_TESTS[@]} test files${NC}"
    echo "TDD requires tests to be written FIRST!"
    echo ""
fi

echo ""
echo -e "${BLUE}🚀 Running tests with coverage...${NC}"
echo "================================"

# Run tests with coverage
npm test -- --coverage --coverageReporters=text 2>&1 | tee test-results.txt

# Check if tests passed
if grep -q "FAIL" test-results.txt; then
    echo ""
    echo -e "${RED}❌ TESTS FAILED${NC}"
    echo "Fix failing tests before proceeding"
    TESTS_PASSED=false
else
    echo ""
    echo -e "${GREEN}✅ All tests passed${NC}"
    TESTS_PASSED=true
fi

# Extract coverage percentages
echo ""
echo -e "${BLUE}📊 Coverage Report:${NC}"
echo "==================="

# Parse coverage from output
STATEMENTS=$(grep "All files" test-results.txt | awk '{print $3}' | sed 's/%//')
BRANCHES=$(grep "All files" test-results.txt | awk '{print $5}' | sed 's/%//')
FUNCTIONS=$(grep "All files" test-results.txt | awk '{print $7}' | sed 's/%//')
LINES=$(grep "All files" test-results.txt | awk '{print $9}' | sed 's/%//')

# Default to 0 if not found
STATEMENTS=${STATEMENTS:-0}
BRANCHES=${BRANCHES:-0}
FUNCTIONS=${FUNCTIONS:-0}
LINES=${LINES:-0}

# Check coverage thresholds (80% minimum)
COVERAGE_PASSED=true
THRESHOLD=80

echo -n "Statements: "
if (( $(echo "$STATEMENTS >= $THRESHOLD" | bc -l) )); then
    echo -e "${GREEN}${STATEMENTS}% ✅${NC}"
else
    echo -e "${RED}${STATEMENTS}% ❌ (min: ${THRESHOLD}%)${NC}"
    COVERAGE_PASSED=false
fi

echo -n "Branches:   "
if (( $(echo "$BRANCHES >= $THRESHOLD" | bc -l) )); then
    echo -e "${GREEN}${BRANCHES}% ✅${NC}"
else
    echo -e "${RED}${BRANCHES}% ❌ (min: ${THRESHOLD}%)${NC}"
    COVERAGE_PASSED=false
fi

echo -n "Functions:  "
if (( $(echo "$FUNCTIONS >= $THRESHOLD" | bc -l) )); then
    echo -e "${GREEN}${FUNCTIONS}% ✅${NC}"
else
    echo -e "${RED}${FUNCTIONS}% ❌ (min: ${THRESHOLD}%)${NC}"
    COVERAGE_PASSED=false
fi

echo -n "Lines:      "
if (( $(echo "$LINES >= $THRESHOLD" | bc -l) )); then
    echo -e "${GREEN}${LINES}% ✅${NC}"
else
    echo -e "${RED}${LINES}% ❌ (min: ${THRESHOLD}%)${NC}"
    COVERAGE_PASSED=false
fi

echo ""
echo "================================================"
echo -e "${BLUE}📋 TDD COMPLIANCE SUMMARY${NC}"
echo "================================================"

# Calculate compliance score
SCORE=0
MAX_SCORE=100

# Tests exist (40 points)
if [ ${#MISSING_TESTS[@]} -eq 0 ]; then
    SCORE=$((SCORE + 40))
    echo -e "${GREEN}✅ All test files exist (+40 points)${NC}"
else
    PARTIAL=$((40 - ${#MISSING_TESTS[@]} * 10))
    SCORE=$((SCORE + PARTIAL))
    echo -e "${YELLOW}⚠️  Missing ${#MISSING_TESTS[@]} test files (+$PARTIAL/40 points)${NC}"
fi

# Tests pass (30 points)
if [ "$TESTS_PASSED" = true ]; then
    SCORE=$((SCORE + 30))
    echo -e "${GREEN}✅ All tests pass (+30 points)${NC}"
else
    echo -e "${RED}❌ Tests failing (+0/30 points)${NC}"
fi

# Coverage meets threshold (30 points)
if [ "$COVERAGE_PASSED" = true ]; then
    SCORE=$((SCORE + 30))
    echo -e "${GREEN}✅ Coverage meets 80% threshold (+30 points)${NC}"
else
    echo -e "${RED}❌ Coverage below 80% threshold (+0/30 points)${NC}"
fi

echo ""
echo "================================================"
echo -n "TDD COMPLIANCE SCORE: "

if [ $SCORE -ge 80 ]; then
    echo -e "${GREEN}${SCORE}/100 - COMPLIANT ✅${NC}"
    echo ""
    echo -e "${GREEN}🎉 Congratulations! Your code follows TDD principles!${NC}"
elif [ $SCORE -ge 60 ]; then
    echo -e "${YELLOW}${SCORE}/100 - PARTIAL ⚠️${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  Improvements needed for full TDD compliance${NC}"
else
    echo -e "${RED}${SCORE}/100 - NON-COMPLIANT ❌${NC}"
    echo ""
    echo -e "${RED}❌ Significant TDD violations detected${NC}"
fi

echo "================================================"
echo ""
echo "📝 Remember the TDD Cycle:"
echo "   1. RED - Write failing test first"
echo "   2. GREEN - Write minimal code to pass"
echo "   3. REFACTOR - Improve with tests passing"
echo ""

# Cleanup
rm -f test-results.txt

# Exit with appropriate code
if [ $SCORE -ge 80 ]; then
    exit 0
else
    exit 1
fi