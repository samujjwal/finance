import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // ========== PHASE 1: Create Reference Data ==========

  // Create User Types (SRS requirement)
  const userTypes = [
    {
      id: "ADMIN",
      name: "Administrator",
      description: "System administrator with full access",
    },
    { id: "MGR", name: "Manager", description: "Branch or department manager" },
    {
      id: "OPR",
      name: "Operator",
      description: "Regular operator with standard access",
    },
    { id: "VIEW", name: "Viewer", description: "Read-only access user" },
  ];

  for (const userType of userTypes) {
    await prisma.userType.upsert({
      where: { id: userType.id },
      update: {},
      create: userType,
    });
  }
  console.log("Created", userTypes.length, "user types");

  // Create Functions (SRS requirement - roles contain functions)
  const functions = [
    // User Management Functions
    {
      id: "FUNC_USER_CREATE",
      name: "USER_CREATE",
      description: "Create new users",
      module: "USER_MGMT",
    },
    {
      id: "FUNC_USER_VIEW",
      name: "USER_VIEW",
      description: "View user details",
      module: "USER_MGMT",
    },
    {
      id: "FUNC_USER_MODIFY",
      name: "USER_MODIFY",
      description: "Modify user information",
      module: "USER_MGMT",
    },
    {
      id: "FUNC_USER_DELETE",
      name: "USER_DELETE",
      description: "Delete users",
      module: "USER_MGMT",
    },
    {
      id: "FUNC_USER_SUSPEND",
      name: "USER_SUSPEND",
      description: "Suspend user accounts",
      module: "USER_MGMT",
    },
    {
      id: "FUNC_USER_REVOKE",
      name: "USER_REVOKE",
      description: "Revoke suspended users",
      module: "USER_MGMT",
    },
    {
      id: "FUNC_USER_UNLOCK",
      name: "USER_UNLOCK",
      description: "Unlock locked user accounts",
      module: "USER_MGMT",
    },

    // Role Management Functions
    {
      id: "FUNC_ROLE_CREATE",
      name: "ROLE_CREATE",
      description: "Create new roles",
      module: "ROLE_MGMT",
    },
    {
      id: "FUNC_ROLE_VIEW",
      name: "ROLE_VIEW",
      description: "View role details",
      module: "ROLE_MGMT",
    },
    {
      id: "FUNC_ROLE_MODIFY",
      name: "ROLE_MODIFY",
      description: "Modify role information",
      module: "ROLE_MGMT",
    },
    {
      id: "FUNC_ROLE_DELETE",
      name: "ROLE_DELETE",
      description: "Delete roles",
      module: "ROLE_MGMT",
    },
    {
      id: "FUNC_ROLE_SUSPEND",
      name: "ROLE_SUSPEND",
      description: "Suspend roles",
      module: "ROLE_MGMT",
    },
    {
      id: "FUNC_ROLE_ASSIGN",
      name: "ROLE_ASSIGN",
      description: "Assign functions to roles",
      module: "ROLE_MGMT",
    },
    {
      id: "FUNC_ROLE_APPROVE",
      name: "ROLE_APPROVE",
      description: "Approve role operations",
      module: "ROLE_MGMT",
    },

    // Portfolio Management Functions
    {
      id: "FUNC_PORTFOLIO_VIEW",
      name: "PORTFOLIO_VIEW",
      description: "View portfolio data",
      module: "PORTFOLIO",
    },
    {
      id: "FUNC_PORTFOLIO_CREATE",
      name: "PORTFOLIO_CREATE",
      description: "Create portfolio entries",
      module: "PORTFOLIO",
    },
    {
      id: "FUNC_PORTFOLIO_MODIFY",
      name: "PORTFOLIO_MODIFY",
      description: "Modify portfolio holdings",
      module: "PORTFOLIO",
    },
    {
      id: "FUNC_PORTFOLIO_DELETE",
      name: "PORTFOLIO_DELETE",
      description: "Delete portfolio entries",
      module: "PORTFOLIO",
    },
    {
      id: "FUNC_PORTFOLIO_EXPORT",
      name: "PORTFOLIO_EXPORT",
      description: "Export portfolio data",
      module: "PORTFOLIO",
    },

    // Transaction Functions
    {
      id: "FUNC_TRANS_VIEW",
      name: "TRANS_VIEW",
      description: "View transactions",
      module: "TRANSACTIONS",
    },
    {
      id: "FUNC_TRANS_CREATE",
      name: "TRANS_CREATE",
      description: "Create transactions",
      module: "TRANSACTIONS",
    },
    {
      id: "FUNC_TRANS_MODIFY",
      name: "TRANS_MODIFY",
      description: "Modify transactions",
      module: "TRANSACTIONS",
    },
    {
      id: "FUNC_TRANS_DELETE",
      name: "TRANS_DELETE",
      description: "Delete transactions",
      module: "TRANSACTIONS",
    },
    {
      id: "FUNC_TRANS_APPROVE",
      name: "TRANS_APPROVE",
      description: "Approve transactions",
      module: "TRANSACTIONS",
    },
    {
      id: "FUNC_TRANS_BULK",
      name: "TRANS_BULK",
      description: "Bulk transaction operations",
      module: "TRANSACTIONS",
    },

    // Company Management Functions
    {
      id: "FUNC_COMPANY_VIEW",
      name: "COMPANY_VIEW",
      description: "View company data",
      module: "COMPANIES",
    },
    {
      id: "FUNC_COMPANY_CREATE",
      name: "COMPANY_CREATE",
      description: "Create companies",
      module: "COMPANIES",
    },
    {
      id: "FUNC_COMPANY_MODIFY",
      name: "COMPANY_MODIFY",
      description: "Modify company data",
      module: "COMPANIES",
    },
    {
      id: "FUNC_COMPANY_DELETE",
      name: "COMPANY_DELETE",
      description: "Delete companies",
      module: "COMPANIES",
    },
    {
      id: "FUNC_COMPANY_IMPORT",
      name: "COMPANY_IMPORT",
      description: "Import companies in bulk",
      module: "COMPANIES",
    },

    // Reporting Functions
    {
      id: "FUNC_REPORT_VIEW",
      name: "REPORT_VIEW",
      description: "View reports",
      module: "REPORTS",
    },
    {
      id: "FUNC_REPORT_CREATE",
      name: "REPORT_CREATE",
      description: "Create custom reports",
      module: "REPORTS",
    },
    {
      id: "FUNC_REPORT_EXPORT",
      name: "REPORT_EXPORT",
      description: "Export reports",
      module: "REPORTS",
    },
    {
      id: "FUNC_REPORT_SCHEDULE",
      name: "REPORT_SCHEDULE",
      description: "Schedule automated reports",
      module: "REPORTS",
    },
    {
      id: "FUNC_REPORT_CUSTOM",
      name: "REPORT_CUSTOM",
      description: "Build custom reports",
      module: "REPORTS",
    },

    // System Administration Functions
    {
      id: "FUNC_SYSTEM_CONFIG",
      name: "SYSTEM_CONFIG",
      description: "Configure system settings",
      module: "SYSTEM",
    },
    {
      id: "FUNC_SYSTEM_BACKUP",
      name: "SYSTEM_BACKUP",
      description: "Create system backups",
      module: "SYSTEM",
    },
    {
      id: "FUNC_SYSTEM_MAINTENANCE",
      name: "SYSTEM_MAINTENANCE",
      description: "Perform system maintenance",
      module: "SYSTEM",
    },
    {
      id: "FUNC_SYSTEM_AUDIT",
      name: "SYSTEM_AUDIT",
      description: "View audit logs",
      module: "SYSTEM",
    },

    // Approval Workflow Functions
    {
      id: "FUNC_APPROVAL_VIEW",
      name: "APPROVAL_VIEW",
      description: "View pending approvals",
      module: "APPROVAL",
    },
    {
      id: "FUNC_APPROVAL_PROCESS",
      name: "APPROVAL_PROCESS",
      description: "Process approval requests",
      module: "APPROVAL",
    },
    {
      id: "FUNC_AUDIT_VIEW",
      name: "AUDIT_VIEW",
      description: "View audit trail",
      module: "AUDIT",
    },
  ];

  for (const func of functions) {
    await prisma.function.upsert({
      where: { id: func.id },
      update: {},
      create: func,
    });
  }
  console.log("Created", functions.length, "functions");

  // Create Branches (SRS requirement)
  const branches = [
    {
      id: "BRANCH_MAIN",
      name: "Main Branch",
      code: "MAIN",
      address: "Kathmandu",
      phone: "01-4000000",
    },
    {
      id: "BRANCH_001",
      name: "Lalitpur Branch",
      code: "LTP",
      address: "Lalitpur",
      phone: "01-5000000",
    },
    {
      id: "BRANCH_002",
      name: "Bhaktapur Branch",
      code: "BKT",
      address: "Bhaktapur",
      phone: "01-6000000",
    },
  ];

  for (const branch of branches) {
    await prisma.branch.upsert({
      where: { id: branch.id },
      update: {},
      create: branch,
    });
  }
  console.log("Created", branches.length, "branches");

  // ========== PHASE 2: Create Initial Admin User ==========

  // Create initial admin user (auto-approved as it's the first user)
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const adminUser = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      userId: "ADMIN001",
      username: "admin",
      email: "admin@jclportfolio.com",
      passwordHash: adminPasswordHash,
      firstName: "System",
      surname: "Administrator",
      designation: "System Admin",
      branchId: "BRANCH_MAIN",
      userTypeId: "ADMIN",
      telephone: "01-4000000",
      mobile: "9800000000",
      status: "ACTIVE",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  console.log("Created admin user:", adminUser.username);

  // Update admin user to set createdBy and approvedBy to itself
  await prisma.user.update({
    where: { id: adminUser.id },
    data: {
      createdBy: adminUser.id,
      approvedBy: adminUser.id,
      approvedAt: new Date(),
    },
  });

  // ========== PHASE 3: Create System Roles ==========

  // Create System Administrator Role (auto-approved, system role)
  const sysAdminRole = await prisma.role.upsert({
    where: { id: "SYSADMIN" },
    update: {},
    create: {
      id: "SYSADMIN",
      name: "System Administrator",
      userTypeId: "ADMIN",
      description: "Full system access with all permissions",
      status: "ACTIVE",
      isSystem: true,
      createdBy: adminUser.id,
      approvedBy: adminUser.id,
      approvedAt: new Date(),
    },
  });
  console.log("Created system admin role:", sysAdminRole.name);

  // Create Portfolio Manager Role
  const portfolioMgrRole = await prisma.role.upsert({
    where: { id: "PORTMGR" },
    update: {},
    create: {
      id: "PORTMGR",
      name: "Portfolio Manager",
      userTypeId: "MGR",
      description: "Manages portfolio and transactions",
      status: "ACTIVE",
      isSystem: true,
      createdBy: adminUser.id,
      approvedBy: adminUser.id,
      approvedAt: new Date(),
    },
  });
  console.log("Created portfolio manager role:", portfolioMgrRole.name);

  // Create Trader Role
  const traderRole = await prisma.role.upsert({
    where: { id: "TRADER" },
    update: {},
    create: {
      id: "TRADER",
      name: "Trader",
      userTypeId: "OPR",
      description: "Can create and manage transactions",
      status: "ACTIVE",
      isSystem: true,
      createdBy: adminUser.id,
      approvedBy: adminUser.id,
      approvedAt: new Date(),
    },
  });
  console.log("Created trader role:", traderRole.name);

  // Create Viewer Role
  const viewerRole = await prisma.role.upsert({
    where: { id: "VIEWER" },
    update: {},
    create: {
      id: "VIEWER",
      name: "Viewer",
      userTypeId: "VIEW",
      description: "Read-only access to all data",
      status: "ACTIVE",
      isSystem: true,
      createdBy: adminUser.id,
      approvedBy: adminUser.id,
      approvedAt: new Date(),
    },
  });
  console.log("Created viewer role:", viewerRole.name);

  // ========== PHASE 4: Assign Functions to Roles ==========

  // Assign ALL functions to System Administrator
  const allFunctions = await prisma.function.findMany();
  for (const func of allFunctions) {
    await prisma.roleFunction.upsert({
      where: {
        id: `RF_SYSADMIN_${func.id}`,
      },
      update: {},
      create: {
        id: `RF_SYSADMIN_${func.id}`,
        roleId: sysAdminRole.id,
        functionId: func.id,
        assignedBy: adminUser.id,
        status: "ACTIVE",
        approvedBy: adminUser.id,
        approvedAt: new Date(),
      },
    });
  }
  console.log(
    `Assigned ${allFunctions.length} functions to System Administrator`,
  );

  // Assign Portfolio Management functions to Portfolio Manager
  const portfolioFunctions = [
    "FUNC_PORTFOLIO_VIEW",
    "FUNC_PORTFOLIO_CREATE",
    "FUNC_PORTFOLIO_MODIFY",
    "FUNC_PORTFOLIO_DELETE",
    "FUNC_PORTFOLIO_EXPORT",
    "FUNC_TRANS_VIEW",
    "FUNC_TRANS_CREATE",
    "FUNC_TRANS_MODIFY",
    "FUNC_TRANS_DELETE",
    "FUNC_TRANS_APPROVE",
    "FUNC_TRANS_BULK",
    "FUNC_COMPANY_VIEW",
    "FUNC_COMPANY_CREATE",
    "FUNC_COMPANY_MODIFY",
    "FUNC_REPORT_VIEW",
    "FUNC_REPORT_CREATE",
    "FUNC_REPORT_EXPORT",
    "FUNC_REPORT_SCHEDULE",
    "FUNC_REPORT_CUSTOM",
    "FUNC_APPROVAL_VIEW",
    "FUNC_APPROVAL_PROCESS",
    "FUNC_AUDIT_VIEW",
  ];

  for (const funcId of portfolioFunctions) {
    await prisma.roleFunction.upsert({
      where: {
        id: `RF_PORTMGR_${funcId}`,
      },
      update: {},
      create: {
        id: `RF_PORTMGR_${funcId}`,
        roleId: portfolioMgrRole.id,
        functionId: funcId,
        assignedBy: adminUser.id,
        status: "ACTIVE",
        approvedBy: adminUser.id,
        approvedAt: new Date(),
      },
    });
  }
  console.log(
    `Assigned ${portfolioFunctions.length} functions to Portfolio Manager`,
  );

  // Assign limited functions to Trader
  const traderFunctions = [
    "FUNC_PORTFOLIO_VIEW",
    "FUNC_TRANS_VIEW",
    "FUNC_TRANS_CREATE",
    "FUNC_TRANS_MODIFY",
    "FUNC_COMPANY_VIEW",
    "FUNC_REPORT_VIEW",
  ];

  for (const funcId of traderFunctions) {
    await prisma.roleFunction.upsert({
      where: {
        id: `RF_TRADER_${funcId}`,
      },
      update: {},
      create: {
        id: `RF_TRADER_${funcId}`,
        roleId: traderRole.id,
        functionId: funcId,
        assignedBy: adminUser.id,
        status: "ACTIVE",
        approvedBy: adminUser.id,
        approvedAt: new Date(),
      },
    });
  }
  console.log(`Assigned ${traderFunctions.length} functions to Trader`);

  // Assign view-only functions to Viewer
  const viewerFunctions = [
    "FUNC_PORTFOLIO_VIEW",
    "FUNC_TRANS_VIEW",
    "FUNC_COMPANY_VIEW",
    "FUNC_REPORT_VIEW",
    "FUNC_AUDIT_VIEW",
  ];

  for (const funcId of viewerFunctions) {
    await prisma.roleFunction.upsert({
      where: {
        id: `RF_VIEWER_${funcId}`,
      },
      update: {},
      create: {
        id: `RF_VIEWER_${funcId}`,
        roleId: viewerRole.id,
        functionId: funcId,
        assignedBy: adminUser.id,
        status: "ACTIVE",
        approvedBy: adminUser.id,
        approvedAt: new Date(),
      },
    });
  }
  console.log(`Assigned ${viewerFunctions.length} functions to Viewer`);

  // ========== PHASE 5: Assign Role to Admin User ==========

  await prisma.userRole.upsert({
    where: {
      id: `UR_ADMIN_SYSADMIN`,
    },
    update: {},
    create: {
      id: `UR_ADMIN_SYSADMIN`,
      userId: adminUser.id,
      roleId: sysAdminRole.id,
      assignedBy: adminUser.id,
      status: "ACTIVE",
      approvedBy: adminUser.id,
      approvedAt: new Date(),
      effectiveFrom: new Date(),
    },
  });
  console.log("Assigned System Administrator role to admin user");

  // ========== PHASE 6: Create Demo User with Role ==========

  const demoPasswordHash = await bcrypt.hash("demo123", 10);
  const demoUser = await prisma.user.upsert({
    where: { username: "demo" },
    update: {},
    create: {
      userId: "DEMO001",
      username: "demo",
      email: "demo@jclportfolio.com",
      passwordHash: demoPasswordHash,
      firstName: "Demo",
      surname: "User",
      designation: "Portfolio Manager",
      branchId: "BRANCH_MAIN",
      userTypeId: "MGR",
      telephone: "01-4000001",
      mobile: "9800000001",
      status: "ACTIVE",
      isActive: true,
      createdBy: adminUser.id,
      approvedBy: adminUser.id,
      approvedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  console.log("Created demo user:", demoUser.username);

  // Assign Portfolio Manager role to demo user
  await prisma.userRole.upsert({
    where: {
      id: `UR_DEMO_PORTMGR`,
    },
    update: {},
    create: {
      id: `UR_DEMO_PORTMGR`,
      userId: demoUser.id,
      roleId: portfolioMgrRole.id,
      assignedBy: adminUser.id,
      status: "ACTIVE",
      approvedBy: adminUser.id,
      approvedAt: new Date(),
      effectiveFrom: new Date(),
    },
  });
  console.log("Assigned Portfolio Manager role to demo user");

  // ========== PHASE 7: Create System Configuration ==========

  const systemConfigs = [
    {
      key: "app.name",
      value: "JCL Investment Portfolio",
      description: "Application name",
      category: "GENERAL",
    },
    {
      key: "app.version",
      value: "1.0.0",
      description: "Application version",
      category: "GENERAL",
    },
    {
      key: "security.max_login_attempts",
      value: "5",
      description: "Maximum failed login attempts before lockout",
      category: "SECURITY",
    },
    {
      key: "security.lockout_duration_minutes",
      value: "30",
      description: "Account lockout duration in minutes",
      category: "SECURITY",
    },
    {
      key: "security.session_timeout_minutes",
      value: "480",
      description: "Session timeout in minutes",
      category: "SECURITY",
    },
    {
      key: "security.password_expiry_days",
      value: "90",
      description: "Password expiry in days",
      category: "SECURITY",
    },
    {
      key: "audit.retention_days",
      value: "365",
      description: "Audit log retention period in days",
      category: "AUDIT",
    },
    {
      key: "nepse.update_interval_seconds",
      value: "300",
      description: "NEPSE market data update interval",
      category: "INTEGRATION",
    },
  ];

  for (const config of systemConfigs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {},
      create: {
        ...config,
        isEditable: true,
        updatedBy: adminUser.id,
      },
    });
  }
  console.log("Created", systemConfigs.length, "system configurations");

  // ========== PHASE 8: Create Sample Companies ==========

  const companies = [
    {
      symbol: "NABIL",
      companyName: "Nabil Bank Limited",
      sector: "Banking",
      instrumentType: "Equity",
      serialNumber: 1,
    },
    {
      symbol: "NTC",
      companyName: "Nepal Telecom",
      sector: "Telecom",
      instrumentType: "Equity",
      serialNumber: 2,
    },
    {
      symbol: "NICA",
      companyName: "NIC Asia Bank Limited",
      sector: "Banking",
      instrumentType: "Equity",
      serialNumber: 3,
    },
    {
      symbol: "SBL",
      companyName: "Siddhartha Bank Limited",
      sector: "Banking",
      instrumentType: "Equity",
      serialNumber: 4,
    },
    {
      symbol: "NLIC",
      companyName: "Nepal Life Insurance Company",
      sector: "Insurance",
      instrumentType: "Equity",
      serialNumber: 5,
    },
    {
      symbol: "UPPER",
      companyName: "Upper Tamakoshi Hydropower",
      sector: "Hydropower",
      instrumentType: "Equity",
      serialNumber: 6,
    },
  ];

  for (const company of companies) {
    await prisma.instrument.upsert({
      where: { symbol: company.symbol },
      update: {},
      create: company,
    });
  }
  console.log("Created", companies.length, "companies");

  // ========== PHASE 9: Create Initial Audit Log ==========

  await prisma.auditLog.create({
    data: {
      entityType: "SYSTEM",
      entityId: "INIT",
      action: "SEED_COMPLETED",
      newValues: JSON.stringify({
        userTypes: userTypes.length,
        functions: functions.length,
        branches: branches.length,
        roles: 4,
        users: 2,
        companies: companies.length,
      }),
      userId: adminUser.id,
      timestamp: new Date(),
      comment: "Initial system seed completed successfully",
    },
  });
  console.log("Created initial audit log entry");

  console.log("\n=== Seed completed successfully! ===");
  console.log("Admin user: admin / admin123");
  console.log("Demo user: demo / demo123");
  console.log("All SRS-compliant entities created and configured.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
