# ProcureHub Gap Matrix (Implementation Tracker)

| Area | Current Feature | Enterprise Target | Priority | Effort | Owner |
|---|---|---|---|---|---|
| Phase 0: CORS | Configurable CORS allowlist implemented | Environment-specific strict allowlists by env + tests | P0 | S | Backend |
| Phase 0: Secrets | `.env` config | Vault/KMS-based secret retrieval + rotation SOP | P0 | M | DevOps |
| Phase 0: Audit | CRUD audit on selected flows | Full audit context (IP, UA, request-id, before/after all critical changes) | P0 | M | Backend |
| Phase 0: Migration | `AUTO_CREATE_TABLES` toggle + migration guide | Enforced Alembic migration pipeline with CI checks | P0 | M | Backend/DevOps |
| Phase 0: CI Security | Bandit, pip-audit, npm audit workflow | Add DAST (ZAP) + SBOM + gating thresholds | P0 | M | DevOps/Sec |
| Phase 1: Approval Engine | DB-driven approval rules/tasks | Multi-level chain completion, delegation, SLA/escalation | P1 | L | Backend |
| Phase 1: Budget | Budget reserve/check + commit endpoints | Commitment ledger per PR/PO + reversal automation | P1 | M | Backend/Finance |
| Phase 1: 3-Way Match | Invoice amount tolerance + GRN ratio checks | Line-level PO-GRN-Invoice matching with configurable tolerances | P1 | L | Backend |
| Phase 1: Invoice Queue | Invoice intake + exception listing | Workflow queue with actions, assignment, and resolution states | P1 | M | Backend |
| Phase 2: Sourcing | RFQ basic | Bid comparison matrix, negotiation logs, award analytics | P2 | L | Product/Backend |
| Phase 2: Contract | Not linked | Contract-to-PO linkage + compliance checks | P2 | L | Backend |
| Phase 2: Supplier Risk | Basic vendor status | Supplier scorecards + risk/compliance workflows | P2 | L | Product/Backend |
| Phase 3: Intelligence | Basic reporting | Anomaly detection + predictive insights | P3 | L | Data |
| Phase 3: Scale | INR-oriented | Multi-entity, multi-currency, multi-tax regimes | P3 | XL | Backend |

## KPI Targets
- PR→PO cycle time down 40%
- Maverick spend < 5%
- 3-way match auto-pass > 70%
- On-time vendor delivery > 90%
- Compliance violations trend down monthly
