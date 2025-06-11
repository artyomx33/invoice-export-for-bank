# Teddy Kids Invoice Manager  
## Online Deployment – Architecture Recommendation

_Last updated: 2025-06-09_

---

### 1. High-Level Goals
* 24/7 access for staff of four companies  
* Minimal DevOps overhead (Artem is single maintainer)  
* Secure (OAuth-only login, encrypted data at rest & in transit)  
* Scales from tens to low-thousands of invoices per month without re-architecture  
* Monthly infra budget ≤ **€50**

---

### 2. Proposed Stack

| Layer                    | Technology                     | Rationale                                                                                 | Indicative Cost* |
|--------------------------|--------------------------------|-------------------------------------------------------------------------------------------|------------------|
| **Hosting Platform**     | **Fly.io** (Apps + Volumes)    | Runs Docker images close to EU users, free global Anycast, built-in Postgres, pay-as-you-go | €5 free + €12 |
| **Backend API**          | Node 18 + **Fastify** (TypeScript) | Lightweight, blazing fast, easy to deploy as single executable                            | (inside Fly) |
| **ORM & Migrations**     | **Prisma** + Postgres          | Type-safe, simple migrations, works with PlanetScale/future move if needed                | — |
| **Database**             | Fly.io Postgres **Hobby 2x**   | 2 shared vCPUs, 1 GB RAM, 10 GB storage, daily backups included                           | €10 |
| **Frontend**             | React 18 + Vite static bundle served via Fly CDN edge cache     | No extra service; zero-config cache headers                                               | (inside Fly) |
| **Authentication**       | **Clerk.dev** (Google OAuth)   | Free tier ≤10k MAU, social login turnkey, includes JWT & session management               | €0 |
| **Object Storage**       | **Backblaze B2** S3-compatible | Cheap (< €0.005/GB), EU region available, used for PDF & SEPA XML exports                 | ~€1 |
| **CI/CD**                | GitHub Actions                 | 2000 free minutes/mo, reusable for build & Fly deploy                                     | €0 |
| **Domain & SSL**         | Cloudflare DNS + Origin CA     | Free DNS, automatic SSL, easy caching rules                                               | €0 |
| **Monitoring**           | Fly metrics + UptimeRobot      | Basic latency / CPU graphs (Fly) and 1-min ping checks (free)                             | €0 |

\* _Prices per month, rounded; Fly.io costs assume 1 shared-CPU VM (512 MB) always on and 10 GB outbound traffic._

**Total recurring cost estimate:** **≈ €25 / month** (well under €50 cap).

---

### 3. Architecture Diagram (ASCII)

```
                       +--------------+
                       |   Browser    |
                       |  (React UI)  |
                       +------+-------+
                              |
                              | HTTPS (Cloudflare)
                              v
    +--------------------- Fly.io ---------------------+
    |                                                   |
    |  +----------------+   internal   +--------------+ |
    |  |  Fastify API   | <----------> |  Postgres DB | |
    |  |  (Docker App)  |              |   (Fly Vol)  | |
    |  +--------+-------+              +------+-------+ |
    |           |                            ^          |
    |           | Signed URL (S3)            | Prisma   |
    |           v                            +----------+
    |  Backblaze B2 Bucket (PDF/XML assets)              |
    +----------------------------------------------------+
                     |
                     +--- Clerk.dev (OAuth)  (JWT validation middleware)
                     |
                     +--- GitHub Actions → Fly deploy (CI/CD)
```

---

### 4. Data Flow Overview
1. **Login** – User clicks _Sign in with Google_; Clerk handles OAuth, returns JWT.  
2. **API call** – React sends JWT in `Authorization: Bearer` header to Fastify.  
3. **Business logic** – Fastify queries Postgres via Prisma; returns JSON.  
4. **File export** – When “Export SEPA” clicked, Fastify generates XML/PDF, uploads to B2, returns pre-signed URL; browser auto-downloads.  
5. **Static assets** – React bundle & icons served directly from Fly edge cache.

---

### 5. Security Considerations
* **TLS everywhere** (Cloudflare → Fly).  
* **row-level ACLs** in API (company_id filter).  
* **Daily DB backups** (Fly) + weekly off-site dump to B2.  
* **Environment variables** stored in Fly Secrets (`fly secrets set DATABASE_URL=...`).  
* **Dependency scanning** (GitHub Dependabot + `npm audit` in CI).  
* **GDPR**: Data resides in `fly-eu-central` (Frankfurt) region + B2 EU.

---

### 6. Deployment Workflow
```sh
# 1. Local test
pnpm dev           # React
pnpm api           # Fastify w/ ts-node-dev

# 2. Push to GitHub 'main'
git push origin main

# 3. GitHub Action
- npm ci
- npm run test && npm run build
- docker build -t teddy-invoice:latest .
- flyctl deploy --remote-only
```
_≈ 90 sec total; automatically rolls back on health-check failure._

---

### 7. Phased Roll-out Plan
1. **Phase 1 (Internal Alpha)**  
   * Single Fly instance, Clerk free tier, hobby Postgres.  
   * Manual DB snapshots weekly.

2. **Phase 2 (Pilot with 10 users)**  
   * Enable Fly autoscale (min = 1, max = 2).  
   * Configure alerting (CPU > 80 %, p95 latency > 500 ms).

3. **Phase 3 (Public / >50 users)**  
   * Move to Fly Postgres `Standard 2x` (4 GB RAM).  
   * Add read-replica in secondary region (optional).  
   * Consider moving object storage to Cloudflare R2 for lower egress.

---

### 8. Future-Proofing
* **Prisma** allows easy switch to MySQL / Aurora if scale demands.  
* **Fly Machines & Volumes** can be migrated to AWS/GCP with minimal changes.  
* Could add serverless functions (e.g., Cloudflare Workers) for webhook handling.

---

### 9. Next Steps Checklist
- [ ] Artem: Create Fly.io account & `fly launch` skeleton  
- [ ] Droid: Add `Dockerfile`, `fly.toml`, `prisma/schema.prisma`  
- [ ] Artem: Register Cloudflare DNS, point `invoices.teddykids.nl` to Fly  
- [ ] Droid: Integrate Clerk SDK & protect routes  
- [ ] Artem: Upload company logos to Backblaze B2  
- [ ] Droid: Ship MVP to `alpha.teddykids.nl` and schedule user testing

---

*Questions or clarifications? Ping the Droid in chat and we’ll adjust the plan.*
