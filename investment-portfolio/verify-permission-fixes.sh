#!/bin/bash

echo "🔧 Permission Function Name Fix Verification"
echo "==========================================="

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

# Get all user functions
echo ""
echo "🔍 Checking Permission Function Names..."
USER_FUNCTIONS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3001/api/roles/user/$USER_ID/functions")

# Check the exact function names that frontend is looking for
echo ""
echo "📋 Frontend Permission Checks vs API Function Names:"

echo ""
echo "USER MANAGEMENT:"
HAS_USER_CREATE=$(echo "$USER_FUNCTIONS_RESPONSE" | jq '.data[] | select(.name == "USER_CREATE") | length')
HAS_USER_VIEW=$(echo "$USER_FUNCTIONS_RESPONSE" | jq '.data[] | select(.name == "USER_VIEW") | length')
HAS_USER_MODIFY=$(echo "$USER_FUNCTIONS_RESPONSE" | jq '.data[] | select(.name == "USER_MODIFY") | length')
HAS_USER_SUSPEND=$(echo "$USER_FUNCTIONS_RESPONSE" | jq '.data[] | select(.name == "USER_SUSPEND") | length')
HAS_USER_UNLOCK=$(echo "$USER_FUNCTIONS_RESPONSE" | jq '.data[] | select(.name == "USER_UNLOCK") | length')

echo "   - hasFunction('USER_CREATE') = $([ $HAS_USER_CREATE -gt 0 ] && echo 'true' || echo 'false')"
echo "   - hasFunction('USER_VIEW') = $([ $HAS_USER_VIEW -gt 0 ] && echo 'true' || echo 'false')"
echo "   - hasFunction('USER_MODIFY') = $([ $HAS_USER_MODIFY -gt 0 ] && echo 'true' || echo 'false')"
echo "   - hasFunction('USER_SUSPEND') = $([ $HAS_USER_SUSPEND -gt 0 ] && echo 'true' || echo 'false')"
echo "   - hasFunction('USER_UNLOCK') = $([ $HAS_USER_UNLOCK -gt 0 ] && echo 'true' || echo 'false')"

echo ""
echo "ROLE MANAGEMENT:"
HAS_ROLE_CREATE=$(echo "$USER_FUNCTIONS_RESPONSE" | jq '.data[] | select(.name == "ROLE_CREATE") | length')
HAS_ROLE_VIEW=$(echo "$USER_FUNCTIONS_RESPONSE" | jq '.data[] | select(.name == "ROLE_VIEW") | length')
HAS_ROLE_ASSIGN=$(echo "$USER_FUNCTIONS_RESPONSE" | jq '.data[] | select(.name == "ROLE_ASSIGN") | length')
HAS_ROLE_SUSPEND=$(echo "$USER_FUNCTIONS_RESPONSE" | jq '.data[] | select(.name == "ROLE_SUSPEND") | length')

echo "   - hasFunction('ROLE_CREATE') = $([ $HAS_ROLE_CREATE -gt 0 ] && echo 'true' || echo 'false')"
echo "   - hasFunction('ROLE_VIEW') = $([ $HAS_ROLE_VIEW -gt 0 ] && echo 'true' || echo 'false')"
echo "   - hasFunction('ROLE_ASSIGN') = $([ $HAS_ROLE_ASSIGN -gt 0 ] && echo 'true' || echo 'false')"
echo "   - hasFunction('ROLE_SUSPEND') = $([ $HAS_ROLE_SUSPEND -gt 0 ] && echo 'true' || echo 'false')"

echo ""
echo "APPROVAL DASHBOARD:"
HAS_APPROVAL_VIEW=$(echo "$USER_FUNCTIONS_RESPONSE" | jq '.data[] | select(.name == "APPROVAL_VIEW") | length')
HAS_APPROVAL_PROCESS=$(echo "$USER_FUNCTIONS_RESPONSE" | jq '.data[] | select(.name == "APPROVAL_PROCESS") | length')

echo "   - hasFunction('APPROVAL_VIEW') = $([ $HAS_APPROVAL_VIEW -gt 0 ] && echo 'true' || echo 'false')"
echo "   - hasFunction('APPROVAL_PROCESS') = $([ $HAS_APPROVAL_PROCESS -gt 0 ] && echo 'true' || echo 'false')"

echo ""
echo "🎯 Expected Results After Fix:"
echo "   - UserManagement tab: $([ $HAS_USER_VIEW -gt 0 ] && echo 'VISIBLE' || echo 'HIDDEN')"
echo "   - RoleManagement tab: $([ $HAS_ROLE_VIEW -gt 0 ] && echo 'VISIBLE' || echo 'HIDDEN')"
echo "   - ApprovalDashboard tab: $([ $HAS_APPROVAL_VIEW -gt 0 ] && echo 'VISIBLE' || echo 'HIDDEN')"

echo ""
echo "🔧 What Was Fixed:"
echo "   ❌ Before: hasFunction('FUNC_USER_VIEW') → false (wrong name)"
echo "   ✅ After:  hasFunction('USER_VIEW') → true (correct name)"
echo ""
echo "   ❌ Before: hasFunction('FUNC_ROLE_VIEW') → false (wrong name)"
echo "   ✅ After:  hasFunction('ROLE_VIEW') → true (correct name)"
echo ""
echo "   ❌ Before: hasFunction('FUNC_APPROVAL_VIEW') → false (wrong name)"
echo "   ✅ After:  hasFunction('APPROVAL_VIEW') → true (correct name)"

echo ""
echo "📋 Manual Verification Steps:"
echo "   1. Open browser to http://localhost:1420"
echo "   2. Login as admin"
echo "   3. Go to Admin tab"
echo "   4. Should see 'Loading permissions...' briefly"
echo "   5. All subtabs (Users, Roles, Approvals) should appear"

if [ "$HAS_USER_VIEW" -gt 0 ] && [ "$HAS_ROLE_VIEW" -gt 0 ] && [ "$HAS_APPROVAL_VIEW" -gt 0 ]; then
    echo ""
    echo "✅ All permission function names are correct"
    echo "✅ Admin subtabs should now be visible"
else
    echo ""
    echo "❌ Some permission function names are still incorrect"
fi
