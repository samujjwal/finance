#!/bin/bash

echo "🔧 Admin Dashboard Debug Script"
echo "=============================="

# Get auth token
echo "📝 Getting authentication token..."
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get authentication token"
    exit 1
fi

echo "✅ Authentication token obtained"

# Get user ID
USER_ID=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3001/api/auth/me" | jq -r '.data.id')
echo "👤 User ID: $USER_ID"

# Test all the APIs that AdminDashboard calls
echo ""
echo "📊 Testing AdminDashboard API Calls..."

echo ""
echo "1. USERS API:"
USERS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3001/api/users")
USERS_TOTAL=$(echo "$USERS_RESPONSE" | jq '.data.pagination.total')
USERS_COUNT=$(echo "$USERS_RESPONSE" | jq '.data.users | length')
ACTIVE_USERS=$(echo "$USERS_RESPONSE" | jq '.data.users | map(select(.status == "ACTIVE")) | length')

echo "   - Total Users: $USERS_TOTAL"
echo "   - Users Array Length: $USERS_COUNT"
echo "   - Active Users: $ACTIVE_USERS"

echo ""
echo "2. ROLES API:"
ROLES_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3001/api/roles")
ROLES_COUNT=$(echo "$ROLES_RESPONSE" | jq '.data.roles | length')

echo "   - Roles Count: $ROLES_COUNT"

echo ""
echo "3. PENDING APPROVALS API:"
PENDING_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3001/api/approvals/pending")
PENDING_COUNT=$(echo "$PENDING_RESPONSE" | jq '.data | length')

echo "   - Pending Approvals: $PENDING_COUNT"

echo ""
echo "4. USER FUNCTIONS API:"
FUNCTIONS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3001/api/roles/user/$USER_ID/functions")
FUNCTIONS_COUNT=$(echo "$FUNCTIONS_RESPONSE" | jq '.data | length')
HAS_USER_VIEW=$(echo "$FUNCTIONS_RESPONSE" | jq '.data[] | select(.name == "USER_VIEW") | length')
HAS_ROLE_VIEW=$(echo "$FUNCTIONS_RESPONSE" | jq '.data[] | select(.name == "ROLE_VIEW") | length')
HAS_APPROVAL_VIEW=$(echo "$FUNCTIONS_RESPONSE" | jq '.data[] | select(.name == "APPROVAL_VIEW") | length')

echo "   - Total Functions: $FUNCTIONS_COUNT"
echo "   - Has USER_VIEW: $HAS_USER_VIEW"
echo "   - Has ROLE_VIEW: $HAS_ROLE_VIEW"
echo "   - Has APPROVAL_VIEW: $HAS_APPROVAL_VIEW"

echo ""
echo "🎯 Expected AdminDashboard Stats:"
echo "   - Total Users: $USERS_TOTAL"
echo "   - Active Users: $ACTIVE_USERS"
echo "   - Pending Approvals: $PENDING_COUNT"
echo "   - Total Roles: $ROLES_COUNT"

echo ""
echo "🔍 Permission Check:"
if [ "$HAS_USER_VIEW" -gt 0 ]; then
    echo "   ✅ Should see User Management tab"
else
    echo "   ❌ Cannot see User Management tab (missing USER_VIEW)"
fi

if [ "$HAS_ROLE_VIEW" -gt 0 ]; then
    echo "   ✅ Should see Role Management tab"
else
    echo "   ❌ Cannot see Role Management tab (missing ROLE_VIEW)"
fi

if [ "$HAS_APPROVAL_VIEW" -gt 0 ]; then
    echo "   ✅ Should see Approval Dashboard tab"
else
    echo "   ❌ Cannot see Approval Dashboard tab (missing APPROVAL_VIEW)"
fi

echo ""
echo "🛠️  Frontend Data Structure Verification:"
echo "   - AdminDashboard expects: usersResponse.data?.pagination?.total"
echo "   - API returns: $USERS_TOTAL"
echo "   - AdminDashboard expects: rolesResponse.data?.roles?.length"
echo "   - API returns: $ROLES_COUNT"

echo ""
echo "🎯 Debug Summary:"
if [ "$USERS_TOTAL" != "null" ] && [ "$ROLES_COUNT" -gt 0 ]; then
    echo "   ✅ API data structure is correct"
    echo "   ✅ Frontend should display correct stats"
else
    echo "   ❌ API data structure issue detected"
    echo "   ❌ Frontend will show incorrect stats"
fi

echo ""
echo "📋 Manual Check Required:"
echo "   1. Open browser to http://localhost:1420"
echo "   2. Login as admin"
echo "   3. Go to Admin tab"
echo "   4. Check if Overview shows: Total Users: $USERS_TOTAL, Active Users: $ACTIVE_USERS, Roles: $ROLES_COUNT"
echo "   5. Check if Users, Roles, Approvals subtabs are visible"
