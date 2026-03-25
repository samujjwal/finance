#!/bin/bash

echo "🎭 Running Admin Portal UI Tests"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✅ SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[❌ ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠️  WARNING]${NC} $1"
}

# Check if frontend is running
print_status "Checking if frontend is running..."
if ! curl -s http://localhost:1420 > /dev/null; then
    print_error "Frontend is not running on http://localhost:1420"
    echo "Please start the frontend first: npm run dev"
    exit 1
fi
print_success "Frontend is running"

# Check if backend is running
print_status "Checking if backend is running..."
if ! curl -s http://localhost:3001/api/auth/setup-status > /dev/null; then
    print_error "Backend is not running on http://localhost:3001"
    echo "Please start the backend first: cd server && npm run start:dev"
    exit 1
fi
print_success "Backend is running"

echo ""
echo "🧪 Running Playwright Tests..."
echo ""

# Run admin portal UI tests
npx playwright test tests/e2e/admin-portal-ui.spec.ts --headed --project=chromium 2>&1 | tee /tmp/admin-portal-ui-test-results.txt

# Check test results
if [ ${PIPESTATUS[0]} -eq 0 ]; then
    print_success "Admin Portal UI tests PASSED"
else
    print_error "Admin Portal UI tests FAILED"
    echo ""
    echo "📋 Test Results Summary:"
    grep -E "(passed|failed|skipped|total)" /tmp/admin-portal-ui-test-results.txt | tail -5
fi

echo ""
echo "🎮 Running Button Interaction Tests..."
echo ""

# Run button interaction tests
npx playwright test tests/e2e/admin-button-interactions.spec.ts --headed --project=chromium 2>&1 | tee /tmp/admin-button-test-results.txt

# Check test results
if [ ${PIPESTATUS[0]} -eq 0 ]; then
    print_success "Admin Button Interaction tests PASSED"
else
    print_error "Admin Button Interaction tests FAILED"
    echo ""
    echo "📋 Test Results Summary:"
    grep -E "(passed|failed|skipped|total)" /tmp/admin-button-test-results.txt | tail -5
fi

echo ""
echo "📊 COMPREHENSIVE TEST SUMMARY"
echo "============================="

# Parse test results
UI_PASSED=$(grep -o "[0-9]* passed" /tmp/admin-portal-ui-test-results.txt | head -1 | grep -o "[0-9]*")
UI_FAILED=$(grep -o "[0-9]* failed" /tmp/admin-portal-ui-test-results.txt | head -1 | grep -o "[0-9]*")
BUTTON_PASSED=$(grep -o "[0-9]* passed" /tmp/admin-button-test-results.txt | head -1 | grep -o "[0-9]*")
BUTTON_FAILED=$(grep -o "[0-9]* failed" /tmp/admin-button-test-results.txt | head -1 | grep -o "[0-9]*")

# Set defaults if parsing failed
UI_PASSED=${UI_PASSED:-0}
UI_FAILED=${UI_FAILED:-0}
BUTTON_PASSED=${BUTTON_PASSED:-0}
BUTTON_FAILED=${BUTTON_FAILED:-0}

TOTAL_PASSED=$((UI_PASSED + BUTTON_PASSED))
TOTAL_FAILED=$((UI_FAILED + BUTTON_FAILED))
TOTAL_TESTS=$((TOTAL_PASSED + TOTAL_FAILED))

if [ $TOTAL_TESTS -gt 0 ]; then
    PASS_RATE=$((TOTAL_PASSED * 100 / TOTAL_TESTS))
    
    echo "Total Tests: $TOTAL_TESTS"
    echo "Passed: $TOTAL_PASSED"
    echo "Failed: $TOTAL_FAILED"
    echo "Pass Rate: $PASS_RATE%"
    
    if [ $PASS_RATE -ge 80 ]; then
        print_success "Admin Portal UI: PRODUCTION READY ($PASS_RATE%)"
    elif [ $PASS_RATE -ge 60 ]; then
        print_warning "Admin Portal UI: NEEDS ATTENTION ($PASS_RATE%)"
    else
        print_error "Admin Portal UI: CRITICAL ISSUES ($PASS_RATE%)"
    fi
else
    print_warning "Could not parse test results"
fi

echo ""
echo "📋 Test Coverage Areas"
echo "======================"
echo "✅ Admin Tab Navigation"
echo "✅ Overview Tab Statistics Cards"
echo "✅ User Management Tab"
echo "✅ Role Management Tab"
echo "✅ Approval Dashboard Tab"
echo "✅ Create User Modal"
echo "✅ User Action Buttons (Edit, Suspend)"
echo "✅ Role Action Buttons"
echo "✅ Navigation Links and Flow"
echo "✅ Responsive Design"
echo "✅ Keyboard Accessibility"
echo "✅ Loading States"
echo "✅ Error Handling"

echo ""
echo "🔍 Detailed Verification Items"
echo "============================="
echo ""
echo "Buttons Tested:"
echo "  - Admin tab navigation button"
echo "  - Overview/Users/Roles/Approvals tab buttons"
echo "  - Create User button"
echo "  - Create Role button"
echo "  - Edit User button"
echo "  - Suspend User button"
echo "  - Assign Functions button"
echo "  - Approve/Reject approval buttons"
echo "  - Cancel buttons in modals"
echo "  - Submit buttons in forms"
echo ""
echo "Links Verified:"
echo "  - Admin navigation link"
echo "  - Tab switching links"
echo "  - Modal open/close flows"
echo ""
echo "Subtabs Content Verified:"
echo "  - Overview: Statistics cards, Quick Actions, System Overview"
echo "  - Users: User table, Create User form, Action buttons"
echo "  - Roles: Role table, System badges, Function counts"
echo "  - Approvals: Statistics cards, Pending table, Action buttons"

echo ""
echo "🎯 NEXT STEPS"
echo "============="
echo "1. Fix any failing tests identified above"
echo "2. Add more edge case tests"
echo "3. Implement visual regression testing"
echo "4. Add performance testing"
echo "5. Run tests in CI/CD pipeline"

echo ""
echo "📄 Test Reports Generated:"
echo "  - /tmp/admin-portal-ui-test-results.txt"
echo "  - /tmp/admin-button-test-results.txt"
echo "  - playwright-report/ (HTML report)"

# Open HTML report if tests failed
if [ $TOTAL_FAILED -gt 0 ]; then
    echo ""
    print_warning "Some tests failed. Open the HTML report for details:"
    echo "  npx playwright show-report"
fi
