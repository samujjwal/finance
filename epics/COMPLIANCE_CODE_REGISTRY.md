# Compliance Code Registry

**Generated:** March 2, 2026  
**Purpose:** Centralized registry of all compliance and regulatory codes referenced across epics

---

## Overview

This registry documents all compliance codes (LCA-*) and authoritative source register codes (ASR-*) referenced throughout the epic specifications. These codes ensure traceability to regulatory requirements and internal compliance policies.

---

## LCA Codes (Local Compliance & Audit)

### LCA-AUDIT-001: Comprehensive Audit Logging
- **Category:** Audit & Traceability
- **Description:** All system actions, state changes, and user activities must be logged immutably with actor identity, timestamp (dual-calendar), and action details.
- **Requirements:**
  - Immutable audit trail (append-only)
  - Dual-calendar timestamps (Gregorian + BS)
  - Actor identification (user_id, service_id)
  - Action details (before/after state)
  - Retention: Minimum 10 years
- **Referenced By:** K-01, K-02, K-03, K-05, K-06, K-07, K-08, K-09, K-10, K-11, K-13, K-14, K-15, K-16, D-01, D-07, D-08, D-09, D-10, D-12, W-01, W-02, O-01, P-01, R-01, PU-004
- **Regulatory Basis:** SEBON Directives, NRB Guidelines, SOX, GDPR Article 30

### LCA-SOD-001: Segregation of Duties (Maker-Checker)
- **Category:** Access Control
- **Description:** Critical operations require dual approval (maker-checker) to prevent fraud and ensure oversight.
- **Requirements:**
  - Two distinct authorized users for approval
  - Same user cannot be both maker and checker
  - All approvals logged to audit trail
  - Timeout/escalation policies defined
- **Referenced By:** K-01, K-03, K-14, K-15, D-01, D-07, D-12, W-02, R-01
- **Regulatory Basis:** SEBON Market Conduct Rules, NRB Internal Control Guidelines

### LCA-RET-001: Data Retention Policy
- **Category:** Data Governance
- **Description:** Minimum retention periods for different data types to meet regulatory requirements.
- **Requirements:**
  - Trade records: 10 years minimum
  - Audit logs: 10 years minimum
  - Client records: 10 years minimum (approved), 2 years minimum (rejected)
  - Corporate action records: 10 years minimum
  - Compliance records: 10 years minimum
  - Operational logs: 1-2 years
- **Referenced By:** K-01, K-07, K-08, D-01, D-10, D-12, W-02, R-01
- **Regulatory Basis:** SEBON Record Keeping Requirements, NRB Directives

### LCA-AMLKYC-001: AML/KYC Compliance
- **Category:** Compliance
- **Description:** Anti-Money Laundering and Know Your Customer requirements for client onboarding and monitoring.
- **Requirements:**
  - Identity verification (National ID, biometrics)
  - Sanctions screening (OFAC, UN, EU lists)
  - PEP (Politically Exposed Person) checks
  - Ongoing monitoring and suspicious activity reporting
  - Enhanced due diligence for high-risk clients
- **Referenced By:** K-01, D-07, W-02
- **Regulatory Basis:** SEBON AML Directives, NRB KYC Guidelines, FATF Recommendations

### LCA-TAX-001: Tax Withholding Compliance
- **Category:** Tax
- **Description:** Accurate calculation and withholding of taxes on dividends, capital gains, and other income.
- **Requirements:**
  - Jurisdiction-specific tax rates (via T2 Rule Packs)
  - TDS (Tax Deducted at Source) calculation
  - Tax reporting to authorities
  - Certificate generation for taxpayers
- **Referenced By:** D-12
- **Regulatory Basis:** Nepal Income Tax Act, TDS Rules

### LCA-COMP-001: Pre-Trade Compliance Checks
- **Category:** Compliance
- **Description:** Mandatory compliance checks before order execution to prevent prohibited trades.
- **Requirements:**
  - Insider trading checks
  - Position limit verification
  - Restricted security checks
  - Circuit breaker compliance
  - Market manipulation detection
- **Referenced By:** K-03, D-01, D-07
- **Regulatory Basis:** SEBON Market Conduct Rules, Insider Trading Regulations

### LCA-BESTEX-001: Best Execution
- **Category:** Trading
- **Description:** Obligation to achieve best execution for client orders.
- **Requirements:**
  - Execution quality monitoring
  - Venue selection justification
  - Transaction cost analysis (TCA)
  - Slippage tracking
  - Periodic best execution reports
- **Referenced By:** D-01, D-02
- **Regulatory Basis:** SEBON Best Execution Guidelines, MiFID II (reference)

---

## ASR Codes (Authoritative Source Register)

### ASR-OPS-001: Operational Resilience
- **Category:** Operations
- **Description:** Platform must maintain operational resilience with defined RTO/RPO targets.
- **Requirements:**
  - Recovery Time Objective (RTO): < 4 hours
  - Recovery Point Objective (RPO): < 15 minutes
  - Disaster recovery procedures tested quarterly
  - Business continuity plan maintained
  - Incident response workflows documented
- **Referenced By:** O-01, W-01
- **Regulatory Basis:** SEBON Business Continuity Guidelines, ISO 22301

### ASR-SEC-001: Security Controls
- **Category:** Security
- **Description:** Comprehensive security controls for platform protection.
- **Requirements:**
  - Encryption in transit (TLS 1.3+) and at rest
  - Multi-factor authentication for critical access
  - Regular security assessments and penetration testing
  - Vulnerability management program
  - Security incident response plan
  - Third-party code governance
- **Referenced By:** K-01, K-08, K-11, K-12, K-14, P-01, T-01
- **Regulatory Basis:** SEBON Cybersecurity Guidelines, ISO 27001, NIST Cybersecurity Framework

### ASR-DATA-001: Data Residency & Sovereignty
- **Category:** Data Governance
- **Description:** Data must be stored and processed according to jurisdiction-specific residency requirements.
- **Requirements:**
  - Nepal data stored in Nepal (or approved jurisdictions)
  - Cross-border data transfer controls
  - Data localization compliance
  - Jurisdiction-aware data routing
- **Referenced By:** K-08, R-01
- **Regulatory Basis:** Nepal Data Protection Act (proposed), SEBON Data Guidelines

### ASR-RPT-001: Regulatory Reporting
- **Category:** Reporting
- **Description:** Timely and accurate regulatory reporting to authorities.
- **Requirements:**
  - Daily trade reports to SEBON
  - Monthly position reports
  - Quarterly compliance attestations
  - Annual audit reports
  - Dual-calendar timestamps on all reports
- **Referenced By:** K-15, D-10
- **Regulatory Basis:** SEBON Reporting Requirements, NRB Periodic Reporting

### ASR-EVID-001: Evidence Integrity
- **Category:** Compliance
- **Description:** Evidence packages for regulators must be tamper-evident and cryptographically signed.
- **Requirements:**
  - Cryptographic signing of evidence packages
  - Manifest files with checksums
  - Tamper-evident packaging
  - Signature verification required
  - Immutable audit trail of package generation
- **Referenced By:** R-01
- **Regulatory Basis:** SEBON Audit Requirements, Digital Evidence Standards

### ASR-TECH-001: Technical Auditability
- **Category:** Technology
- **Description:** Platform technical state must be auditable and reproducible.
- **Requirements:**
  - SDK version tracking
  - Platform manifest versioning
  - Configuration change tracking
  - Deployment history retention
  - Reproducible builds
- **Referenced By:** K-12, PU-004
- **Regulatory Basis:** SEBON Technology Risk Guidelines, SOC 2 Requirements

### ASR-QA-001: Software Quality Assurance
- **Category:** Quality
- **Description:** Comprehensive testing and quality assurance for platform software.
- **Requirements:**
  - Unit test coverage > 80%
  - Integration testing for all workflows
  - Performance testing against NFR targets
  - Security testing (OWASP Top 10)
  - Regression testing on every commit
- **Referenced By:** T-01
- **Regulatory Basis:** SEBON Software Development Guidelines, ISO 25010

---

## Compliance Code Usage Statistics

| Code | Category | Reference Count | Priority |
|------|----------|----------------|----------|
| LCA-AUDIT-001 | Audit | 26 epics | Critical |
| LCA-SOD-001 | Access Control | 9 epics | High |
| LCA-RET-001 | Data Governance | 8 epics | High |
| LCA-AMLKYC-001 | Compliance | 3 epics | High |
| LCA-TAX-001 | Tax | 1 epic | Medium |
| LCA-COMP-001 | Compliance | 3 epics | High |
| LCA-BESTEX-001 | Trading | 2 epics | Medium |
| ASR-OPS-001 | Operations | 2 epics | High |
| ASR-SEC-001 | Security | 7 epics | Critical |
| ASR-DATA-001 | Data Governance | 2 epics | High |
| ASR-RPT-001 | Reporting | 2 epics | High |
| ASR-EVID-001 | Compliance | 1 epic | Medium |
| ASR-TECH-001 | Technology | 2 epics | Medium |
| ASR-QA-001 | Quality | 1 epic | Medium |

---

## Regulatory Framework Mapping

### Nepal Securities Board (SEBON)
- **Applicable Codes:** LCA-AUDIT-001, LCA-SOD-001, LCA-RET-001, LCA-AMLKYC-001, LCA-COMP-001, LCA-BESTEX-001, ASR-OPS-001, ASR-SEC-001, ASR-RPT-001, ASR-EVID-001, ASR-TECH-001
- **Key Regulations:**
  - SEBON Act 2063
  - Securities Market Conduct Rules
  - Insider Trading Regulations
  - AML Directives
  - Cybersecurity Guidelines
  - Business Continuity Guidelines

### Nepal Rastra Bank (NRB)
- **Applicable Codes:** LCA-AMLKYC-001, LCA-RET-001, ASR-RPT-001
- **Key Regulations:**
  - NRB KYC Directive
  - AML/CFT Guidelines
  - Internal Control Guidelines
  - Periodic Reporting Requirements

### International Standards (Reference)
- **SOX (Sarbanes-Oxley):** LCA-AUDIT-001, LCA-SOD-001
- **GDPR:** LCA-AUDIT-001, LCA-RET-001, ASR-DATA-001
- **MiFID II:** LCA-BESTEX-001
- **FATF:** LCA-AMLKYC-001
- **ISO 27001:** ASR-SEC-001
- **ISO 22301:** ASR-OPS-001
- **SOC 2:** LCA-AUDIT-001, ASR-TECH-001

---

## Compliance Verification Checklist

### For Each Epic Implementation

- [ ] All referenced compliance codes documented
- [ ] Compliance requirements implemented in code
- [ ] Audit logging configured per LCA-AUDIT-001
- [ ] Maker-checker workflows implemented (if applicable)
- [ ] Data retention policies configured
- [ ] Security controls implemented per ASR-SEC-001
- [ ] Test cases cover compliance scenarios
- [ ] Compliance evidence generation tested
- [ ] Regulatory reporting validated
- [ ] Documentation updated with compliance details

### For Platform Deployment

- [ ] All LCA codes verified across platform
- [ ] All ASR codes verified across platform
- [ ] Compliance dashboard configured
- [ ] Regulatory reporting pipelines tested
- [ ] Audit trail integrity verified
- [ ] Data residency rules enforced
- [ ] Security controls operational
- [ ] Incident response procedures documented
- [ ] Compliance training completed
- [ ] Regulatory approval obtained (if required)

---

## Maintenance & Updates

### Adding New Compliance Codes

1. Assign unique code (LCA-XXX-### or ASR-XXX-###)
2. Document in this registry with full details
3. Reference in relevant epic specifications
4. Update compliance verification checklist
5. Communicate to implementation teams
6. Update compliance dashboard

### Updating Existing Codes

1. Document change reason and regulatory basis
2. Update all referencing epics
3. Notify affected teams
4. Update test cases
5. Version control the change
6. Audit trail of modification

### Quarterly Review

- Review all compliance codes for regulatory changes
- Validate code usage across epics
- Update regulatory framework mapping
- Assess new regulatory requirements
- Archive deprecated codes

---

**Registry Status:** ✅ ACTIVE  
**Last Updated:** March 2, 2026  
**Next Review:** June 2, 2026  
**Owner:** Compliance & Regulatory Team  
**Approver:** Chief Compliance Officer
