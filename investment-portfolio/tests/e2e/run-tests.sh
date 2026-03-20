#!/bin/bash

# Investment Portfolio E2E Test Runner
# Comprehensive test execution script with reporting

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_URL="http://localhost:1420"
TEST_DIR="tests/e2e"
REPORT_DIR="test-results"
PLAYWRIGHT_REPORT_DIR="playwright-report"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    
    # Check if Playwright is installed
    if ! npm list @playwright/test &> /dev/null; then
        log_warning "Playwright is not installed. Installing..."
        npm install --save-dev @playwright/test
    fi
    
    # Check if Playwright browsers are installed
    if ! npx playwright --version &> /dev/null; then
        log_warning "Playwright browsers not installed. Installing..."
        npx playwright install
    fi
    
    log_success "Prerequisites check completed"
}

# Start application
start_app() {
    log_info "Starting application..."
    
    # Check if app is already running
    if curl -s "$APP_URL" > /dev/null; then
        log_info "Application is already running"
        return 0
    fi
    
    # Start the app in background
    npm run dev > /dev/null 2>&1 &
    APP_PID=$!
    
    # Wait for app to start
    for i in {1..30}; do
        if curl -s "$APP_URL" > /dev/null; then
            log_success "Application started successfully (PID: $APP_PID)"
            return 0
        fi
        sleep 1
    done
    
    log_error "Application failed to start"
    kill $APP_PID 2>/dev/null || true
    exit 1
}

# Stop application
stop_app() {
    if [ ! -z "$APP_PID" ]; then
        log_info "Stopping application (PID: $APP_PID)..."
        kill $APP_PID 2>/dev/null || true
        wait $APP_PID 2>/dev/null || true
        log_success "Application stopped"
    fi
}

# Clean up test results
cleanup() {
    log_info "Cleaning up previous test results..."
    rm -rf "$REPORT_DIR"
    rm -rf "$PLAYWRIGHT_REPORT_DIR"
    mkdir -p "$REPORT_DIR"
    mkdir -p "$PLAYWRIGHT_REPORT_DIR"
}

# Run tests
run_tests() {
    local test_type=$1
    local browser=$2
    local headed=$3
    
    log_info "Running tests: $test_type"
    
    local test_command="npx playwright test"
    
    # Add browser filter if specified
    if [ "$browser" != "" ]; then
        test_command="$test_command --project=$browser"
    fi
    
    # Add headed mode if specified
    if [ "$headed" = "true" ]; then
        test_command="$test_command --headed"
    fi
    
    # Add specific test file if specified
    case $test_type in
        "smoke")
            test_command="$test_command --grep \"Authentication\""
            ;;
        "transactions")
            test_command="$test_command --grep \"Transaction Management\""
            ;;
        "reports")
            test_command="$test_command --grep \"Reporting Features\""
            ;;
        "dashboard")
            test_command="$test_command --grep \"Dashboard Features\""
            ;;
        "performance")
            test_command="$test_command --grep \"Performance\""
            ;;
        "mobile")
            test_command="$test_command --project=\"Mobile Chrome\" --project=\"Mobile Safari\""
            ;;
        "accessibility")
            test_command="$test_command --grep \"Accessibility\""
            ;;
        "security")
            test_command="$test_command --grep \"Security\""
            ;;
        "workflow")
            test_command="$test_command --grep \"End-to-End User Journeys\""
            ;;
    esac
    
    # Run the tests
    log_info "Executing: $test_command"
    eval $test_command
    
    if [ $? -eq 0 ]; then
        log_success "Tests completed successfully"
    else
        log_error "Tests failed"
        return 1
    fi
}

# Generate reports
generate_reports() {
    log_info "Generating test reports..."
    
    # HTML report
    if [ -d "$PLAYWRIGHT_REPORT_DIR" ]; then
        log_success "HTML report generated: $PLAYWRIGHT_REPORT_DIR/index.html"
    fi
    
    # JSON report
    if [ -f "test-results.json" ]; then
        log_success "JSON report generated: test-results.json"
    fi
    
    # Screenshots and videos
    if [ -d "$REPORT_DIR" ]; then
        local screenshot_count=$(find "$REPORT_DIR" -name "*.png" | wc -l)
        local video_count=$(find "$REPORT_DIR" -name "*.webm" | wc -l)
        
        if [ $screenshot_count -gt 0 ]; then
            log_info "Screenshots captured: $screenshot_count"
        fi
        
        if [ $video_count -gt 0 ]; then
            log_info "Videos recorded: $video_count"
        fi
    fi
}

# Main execution
main() {
    local test_type=${1:-"all"}
    local browser=${2:-""}
    local headed=${3:-"false"}
    
    echo "=========================================="
    echo "Investment Portfolio E2E Test Runner"
    echo "=========================================="
    echo "Test Type: $test_type"
    echo "Browser: ${browser:-"All"}"
    echo "Headed Mode: $headed"
    echo "=========================================="
    
    # Trap to ensure cleanup
    trap stop_app EXIT
    
    # Check prerequisites
    check_prerequisites
    
    # Clean up
    cleanup
    
    # Start application
    start_app
    
    # Run tests
    case $test_type in
        "all")
            run_tests "all" "$browser" "$headed"
            ;;
        "smoke"|"transactions"|"reports"|"dashboard"|"performance"|"mobile"|"accessibility"|"security"|"workflow")
            run_tests "$test_type" "$browser" "$headed"
            ;;
        *)
            log_error "Unknown test type: $test_type"
            echo "Available test types: all, smoke, transactions, reports, dashboard, performance, mobile, accessibility, security, workflow"
            exit 1
            ;;
    esac
    
    # Generate reports
    generate_reports
    
    echo "=========================================="
    log_success "Test execution completed!"
    echo "=========================================="
    echo "View HTML report: open $PLAYWRIGHT_REPORT_DIR/index.html"
    echo "View JSON report: cat test-results.json"
    echo "=========================================="
}

# Help function
show_help() {
    echo "Investment Portfolio E2E Test Runner"
    echo ""
    echo "Usage: $0 [test_type] [browser] [headed]"
    echo ""
    echo "Test Types:"
    echo "  all          - Run all tests (default)"
    echo "  smoke        - Run smoke tests (authentication only)"
    echo "  transactions - Run transaction management tests"
    echo "  reports      - Run reporting features tests"
    echo "  dashboard    - Run dashboard features tests"
    echo "  performance  - Run performance tests"
    echo "  mobile       - Run mobile device tests"
    echo "  accessibility- Run accessibility tests"
    echo "  security     - Run security tests"
    echo "  workflow     - Run end-to-end workflow tests"
    echo ""
    echo "Browsers:"
    echo "  chromium     - Run on Chrome/Chromium"
    echo "  firefox      - Run on Firefox"
    echo "  webkit       - Run on Safari/Webkit"
    echo "  (empty)      - Run on all configured browsers"
    echo ""
    echo "Headed Mode:"
    echo "  true         - Run tests in visible browser"
    echo "  false        - Run tests in headless mode (default)"
    echo ""
    echo "Examples:"
    echo "  $0                           # Run all tests on all browsers"
    echo "  $0 smoke                      # Run smoke tests"
    echo "  $0 transactions chromium     # Run transaction tests on Chrome"
    echo "  $0 reports firefox true      # Run report tests on Firefox (visible)"
    echo "  $0 mobile                     # Run mobile tests"
}

# Check for help flag
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    show_help
    exit 0
fi

# Run main function
main "$@"
