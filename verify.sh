#!/bin/bash

# Pre-submission Verification Script
# This script checks all critical aspects of the project before submission

set -e

echo "🔍 Starting Pre-Submission Verification..."
echo "=========================================="
echo ""

ERRORS=0
WARNINGS=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ERRORS=$((ERRORS + 1))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    WARNINGS=$((WARNINGS + 1))
}

# 1. Node.js version check
echo "1. Checking Node.js version..."
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 18 ]; then
    check_pass "Node.js version $(node --version) >= 18.0.0"
else
    check_fail "Node.js version $(node --version) < 18.0.0 (required: >= 18.0.0)"
fi
echo ""

# 2. pnpm check
echo "2. Checking pnpm..."
if command -v pnpm &> /dev/null; then
    check_pass "pnpm $(pnpm --version) is installed"
else
    check_fail "pnpm is not installed"
fi
echo ""

# 3. Dependencies check
echo "3. Checking dependencies..."
if [ -d "node_modules" ] && [ -d "backend/node_modules" ] && [ -d "frontend/node_modules" ]; then
    check_pass "All dependencies are installed"
else
    check_warn "Dependencies may not be installed. Run: pnpm install"
fi
echo ""

# 4. Environment files check
echo "4. Checking environment files..."
if [ -f "backend/.env" ]; then
    check_pass "backend/.env exists"
    # Check for required variables
    if grep -q "JWT_SECRET" backend/.env && grep -q "DATABASE_URL" backend/.env; then
        check_pass "backend/.env contains required variables"
    else
        check_warn "backend/.env may be missing required variables (JWT_SECRET, DATABASE_URL)"
    fi
else
    check_fail "backend/.env does not exist"
fi

if [ -f "frontend/.env" ]; then
    check_pass "frontend/.env exists"
else
    check_warn "frontend/.env does not exist (may be optional)"
fi
echo ""

# 5. Git configuration check
echo "5. Checking Git configuration..."
if git rev-parse --git-dir > /dev/null 2>&1; then
    check_pass "Git repository is initialized"
    
    if git remote get-url origin > /dev/null 2>&1; then
        check_pass "Git remote 'origin' is configured"
    else
        check_warn "Git remote 'origin' is not configured"
    fi
    
    # Check for uncommitted changes
    if [ -z "$(git status --porcelain)" ]; then
        check_pass "Working directory is clean"
    else
        check_warn "Working directory has uncommitted changes"
    fi
else
    check_fail "Not a Git repository"
fi
echo ""

# 6. Documentation check
echo "6. Checking documentation..."
if [ -f "README.md" ]; then
    check_pass "README.md exists"
else
    check_fail "README.md does not exist"
fi

if [ -f "OPENAPI.yaml" ]; then
    check_pass "OPENAPI.yaml exists"
else
    check_warn "OPENAPI.yaml does not exist"
fi

if [ -f "EVAL.md" ]; then
    check_pass "EVAL.md exists"
else
    check_warn "EVAL.md does not exist"
fi

if [ -f "AI_USAGE.md" ]; then
    check_pass "AI_USAGE.md exists"
else
    check_warn "AI_USAGE.md does not exist"
fi
echo ""

# 7. Database setup check
echo "7. Checking database setup..."
if [ -f "backend/prisma/schema.prisma" ]; then
    check_pass "Prisma schema exists"
else
    check_fail "Prisma schema does not exist"
fi

if [ -d "backend/prisma/migrations" ] && [ "$(ls -A backend/prisma/migrations 2>/dev/null)" ]; then
    check_pass "Prisma migrations exist"
else
    check_warn "Prisma migrations directory is empty or missing"
fi
echo ""

# 8. Linting check
echo "8. Running linting checks..."
if pnpm lint > /tmp/lint_output.txt 2>&1; then
    check_pass "Linting passed"
else
    LINT_ERRORS=$(grep -c "error" /tmp/lint_output.txt || echo "0")
    if [ "$LINT_ERRORS" -gt 0 ]; then
        check_fail "Linting failed with errors (see output below)"
        echo "Last 20 lines of lint output:"
        tail -20 /tmp/lint_output.txt
    else
        check_warn "Linting has warnings (acceptable)"
    fi
fi
echo ""

# 9. Type checking
echo "9. Running type checks..."
if pnpm type-check > /tmp/typecheck_output.txt 2>&1; then
    check_pass "Type checking passed"
else
    check_fail "Type checking failed"
    echo "Last 20 lines of type check output:"
    tail -20 /tmp/typecheck_output.txt
fi
echo ""

# 10. Build process check
echo "10. Checking build process..."
if pnpm build > /tmp/build_output.txt 2>&1; then
    check_pass "Build process succeeded"
else
    check_fail "Build process failed"
    echo "Last 20 lines of build output:"
    tail -20 /tmp/build_output.txt
fi
echo ""

# 11. Tests check
echo "11. Running tests..."
if pnpm test > /tmp/test_output.txt 2>&1; then
    check_pass "All tests passed"
else
    TEST_FAILURES=$(grep -c "FAIL\|failed" /tmp/test_output.txt || echo "0")
    if [ "$TEST_FAILURES" -gt 0 ]; then
        check_fail "Some tests failed"
        echo "Last 30 lines of test output:"
        tail -30 /tmp/test_output.txt
    else
        check_warn "Tests completed with warnings"
    fi
fi
echo ""

# 12. ESLint config check
echo "12. Checking ESLint configuration..."
if [ -f ".eslintrc.cjs" ] && [ -f "backend/.eslintrc.cjs" ] && [ -f "frontend/.eslintrc.cjs" ]; then
    check_pass "All ESLint config files exist (.cjs format)"
else
    check_fail "Missing ESLint config files"
fi
echo ""

# 13. .gitignore check
echo "13. Checking .gitignore..."
if [ -f ".gitignore" ]; then
    check_pass ".gitignore exists"
    if grep -q "backend/uploads" .gitignore; then
        check_pass ".gitignore includes uploads directory"
    else
        check_warn ".gitignore may not include uploads directory"
    fi
else
    check_fail ".gitignore does not exist"
fi
echo ""

# 14. CI/CD check
echo "14. Checking CI/CD configuration..."
if [ -f ".github/workflows/ci.yml" ]; then
    check_pass "GitHub Actions CI workflow exists"
else
    check_warn "GitHub Actions CI workflow does not exist"
fi
echo ""

# Summary
echo "=========================================="
echo "Verification Summary:"
echo "=========================================="
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ All critical checks passed!${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠ $WARNINGS warning(s) found (review recommended)${NC}"
    fi
    exit 0
else
    echo -e "${RED}✗ $ERRORS error(s) found${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠ $WARNINGS warning(s) found${NC}"
    fi
    exit 1
fi

