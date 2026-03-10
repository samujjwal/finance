# ALL-IN-ONE CAPITAL MARKETS PLATFORM

## Comprehensive Architecture, Operator Packs, Plugin Framework & Control Model

Version: 1.0\
Status: Architecture Baseline

Shared terminology and policy baseline: [Documentation_Glossary_and_Policy_Appendix.md](Documentation_Glossary_and_Policy_Appendix.md)
Shared authoritative source register: [Authoritative_Source_Register.md](Authoritative_Source_Register.md)
Reference style for time-sensitive external facts: `ASR-*` IDs from the shared source register.

------------------------------------------------------------------------

# 1. Executive Overview

This document defines a complete architecture specification for a
modular, regulator-grade, all-in-one capital markets platform
supporting:

This document is architecture-first. Use the Nepal-specific specification and shared source register for current market-state facts, regulatory status references, and date-sensitive operating metrics.

-   Brokerage + Depository Participants
-   Merchant Banking (Primary Markets)
-   Investment Banking (ECM/DCM + M&A)
-   Asset / Wealth Management
-   Exchange / Clearing / CSD Utilities
-   Fintech Retail Operators
-   Regulator-Backed Infrastructure Platforms

The platform is designed as:

Core Financial Operating System (FOS)\
+ Product Engines\
+ Country Packs\
+ Sector Packs\
+ Certified Plugin Ecosystem

------------------------------------------------------------------------

# 2. Core Financial Operating System (FOS)

## 2.1 Identity & Relationship Graph

Entities: - Individual - Corporate - Beneficial Owner - Director /
Signatory - Intermediary - Issuer - Counterparty - Exchange -
Depository - Bank - Regulator

Capabilities: - KYC/KYB lifecycle - Beneficial ownership graph - Risk
rating engine - Consent & disclosure registry - RBAC + ABAC -
Segregation of duties (maker-checker)

------------------------------------------------------------------------

## 2.2 Reference Data & Master Data Management

Required Master Domains:

-   Instrument Master (ISIN, symbol, board, settlement cycle)
-   Issuer Master
-   Counterparty Master
-   Calendar Master (holidays, cut-offs)
-   Corporate Actions Master
-   Tax Rules Master
-   Margin & Haircut Rules Master

Controls: - Versioned reference data - Effective-date support - Approval
workflow for overrides - Full audit trail of changes

------------------------------------------------------------------------

## 2.3 Ledger Architecture

Separate but reconciled layers:

1.  Operational Sub-Ledgers
    -   Securities positions
    -   Cash ledger
    -   Margin ledger
    -   Fee ledger
    -   Corporate actions ledger
2.  Accounting General Ledger (GL)
    -   IFRS / Local GAAP mapping
    -   Chart of accounts
    -   Journal posting engine
    -   Trial balance export
3.  Regulatory Ledgers
    -   Client asset segregation
    -   Net capital calculation
    -   Capital adequacy tracking

All ledgers must be: - Immutable - Event-driven - Replayable -
Tamper-evident

------------------------------------------------------------------------

## 2.4 Pricing & Valuation Engine

Capabilities: - End-of-day pricing - Intraday pricing - Mark-to-market -
NAV calculation (if applicable) - Price source hierarchy - Corporate
action adjustments - Override workflow with approval

------------------------------------------------------------------------

## 2.5 Margin, Collateral & Credit Engine

Required Features: - Exposure limits (client / group / instrument) -
Concentration limits - Collateral eligibility rules - Haircut logic -
Margin calls workflow - Shortfall handling - Forced liquidation
procedures - Settlement liquidity forecasting

------------------------------------------------------------------------

## 2.6 Client Money & Asset Segregation

Mandatory Controls: - Segregated client bank accounts - Daily client
money reconciliation - Withdrawal approval workflow - Prohibition of
unauthorized transfers - Audit-ready client asset reports

------------------------------------------------------------------------

## 2.7 Reconciliation Framework

Types: - Broker vs Exchange - Broker vs Depository - Broker vs Bank -
Sub-ledger vs GL - Client asset vs Bank balance

Features: - Auto-matching engine - Tolerance thresholds - Break
classification - Break aging & escalation - Resolution evidence storage

------------------------------------------------------------------------

## 2.8 Workflow & Case Management

-   BPM orchestration
-   SLA tracking
-   Exception queues
-   Regulator inspection pack export
-   Incident management linkage

------------------------------------------------------------------------

# 3. Deployment Modes (Refactored Exchange/Clearing/CSD)

The platform supports modular deployment:

Mode 1: Exchange Only - Matching engine - Market data dissemination -
Market surveillance

Mode 2: Clearing House - Netting engine - Margin calculation - Default
management - Collateral tracking

Mode 3: Central Securities Depository (CSD) - Securities register -
Settlement finality - Corporate actions master - Participant account
management

Mode 4: Integrated Utility - Exchange + Clearing + CSD combined

Each mode requires separate licensing, control model, and participant
governance.

------------------------------------------------------------------------

# 4. Operator Packs (Expanded with Controls & Reports)

------------------------------------------------------------------------

## PACK A: Broker + Depository Participant

Minimum Controls: - Client money segregation - Daily reconciliation -
Margin monitoring - Trade confirmation controls - Restricted list
enforcement

Mandatory Reconciliations: - Exchange trades - Depository positions -
Bank balances - Client asset segregation

Required Reports: - Daily trade register - Client holdings statement -
Margin report - Regulatory capital report - Suspicious transaction log

------------------------------------------------------------------------

## PACK B: Merchant Banker

Minimum Controls: - Conflict of interest registry - Due diligence
checklist - Prospectus validation - Escrow reconciliation - Allocation
audit trail

Mandatory Reconciliations: - Bid vs allocation - Escrow funds vs
subscriptions - Allotment vs depository credits

Required Reports: - Due diligence certificate - Allotment report - Issue
summary report - Regulatory submission pack

------------------------------------------------------------------------

## PACK C: Investment Bank

Minimum Controls: - Information barrier enforcement - Insider list
management - Wall-crossing logs - Conflict committee workflow

Mandatory Reconciliations: - Syndicate allocations - Fee split
distribution - Deal expense reconciliation

Required Reports: - Fairness opinion pack - Valuation documentation -
Deal audit trail - Regulatory filing bundle

------------------------------------------------------------------------

## PACK D: Asset / Wealth Manager

Minimum Controls: - Suitability enforcement - Override justification
logging - Performance methodology documentation

Mandatory Reconciliations: - Portfolio valuation vs custodian - Fee
billing vs ledger

Required Reports: - Client periodic statement - Performance report - Fee
invoice report - Tax summary pack

------------------------------------------------------------------------

## PACK E: Exchange / Clearing / CSD Utility

Minimum Controls: - Participant onboarding controls - Margin coverage
monitoring - Default management plan - Settlement cut-off enforcement

Mandatory Reconciliations: - Clearing margin vs collateral - Settlement
obligations vs actual settlement - Participant exposure monitoring

Required Reports: - Margin exposure report - Settlement completion
report - Market surveillance alerts

------------------------------------------------------------------------

## PACK F: Fintech Retail Operator

Minimum Controls: - Digital onboarding verification - Fraud detection -
Suitability simplified checks

Mandatory Reconciliations: - Broker vs exchange - Client ledger vs bank

Required Reports: - Retail portfolio statement - Fee transparency
summary - Risk disclosure log

------------------------------------------------------------------------

## PACK G: Regulator-Backed Platform

Minimum Controls: - Licensing registry - Breach tracking - Inspection
workflow

Mandatory Reconciliations: - Filing completeness checks - Cross-entity
exposure monitoring

Required Reports: - Intermediary compliance dashboard - Suspicious
activity register - Enforcement action log

------------------------------------------------------------------------

# 5. Plugin Framework

## 5.1 Plugin Contract JSON Schema

{ "\$schema": "http://json-schema.org/draft-07/schema#", "title":
"CapitalMarketsPlugin", "type": "object", "properties": { "name":
{"type": "string"}, "version": {"type": "string"},
"required_permissions": {"type": "array", "items": {"type": "string"}},
"consumed_events": {"type": "array", "items": {"type": "string"}},
"emitted_events": {"type": "array", "items": {"type": "string"}},
"data_access": {"type": "array", "items": {"type": "string"}},
"command_types_allowed": {"type": "array", "items": {"type": "string"}},
"pii_classes": {"type": "array", "items": {"type": "string"}},
"performance_slo": {"type": "string"}, "compatibility": {"type":
"string"}, "observability": {"type": "array", "items": {"type":
"string"}} }, "required": \["name", "version", "required_permissions"\]
}

------------------------------------------------------------------------

## 5.2 Example Plugin Declaration

{ "name": "IPO_BookBuilding_Module", "version": "1.0.0",
"required_permissions": \["READ_ISSUER", "SUBMIT_ALLOCATION"\],
"consumed_events": \["BidPlaced"\], "emitted_events":
\["AllocationGenerated"\], "data_access": \["Issuer", "Investor",
"Bid"\], "command_types_allowed": \["SubmitAllocationCommand"\],
"pii_classes": \["InvestorIdentity"\], "performance_slo": "500ms per
allocation batch", "compatibility": "Core\>=1.0.0", "observability":
\["latency", "error_rate"\] }

------------------------------------------------------------------------

# 6. Plugin Conformance & Certification Checklist

Technical: - Contract validation passes - No direct ledger mutation -
Idempotency verified - Load tested for burst traffic - Security scan
completed

Compliance: - Audit logs emitted - PII classification declared - Data
retention rules mapped - Role-based access validated

Operational: - Rollback strategy tested - Monitoring metrics
registered - Error handling documented - Documentation provided

Certification Steps: 1. Static analysis 2. Security review 3. Functional
conformance test 4. Performance test 5. Compliance audit approval 6.
Production enablement approval

------------------------------------------------------------------------

# 7. Versioning & Compatibility Strategy

-   Semantic versioning for Core and Plugins
-   Backward compatibility guarantee within major version
-   Schema migration tooling
-   Deprecation policy documentation
-   Plugin compatibility matrix

------------------------------------------------------------------------

# 8. Governance & Control Layers

1.  Command validation layer
2.  Policy enforcement layer
3.  Ledger mutation layer (core only)
4.  Audit & evidence capture
5.  Regulatory export layer

------------------------------------------------------------------------

# 9. Conclusion

This document defines a regulator-grade, modular, extensible capital
markets platform capable of supporting diverse operator models while
maintaining:

-   Investor protection
-   Market integrity
-   Operational resilience
-   Strict segregation of duties
-   Audit-grade evidence
-   Controlled plugin extensibility
