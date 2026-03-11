# Project Siddhanta - Epic Generation Summary

## Overview

This directory contains implementation-ready epics for the AI-Native Capital Markets Platform (Project Siddhanta) for Nepal, generated based on:

- `docs/Siddhanta_Platform_Specification.md`
- `docs/siddhanta.md`
- `docs/capital_markets_platform_prompt_v2.1.md`
- `plans/CURRENT_EXECUTION_PLAN.md`
- `adr/ADR-011_STACK_STANDARDIZATION_AND_GHATANA_PLATFORM_ALIGNMENT.md`

The `VERSION:` header inside each epic file is authoritative. The lists below summarize module coverage and names, not a locked version matrix.

## Epic Structure

### Layer 0: Platform Kernel (K-XX) — 19 epics

Core infrastructure modules that provide foundational services:

- **EPIC-K-01**: Identity & Access Management
- **EPIC-K-01**: Identity & Access Management
- **EPIC-K-02**: Configuration Engine
- **EPIC-K-03**: Policy / Rules Engine
- **EPIC-K-04**: Plugin Runtime & SDK
- **EPIC-K-05**: Event Bus, Event Store & Workflow Orchestration
- **EPIC-K-06**: Observability Stack
- **EPIC-K-07**: Audit Framework
- **EPIC-K-08**: Data Governance
- **EPIC-K-09**: AI Governance
- **EPIC-K-10**: Deployment Abstraction
- **EPIC-K-11**: Unified API Gateway
- **EPIC-K-12**: Platform SDK
- **EPIC-K-13**: Admin Portal
- **EPIC-K-14**: Secrets Management & Key Vault
- **EPIC-K-15**: Dual-Calendar Service (Bikram Sambat & Gregorian)
- **EPIC-K-16**: Ledger Framework
- **EPIC-K-17**: Distributed Transaction Coordinator 🆕 [ARB P0-01]
- **EPIC-K-18**: Resilience Patterns Library 🆕 [ARB P0-02]
- **EPIC-K-19**: DLQ Management & Event Replay 🆕 [ARB P0-04]

### Platform Unity (PU-XX) — 1 epic

Cross-cutting platform capabilities:

- **EPIC-PU-004**: Platform Manifest

### Layer 1: Domain Subsystems (D-XX) — 14 epics

Business domain modules:

- **EPIC-D-01**: Order Management System (OMS)
- **EPIC-D-02**: Execution Management System (EMS)
- **EPIC-D-03**: Portfolio Management System (PMS)
- **EPIC-D-04**: Market Data
- **EPIC-D-05**: Pricing Engine
- **EPIC-D-06**: Risk Engine
- **EPIC-D-07**: Compliance & Controls
- **EPIC-D-08**: Trade Surveillance
- **EPIC-D-09**: Post-Trade & Settlement
- **EPIC-D-10**: Regulatory Reporting & Filings
- **EPIC-D-11**: Reference Data
- **EPIC-D-12**: Corporate Actions
- **EPIC-D-13**: Client Money Reconciliation 🆕 [ARB P1-11]
- **EPIC-D-14**: Sanctions Screening 🆕 [ARB P1-13]

### Layer 2: Workflow Orchestration (W-XX) — 2 epics

Cross-domain workflow modules:

- **EPIC-W-01**: Workflow Orchestration
- **EPIC-W-02**: Client Onboarding

### Layer 3: Pack Governance (P-XX) — 1 epic

Extension pack lifecycle management:

- **EPIC-P-01**: Pack Certification & Marketplace

### Cross-Cutting: Testing (T-XX) — 2 epics

Platform testing and quality assurance:

- **EPIC-T-01**: Platform Integration Testing & E2E Scenarios
- **EPIC-T-02**: Chaos Engineering & Resilience Testing 🆕 [ARB P2-19]

### Cross-Cutting: Operations (O-XX) — 1 epic

Operational excellence and SRE:

- **EPIC-O-01**: Operator Console

### Cross-Cutting: Regulatory (R-XX) — 2 epics

Regulatory interface and compliance:

- **EPIC-R-01**: Regulator Portal
- **EPIC-R-02**: Incident Response & Escalation 🆕 [ARB P1-15]

## Key Architectural Principles

All epics adhere to the following non-negotiable principles:

1. **Zero Hardcoding of Jurisdiction Logic**: All country-specific rules externalized to plugins
2. **Event-Sourced, Immutable State**: Every state change is an immutable event
3. **CQRS Separation**: Write and read models strictly separated
4. **Dual-Calendar Native**: Bikram Sambat and Gregorian at the data layer
5. **AI as Substrate**: AI embedded across all workflows with governance
6. **Plugin Taxonomy Enforcement**: T1 (Config), T2 (Rules), T3 (Executable) strictly enforced
7. **Generic Core Purity**: Nepal is first instantiation, not architectural boundary

## Epic Format

Each epic follows a standardized 16-section format:

1. Objective
2. Scope
3. Functional Requirements
4. Jurisdiction Isolation Requirements
5. Data Model Impact
6. Event Model Definition
7. Command Model Definition
8. AI Integration Requirements
9. NFRs (Non-Functional Requirements)
10. Acceptance Criteria
11. Failure Modes & Resilience
12. Observability & Audit
13. Compliance & Regulatory Traceability
14. Extension Points & Contracts
15. Future-Safe Architecture Evaluation
16. Threat Model

## Implementation Order

**CRITICAL**: Build order is strictly enforced:

1. **Layer 0 (Kernel)** must reach "Platform Stable" status first
2. **Layer 1 (Domain)** can only begin after all required Kernel modules are stable
3. **Layer 2 (Workflow)** can progress after required kernel foundations are stable and relevant domain contracts exist
4. **Layer 3+ cross-cutting epics** progress after their prerequisite kernel/domain/workflow contracts are stable

## Jurisdiction Isolation

All jurisdiction-specific logic (Nepal SEBON rules, NRB regulations, NEPSE protocols) is externalized to:

- **T1 Config Packs**: Data-only (tax tables, calendars, thresholds)
- **T2 Rule Packs**: Declarative logic (compliance rules, validation)
- **T3 Executable Packs**: Signed code (exchange adapters, pricing models)

## Next Steps

1. Review and validate each epic against business requirements
2. Prioritize epics based on critical path dependencies
3. Assign epics to development teams
4. Begin implementation with Layer 0 (Kernel) modules
5. Ensure all Kernel Readiness Gates are met before starting Domain modules

## Contact & Governance

For questions or clarifications on epic specifications, refer to:

- Strategic Vision: `siddhanta.md`
- Technical Specification: `Siddhanta_Platform_Specification.md`
- Planning Baseline: `plans/CURRENT_EXECUTION_PLAN.md`
- Stack Baseline: `adr/ADR-011_STACK_STANDARDIZATION_AND_GHATANA_PLATFORM_ALIGNMENT.md`
- Epic Generation Rules: `capital_markets_platform_prompt_v2.1.md`
