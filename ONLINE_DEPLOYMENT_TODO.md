# Teddy Kids Invoice Manager – Online Deployment To-Do

A step-by-step plan to transition the existing Tauri desktop app into a secure, cloud-hosted web application.

---

## Milestone 0 — Project Kick-off  
| ✅ | Owner | Task |
|----|-------|------|
| ☐ | Artem | Confirm target stack (preferred cloud provider, DB engine, auth provider) |
| ☐ | Droid | Produce detailed architecture diagram & README skeleton |
| ☐ | Artem | Create GitHub “online” branch & invite Droid as collaborator |

---

## Milestone 1 — Frontend Extraction  
| ✅ | Owner | Task |
|----|-------|------|
| ☐ | Droid | Remove Tauri-specific imports & APIs; refactor to pure React/Vite build |
| ☐ | Artem | Test web-only build locally (`npm run build && npx serve dist`) |
| ☐ | Droid | Replace local-file dialogs (Tauri) with browser-compatible equivalents (File API / download links) |
| ☐ | Droid | Update environment variable handling (`import.meta.env`) |

---

## Milestone 2 — Backend API Foundation  
| ✅ | Owner | Task |
|----|-------|------|
| ☐ | Droid | Scaffold REST/GraphQL service (suggested: **Fastify + TypeScript** or **NestJS**) |
| ☐ | Droid | Define API contract (`/companies`, `/clients`, `/invoices`, `/exports`) in OpenAPI spec |
| ☐ | Artem | Review & approve endpoint spec |
| ☐ | Droid | Add unit tests for each endpoint |

---

## Milestone 3 — Database & Persistence  
| ✅ | Owner | Task |
|----|-------|------|
| ☐ | Droid | Choose ORM (Prisma) & model schema (Company, Client, Invoice, PaymentRun, User) |
| ☐ | Droid | Implement migrations; supply Docker Compose for local Postgres |
| ☐ | Artem | Run migration locally; seed sample data; confirm schema meets needs |
| ☐ | Droid | Write backup/restore scripts (pg_dump / pg_restore) |

---

## Milestone 4 — Authentication & Authorization  
| ✅ | Owner | Task |
|----|-------|------|
| ☐ | Droid | Integrate Google OAuth2 via Auth provider (Clerk/Auth0/Supabase Auth) |
| ☐ | Droid | Implement JWT session middleware; role model: **admin**, **staff** |
| ☐ | Artem | Create Google Cloud OAuth credentials & share client ID/secret securely |
| ☐ | Droid | Add protected routes & React context for auth state |

---

## Milestone 5 — Cloud Hosting & CI/CD  
| ✅ | Owner | Task |
|----|-------|------|
| ☐ | Droid | Author Dockerfile(s) for frontend & backend |
| ☐ | Droid | Set up GitHub Actions: lint → test → build → push image |
| ☐ | Artem | Provision cloud resources (e.g., Fly.io / Render / AWS Fargate) |
| ☐ | Droid | Create Terraform/CloudFormation for reproducible infra |
| ☐ | Artem | Configure domain & SSL (e.g., invoices.teddykids.nl) |

---

## Milestone 6 — Feature Adaptations for Web  
| ✅ | Owner | Task |
|----|-------|------|
| ☐ | Droid | Re-implement SEPA XML export as backend endpoint returning file |
| ☐ | Droid | Convert “Save to local file” to “Download” / “Email” options |
| ☐ | Droid | Add dashboard charts using live API data (Recharts) |
| ☐ | Artem | Provide company logos/branding assets for PDF generation |
| ☐ | Droid | Integrate PDF invoice generation service (Puppeteer/Playwright) |

---

## Milestone 7 — Data Migration  
| ✅ | Owner | Task |
|----|-------|------|
| ☐ | Artem | Export existing local IndexedDB/JSON data from Tauri app |
| ☐ | Droid | Write migration script to transform & import into Postgres |
| ☐ | Artem | Validate migrated records & balances |

---

## Milestone 8 — Quality, Security & Compliance  
| ✅ | Owner | Task |
|----|-------|------|
| ☐ | Droid | Add ESLint, Prettier, Husky pre-commit hooks |
| ☐ | Droid | Run OWASP dependency check / `npm audit` gating in CI |
| ☐ | Artem | Draft GDPR-compliant privacy statement for online service |
| ☐ | Droid | Set up log aggregation (Grafana/Loki) & uptime monitoring (Healthchecks) |
| ☐ | Artem | Enroll in Apple Developer Program for upcoming iOS PWA (optional) |

---

## Milestone 9 — Beta Launch  
| ✅ | Owner | Task |
|----|-------|------|
| ☐ | Artem | Invite pilot users; collect feedback |
| ☐ | Droid | Implement feedback tracker (GitHub Issues project board) |
| ☐ | Droid | Harden rate-limiting & request validation |
| ☐ | Artem | Sign DPA with hosting provider if storing personal data |

---

## Milestone 10 — Public Release & Maintenance  
| ✅ | Owner | Task |
|----|-------|------|
| ☐ | Droid | Write end-user documentation & onboarding guide |
| ☐ | Artem | Announce new web version to staff/clients |
| ☐ | Droid | Schedule automated nightly backups & weekly security scans |
| ☐ | Artem | Review roadmap for mobile app & future features |

---

### Helpful Commands

```bash
# Local dev
pnpm i
pnpm dev            # frontend
pnpm api            # backend (via ts-node-dev)
pnpm db:studio      # open Prisma studio

# CI test locally
pnpm lint && pnpm test

# Build & compose
docker compose up --build
```

---

### Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-06-09 | Use Postgres + Prisma | Relational data & strong migration tooling |
| 2025-06-09 | Google OAuth via Auth0 | Quick SSO for internal users |

---

_Keep this document in the repo root and tick boxes as tasks progress._
