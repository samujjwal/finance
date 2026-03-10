EPIC-ID:    EPIC-R-02
EPIC NAME:  Incident Notification & Escalation
LAYER:      REGULATORY
MODULE:     R-02 Incident Notification & Escalation
VERSION:    1.0.0
ARB-REF:    P1-15

---

#### Section 1 — Objective

Deliver the R-02 Incident Notification & Escalation module to provide automated, timely notification to regulators, senior management, and affected parties when critical incidents occur. This epic directly remediates ARB finding P1-15 and Regulatory Architecture Document GAP-007, ensuring the platform meets regulatory requirements for incident disclosure within mandated timeframes.

---

#### Section 2 — Scope

- **In-Scope:**
  1. Automated incident detection and classification (integrating with K-06 alerts).
  2. Configurable notification rules per incident type and severity.
  3. Regulator notification with structured incident reports.
  4. Internal escalation workflows (operations → compliance → management → board).
  5. Notification tracking and acknowledgment management.
  6. Integration with R-01 Regulator Portal for incident report delivery.
- **Out-of-Scope:**
  1. Root cause analysis (performed by operations teams using K-06/K-19).
  2. Incident remediation (handled by relevant module owners).
- **Dependencies:** EPIC-K-02 (Config Engine), EPIC-K-05 (Event Bus), EPIC-K-06 (Observability), EPIC-K-07 (Audit Framework), EPIC-K-15 (Dual-Calendar), EPIC-R-01 (Regulator Portal)
- **Kernel Readiness Gates:** K-06, R-01 must be stable.
- **Module Classification:** Regulatory Subsystem

---

#### Section 3 — Functional Requirements (FR)

1. **FR1 Incident Classification:** Automatically classify incidents based on severity and type: (a) P0-CRITICAL: data breach, client money shortfall, system-wide outage > 15 minutes, audit chain compromise, (b) P1-HIGH: partial outage > 30 minutes, segregation warning, sanctions match confirmed, (c) P2-MEDIUM: degraded performance > 1 hour, DLQ threshold breach, failed reconciliation. Classification rules are configurable via T2 Rule Packs.
2. **FR2 Regulator Notification:** For P0 and P1 incidents, automatically generate a structured incident report and deliver to the regulator via R-01 Regulator Portal within configurable SLA: (a) P0: initial notification within 4 hours, (b) P1: initial notification within 24 hours. Report includes: incident summary, affected systems/clients, impact assessment, containment actions taken, estimated resolution time.
3. **FR3 Internal Escalation:** Escalate incidents through configurable chains: (a) Level 1: On-call engineer (immediate), (b) Level 2: Team lead (15 minutes if unacknowledged), (c) Level 3: Head of Operations (30 minutes), (d) Level 4: Chief Compliance Officer (1 hour for P0), (e) Level 5: Board notification (4 hours for P0 unresolved). All escalations are audited.
4. **FR4 Notification Channels:** Support multiple notification channels: (a) Email (structured HTML report), (b) SMS (summary alert), (c) Webhook (for integration with external ITSM tools), (d) R-01 Portal (secure delivery to regulator), (e) PagerDuty/OpsGenie integration. Channel selection configurable per recipient and severity.
5. **FR5 Acknowledgment Tracking:** Track notification delivery and acknowledgment: (a) delivery confirmation per channel, (b) read receipt for portal-delivered reports, (c) escalation if not acknowledged within configurable window. Emit `IncidentNotificationUnacknowledgedEvent` on timeout.
6. **FR6 Incident Lifecycle:** Track incident through lifecycle: DETECTED → NOTIFIED → ACKNOWLEDGED → INVESTIGATING → CONTAINED → RESOLVED → POST_MORTEM. Each state change is audited. Post-mortem report required for all P0 incidents within 5 business days.
7. **FR7 Affected Party Notification:** For incidents affecting client data or funds, support automated notification to affected clients (via configurable templates) within regulatory-mandated timeframes. Client notification requires maker-checker approval.
8. **FR8 Dual-Calendar Support:** All incident timestamps, SLA deadlines, and report dates use dual-calendar via K-15.

---

#### Section 4 — Jurisdiction Isolation Requirements

1. **Generic Core:** The notification engine, escalation workflow, and tracking are generic.
2. **Jurisdiction Plugin:** Notification SLAs, regulator contact details, report templates, and client notification requirements are defined in T1 Config Packs per jurisdiction.
3. **Resolution Flow:** K-02 Config Engine determines notification rules per jurisdiction.
4. **Hot Reload:** Escalation timelines and notification templates hot-reloadable.
5. **Backward Compatibility:** Historical incident records are immutable.
6. **Future Jurisdiction:** New jurisdiction requires new SLA config and report templates.

---

#### Section 5 — Data Model Impact

- **New Entities:**
  - `Incident`: `{ incident_id: UUID, type: Enum, severity: Enum(P0, P1, P2), status: Enum, summary: String, affected_systems: List<String>, detected_at: DualDate, resolved_at: DualDate }`
  - `IncidentNotification`: `{ notification_id: UUID, incident_id: UUID, recipient: String, channel: Enum, status: Enum(SENT, DELIVERED, ACKNOWLEDGED, ESCALATED), sent_at: DualDate, acknowledged_at: DualDate }`
  - `EscalationRecord`: `{ escalation_id: UUID, incident_id: UUID, from_level: Int, to_level: Int, reason: String, escalated_at: DualDate }`
- **Dual-Calendar Fields:** `detected_at`, `resolved_at`, `sent_at`, `acknowledged_at`, `escalated_at` use `DualDate`.
- **Event Schema Changes:** `IncidentDetectedEvent`, `IncidentEscalatedEvent`, `IncidentResolvedEvent`, `IncidentNotificationUnacknowledgedEvent`.

---

#### Section 6 — Event Model Definition

| Field | Description |
|---|---|
| Event Name | `IncidentEscalatedEvent` |
| Schema Version | `v1.0.0` |
| Trigger Condition | An incident is escalated to the next level due to unacknowledged notification or severity. |
| Payload | `{ "incident_id": "...", "severity": "P0", "from_level": 2, "to_level": 3, "reason": "Unacknowledged after 30 minutes" }` |
| Consumers | K-06 Alerting, On-Call Escalation, Admin Portal |
| Idempotency Key | `hash(incident_id + to_level)` |
| Replay Behavior | N/A (alert event). |
| Retention Policy | Permanent. |

---

#### Section 6.5 — Command Model Definition

| Field | Description |
|---|---|
| Command Name | `AcknowledgeIncidentCommand` |
| Schema Version | `v1.0.0` |
| Validation Rules | Incident exists, requester is designated recipient, incident not yet acknowledged by this level |
| Handler | `IncidentCommandHandler` in R-02 |
| Success Event | `IncidentAcknowledged` |
| Failure Event | `IncidentAcknowledgeFailed` |
| Idempotency | Acknowledgment per incident per level is idempotent |

| Field | Description |
|---|---|
| Command Name | `ResolveIncidentCommand` |
| Schema Version | `v1.0.0` |
| Validation Rules | Incident exists, resolution summary provided, requester authorized |
| Handler | `IncidentCommandHandler` in R-02 |
| Success Event | `IncidentResolved` |
| Failure Event | `IncidentResolutionFailed` |
| Idempotency | Command ID must be unique |

---

#### Section 7 — AI Integration Requirements

- **AI Hook Type:** Classification / Summarization
- **Workflow Steps Exposed:** Incident classification and report generation.
- **Model Registry Usage:** `incident-classifier-v1`, `incident-summarizer-v1`
- **Explainability Requirement:** AI must explain severity classification reasoning; human can override.
- **Human Override Path:** Compliance officer can upgrade/downgrade incident severity.
- **Drift Monitoring:** Classification accuracy monitored against post-mortem findings.
- **Fallback Behavior:** Rule-based classification from K-06 alert metadata.

---

#### Section 8 — NFRs

| NFR Category | Required Targets |
|---|---|
| Latency / Throughput | Notification sent within 60 seconds of incident detection |
| Scalability | Horizontally scalable notification workers |
| Availability | 99.999% uptime (critical regulatory path) |
| Consistency Model | Strong consistency for incident state |
| Security | Incident reports encrypted in transit and at rest; access restricted |
| Data Residency | Incident data follows K-08 residency rules |
| Data Retention | Incident records retained per audit policy (minimum 10 years) |
| Auditability | All incident lifecycle changes logged to K-07 [LCA-AUDIT-001] |
| Observability | Metrics: `incident.count`, `incident.notification.latency`, `incident.resolution.time`, `incident.escalation.count` |
| Extensibility | New notification channels via plugin |
| Upgrade / Compatibility | Backward compatible API |
| On-Prem Constraints | Email/SMS notification via local SMTP/gateway |
| Ledger Integrity | N/A |
| Dual-Calendar Correctness | All timestamps use DualDate |

---

#### Section 9 — Acceptance Criteria

1. **Given** a P0 data breach detected by K-06, **When** R-02 processes the alert, **Then** a structured incident report is delivered to the regulator via R-01 within 4 hours.
2. **Given** an incident notification sent to on-call engineer, **When** unacknowledged for 15 minutes, **Then** the incident auto-escalates to the team lead.
3. **Given** a resolved P0 incident, **When** 5 business days pass without a post-mortem report, **Then** an alert is raised to the Head of Operations.
4. **Given** a client data breach affecting 500 clients, **When** client notification is initiated, **Then** maker-checker approval is required before sending.
5. **Given** an air-gapped deployment, **When** regulator notification is required, **Then** a signed incident report is generated for manual delivery, and the system tracks that manual delivery is pending.

---

#### Section 10 — Failure Modes & Resilience

- **Notification Channel Down:** Failover to alternate channel; retry with backoff; alert raised.
- **R-01 Portal Unavailable:** Incident report queued; delivered on recovery; manual delivery initiated as backup.
- **Escalation Service Down:** Escalation queue persisted locally; processed on recovery.
- **All Channels Down:** CRITICAL alert to system monitoring; manual notification procedures activated.

---

#### Section 11 — Observability & Audit

| Telemetry Type | Required Details |
|---|---|
| Metrics | `incident.detected.count`, `incident.notification.latency`, `incident.escalation.count`, `incident.resolution.time` |
| Logs | Structured: `incident_id`, `severity`, `status`, `notification_channel`, `recipient` |
| Traces | Span per incident lifecycle |
| Audit Events | `IncidentDetected`, `IncidentNotified`, `IncidentEscalated`, `IncidentResolved` [LCA-AUDIT-001] |
| Regulatory Evidence | Incident reports and notification receipts for regulatory examination [LCA-INCIDENT-001] |

---

#### Section 12 — Compliance & Regulatory Traceability

- Incident disclosure requirements [LCA-INCIDENT-001]
- Breach notification (GDPR 72-hour) [LCA-BREACH-001]
- Audit trails [LCA-AUDIT-001]

---

#### Section 13 — Extension Points & Contracts

- **SDK Contract:** `IncidentClient.report(incident)`, `IncidentClient.acknowledge(incidentId)`, `IncidentClient.resolve(incidentId, summary)`.
- **Jurisdiction Plugin Extension Points:** T1 Config Packs for SLA timelines and report templates.

---

#### Section 14 — Future-Safe Architecture Evaluation

| Question | Expected Answer |
|---|---|
| Can this module support India/Bangladesh via plugin? | Yes, via jurisdiction-specific SLA configs and templates. |
| Can new notification channels be added? | Yes, via plugin interface. |
| Can this run in an air-gapped deployment? | Yes, with local notification and manual delivery tracking. |
