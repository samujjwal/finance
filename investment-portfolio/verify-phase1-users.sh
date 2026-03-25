#!/bin/bash

echo "👥 Phase 1: User & Role Management Verification"
echo "=============================================="

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

echo "👤 USER CRUD OPERATIONS VERIFICATION"
echo ""

# Get auth token
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    print_error "Could not obtain authentication token"
    exit 1
fi

print_success "Authentication token obtained"

# Test user CRUD operations
print_status "Testing user CRUD operations..."

# Test GET users
print_status "Testing GET users endpoint..."
USERS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3001/api/users")

if echo "$USERS_RESPONSE" | jq -e '.success' > /dev/null; then
    print_success "GET users endpoint works"
    
    USERS_COUNT=$(echo "$USERS_RESPONSE" | jq '.data.users | length')
    print_success "Found $USERS_COUNT users"
    
    # Check if admin user exists
    ADMIN_EXISTS=$(echo "$USERS_RESPONSE" | jq '.data.users[] | select(.username == "admin") | length')
    if [ "$ADMIN_EXISTS" -gt 0 ]; then
        print_success "Admin user found in database"
    else
        print_error "Admin user not found in database"
    fi
else
    print_error "GET users endpoint failed"
fi

echo ""

# Test GET user by ID
print_status "Testing GET user by ID endpoint..."
ADMIN_ID=$(echo "$USERS_RESPONSE" | jq -r '.data.users[] | select(.username == "admin") | .id')

if [ -n "$ADMIN_ID" ] && [ "$ADMIN_ID" != "null" ]; then
    USER_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3001/api/users/$ADMIN_ID")
    
    if echo "$USER_RESPONSE" | jq -e '.success' > /dev/null; then
        print_success "GET user by ID endpoint works"
    else
        print_error "GET user by ID endpoint failed"
    fi
else
    print_error "Could not get admin user ID"
fi

echo ""

# Test POST create user
print_status "Testing POST create user endpoint..."
CREATE_USER_RESPONSE=$(curl -s -X POST http://localhost:3001/api/users -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{
  "userId": "TEST001",
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "firstName": "Test",
  "surname": "User",
  "branchId": "BRANCH001",
  "userTypeId": "VIEW"
}')

if echo "$CREATE_USER_RESPONSE" | jq -e '.success' > /dev/null; then
    print_success "POST create user endpoint works"
    
    # Check if user was created (should be pending approval)
    CREATED_USER_ID=$(echo "$CREATE_USER_RESPONSE" | jq -r '.data.id')
    if [ -n "$CREATED_USER_ID" ] && [ "$CREATED_USER_ID" != "null" ]; then
        print_success "User created successfully (ID: $CREATED_USER_ID)"
        
        # Test user approval
        print_status "Testing user approval workflow..."
        APPROVE_RESPONSE=$(curl -s -X POST http://localhost:3001/api/users/$CREATED_USER_ID/approve -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"action": "APPROVE"}')
        
        if echo "$APPROVE_RESPONSE" | jq -e '.success' > /dev/null; then
            print_success "User approval workflow works"
        else
            print_error "User approval workflow failed"
        fi
    else
        print_error "User creation failed - no ID returned"
    fi
else
    print_error "POST create user endpoint failed"
    echo "Response: $CREATE_USER_RESPONSE"
fi

echo ""

# Test user search and filtering
print_status "Testing user search and filtering..."
SEARCH_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3001/api/users?search=admin")

if echo "$SEARCH_RESPONSE" | jq -e '.success' > /dev/null; then
    print_success "User search endpoint works"
    
    SEARCH_RESULTS=$(echo "$SEARCH_RESPONSE" | jq '.data.users | length')
    print_success "Search returned $SEARCH_RESULTS results"
else
    print_error "User search endpoint failed"
fi

echo ""

# Test user suspension
print_status "Testing user suspension..."
if [ -n "$CREATED_USER_ID" ] && [ "$CREATED_USER_ID" != "null" ]; then
    SUSPEND_RESPONSE=$(curl -s -X POST http://localhost:3001/api/users/$CREATED_USER_ID/suspend -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"reason": "Test suspension"}')
    
    if echo "$SUSPEND_RESPONSE" | jq -e '.success' > /dev/null; then
        print_success "User suspension works"
        
        # Test user unlock
        UNLOCK_RESPONSE=$(curl -s -X POST http://localhost:3001/api/users/$CREATED_USER_ID/unlock -H "Authorization: Bearer $TOKEN")
        
        if echo "$UNLOCK_RESPONSE" | jq -e '.success' > /dev/null; then
            print_success "User unlock works"
        else
            print_error "User unlock failed"
        fi
    else
        print_error "User suspension failed"
    fi
else
    print_warning "Skipping suspension test - no user ID available"
fi

echo ""
echo "🔐 ROLE MANAGEMENT VERIFICATION"
echo ""

# Test role CRUD operations
print_status "Testing role management endpoints..."

# Test GET roles
ROLES_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3001/api/roles")

if echo "$ROLES_RESPONSE" | jq -e '.success' > /dev/null; then
    print_success "GET roles endpoint works"
    
    ROLES_COUNT=$(echo "$ROLES_RESPONSE" | jq '.data.roles | length')
    print_success "Found $ROLES_COUNT roles"
else
    print_error "GET roles endpoint failed"
fi

echo ""

# Test GET functions
FUNCTIONS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3001/api/roles/functions")

if echo "$FUNCTIONS_RESPONSE" | jq -e '.success' > /dev/null; then
    print_success "GET functions endpoint works"
    
    FUNCTIONS_COUNT=$(echo "$FUNCTIONS_RESPONSE" | jq '.data | length')
    print_success "Found $FUNCTION_COUNT functions"
else
    print_error "GET functions endpoint failed"
fi

echo ""

# Test approval workflow engine
print_status "Testing approval workflow engine..."

# Get pending approvals
PENDING_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3001/api/approvals/pending")

if echo "$PENDING_RESPONSE" | jq -e '.success' > /dev/null; then
    print_success "Get pending approvals endpoint works"
    
    PENDING_COUNT=$(echo "$PENDING_RESPONSE" | jq '.data | length')
    print_success "Found $PENDING_COUNT pending approvals"
else
    print_error "Get pending approvals endpoint failed"
fi

echo ""

# Test audit trail logging
print_status "Testing audit trail logging..."
AUDIT_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3001/api/audit")

if echo "$AUDIT_RESPONSE" | jq -e '.success' > /dev/null; then
    print_success "Audit trail endpoint works"
    
    AUDIT_COUNT=$(echo "$AUDIT_RESPONSE" | jq '.data.auditLogs | length')
    print_success "Found $AUDIT_COUNT audit logs"
else
    print_error "Audit trail endpoint failed"
fi

echo ""
echo "📊 PHASE 1 USER & ROLE MANAGEMENT SUMMARY"
echo "=========================================="

# Count successes
TOTAL_CHECKS=15
PASSED_CHECKS=0

# Simple success checks
if echo "$USERS_RESPONSE" | jq -e '.success' > /dev/null; then
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
fi

if echo "$CREATE_USER_RESPONSE" | jq -e '.success' > /dev/null; then
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
fi

if echo "$ROLES_RESPONSE" | jq -e '.success' > /dev/null; then
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
fi

if echo "$FUNCTIONS_RESPONSE" | jq -e '.success' > /dev/null; then
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
fi

echo "Checks Passed: $PASSED_CHECKS/$TOTAL_CHECKS"

if [ "$PASSED_CHECKS" -ge 10 ]; then
    print_success "Phase 1 User & Role Management: COMPLETED"
else
    print_warning "Phase 1 User & Role Management: PARTIALLY COMPLETED"
fi

echo ""
echo "🔧 NEXT STEPS"
echo "1. Fix any missing user management components"
echo "2. Test approval workflows thoroughly"
echo "3. Verify audit trail logging is complete"
echo "4. Test user suspension and lock management"
