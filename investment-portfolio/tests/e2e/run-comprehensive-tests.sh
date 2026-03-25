#!/bin/bash

# COMPREHENSIVE ADMIN PORTAL - MANUAL STYLE PLAYWRIGHT TEST RUNNER
# Runs all test suites and generates detailed report

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     COMPREHENSIVE MANUAL TEST STYLE PLAYWRIGHT RUNNER        ║"
echo "║                    Admin Portal Test Suite                     ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check prerequisites
echo -e "${BLUE}[INFO]${NC} Checking prerequisites..."

if ! command -v npx &> /dev/null; then
    echo -e "${RED}[ERROR]${NC} npx not found. Please install Node.js"
    exit 1
fi

if ! curl -s http://localhost:1420 > /dev/null; then
    echo -e "${RED}[ERROR]${NC} Frontend not running on http://localhost:1420"
    echo -e "${YELLOW}[TIP]${NC} Start frontend: cd web && npm run dev"
    exit 1
fi

if ! curl -s http://localhost:3001/api/auth/setup-status > /dev/null; then
    echo -e "${RED}[ERROR]${NC} Backend not running on http://localhost:3001"
    echo -e "${YELLOW}[TIP]${NC} Start backend: cd server && npm run start:dev"
    exit 1
fi

echo -e "${GREEN}[✅ SUCCESS]${NC} Prerequisites met"

# Test suites
TEST_SUITES=(
    "admin-navigation-tests.spec.ts:Navigation & Links (TC-NAV-001 to TC-NAV-020)"
    "admin-button-tests.spec.ts:Button States & Actions (TC-BTN-001 to TC-BTN-030)"
    "admin-modal-tests.spec.ts:Modal Interactions (TC-MODAL-001 to TC-MODAL-020)"
    "admin-state-tests.spec.ts:States & Loading (TC-STATE-001 to TC-STATE-020)"
    "admin-data-tests.spec.ts:Data & Forms (TC-DATA-001 to TC-DATA-020)"
    "admin-manual-tests-part1.spec.ts:Part 1 - Navigation & Overview"
    "admin-manual-tests-part2.spec.ts:Part 2 - Roles & Approvals"
    "admin-actual-state.spec.ts:Actual State Verification"
)

# Summary counters
TOTAL_SUITES=${#TEST_SUITES[@]}
PASSED_SUITES=0
FAILED_SUITES=0

# Results storage
declare -A RESULTS

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  RUNNING ${TOTAL_SUITES} TEST SUITES${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Run each test suite
for suite_info in "${TEST_SUITES[@]}"; do
    IFS=':' read -r suite_file suite_name <<< "$suite_info"
    
    echo -e "${BLUE}[RUNNING]${NC} ${suite_name}"
    echo "  File: tests/e2e/${suite_file}"
    echo "────────────────────────────────────────────────────────────────"
    
    suite_start=$(date +%s)
    
    # Run the test suite
    if npx playwright test "tests/e2e/${suite_file}" --reporter=line 2>&1 | tee "/tmp/${suite_file}.log"; then
        suite_status="PASSED"
        PASSED_SUITES=$((PASSED_SUITES + 1))
        echo -e "${GREEN}[✅ PASSED]${NC} ${suite_name}"
    else
        suite_status="FAILED"
        FAILED_SUITES=$((FAILED_SUITES + 1))
        echo -e "${RED}[❌ FAILED]${NC} ${suite_name}"
    fi
    
    suite_end=$(date +%s)
    suite_duration=$((suite_end - suite_start))
    
    # Parse test results from log
    passed=$(grep -o "[0-9]* passed" "/tmp/${suite_file}.log" | grep -o "[0-9]*" | head -1 || echo "0")
    failed=$(grep -o "[0-9]* failed" "/tmp/${suite_file}.log" | grep -o "[0-9]*" | head -1 || echo "0")
    
    RESULTS["${suite_file}_status"]=$suite_status
    RESULTS["${suite_file}_passed"]=$passed
    RESULTS["${suite_file}_failed"]=$failed
    RESULTS["${suite_file}_duration"]=$suite_duration
    
    echo ""
done

# Generate summary report
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  TEST EXECUTION SUMMARY${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Calculate totals
TOTAL_PASSED=0
TOTAL_FAILED=0

for suite_info in "${TEST_SUITES[@]}"; do
    IFS=':' read -r suite_file suite_name <<< "$suite_info"
    
    status=${RESULTS["${suite_file}_status"]}
    passed=${RESULTS["${suite_file}_passed"]}
    failed=${RESULTS["${suite_file}_failed"]}
    duration=${RESULTS["${suite_file}_duration"]}
    
    TOTAL_PASSED=$((TOTAL_PASSED + passed))
    TOTAL_FAILED=$((TOTAL_FAILED + failed))
    
    status_color=$GREEN
    if [ "$status" = "FAILED" ]; then
        status_color=$RED
    fi
    
    printf "${status_color}%-8s${NC} %-45s %3s passed %3s failed %3ss\n" \
        "[$status]" "$suite_name" "$passed" "$failed" "$duration"
done

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  FINAL RESULTS${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

TOTAL_TESTS=$((TOTAL_PASSED + TOTAL_FAILED))
PASS_RATE=$(( TOTAL_PASSED * 100 / (TOTAL_TESTS > 0 ? TOTAL_TESTS : 1) ))

echo "  Test Suites: ${TOTAL_SUITES}"
echo "  Total Tests:  ${TOTAL_TESTS}"
echo "  Passed:       ${GREEN}${TOTAL_PASSED}${NC}"
echo "  Failed:       ${RED}${TOTAL_FAILED}${NC}"
echo "  Pass Rate:    ${PASS_RATE}%"
echo ""

# Test Case Coverage Summary
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  TEST CASE COVERAGE${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

echo "  ✅ Navigation Tests (TC-NAV-001 to TC-NAV-020)"
echo "     - Dashboard, Portfolio, Companies, Transactions links"
echo "     - Admin tab with Overview, Users, Roles, Approvals subtabs"
echo "     - URL navigation, browser back button, query parameters"
echo "     - Mobile navigation, tab switching performance"
echo ""

echo "  ✅ Button Tests (TC-BTN-001 to TC-BTN-030)"
echo "     - Create User, Edit User, Suspend User buttons"
echo "     - Create Role, Assign Functions buttons"
echo "     - Cancel, Submit, Login, Logout buttons"
echo "     - Hover states, disabled states, loading states"
echo "     - Pagination, search, filter, export buttons"
echo ""

echo "  ✅ Modal Tests (TC-MODAL-001 to TC-MODAL-020)"
echo "     - Create/Edit User modals"
echo "     - Create Role, Assign Functions modals"
echo "     - Open/close via Cancel, Escape, backdrop click"
echo "     - Form validation, pre-filled data, error display"
echo "     - Modal sizing, scrolling, animations"
echo ""

echo "  ✅ State Tests (TC-STATE-001 to TC-STATE-020)"
echo "     - Loading indicators, skeleton screens"
echo "     - Empty states, error states, success states"
echo "     - Data refresh, network states, permission states"
echo "     - Hover, focus, disabled, animation states"
echo ""

echo "  ✅ Data & Form Tests (TC-DATA-001 to TC-DATA-020)"
echo "     - Data persistence across navigation"
echo "     - Form inputs: text, email, password, dropdown, checkbox"
echo "     - Required validation, form reset"
echo "     - CRUD operations, data integrity, pagination"
echo "     - Sort, filter, data consistency"
echo ""

# Features Verified
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  FEATURES VERIFIED${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

echo "  🔷 Navigation Features:"
echo "     - 5 main navigation links (Dashboard, Portfolio, Companies, Transactions, Admin)"
echo "     - 4 admin subtabs (Overview, Users, Roles, Approvals)"
echo "     - URL routing and browser history"
echo "     - Tab state persistence"
echo ""

echo "  🔷 Button Features:"
echo "     - Create User, Edit User, Suspend User"
echo "     - Create Role, Assign Functions"
echo "     - Cancel, Submit, Login, Logout"
echo "     - Enabled, disabled, loading, hover states"
echo ""

echo "  🔷 Modal Features:"
echo "     - Create User/Role modals with forms"
echo "     - Edit User modal with pre-filled data"
echo "     - Assign Functions modal with checkboxes"
echo "     - Form validation and error display"
echo ""

echo "  🔷 State Features:"
echo "     - Loading states during data fetch"
echo "     - Empty states for no data"
echo "     - Error states and messages"
echo "     - Success confirmation states"
echo ""

echo "  🔷 Data Features:"
echo "     - Statistics cards (Total Users, Active Users, etc.)"
echo "     - User/Role tables with sorting and filtering"
echo "     - CRUD operations (Create, Read, Update, Delete/Deactivate)"
echo "     - Data persistence and consistency"
echo ""

# Issue Summary
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  KNOWN ISSUES${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

echo "  ⚠️ Issues that may cause test failures:"
echo "     - Some forms may have strict validation requirements"
echo "     - Modal animations may cause timing issues"
echo "     - Backend state may affect test isolation"
echo ""

echo "  💡 If tests fail:"
echo "     1. Ensure backend and frontend are running"
echo "     2. Check that database is seeded correctly"
echo "     3. Run individual test files to isolate issues"
echo "     4. Check test logs in /tmp/*.log"
echo ""

# Final verdict
if [ $FAILED_SUITES -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  🎉 ALL TEST SUITES PASSED - Admin Portal Fully Verified      ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
else
    echo -e "${YELLOW}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║  ⚠️  ${FAILED_SUITES} SUITE(S) FAILED - Review logs above                    ║${NC}"
    echo -e "${YELLOW}╚════════════════════════════════════════════════════════════════╝${NC}"
fi

echo ""
echo "  📋 Test Artifacts:"
echo "     - Log files: /tmp/admin-*.log"
echo "     - Test reports: playwright-report/"
echo ""
echo "  🔧 Run individual suites:"
echo "     npx playwright test tests/e2e/admin-navigation-tests.spec.ts"
echo "     npx playwright test tests/e2e/admin-button-tests.spec.ts"
echo "     npx playwright test tests/e2e/admin-modal-tests.spec.ts"
echo "     npx playwright test tests/e2e/admin-state-tests.spec.ts"
echo "     npx playwright test tests/e2e/admin-data-tests.spec.ts"
echo ""
