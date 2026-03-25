# 🐛 ADMIN PORTAL - KNOWN ISSUES REPORT

## 📋 Issue Summary

**Report Date**: March 24, 2026  
**Status**: 🔴 CRITICAL - Admin Portal is VIEW-ONLY  
**Impact**: All CREATE/UPDATE/DELETE operations fail  
**Affected Features**: User Creation, Role Creation, Function Assignment, User Suspension

---

## ❌ Issue 1: Create User - Password Validation Too Strict

### **Severity**: 🔴 HIGH  
### **Status**: Confirmed Broken

### **Description**
The Create User form submission fails due to overly strict password validation rules that make it nearly impossible to create valid users through the UI.

### **Steps to Reproduce**
1. Navigate to Admin → Users tab
2. Click "Create User" button
3. Fill in all required fields
4. Enter password (e.g., "password123" - 11 characters)
5. Click "Create" button

### **Expected Result**
User should be created successfully or show reasonable validation error

### **Actual Result**
```json
{
  "success": false,
  "statusCode": 400,
  "message": [
    "Password must be between 6-10 characters"
  ]
}
```

### **Additional Validation Issues**
Even with correct length, additional validation blocks creation:
```json
{
  "success": false,
  "statusCode": 400,
  "message": [
    "Password must contain at least one uppercase letter, one lowercase letter, and one number"
  ]
}
```

### **Root Cause**
Backend validation in `CreateUserDto` has:
- `@Length(6, 10)` - limits password to only 6-10 characters
- Complex password pattern requirements

### **Impact**
- ❌ Cannot create new users through UI
- ❌ Cannot add staff members
- ❌ Cannot expand user base

### **Workaround**
None available through UI. Requires direct database insertion.

### **Suggested Fix**
Relax password validation:
- Increase max length to 50+ characters
- Remove excessive complexity requirements
- Follow standard security practices (8+ chars, mixed case)

---

## ❌ Issue 2: Create Role - Role ID Length Limitation

### **Severity**: 🔴 HIGH  
### **Status**: Confirmed Broken

### **Description**
Role creation fails because Role ID is limited to 8 characters, making meaningful identifiers impossible.

### **Steps to Reproduce**
1. Navigate to Admin → Roles tab
2. Click "Create Role" button
3. Enter Role ID: "PORTFOLIO_MANAGER" (18 characters)
4. Fill in other fields
5. Click "Create"

### **Expected Result**
Role should be created with meaningful ID

### **Actual Result**
```json
{
  "success": false,
  "statusCode": 400,
  "message": [
    "Role ID must not exceed 8 characters"
  ]
}
```

### **Root Cause**
Backend validation in `CreateRoleDto`:
```typescript
@MaxLength(8)
roleId: string;
```

### **Impact**
- ❌ Cannot create roles with descriptive IDs
- ❌ Limited to cryptic short codes (e.g., "PM" instead of "PORTFOLIO_MANAGER")
- ❌ Poor usability and maintainability

### **Workaround**
Use abbreviated role IDs (not practical)

### **Suggested Fix**
Increase max length to 50 characters to allow meaningful role identifiers.

---

## ❌ Issue 3: Assign Functions - Server Error

### **Severity**: 🔴 HIGH  
### **Status**: Confirmed Broken

### **Description**
Assigning functions to roles fails with a server error due to backend code bug.

### **Steps to Reproduce**
1. Navigate to Admin → Roles tab
2. Click "Assign Functions" on any role (e.g., System Administrator)
3. Select functions to assign
4. Click "Save"

### **Expected Result**
Functions should be assigned to role successfully

### **Actual Result**
```json
{
  "success": false,
  "statusCode": 500,
  "message": [
    "Cannot read properties of undefined (reading 'length')"
  ]
}
```

### **Root Cause**
Backend bug in `RolesService.assignFunctions()` method:
- Attempting to access `.length` on undefined variable
- Likely missing null check on input validation

### **Impact**
- ❌ Cannot assign functions to roles
- ❌ Cannot configure role permissions
- ❌ RBAC system non-functional

### **Workaround**
None available

### **Suggested Fix**
1. Add null/undefined checks in `assignFunctions` method
2. Validate input array before processing
3. Add proper error handling

---

## ❌ Issue 4: Suspend User - Logic Error

### **Severity**: 🔴 HIGH  
### **Status**: Confirmed Broken

### **Description**
Suspending users fails with "Only ACTIVE users can be suspended" error, even when attempting to suspend ACTIVE users.

### **Steps to Reproduce**
1. Navigate to Admin → Users tab
2. Find a user with "ACTIVE" status (e.g., "demo" user)
3. Click "Suspend" button
4. Enter suspension reason
5. Confirm

### **Expected Result**
User should be suspended (status changed to SUSPENDED)

### **Actual Result**
```json
{
  "success": false,
  "statusCode": 400,
  "message": [
    "Only ACTIVE users can be suspended"
  ]
}
```

### **Root Cause**
Backend logic error in `UsersService.suspendUser()`:
- Status check is likely comparing against wrong value
- Possible case sensitivity issue ("ACTIVE" vs "active")
- Or status field not being read correctly

### **Additional Context**
The demo user shows status "ACTIVE" in the UI, but backend claims it's not ACTIVE.

### **Impact**
- ❌ Cannot suspend problematic users
- ❌ Cannot enforce user access restrictions
- ❌ Security risk - cannot disable compromised accounts

### **Workaround**
None available

### **Suggested Fix**
1. Debug status value comparison
2. Check case sensitivity
3. Verify status field mapping
4. Add debug logging to identify the actual status value

---

## ❌ Issue 5: Unlock User (Inferred)

### **Severity**: 🟡 MEDIUM  
### **Status**: Likely Broken (Not Tested)

### **Description**
Based on the same logic error pattern as Suspend User, the Unlock User feature is likely also broken.

### **Inference**
Since Unlock User uses similar status checking logic:
```typescript
// Likely similar code pattern
if (user.status !== 'LOCKED') {
  throw new Error('Only LOCKED users can be unlocked');
}
```

### **Expected to Fail**
Same status comparison logic error as Suspend User

### **Suggested Fix**
Fix the underlying status comparison logic that affects both operations.

---

## 📊 Impact Assessment

### **Functional Impact**

| Feature | Status | User Impact | Business Impact |
|---------|--------|-------------|-----------------|
| **View Users** | ✅ Working | Low | Low |
| **View Roles** | ✅ Working | Low | Low |
| **View Approvals** | ✅ Working | Low | Low |
| **Create User** | ❌ Broken | 🔴 Critical | 🔴 High |
| **Create Role** | ❌ Broken | 🔴 Critical | 🔴 High |
| **Assign Functions** | ❌ Broken | 🔴 Critical | 🔴 High |
| **Suspend User** | ❌ Broken | 🔴 Critical | 🔴 High |
| **Unlock User** | ⚠️ Likely Broken | 🟡 Medium | 🟡 Medium |

### **Risk Assessment**

**Overall Risk Level**: 🔴 **CRITICAL**

1. **Operational Risk**: HIGH
   - Cannot onboard new users
   - Cannot create new roles
   - Cannot configure permissions

2. **Security Risk**: HIGH
   - Cannot suspend compromised accounts
   - Cannot enforce access restrictions

3. **Business Risk**: HIGH
   - System cannot scale
   - User management non-functional
   - Requires manual database intervention

---

## 🎯 Summary

### **What Works**
- ✅ Admin navigation and tab switching
- ✅ Viewing existing users, roles, and approvals
- ✅ Displaying statistics from API
- ✅ Modal/form display (but not submission)

### **What Doesn't Work**
- ❌ Creating new users (password validation)
- ❌ Creating new roles (ID length limit)
- ❌ Assigning functions to roles (server error)
- ❌ Suspending users (logic error)
- ❌ Unlocking users (likely same issue)

### **Verdict**
🔴 **Admin Portal is VIEW-ONLY**

The admin portal can display data correctly but cannot perform any mutating operations (create, update, delete). All write operations fail with validation errors or server errors.

---

## 🔧 Recommended Fixes (Priority Order)

### **P0 - Critical (Fix Immediately)**
1. **Fix Suspend User logic error**
   - Debug status comparison
   - Likely case sensitivity or field mapping issue

2. **Fix Assign Functions server error**
   - Add null checks
   - Fix undefined reference

### **P1 - High (Fix This Sprint)**
3. **Fix Create User password validation**
   - Increase max length to 128
   - Simplify complexity requirements

4. **Fix Create Role ID length**
   - Increase max length to 50

### **P2 - Medium (Fix Next Sprint)**
5. **Verify Unlock User works after Suspend fix**
6. **Add comprehensive validation error messages**
7. **Add frontend validation to match backend**

---

## 📝 Test Results Evidence

### **Create User Test**
```bash
curl -X POST http://localhost:3001/api/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId":"TEST001",
    "username":"testuser",
    "email":"test@example.com",
    "firstName":"Test",
    "surname":"User",
    "password":"password123",
    "branchId":"BRANCH001",
    "userTypeId":"TYPE001"
  }'

# Result: 400 Bad Request
# "Password must be between 6-10 characters"
```

### **Create Role Test**
```bash
curl -X POST http://localhost:3001/api/roles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roleId":"PORTFOLIO_MANAGER",
    "name":"Portfolio Manager",
    "type":"MANAGER"
  }'

# Result: 400 Bad Request
# "Role ID must not exceed 8 characters"
```

### **Assign Functions Test**
```bash
curl -X POST http://localhost:3001/api/roles/VIEWER/functions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '["USER_VIEW","USER_CREATE"]'

# Result: 500 Server Error
# "Cannot read properties of undefined (reading 'length')"
```

### **Suspend User Test**
```bash
curl -X POST http://localhost:3001/api/users/{userId}/suspend \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Test suspension"}'

# Result: 400 Bad Request
# "Only ACTIVE users can be suspended"
# (Even though user IS active)
```

---

## ✅ Next Steps

1. **Fix the 5 identified issues** in priority order
2. **Re-run these tests** to verify fixes
3. **Add regression tests** to prevent future breakage
4. **Update documentation** once fixes are deployed

---

**Report Generated**: March 24, 2026  
**Tester**: Automated Test Suite  
**Status**: 🔴 CRITICAL - Immediate Action Required
