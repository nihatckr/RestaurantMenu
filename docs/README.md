# Documentation

All project docs live here. Start with **[JOURNEY.md](JOURNEY.md)** for the story of
how the app was built (decisions + how we solved them), then dive into the specific
docs below. The agent contract (`../AGENTS.md`) points here for the binding specs.

## Authority (binding — in this order)

| Doc | Role |
| --- | --- |
| [PRODUCT.md](PRODUCT.md) | **What** the system is and does — the product authority. |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Technical boundaries: stack, allowed/denied deps, read/write paths. |
| [LEGACY_AUDIT.md](LEGACY_AUDIT.md) | Evidence of what the old Terrace/Garden apps did (reference only — the apps were removed 2026-08-28; source kept on GitHub). |

## Supporting specs (binding within their domain)

| Doc | Domain |
| --- | --- |
| [SECURITY.md](SECURITY.md) | Threat model + controls (CSP, headers, read-only public path). |
| [I18N.md](I18N.md) | Localization (tr/en/ru) — affects the schema. |
| [DESIGN.md](DESIGN.md) | UI system: tokens, typography roles, responsive rules, a11y. |
| [DATA_SOURCING.md](DATA_SOURCING.md) | Seed source + SaaS domain cutover. |
| [OPS.md](OPS.md) | Infra / operations. |
| [COMPLIANCE.md](COMPLIANCE.md) | TR price-label law (6502) obligations. |

## History & reference

| Doc | Purpose |
| --- | --- |
| [JOURNEY.md](JOURNEY.md) | Narrative of decisions and how we reached the current state. |
| [DECISIONS.md](DECISIONS.md) | Auditable decision log: each request → why → change → how approved → commit. |
| [ADMIN_PLAN.md](ADMIN_PLAN.md) | The owner self-service admin (Path B) — **✅ shipped**: auth, inline CRUD, DB-as-source, cache revalidation. |
| [DIAGRAMS.md](DIAGRAMS.md) | Mermaid diagrams: data model (ERD), request/render flow, card-variant + typography systems. |
| [TASKS.md](TASKS.md) | Task-by-task plan and status (T1–T16, U-decisions; admin T12–T14 done). |
| [PARITY.md](PARITY.md) | Intentional HTML/CSS-inherent differences from the legacy apps. |
| [DEPLOY.md](DEPLOY.md) | Vercel + managed-Postgres deploy runbook. |
| [YAYIN_ONCESI.md](YAYIN_ONCESI.md) | Owner-facing pre-launch checklist (Turkish). |
| [DEMO_MENU.md](DEMO_MENU.md) | Generated DEMO price list (optional `seed:demo` content). |

## Notes

- These docs moved from the project root into `docs/` on 2026-08-28; references in
  `../AGENTS.md` point to `docs/…`. Cross-references between docs are by name and
  still resolve within this folder.
- Root-level files stay at the root by convention: `../README.md`, `../AGENTS.md`,
  `../CLAUDE.md` (the last two are partly auto-managed by `next dev`).
