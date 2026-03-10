# Siddhanta — Capital Markets Operating System

> A **jurisdiction-neutral, regulator-grade capital markets platform** designed as an extensible operating system. Nepal (SEBON / NRB / NEPSE) is the first instantiation — not the architectural boundary.

## Architecture at a Glance

| Dimension | Choice |
|-----------|--------|
| **Architecture Style** | 7-layer microservices, Event Sourcing, CQRS |
| **Extensibility Model** | T1 Config / T2 Rules (OPA-Rego) / T3 Executable Content Packs |
| **Calendar** | Dual-Calendar Native (Bikram Sambat + Gregorian) |
| **Tech Stack** | Java 21 + ActiveJ, Node.js LTS + TypeScript + Fastify + Prisma, Python 3.11 + FastAPI, React 18 + Tailwind CSS + Jotai + TanStack Query, Kafka 3+, PostgreSQL 15+, TimescaleDB, Redis 7+, Elasticsearch, Kubernetes, Istio |
| **Security** | Zero-Trust, OPA policy-as-code, mTLS, HashiCorp Vault |
| **Availability Target** | 99.999% (5.26 min downtime/year) |
| **Data Retention** | 10 years regulatory minimum |

> **Stack authority**: [ADR-011_STACK_STANDARDIZATION_AND_GHATANA_PLATFORM_ALIGNMENT.md](ADR-011_STACK_STANDARDIZATION_AND_GHATANA_PLATFORM_ALIGNMENT.md) is the canonical technology baseline. Older architecture and C4 docs may contain historical labels that do not override ADR-011.

## Repository Structure

```
├── ARCHITECTURE_AND_DESIGN_SPECIFICATION.md   # Master index & key architectural decisions
├── CURRENT_EXECUTION_PLAN.md                  # Current implementation and phase plan
├── ADR-011_STACK_STANDARDIZATION_AND_GHATANA_PLATFORM_ALIGNMENT.md # Canonical stack baseline and Ghatana alignment
├── ARCHITECTURE_SPEC_PART_1_SECTIONS_1-3.md   # Executive summary, layered architecture, event-driven/CQRS
├── ARCHITECTURE_SPEC_PART_1_SECTIONS_4-5.md   # Configuration hierarchy, plugin runtime (T1/T2/T3)
├── ARCHITECTURE_SPEC_PART_2_SECTIONS_6-8.md   # Data architecture, database schemas, AI/ML
├── ARCHITECTURE_SPEC_PART_2_SECTIONS_9-10.md  # Security, deployment, observability
├── ARCHITECTURE_SPEC_PART_3_SECTIONS_11-15.md # Performance, compliance, future-safe, traceability
├── C4_C1_CONTEXT_SIDDHANTA.md                 # C4 Level 1 — System Context
├── C4_C2_CONTAINER_SIDDHANTA.md               # C4 Level 2 — Container
├── C4_C3_COMPONENT_SIDDHANTA.md               # C4 Level 3 — Component
├── C4_C4_CODE_SIDDHANTA.md                    # C4 Level 4 — Code
├── REGULATORY_ARCHITECTURE_DOCUMENT.md        # Regulatory compliance framework
├── epics/                                      # 42 epics across 8 layers
│   ├── EPIC-K-01 through K-19                 # Kernel layer (19 epics)
│   ├── EPIC-D-01 through D-14                 # Domain layer (14 epics)
│   ├── EPIC-W-01, W-02                        # Workflow layer
│   ├── EPIC-P-01                              # Content Packs certification
│   ├── EPIC-T-01, T-02                        # Testing layer
│   ├── EPIC-O-01                              # Operations
│   ├── EPIC-R-01, R-02                        # Regulatory layer
│   └── DEPENDENCY_MATRIX.md                   # Cross-epic dependency graph
├── LLD_INDEX.md                               # Low-Level Design master index
├── LLD_D01_OMS.md                             # Order Management System LLD
├── LLD_K02_CONFIGURATION_ENGINE.md            # Config Engine LLD
├── LLD_K03_RULES_ENGINE.md                    # Rules Engine LLD
├── LLD_K04_PLUGIN_RUNTIME.md                  # Plugin Runtime LLD
├── LLD_K05_EVENT_BUS.md                       # Event Bus LLD
├── LLD_K07_AUDIT_FRAMEWORK.md                 # Audit Framework LLD
├── LLD_K09_AI_GOVERNANCE.md                   # AI Governance LLD
└── docs/                                       # Proposals, claims, research
```

## Key Architectural Decisions

1. **T1/T2/T3 Content Pack Taxonomy** — All jurisdiction-specific logic lives in packs, not platform code
2. **Dual-Calendar Native** — Bikram Sambat alongside Gregorian at the data layer
3. **K-05 Standard Event Envelope** — Every event carries `event_type`, `aggregate_id`, `causality_id`, `trace_id`, `timestamp_bs`, `timestamp_gregorian`, and a `data` payload wrapper
4. **10-Year Regulatory Retention** — All audit/trade/event data retained for 10 years minimum
5. **99.999% Availability** — Active-active multi-AZ with automatic failover
6. **ADR-011 Stack Standardization** — One canonical stack baseline aligned to finance ADRs and reusable Ghatana platform products

## Epic Layers

| Layer | Count | Scope |
|-------|-------|-------|
| Kernel (K) | 19 | IAM, Config, Rules, Plugin, Event Bus, Observability, Audit, Data Governance, AI Governance, Deployment, API Gateway, Platform SDK, Dual-Calendar, Ledger, DTC, Resilience, DLQ |
| Domain (D) | 14 | OMS, EMS, PMS, Market Data, Pricing, Risk, Compliance, Surveillance, Post-Trade, Regulatory Reporting, Reference Data, Corporate Actions, Client Money, Sanctions |
| Workflow (W) | 2 | Orchestration, Client Onboarding |
| Packs (P) | 1 | Content Pack Certification Pipeline |
| Testing (T) | 2 | Testing Framework, Performance Testing |
| Operations (O) | 1 | Runbook Automation |
| Regulatory (R) | 2 | Regulator Portal, Incident Notification |
| Platform Unity (PU) | 1 | Platform Manifest |

## Version

**v2.1** — March 2026 | Post-ARB Review | Hardened for consistency, extensibility, and future-proofing.
