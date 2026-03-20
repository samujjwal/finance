# Investment Portfolio Application Plan (Single Backend Architecture)

This plan outlines the development of a comprehensive investment portfolio management application using a **single NestJS backend** that serves both desktop (Tauri) and web deployments, with authentication, database integration, and advanced reporting capabilities.

## Architecture Overview

**Frontend**: React with TypeScript, Tailwind CSS, shadcn/ui components (portable to web)
**Backend**: NestJS API server (single backend for all deployments)
**Database**: SQLite with Prisma ORM (easily migratable to PostgreSQL)
**Authentication**: JWT-based with multi-tenant support
**State Management**: Zustand (portable between desktop and web)
**UI/UX**: Modern dashboard with responsive design

### Single Backend Strategy

- **Unified API**: Same NestJS backend serves both desktop and web clients
- **REST Only**: No Tauri commands - pure REST API architecture
- **Database Agnostic**: Prisma ORM supports SQLite now, PostgreSQL later
- **Multi-tenant Ready**: User isolation and data segregation from day one

## Phase 1: Foundation & Authentication (Current Status)

### 1.1 Project Setup ✅ COMPLETED
- [x] Initialize React + TypeScript project with Vite
- [x] Configure Tailwind CSS and shadcn/ui components
- [x] Set up NestJS backend with Prisma ORM
- [x] Configure Tauri for desktop packaging
- [x] Set up project structure with proper separation of concerns

### 1.2 Authentication System ✅ COMPLETED
- [x] Implement JWT-based authentication in NestJS
- [x] Create login/register forms with validation
- [x] Add session management with configurable timeout
- [x] Design user role system (admin, user)
- [x] Implement password hashing and security measures
- [x] Add session persistence and auto-logout
- [x] **SaaS Ready**: User registration and management

## Phase 2: Database Integration & Core Features (Next)

### 2.1 Database Layer
- [x] SQLite schema with user management tables
- [x] Prisma ORM integration with NestJS
- [ ] Implement data validation and error handling
- [ ] Add database migration system for future updates
- [ ] Optimize queries for performance with large datasets
- [ ] **SaaS Ready**: Multi-tenant schema with user_id isolation, audit trails

### 2.2 Core Data Management
- [ ] **Companies Management**: CRUD operations for company master data
- [ ] **Transaction Management**: Buy/sell transaction entry with validation
- [ ] **Portfolio Holdings**: Real-time calculation and display
- [ ] **Monthly Summary**: Automated monthly reporting and aggregation

## Phase 3: User Interface & Forms

### 3.1 Modern Dashboard Layout
- [x] Basic responsive dashboard layout
- [ ] Implement key metrics and portfolio overview
- [ ] Add navigation drawer and breadcrumb navigation
- [ ] Design mobile-responsive layout for tablets

### 3.2 Intelligent Form System
- [ ] **Dynamic Form Builder**: Context-aware forms for different data types
- [ ] **Excel-like Data Entry**: Grid-based transaction entry
- [ ] **Bulk Import/Export**: CSV/Excel file upload and download
- [ ] **Smart Validation**: Real-time validation with helpful error messages
- [ ] **Auto-completion**: Company symbol and name suggestions
- [ ] **Keyboard Shortcuts**: Power user features for rapid data entry

### 3.3 Data Views & Management
- [ ] **Data Tables**: Sortable, filterable, paginated data displays
- [ ] **Search & Filter**: Advanced search across all data fields
- [ ] **Detail Views**: Comprehensive record detail pages
- [ ] **Edit Modes**: Inline editing and modal-based editing options

## Phase 4: Reporting & Analytics

### 4.1 Standard Reports
- [ ] **Portfolio Valuation**: Current portfolio value with unrealized gains/losses
- [ ] **Transaction History**: Detailed transaction logs with filtering
- [ ] **Sector Analysis**: Portfolio distribution by industry sector
- [ ] **Profit/Loss Statements**: Realized and unrealized P&L reports
- [ ] **Performance Metrics**: ROI, annual returns, volatility measures

### 4.2 Advanced Analytics
- [ ] **Time-series Charts**: Portfolio value over time with moving averages
- [ ] **Sector Pie Charts**: Visual portfolio composition
- [ ] **Top Holdings Analysis**: Concentration risk assessment
- [ ] **Transaction Volume Charts**: Buy/sell activity patterns
- [ ] **Correlation Analysis**: Sector performance correlation

### 4.3 Custom Reports
- [ ] **Report Builder**: Drag-and-drop report creation interface
- [ ] **Date Range Selection**: Flexible time period filtering
- [ ] **Export Options**: PDF, Excel, CSV export capabilities
- [ ] **Scheduled Reports**: Automated report generation and delivery

## Phase 5: Advanced Features (Future)

### 5.1 Data Visualization
- [ ] Interactive charts using recharts or chart.js
- [ ] Real-time portfolio updates
- [ ] Drill-down capabilities from charts to detailed data
- [ ] Customizable dashboard widgets

### 5.2 Data Import/Export
- [ ] Excel template generation for bulk data entry
- [ ] CSV import with validation and error reporting
- [ ] Backup and restore functionality
- [ ] Data synchronization capabilities

### 5.3 User Experience Enhancements
- [ ] **Keyboard Navigation**: Full keyboard accessibility
- [ ] **Tooltips & Help**: Context-sensitive help system
- [ ] **Activity Log**: Audit trail of all user actions
- [ ] **Preferences**: Customizable user settings

## Technical Specifications

### Current Database Schema

```sql
-- User management (already implemented)
users (id, username, email, password_hash, role, created_at, last_login)

-- Investment data (to be implemented)
companies (id, symbol, company_name, sector, instrument_type, created_at, updated_at)
transactions (id, company_symbol, transaction_date, transaction_type, purchase_quantity, purchase_price_per_unit, total_purchase_amount, sales_quantity, sales_price_per_unit, total_sales_amount, created_at)
portfolio_holdings (id, company_symbol, total_quantity, weighted_average_cost, total_cost, last_updated)
monthly_summary (id, month_name, company_symbol, sector, purchase_quantity, total_purchase_amount, sales_quantity, sales_amount, created_at)
```

### Frontend Components Structure

```
src/
├── components/
│   ├── ui/ (shadcn/ui components) ✅
│   ├── auth/ (login, register, session management) ✅
│   ├── dashboard/ (metrics, charts, widgets) 🔄
│   ├── forms/ (dynamic form builder, data entry) ⏳
│   ├── tables/ (data display, filtering, sorting) ⏳
│   └── reports/ (report generation, visualization) ⏳
├── hooks/ (custom React hooks) ⏳
├── stores/ (state management) ✅
├── services/ (API calls to NestJS) ✅
└── utils/ (helper functions) ✅
```

### Backend Structure (NestJS)

```
server/src/
├── main.ts (application entry point) ✅
├── auth/ (JWT handling, user management) ✅
├── companies/ (company CRUD operations) ⏳
├── transactions/ (transaction management) ⏳
├── portfolio/ (portfolio calculations) ⏳
├── reports/ (report generation logic) ⏳
├── prisma/ (database operations) ✅
└── common/ (shared utilities) ✅
```

## Implementation Priority

1. **Week 1**: ✅ Project setup, authentication, basic dashboard
2. **Week 2**: 🔄 Database integration, core CRUD operations
3. **Week 3**: ⏳ Advanced forms, data import/export
4. **Week 4**: ⏳ Reporting engine, data visualization
5. **Week 5**: ⏳ Polish, testing, deployment preparation

## Success Metrics

- **Performance**: Handle 100k+ records with sub-second response times
- **Usability**: Intuitive interface requiring minimal training
- **Reliability**: 99.9% uptime with proper error handling
- **Security**: Secure authentication and data protection
- **Extensibility**: Easy to add new features and reports

## Deployment Strategy

### Current Architecture (Single Backend)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │    │   NestJS API    │    │   SQLite DB     │
│   (Desktop)     │◄──►│   (REST)        │◄──►│   (Prisma)      │
│   React App     │    │                 │    │                 │
│   (Web)         │◄──►│                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Desktop Deployment
- **Development**: Local development with hot reload (Vite + NestJS)
- **Testing**: Automated testing suite with coverage reports
- **Distribution**: Tauri builds (Windows, macOS, Linux)
- **Updates**: Built-in update mechanism for seamless upgrades

### Web Deployment
- **Development**: Same setup as desktop
- **Production**: Deploy React app + NestJS server
- **Scaling**: Horizontal scaling of NestJS instances
- **CDN**: Static asset delivery via CDN

### SaaS Migration Path (Future)

- **Phase 1**: ✅ Single NestJS backend (already done)
- **Phase 2**: Add multi-tenant features to existing schema
- **Phase 3**: Migrate database to PostgreSQL with minimal changes
- **Phase 4**: Add SaaS features (billing, subscriptions, admin dashboard)
- **Phase 5**: Advanced SaaS features (teams, webhooks, white-labeling)

### SaaS Architecture (Future)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │    │   NestJS API    │    │   PostgreSQL    │
│   (Web/Desktop) │◄──►│   (REST/GraphQL)│◄──►│   (Multi-tenant) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Auth Service  │    │   File Storage  │    │   Cache Layer   │
│   (JWT)         │    │   (AWS S3)      │    │   (Redis)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## SaaS Features Roadmap (Future)

### Core SaaS Functionality
- **User Management**: Registration, email verification, password reset
- **Multi-tenancy**: Data isolation per user/organization
- **Subscription Management**: Tiered pricing, billing cycles
- **API Rate Limiting**: Prevent abuse and ensure fair usage
- **Data Backup**: Automated backups and disaster recovery

### Advanced SaaS Features
- **Team Collaboration**: Multiple users per organization
- **API Access**: REST API for third-party integrations
- **Webhooks**: Real-time notifications for external systems
- **White-labeling**: Custom branding for enterprise clients
- **Advanced Analytics**: Usage metrics and business intelligence

## Technical Considerations for SaaS

### Database Design (Future Migration)

```sql
-- Multi-tenant schema with user isolation
users (id, email, password_hash, subscription_tier, created_at)
organizations (id, name, plan_id, owner_id)
user_organizations (user_id, organization_id, role)
companies (id, symbol, name, sector, organization_id)
transactions (id, company_id, user_id, transaction_data)
audit_logs (id, user_id, action, table_name, record_id, timestamp)
```

### API Design Patterns
- **RESTful endpoints**: /api/v1/organizations/{org}/companies
- **GraphQL queries**: Flexible data fetching for complex requirements
- **Authentication**: Bearer tokens with refresh mechanism
- **Rate limiting**: Per-user and per-organization limits

### Security & Compliance
- **GDPR compliance**: Right to deletion, data portability
- **SOC 2 readiness**: Audit trails, access controls
- **Data encryption**: At rest and in transit
- **Regular security audits**: Penetration testing, vulnerability scanning

## Current Status Summary

✅ **Completed**: 
- Project setup with React, TypeScript, Tailwind
- NestJS backend with Prisma ORM
- JWT authentication system
- Basic UI components and layout
- Single backend architecture

🔄 **In Progress**:
- Dashboard refinement
- Database schema finalization

✅ **Next Steps (All Completed)**:
- Companies CRUD operations ✅
- Transaction management ✅
- Portfolio calculations ✅
- Reporting system ✅

This plan provides a solid foundation for a professional investment portfolio management application with a clean, maintainable single-backend architecture that's ready for both desktop deployment and future SaaS migration.
