#!/bin/bash

echo "🎛️  Phase 4: Admin Portal Verification"
echo "====================================="

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

echo "🎛️  ADMIN DASHBOARD VERIFICATION"
echo ""

# Check if frontend is running
print_status "Checking frontend availability..."
if curl -s http://localhost:1420 > /dev/null; then
    print_success "Frontend is running on http://localhost:1420"
else
    print_error "Frontend is not running"
fi

# Check if backend is running
print_status "Checking backend availability..."
if curl -s http://localhost:3001/api/auth/setup-status > /dev/null; then
    print_success "Backend is running on http://localhost:3001"
else
    print_error "Backend is not running"
fi

echo ""

# Get auth token
print_status "Getting authentication token..."
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    print_error "Could not obtain authentication token"
    exit 1
fi

print_success "Authentication token obtained"

echo ""

# Test admin dashboard data
print_status "Testing admin dashboard data endpoints..."

# Test users statistics
USERS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3001/api/users")
if echo "$USERS_RESPONSE" | jq -e '.success' > /dev/null; then
    USERS_TOTAL=$(echo "$USERS_RESPONSE" | jq '.data.pagination.total // 0')
    USERS_COUNT=$(echo "$USERS_RESPONSE" | jq '.data.users | length')
    ACTIVE_USERS=$(echo "$USERS_RESPONSE" | jq '.data.users | map(select(.status == "ACTIVE")) | length')
    
    print_success "Users data: Total=$USERS_TOTAL, Active=$ACTIVE_USERS, Array=$USERS_COUNT"
else
    print_error "Users endpoint failed"
fi

# Test roles statistics
ROLES_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3001/api/roles")
if echo "$ROLES_RESPONSE" | jq -e '.success' > /dev/null; then
    ROLES_COUNT=$(echo "$ROLES_RESPONSE" | jq '.data.roles | length // 0')
    print_success "Roles data: Total=$ROLES_COUNT"
else
    print_error "Roles endpoint failed"
fi

# Test approvals statistics
APPROVALS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3001/api/approvals/pending")
if echo "$APPROVALS_RESPONSE" | jq -e '.success' > /dev/null; then
    PENDING_COUNT=$(echo "$APPROVALS_RESPONSE" | jq '.data | length // 0')
    print_success "Approvals data: Pending=$PENDING_COUNT"
else
    print_error "Approvals endpoint failed"
fi

echo ""

# Test user management interface
print_status "Testing user management functionality..."

# Test user permissions
USER_ID=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3001/api/auth/me" | jq -r '.data.id')
USER_FUNCTIONS=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3001/api/roles/user/$USER_ID/functions")

if echo "$USER_FUNCTIONS" | jq -e '.success' > /dev/null; then
    FUNCTIONS_COUNT=$(echo "$USER_FUNCTIONS" | jq '.data | length')
    HAS_USER_VIEW=$(echo "$USER_FUNCTIONS" | jq '.data[] | select(.name == "USER_VIEW") | length')
    HAS_ROLE_VIEW=$(echo "$USER_FUNCTIONS" | jq '.data[] | select(.name == "ROLE_VIEW") | length')
    HAS_APPROVAL_VIEW=$(echo "$USER_FUNCTIONS" | jq '.data[] | select(.name == "APPROVAL_VIEW") | length')
    
    print_success "User permissions: $FUNCTIONS_COUNT functions"
    print_success "Permission checks: USER_VIEW=$HAS_USER_VIEW, ROLE_VIEW=$HAS_ROLE_VIEW, APPROVAL_VIEW=$HAS_APPROVAL_VIEW"
else
    print_error "User permissions endpoint failed"
fi

echo ""

# Test role management interface
print_status "Testing role management functionality..."

# Test role functions assignment
ROLES_LIST=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3001/api/roles")
if echo "$ROLES_LIST" | jq -e '.success' > /dev/null; then
    # Get first role ID
    ROLE_ID=$(echo "$ROLES_LIST" | jq -r '.data.roles[0].id')
    
    if [ -n "$ROLE_ID" ] && [ "$ROLE_ID" != "null" ]; then
        # Test get role functions
        ROLE_FUNCTIONS=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3001/api/roles/$ROLE_ID/functions")
        
        if echo "$ROLE_FUNCTIONS" | jq -e '.success' > /dev/null; then
            ROLE_FUNCTIONS_COUNT=$(echo "$ROLE_FUNCTIONS" | jq '.data | length')
            print_success "Role functions: $ROLE_FUNCTIONS_COUNT functions for role $ROLE_ID"
        else
            print_error "Role functions endpoint failed"
        fi
    else
        print_warning "No roles found for testing"
    fi
else
    print_error "Roles endpoint failed"
fi

echo ""

# Test approval dashboard
print_status "Testing approval dashboard functionality..."

# Test approval statistics
APPROVAL_STATS=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3001/api/approvals/stats")
if echo "$APPROVAL_STATS" | jq -e '.success' > /dev/null; then
    TOTAL_PENDING=$(echo "$APPROVAL_STATS" | jq '.data.totalPending // 0')
    TOTAL_APPROVED=$(echo "$APPROVAL_STATS" | jq '.data.totalApproved // 0')
    TOTAL_REJECTED=$(echo "$APPROVAL_STATS" | jq '.data.totalRejected // 0')
    
    print_success "Approval stats: Pending=$TOTAL_PENDING, Approved=$TOTAL_APPROVED, Rejected=$TOTAL_REJECTED"
else
    print_error "Approval stats endpoint failed"
fi

echo ""

# Test audit log viewer
print_status "Testing audit log viewer..."

AUDIT_LOGS=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3001/api/audit")
if echo "$AUDIT_LOGS" | jq -e '.success' > /dev/null; then
    AUDIT_COUNT=$(echo "$AUDIT_LOGS" | jq '.data.auditLogs | length // 0')
    print_success "Audit logs: $AUDIT_COUNT entries found"
else
    print_error "Audit logs endpoint failed"
fi

echo ""

# Test system configuration
print_status "Testing system configuration..."

# Test system settings
if [ -f "/home/samujjwal/Developments/finance/investment-portfolio/server/src/system/"* ]; then
    print_success "System configuration files exist"
else
    print_warning "System configuration files not found"
fi

# Test fee rate management
FEE_RATES=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3001/api/fee-rates")
if echo "$FEE_RATES" | jq -e '.success' > /dev/null; then
    FEE_COUNT=$(echo "$FEE_RATES" | jq '.data | length // 0')
    print_success "Fee rates: $FEE_COUNT fee rates found"
else
    print_error "Fee rates endpoint failed"
fi

echo ""

# Test system health monitoring
print_status "Testing system health monitoring..."

HEALTH_RESPONSE=$(curl -s http://localhost:3001/api/health)
if echo "$HEALTH_RESPONSE" | jq -e '.success' > /dev/null; then
    DB_STATUS=$(echo "$HEALTH_RESPONSE" | jq '.data.database')
    API_STATUS=$(echo "$HEALTH_RESPONSE" | jq '.data.api')
    print_success "System health: Database=$DB_STATUS, API=$API_STATUS"
else
    print_warning "Health endpoint not available"
fi

echo ""

# Test frontend admin components
print_status "Testing frontend admin components..."

# Check if AdminDashboard component exists
if [ -f "/home/samujjwal/Developments/finance/investment-portfolio/src/components/admin/AdminDashboard.tsx" ]; then
    print_success "AdminDashboard component exists"
else
    print_error "AdminDashboard component not found"
fi

# Check if UserManagement component exists
if [ -f "/home/samujjwal/Developments/finance/investment-portfolio/src/components/admin/UserManagement.tsx" ]; then
    print_success "UserManagement component exists"
else
    print_error "UserManagement component not found"
fi

# Check if RoleManagement component exists
if [ -f "/home/samujjwal/Developments/finance/investment-portfolio/src/components/admin/RoleManagement.tsx" ]; then
    print_success "RoleManagement component exists"
else
    print_error "RoleManagement component not found"
fi

# Check if ApprovalDashboard component exists
if [ -f "/home/samujjwal/Developments/finance/investment-portfolio/src/components/admin/ApprovalDashboard.tsx" ]; then
    print_success "ApprovalDashboard component exists"
else
    print_error "ApprovalDashboard component not found"
fi

echo ""
echo "📊 PHASE 4 ADMIN PORTAL SUMMARY"
echo "==============================="

# Count successes
TOTAL_CHECKS=20
PASSED_CHECKS=0

# Simple success checks
if curl -s http://localhost:1420 > /dev/null; then
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
fi

if curl -s http://localhost:3001/api/auth/setup-status > /dev/null; then
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
fi

if echo "$USERS_RESPONSE" | jq -e '.success' > /dev/null; then
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
fi

if echo "$ROLES_RESPONSE" | jq -e '.success' > /dev/null; then
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
fi

if echo "$APPROVALS_RESPONSE" | jq -e '.success' > /dev/null; then
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
fi

if [ -f "/home/samujjwal/Developments/finance/investment-portfolio/src/components/admin/AdminDashboard.tsx" ]; then
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
fi

if [ -f "/home/samujjwal/Developments/finance/investment-portfolio/src/components/admin/UserManagement.tsx" ]; then
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
fi

if [ -f "/home/samujjwal/Developments/finance/investment-portfolio/src/components/admin/RoleManagement.tsx" ]; then
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
fi

if [ -f "/home/samujjwal/Developments/finance/investment-portfolio/src/components/admin/ApprovalDashboard.tsx" ]; then
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
fi

echo "Checks Passed: $PASSED_CHECKS/$TOTAL_CHECKS"

if [ "$PASSED_CHECKS" -ge 15 ]; then
    print_success "Phase 4 Admin Portal: COMPLETED"
else
    print_warning "Phase 4 Admin Portal: PARTIALLY COMPLETED"
fi

echo ""
echo "🔧 NEXT STEPS"
echo "1. Fix any missing admin portal components"
echo "2. Test admin dashboard UI thoroughly"
echo "3. Verify user management interface"
echo "4. Test approval dashboard functionality"
echo "5. Implement missing system configuration features"
