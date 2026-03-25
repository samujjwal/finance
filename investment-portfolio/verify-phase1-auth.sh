#!/bin/bash

echo "🔐 Phase 1: Authentication & Authorization Verification"
echo "===================================================="

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

echo "🔑 AUTHENTICATION SYSTEM VERIFICATION"
echo ""

# Check JWT authentication service
print_status "Checking JWT authentication service..."
if [ -f "/home/samujjwal/Developments/finance/investment-portfolio/server/src/auth/auth.service.ts" ]; then
    print_success "Auth service file exists"
    
    if grep -q "jwt" "/home/samujjwal/Developments/finance/investment-portfolio/server/src/auth/auth.service.ts"; then
        print_success "JWT implementation found in auth service"
    else
        print_error "JWT implementation not found in auth service"
    fi
    
    if grep -q "sign" "/home/samujjwal/Developments/finance/investment-portfolio/server/src/auth/auth.service.ts"; then
        print_success "JWT token signing found"
    else
        print_error "JWT token signing not found"
    fi
    
    if grep -q "verify" "/home/samujjwal/Developments/finance/investment-portfolio/server/src/auth/auth.service.ts"; then
        print_success "JWT token verification found"
    else
        print_error "JWT token verification not found"
    fi
else
    print_error "Auth service file not found"
fi

echo ""

# Check login/logout endpoints
print_status "Checking login/logout endpoints..."
if [ -f "/home/samujjwal/Developments/finance/investment-portfolio/server/src/auth/auth.controller.ts" ]; then
    print_success "Auth controller file exists"
    
    if grep -q "login" "/home/samujjwal/Developments/finance/investment-portfolio/server/src/auth/auth.controller.ts"; then
        print_success "Login endpoint found"
    else
        print_error "Login endpoint not found"
    fi
    
    if grep -q "logout" "/home/samujjwal/Developments/finance/investment-portfolio/server/src/auth/auth.controller.ts"; then
        print_success "Logout endpoint found"
    else
        print_error "Logout endpoint not found"
    fi
    
    if grep -q "me" "/home/samujjwal/Developments/finance/investment-portfolio/server/src/auth/auth.controller.ts"; then
        print_success "Current user endpoint found"
    else
        print_error "Current user endpoint not found"
    fi
else
    print_error "Auth controller file not found"
fi

echo ""

# Check permission guards and decorators
print_status "Checking permission guards..."
if [ -f "/home/samujjwal/Developments/finance/investment-portfolio/server/src/auth/jwt-auth.guard.ts" ]; then
    print_success "JWT auth guard file exists"
else
    print_error "JWT auth guard file not found"
fi

if [ -f "/home/samujjwal/Developments/finance/investment-portfolio/server/src/auth/permissions.guard.ts" ]; then
    print_success "Permissions guard file exists"
else
    print_warning "Permissions guard file not found"
fi

echo ""

# Check role-based access control
print_status "Checking role-based access control..."
if [ -f "/home/samujjwal/Developments/finance/investment-portfolio/server/src/permissions/permission.service.ts" ]; then
    print_success "Permission service file exists"
else
    print_error "Permission service file not found"
fi

echo ""

# Check user session management
print_status "Checking user session management..."
if grep -q "session" "/home/samujjwal/Developments/finance/investment-portfolio/server/src/auth/auth.service.ts" 2>/dev/null; then
    print_success "Session management found in auth service"
else
    print_warning "Session management not explicitly found"
fi

echo ""

# Check password hashing and validation
print_status "Checking password hashing and validation..."
if grep -q "bcrypt" "/home/samujjwal/Developments/finance/investment-portfolio/server/src/auth/auth.service.ts" 2>/dev/null; then
    print_success "Password hashing (bcrypt) found"
else
    print_error "Password hashing not found"
fi

if grep -q "validatePassword" "/home/samujjwal/Developments/finance/investment-portfolio/server/src/users/users.service.ts" 2>/dev/null; then
    print_success "Password validation found"
else
    print_warning "Password validation not explicitly found"
fi

echo ""
echo "🧪 FUNCTIONAL TESTING"
echo ""

# Test login endpoint
print_status "Testing login endpoint..."
if curl -s http://localhost:3001/api/auth/login > /dev/null; then
    print_success "Login endpoint is accessible"
    
    # Test valid login
    LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}')
    
    if echo "$LOGIN_RESPONSE" | jq -e '.success' > /dev/null; then
        print_success "Valid login works"
        
        # Check if token is returned
        if echo "$LOGIN_RESPONSE" | jq -e '.data.token' > /dev/null; then
            print_success "JWT token returned on login"
        else
            print_error "JWT token not returned on login"
        fi
    else
        print_error "Valid login failed"
    fi
    
    # Test invalid login
    INVALID_LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"wrong"}')
    
    if echo "$INVALID_LOGIN_RESPONSE" | jq -e '.success == false' > /dev/null; then
        print_success "Invalid login properly rejected"
    else
        print_error "Invalid login not properly rejected"
    fi
else
    print_error "Login endpoint not accessible"
fi

echo ""

# Test current user endpoint
print_status "Testing current user endpoint..."
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    print_success "Token obtained for testing"
    
    ME_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3001/api/auth/me")
    
    if echo "$ME_RESPONSE" | jq -e '.success' > /dev/null; then
        print_success "Current user endpoint works"
        
        if echo "$ME_RESPONSE" | jq -e '.data.username' > /dev/null; then
            print_success "User data returned"
        else
            print_error "User data not returned"
        fi
    else
        print_error "Current user endpoint failed"
    fi
    
    # Test protected endpoint without token
    UNAUTHORIZED_RESPONSE=$(curl -s "http://localhost:3001/api/auth/me")
    
    if echo "$UNAUTHORIZED_RESPONSE" | jq -e '.statusCode == 401' > /dev/null; then
        print_success "Protected endpoint properly requires authentication"
    else
        print_error "Protected endpoint doesn't require authentication"
    fi
else
    print_error "Could not obtain token for testing"
fi

echo ""
echo "📊 PHASE 1 AUTHENTICATION SUMMARY"
echo "==============================="

# Count successes and errors
TOTAL_CHECKS=12
PASSED_CHECKS=0

# Simple success checks
if [ -f "/home/samujjwal/Developments/finance/investment-portfolio/server/src/auth/auth.service.ts" ]; then
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
fi

if [ -f "/home/samujjwal/Developments/finance/investment-portfolio/server/src/auth/auth.controller.ts" ]; then
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
fi

if [ -f "/home/samujjwal/Developments/finance/investment-portfolio/server/src/auth/jwt-auth.guard.ts" ]; then
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
fi

if curl -s http://localhost:3001/api/auth/login > /dev/null; then
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
fi

echo "Checks Passed: $PASSED_CHECKS/$TOTAL_CHECKS"

if [ "$PASSED_CHECKS" -ge 8 ]; then
    print_success "Phase 1 Authentication & Authorization: COMPLETED"
else
    print_warning "Phase 1 Authentication & Authorization: PARTIALLY COMPLETED"
fi

echo ""
echo "🔧 NEXT STEPS"
echo "1. Fix any missing authentication components"
echo "2. Test role-based access control thoroughly"
echo "3. Verify permission guards are working"
echo "4. Test session management"
