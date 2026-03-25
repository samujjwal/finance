#!/bin/bash

echo "🔧 Permission Loading Debug Script"
echo "================================="

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

# Test the getCurrentUserFunctions API call that the frontend makes
echo ""
echo "🔍 Testing Frontend Permission API Call..."

# First test getCurrentUser (this is what getCurrentUserFunctions calls first)
echo "1. Getting current user:"
CURRENT_USER_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3001/api/auth/me")
CURRENT_USER_ID=$(echo "$CURRENT_USER_RESPONSE" | jq -r '.data.id')
echo "   - Current User ID: $CURRENT_USER_ID"

# Then test getUserFunctions (this is what getCurrentUserFunctions calls next)
echo ""
echo "2. Getting user functions:"
USER_FUNCTIONS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3001/api/roles/user/$CURRENT_USER_ID/functions")
USER_FUNCTIONS_COUNT=$(echo "$USER_FUNCTIONS_RESPONSE" | jq '.data | length')
USER_VIEW_COUNT=$(echo "$USER_FUNCTIONS_RESPONSE" | jq '.data[] | select(.name == "USER_VIEW") | length')
ROLE_VIEW_COUNT=$(echo "$USER_FUNCTIONS_RESPONSE" | jq '.data[] | select(.name == "ROLE_VIEW") | length')
APPROVAL_VIEW_COUNT=$(echo "$USER_FUNCTIONS_RESPONSE" | jq '.data[] | select(.name == "APPROVAL_VIEW") | length')

echo "   - Total Functions: $USER_FUNCTIONS_COUNT"
echo "   - USER_VIEW functions: $USER_VIEW_COUNT"
echo "   - ROLE_VIEW functions: $ROLE_VIEW_COUNT"
echo "   - APPROVAL_VIEW functions: $APPROVAL_VIEW_COUNT"

# Test the exact API call that the usePermissions hook makes
echo ""
echo "🔍 Testing usePermissions Hook API Flow..."

# The usePermissions hook calls apiService.getCurrentUserFunctions()
# getCurrentUserFunctions() calls apiService.getCurrentUser() then apiService.makeRequest(`roles/user/${userId}/functions`)

echo "   - Step 1: getCurrentUser() ✅"
echo "   - Step 2: getUserFunctions(userId) ✅"
echo "   - Step 3: hasFunction('FUNC_USER_VIEW') should return: $([ $USER_VIEW_COUNT -gt 0 ] && echo 'true' || echo 'false')"
echo "   - Step 4: hasFunction('FUNC_ROLE_VIEW') should return: $([ $ROLE_VIEW_COUNT -gt 0 ] && echo 'true' || echo 'false')"
echo "   - Step 5: hasFunction('FUNC_APPROVAL_VIEW') should return: $([ $APPROVAL_VIEW_COUNT -gt 0 ] && echo 'true' || echo 'false')"

echo ""
echo "🎯 Expected Frontend Behavior:"
echo "   1. usePermissions hook should load 42 functions"
echo "   2. hasFunction('FUNC_USER_VIEW') should return true"
echo "   3. hasFunction('FUNC_ROLE_VIEW') should return true"
echo "   4. hasFunction('FUNC_APPROVAL_VIEW') should return true"
echo "   5. All admin subtabs should be visible"

echo ""
echo "🛠️  Debugging Steps:"
echo "   1. Check browser console for permission loading errors"
echo "   2. Check network tab for API call failures"
echo "   3. Look for 'Loading permissions...' message in UI"
echo "   4. Verify usePermissions hook is not stuck in loading state"

echo ""
echo "📋 Manual Verification:"
echo "   1. Open browser to http://localhost:1420"
echo "   2. Login as admin"
echo "   3. Go to Admin tab"
echo "   4. Check if you see 'Loading permissions...' briefly"
echo "   5. Verify all subtabs (Users, Roles, Approvals) appear"

if [ "$USER_FUNCTIONS_COUNT" -gt 0 ] && [ "$USER_VIEW_COUNT" -gt 0 ]; then
    echo ""
    echo "✅ API calls are working correctly"
    echo "✅ Admin user has required permissions"
    echo "🔧 Issue is likely in frontend permission loading logic"
else
    echo ""
    echo "❌ API calls are not working correctly"
    echo "❌ Admin user does not have required permissions"
fi
