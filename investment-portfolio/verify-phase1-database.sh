#!/bin/bash

echo "🔍 Phase 1: Database & Core Setup Verification"
echo "============================================"

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

echo "🗄️  DATABASE SETUP VERIFICATION"
echo ""

# Check Prisma schema
print_status "Checking Prisma schema..."
if [ -f "/home/samujjwal/Developments/finance/investment-portfolio/server/prisma/schema.prisma" ]; then
    print_success "Prisma schema file exists"
    
    # Check if schema has required models
    if grep -q "model User" "/home/samujjwal/Developments/finance/investment-portfolio/server/prisma/schema.prisma"; then
        print_success "User model found in schema"
    else
        print_error "User model not found in schema"
    fi
    
    if grep -q "model Role" "/home/samujjwal/Developments/finance/investment-portfolio/server/prisma/schema.prisma"; then
        print_success "Role model found in schema"
    else
        print_error "Role model not found in schema"
    fi
    
    if grep -q "model Company" "/home/samujjwal/Developments/finance/investment-portfolio/server/prisma/schema.prisma"; then
        print_success "Company model found in schema"
    else
        print_error "Company model not found in schema"
    fi
    
    if grep -q "model Transaction" "/home/samujjwal/Developments/finance/investment-portfolio/server/prisma/schema.prisma"; then
        print_success "Transaction model found in schema"
    else
        print_error "Transaction model not found in schema"
    fi
    
    if grep -q "model Portfolio" "/home/samujjwal/Developments/finance/investment-portfolio/server/prisma/schema.prisma"; then
        print_success "Portfolio model found in schema"
    else
        print_error "Portfolio model not found in schema"
    fi
else
    print_error "Prisma schema file not found"
fi

echo ""

# Check database migrations
print_status "Checking database migrations..."
if [ -d "/home/samujjwal/Developments/finance/investment-portfolio/server/prisma/migrations" ]; then
    print_success "Migrations directory exists"
    
    MIGRATION_COUNT=$(find "/home/samujjwal/Developments/finance/investment-portfolio/server/prisma/migrations" -name "*.sql" | wc -l)
    if [ "$MIGRATION_COUNT" -gt 0 ]; then
        print_success "Found $MIGRATION_COUNT migration files"
    else
        print_warning "No migration files found"
    fi
else
    print_warning "Migrations directory not found"
fi

echo ""

# Check seed data
print_status "Checking database seed data..."
if [ -f "/home/samujjwal/Developments/finance/investment-portfolio/server/prisma/seed.ts" ]; then
    print_success "Seed file exists"
    
    # Check if seed has required data
    if grep -q "userTypes" "/home/samujjwal/Developments/finance/investment-portfolio/server/prisma/seed.ts"; then
        print_success "User types seed data found"
    else
        print_error "User types seed data not found"
    fi
    
    if grep -q "functions" "/home/samujjwal/Developments/finance/investment-portfolio/server/prisma/seed.ts"; then
        print_success "Functions seed data found"
    else
        print_error "Functions seed data not found"
    fi
    
    if grep -q "branches" "/home/samujjwal/Developments/finance/investment-portfolio/server/prisma/seed.ts"; then
        print_success "Branches seed data found"
    else
        print_error "Branches seed data not found"
    fi
    
    if grep -q "admin" "/home/samujjwal/Developments/finance/investment-portfolio/server/prisma/seed.ts"; then
        print_success "Admin user seed data found"
    else
        print_error "Admin user seed data not found"
    fi
else
    print_error "Seed file not found"
fi

echo ""

# Check database connection
print_status "Testing database connection..."
if curl -s http://localhost:3001/api/auth/setup-status > /dev/null; then
    print_success "Database connection working"
    
    # Test database health
    DB_STATUS=$(curl -s http://localhost:3001/api/auth/setup-status | jq -r '.data.databaseConnected')
    if [ "$DB_STATUS" = "true" ]; then
        print_success "Database is connected"
    else
        print_error "Database connection failed"
    fi
else
    print_error "Backend server not running or database connection failed"
fi

echo ""

# Check base repository pattern
print_status "Checking base repository pattern..."
if [ -f "/home/samujjwal/Developments/finance/investment-portfolio/server/src/common/base.repository.ts" ]; then
    print_success "Base repository file exists"
else
    print_warning "Base repository file not found"
fi

echo ""

# Check error handling framework
print_status "Checking error handling framework..."
if [ -f "/home/samujjwal/Developments/finance/investment-portfolio/server/src/common/exceptions/"* ]; then
    print_success "Exception handling files exist"
    
    if [ -f "/home/samujjwal/Developments/finance/investment-portfolio/server/src/common/exceptions/bad-request.exception.ts" ]; then
        print_success "BadRequestException found"
    fi
    
    if [ -f "/home/samujjwal/Developments/finance/investment-portfolio/server/src/common/exceptions/not-found.exception.ts" ]; then
        print_success "NotFoundException found"
    fi
    
    if [ -f "/home/samujjwal/Developments/finance/investment-portfolio/server/src/common/exceptions/unauthorized.exception.ts" ]; then
        print_success "UnauthorizedException found"
    fi
else
    print_warning "Exception handling files not found"
fi

echo ""
echo "📊 PHASE 1 DATABASE SETUP SUMMARY"
echo "================================"

# Count successes and errors
TOTAL_CHECKS=15
PASSED_CHECKS=0

# Simple success check based on file existence
if [ -f "/home/samujjwal/Developments/finance/investment-portfolio/server/prisma/schema.prisma" ]; then
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
fi

if [ -d "/home/samujjwal/Developments/finance/investment-portfolio/server/prisma/migrations" ]; then
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
fi

if [ -f "/home/samujjwal/Developments/finance/investment-portfolio/server/prisma/seed.ts" ]; then
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
fi

if curl -s http://localhost:3001/api/auth/setup-status > /dev/null; then
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
fi

echo "Checks Passed: $PASSED_CHECKS/$TOTAL_CHECKS"

if [ "$PASSED_CHECKS" -ge 10 ]; then
    print_success "Phase 1 Database & Core Setup: COMPLETED"
else
    print_warning "Phase 1 Database & Core Setup: PARTIALLY COMPLETED"
fi

echo ""
echo "🔧 NEXT STEPS"
echo "1. Fix any missing components identified above"
echo "2. Run database migrations: npx prisma migrate dev"
echo "3. Seed database: npx prisma db seed"
echo "4. Verify database connection and data"
