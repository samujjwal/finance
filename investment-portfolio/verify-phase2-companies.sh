#!/bin/bash

echo "🏢 Phase 2: Company Management Verification"
echo "=========================================="

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

echo "🏢 COMPANY CRUD OPERATIONS VERIFICATION"
echo ""

# Get auth token
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    print_error "Could not obtain authentication token"
    exit 1
fi

print_success "Authentication token obtained"

# Test company CRUD operations
print_status "Testing company CRUD operations..."

# Test GET companies
print_status "Testing GET companies endpoint..."
COMPANIES_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3001/api/companies")

if echo "$COMPANIES_RESPONSE" | jq -e '.success' > /dev/null; then
    print_success "GET companies endpoint works"
    
    COMPANIES_COUNT=$(echo "$COMPANIES_RESPONSE" | jq '.data.companies | length')
    print_success "Found $COMPANIES_COUNT companies"
else
    print_error "GET companies endpoint failed"
fi

echo ""

# Test POST create company
print_status "Testing POST create company endpoint..."
CREATE_COMPANY_RESPONSE=$(curl -s -X POST http://localhost:3001/api/companies -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{
  "symbol": "TEST",
  "name": "Test Company Ltd",
  "sector": "Technology",
  "industry": "Software",
  "description": "A test company for verification",
  "address": "123 Test Street",
  "phone": "1234567890",
  "email": "info@testcompany.com",
  "website": "https://testcompany.com",
  "listed": true,
  "listingDate": "2024-01-01",
  "paidUpCapital": 1000000000,
  "authorizedCapital": 2000000000,
  "isin": "TEST1234567890"
}')

if echo "$CREATE_COMPANY_RESPONSE" | jq -e '.success' > /dev/null; then
    print_success "POST create company endpoint works"
    
    # Check if company was created
    CREATED_COMPANY_ID=$(echo "$CREATE_COMPANY_RESPONSE" | jq -r '.data.id')
    if [ -n "$CREATED_COMPANY_ID" ] && [ "$CREATED_COMPANY_ID" != "null" ]; then
        print_success "Company created successfully (ID: $CREATED_COMPANY_ID)"
        
        # Test GET company by ID
        print_status "Testing GET company by ID endpoint..."
        COMPANY_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3001/api/companies/$CREATED_COMPANY_ID")
        
        if echo "$COMPANY_RESPONSE" | jq -e '.success' > /dev/null; then
            print_success "GET company by ID endpoint works"
        else
            print_error "GET company by ID endpoint failed"
        fi
        
        # Test PUT update company
        print_status "Testing PUT update company endpoint..."
        UPDATE_RESPONSE=$(curl -s -X PUT http://localhost:3001/api/companies/$CREATED_COMPANY_ID -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{
          "name": "Test Company Ltd - Updated",
          "description": "Updated test company description"
        }')
        
        if echo "$UPDATE_RESPONSE" | jq -e '.success' > /dev/null; then
            print_success "PUT update company endpoint works"
        else
            print_error "PUT update company endpoint failed"
        fi
        
        # Test DELETE company
        print_status "Testing DELETE company endpoint..."
        DELETE_RESPONSE=$(curl -s -X DELETE http://localhost:3001/api/companies/$CREATED_COMPANY_ID -H "Authorization: Bearer $TOKEN")
        
        if echo "$DELETE_RESPONSE" | jq -e '.success' > /dev/null; then
            print_success "DELETE company endpoint works"
        else
            print_error "DELETE company endpoint failed"
        fi
    else
        print_error "Company creation failed - no ID returned"
    fi
else
    print_error "POST create company endpoint failed"
    echo "Response: $CREATE_COMPANY_RESPONSE"
fi

echo ""

# Test company search and filtering
print_status "Testing company search and filtering..."
SEARCH_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3001/api/companies?search=Test")

if echo "$SEARCH_RESPONSE" | jq -e '.success' > /dev/null; then
    print_success "Company search endpoint works"
else
    print_error "Company search endpoint failed"
fi

echo ""

# Test company validation rules
print_status "Testing company validation rules..."

# Test duplicate symbol detection
DUPLICATE_RESPONSE=$(curl -s -X POST http://localhost:3001/api/companies -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{
  "symbol": "NABIL",
  "name": "Duplicate Test Company",
  "sector": "Banking"
}')

if echo "$DUPLICATE_RESPONSE" | jq -e '.success == false' > /dev/null; then
    print_success "Duplicate symbol validation works"
else
    print_warning "Duplicate symbol validation may not be working"
fi

echo ""

# Test bulk import/export functionality
print_status "Testing bulk import functionality..."

# Create a simple CSV file for testing
echo "symbol,name,sector,industry,description,listed
IMPORT1,Import Company 1,Technology,Software,Test import 1,true
IMPORT2,Import Company 2,Banking,Financial,Test import 2,true" > /tmp/test_companies.csv

IMPORT_RESPONSE=$(curl -s -X POST http://localhost:3001/api/companies/import -H "Authorization: Bearer $TOKEN" -F "file=@/tmp/test_companies.csv")

if echo "$IMPORT_RESPONSE" | jq -e '.success' > /dev/null; then
    print_success "Bulk import endpoint works"
    
    IMPORT_COUNT=$(echo "$IMPORT_RESPONSE" | jq '.data.imported | length')
    print_success "Imported $IMPORT_COUNT companies"
else
    print_error "Bulk import endpoint failed"
fi

echo ""

# Test export functionality
EXPORT_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3001/api/companies/export")

if echo "$EXPORT_RESPONSE" | jq -e '.success' > /dev/null; then
    print_success "Export endpoint works"
else
    print_error "Export endpoint failed"
fi

echo ""

# Test NEPSE data integration structure
print_status "Testing NEPSE data integration..."

# Check if NEPSE integration service exists
if [ -f "/home/samujjwal/Developments/finance/investment-portfolio/server/src/companies/nepse.service.ts" ]; then
    print_success "NEPSE integration service exists"
else
    print_warning "NEPSE integration service not found"
fi

# Test market data endpoint
MARKET_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3001/api/companies/market-data")

if echo "$MARKET_RESPONSE" | jq -e '.success' > /dev/null; then
    print_success "Market data endpoint works"
else
    print_warning "Market data endpoint not working or not implemented"
fi

echo ""
echo "📊 PHASE 2 COMPANY MANAGEMENT SUMMARY"
echo "===================================="

# Count successes
TOTAL_CHECKS=12
PASSED_CHECKS=0

# Simple success checks
if echo "$COMPANIES_RESPONSE" | jq -e '.success' > /dev/null; then
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
fi

if echo "$CREATE_COMPANY_RESPONSE" | jq -e '.success' > /dev/null; then
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
fi

if echo "$SEARCH_RESPONSE" | jq -e '.success' > /dev/null; then
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
fi

if echo "$IMPORT_RESPONSE" | jq -e '.success' > /dev/null; then
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
fi

echo "Checks Passed: $PASSED_CHECKS/$TOTAL_CHECKS"

if [ "$PASSED_CHECKS" -ge 8 ]; then
    print_success "Phase 2 Company Management: COMPLETED"
else
    print_warning "Phase 2 Company Management: PARTIALLY COMPLETED"
fi

echo ""
echo "🔧 NEXT STEPS"
echo "1. Fix any missing company management components"
echo "2. Implement NEPSE data integration if missing"
echo "3. Test bulk import/export thoroughly"
echo "4. Verify company validation rules"
