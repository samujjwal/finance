-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "surname" TEXT NOT NULL,
    "designation" TEXT,
    "branch_id" TEXT NOT NULL,
    "user_type_id" TEXT NOT NULL,
    "telephone" TEXT,
    "mobile" TEXT,
    "extension" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" DATETIME,
    "lock_reason" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_password_change" DATETIME,
    "organization_id" TEXT,
    "created_by" TEXT,
    "approved_by" TEXT,
    "approved_at" DATETIME,
    "rejection_reason" TEXT,
    "suspension_reason" TEXT,
    "last_login" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "users_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "users_user_type_id_fkey" FOREIGN KEY ("user_type_id") REFERENCES "user_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "users_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "users_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serial_number" INTEGER,
    "symbol" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "symbol2" TEXT,
    "sector" TEXT,
    "symbol3" TEXT,
    "instrument_type" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "company_symbol" TEXT NOT NULL,
    "bill_no" TEXT,
    "transaction_date" TEXT NOT NULL,
    "transaction_type" TEXT NOT NULL,
    "purchase_quantity" INTEGER NOT NULL DEFAULT 0,
    "purchase_price_per_unit" REAL,
    "total_purchase_amount" REAL,
    "purchase_commission" REAL,
    "purchase_dp_charges" REAL,
    "sebon_fee_purchase" REAL,
    "other_charges_purchase" REAL,
    "total_purchase_cost" REAL,
    "sales_quantity" INTEGER NOT NULL DEFAULT 0,
    "sales_price_per_unit" REAL,
    "total_sales_amount" REAL,
    "sales_commission" REAL,
    "sales_dp_charges" REAL,
    "sebon_fee_sales" REAL,
    "other_charges_sales" REAL,
    "total_sales_charges" REAL,
    "principal_cost_nfrs" REAL,
    "transaction_cost_nfrs" REAL,
    "unit_sum" REAL,
    "wacc_nfrs" REAL,
    "profit_loss_nfrs" REAL,
    "capital_gain_tax" REAL,
    "net_receivables" REAL,
    "principal_amount_tax" REAL,
    "tc_tax" REAL,
    "wacc_tax" REAL,
    "profit_loss_tax" REAL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "approved_by" TEXT,
    "approved_at" DATETIME,
    "created_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "transactions_company_symbol_fkey" FOREIGN KEY ("company_symbol") REFERENCES "companies" ("symbol") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "transactions_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "monthly_summary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "month_name" TEXT,
    "serial_no" INTEGER,
    "company_symbol" TEXT NOT NULL,
    "sector" TEXT,
    "purchase_quantity" INTEGER,
    "total_purchase_amount" REAL,
    "sales_quantity" INTEGER,
    "sales_amount" REAL,
    "tc_nfrs" REAL,
    "closing_units" INTEGER,
    "wacc_nfrs" REAL,
    "profit_loss_nfrs" REAL,
    "purchase_commission" REAL,
    "purchase_dp_charges" REAL,
    "total_purchase_commission" REAL,
    "investment_cost_with_commission" REAL,
    "sales_commission" REAL,
    "sales_dp_charges" REAL,
    "total_sales_commission" REAL,
    "capital_gain_tax" REAL,
    "net_receivables" REAL,
    "tc_tax" REAL,
    "wacc_tax" REAL,
    "profit_loss_tax" REAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "monthly_summary_company_symbol_fkey" FOREIGN KEY ("company_symbol") REFERENCES "companies" ("symbol") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "portfolio_holdings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "company_symbol" TEXT NOT NULL,
    "total_quantity" INTEGER NOT NULL DEFAULT 0,
    "available_quantity" INTEGER NOT NULL DEFAULT 0,
    "pledged_quantity" INTEGER NOT NULL DEFAULT 0,
    "weighted_average_cost" REAL,
    "total_cost" REAL,
    "market_value" REAL,
    "unrealized_gain_loss" REAL,
    "unrealized_gain_loss_percent" REAL,
    "last_updated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "portfolio_holdings_company_symbol_fkey" FOREIGN KEY ("company_symbol") REFERENCES "companies" ("symbol") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "validation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "validation_type" TEXT NOT NULL,
    "validation_data" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "user_types" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "functions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "module" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "branches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "user_type_id" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "approved_by" TEXT,
    "approved_at" DATETIME,
    "rejection_reason" TEXT,
    "suspension_reason" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "roles_user_type_id_fkey" FOREIGN KEY ("user_type_id") REFERENCES "user_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "roles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "roles_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "role_functions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role_id" TEXT NOT NULL,
    "function_id" TEXT NOT NULL,
    "assigned_by" TEXT,
    "assigned_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "approved_by" TEXT,
    "approved_at" DATETIME,
    "rejection_reason" TEXT,
    CONSTRAINT "role_functions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "role_functions_function_id_fkey" FOREIGN KEY ("function_id") REFERENCES "functions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "role_functions_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "role_functions_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "assigned_by" TEXT,
    "assigned_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "approved_by" TEXT,
    "approved_at" DATETIME,
    "rejection_reason" TEXT,
    "effective_from" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" DATETIME,
    CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_roles_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "user_roles_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "old_values" TEXT,
    "new_values" TEXT,
    "user_id" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "comment" TEXT,
    CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "approval_workflows" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "requested_by" TEXT NOT NULL,
    "requested_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approved_by" TEXT,
    "approved_at" DATETIME,
    "rejection_reason" TEXT,
    CONSTRAINT "approval_workflows_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "approval_workflows_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "system_config" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "is_editable" BOOLEAN NOT NULL DEFAULT true,
    "updated_by" TEXT,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "system_config_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "fee_rates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "instrument" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "min_amount" REAL,
    "max_amount" REAL,
    "rate" REAL,
    "fixed_amount" REAL,
    "min_fixed" REAL,
    "investor_type" TEXT,
    "term_type" TEXT,
    "remarks" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_user_id_key" ON "users"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "companies_symbol_key" ON "companies"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "portfolio_holdings_company_symbol_key" ON "portfolio_holdings"("company_symbol");

-- CreateIndex
CREATE UNIQUE INDEX "user_types_name_key" ON "user_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "functions_name_key" ON "functions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "branches_code_key" ON "branches"("code");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "approval_workflows_entity_type_entity_id_idx" ON "approval_workflows"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "approval_workflows_status_idx" ON "approval_workflows"("status");

-- CreateIndex
CREATE INDEX "approval_workflows_requested_by_idx" ON "approval_workflows"("requested_by");

-- CreateIndex
CREATE UNIQUE INDEX "system_config_key_key" ON "system_config"("key");
