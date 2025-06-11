# Teddy Kids Invoice Manager  
## Alternative Simple Hosting – Vercel + Supabase

_Last updated: 2025-06-09_

---

### 1. Why This Option?
| Feature                     | Vercel + Supabase                                              | Benefit for Artem |
|-----------------------------|----------------------------------------------------------------|-------------------|
| **Zero-config Frontend**    | Vercel auto-detects Vite/React, builds & deploys on `git push` | No Docker, no servers |
| **Managed Postgres**        | Supabase Cloud (EU region) with nightly backups                | Click-to-create DB |
| **Auth out-of-the-box**     | Supabase Auth (Google OAuth)                                   | No third-party auth setup |
| **Edge Functions (optional)**| Supabase Functions or Vercel Serverless Functions             | Quick backend logic |
| **Built-in Storage**        | Supabase Storage (S3-compatible)                               | Store PDFs, SEPA XML |
| **Monitoring**              | Vercel & Supabase dashboards                                   | No self-hosted Prometheus |
| **Cost**                    | Generous free tiers; paid plan ≈ **€25/mo** at scale           | Under budget |

---

### 2. Proposed Stack at a Glance
| Layer               | Service               | Notes |
|---------------------|-----------------------|-------|
| Frontend Hosting    | **Vercel**            | Single project, EU edge network |
| Database            | **Supabase Postgres** | `tier_free` → upgrade when >500 MB |
| Auth                | Supabase Auth         | Enable Google Provider, email domain restrict `@teddykids.nl` |
| API / Functions     | Vercel Serverless Functions **or** Supabase Edge Functions | Start with Vercel (simpler), can migrate later |
| Storage             | Supabase Storage      | `pdf/` and `exports/` buckets |
| CI/CD               | Built-in (Vercel)     | Every PR gets a Preview URL |
| Custom Domain       | `invoices.teddykids.nl` via Vercel DNS | Auto-SSL |

---

### 3. Data Flow
1. User visits `invoices.teddykids.nl` → Vercel serves static React bundle.  
2. Frontend calls `/api/*` (Vercel Functions) – validated with Supabase JWT.  
3. Function accesses Supabase Postgres via service key (Row Level Security).  
4. Exports generated (PDF/XML) in function, stored in Supabase Storage, signed URL returned.  

_No servers ➡ no patch Tuesday, no dockerfiles._

---

### 4. Pricing Snapshot (June 2025)
| Service    | Free Tier                            | When to Upgrade                       | Paid Tier (€) |
|------------|--------------------------------------|---------------------------------------|---------------|
| Vercel     | 100 GB-hrs, 100 GB bandwidth         | >100 GB/mon traffic                   | Pro €20 |
| Supabase   | 500 MB DB, 1 GB storage, 50K auth    | >500 MB DB or >1 GB asset storage     | Pro €19 |
| Cloud DNS  | Included in Vercel                   | —                                     | €0 |

_Estimated monthly cost after upgrade: **€39** (still well under €50 cap)._

---

### 5. Getting Started Checklist
| Step | Owner | Action |
|------|-------|--------|
| 1 | Artem | Sign up at Vercel & Supabase (use GitHub SSO). |
| 2 | Artem | Create new **Supabase project** in `eu-central` region. |
| 3 | Droid | Add `supabase` npm client, set up `.env` with `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY`. |
| 4 | Droid | Push Prisma schema to Supabase (`npx prisma db push`). |
| 5 | Artem | On Vercel, import GitHub repo → select **online** branch. |
| 6 | Vercel | Auto-deploy, generate preview link. |
| 7 | Droid | Add Vercel environment vars (`SUPABASE_SERVICE_KEY` for serverless). |
| 8 | Artem | Point `invoices.teddykids.nl` DNS to Vercel nameservers. |
| 9 | Droid | Implement Supabase Row Level Security policies (company isolation). |
| 10 | Artem | Test Google login, CRUD invoices, and export download. |

---

### 6. Migration from Desktop Data
1. **Export JSON** from Tauri local storage.  
2. Use Supabase **Table Editor → Import CSV/JSON**.  
3. Run data-clean script (Vercel Function) to normalize fields & set company_id.

---

### 7. Roadmap After Launch
* **Usage analytics**: enable Vercel Web Analytics (free for 500 K pageviews).  
* **Daily backups**: Supabase automatic, plus weekly off-site dump to Backblaze.  
* **PWA Support**: Vercel serves `service-worker.js` for offline invoice draft mode.  
* **Role management**: Supabase Auth → `role` claim in JWT for staff vs admin.  

---

### 8. Pros & Cons
| Pros                                      | Cons |
|-------------------------------------------|------|
| All managed; no servers to maintain       | Less control over infra internals |
| One-click preview deployments             | Cold starts on serverless functions |
| Supabase UI for DB + Auth + Storage       | Vendor lock-in (moving DB requires dump/restore) |
| Strict EU data residency on paid tier     | Free tier DB limited to 500 MB |

---

### 9. Decision Point
If you value _hands-off_ DevOps and can live with slight vendor lock-in, **Vercel + Supabase is the fastest path** to go live within a day.  
Need more infra control or custom networking? Use the **Fly.io** architecture instead.

---

### 10. Next Steps
- [ ] Artem: Confirm you’re happy with Vercel/Supabase route.  
- [ ] Droid: Begin Milestone 1 tasks on **online** branch targeting this stack.  
- [ ] Schedule: First working preview URL in **< 48 h** after confirmation.

---
