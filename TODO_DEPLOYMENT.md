# 🚀 Deployment TODO – invoice-export-for-bank

A step-by-step checklist for **backing up** and **deploying** the current working app to GitHub, Vercel, and Supabase.

---

## 1. Local Backup & Git Setup
- [ ] **Create safety copy**  
      `cp -R ~/projects/invoice-export-for-bank ~/projects/invoice-export-for-bank-backup`
- [ ] `cd ~/projects/invoice-export-for-bank`
- [ ] `git init`
- [ ] `git add -A`
- [ ] `git commit -m "Initial commit – working invoice-export-for-bank app"`
- [ ] **Create new GitHub repo** (e.g. `artyomx33/invoice-export-for-bank`)
- [ ] `git remote add origin https://github.com/artyomx33/invoice-export-for-bank.git`
- [ ] `git push -u origin main`  
      _Verify push succeeds (no auth errors)._

---

## 2. Vercel Deployment
- [ ] Log in to Vercel dashboard
- [ ] **Import GitHub repo** ➜ “New Project”
- [ ] Project Name: `invoice-export-for-bank`
- [ ] Framework Preset: **Vite**
- [ ] Root Directory: `./`
- [ ] Build Command: `npm run build`  (auto-detected by Vercel)  
  _If not, add `vercel.json` locally and push._
- [ ] Output Directory: `dist`
- [ ] Environment Variables → add after Supabase step (see section 3)
- [ ] Click **Deploy**
- [ ] Wait for build → verify preview URL works

---

## 3. Supabase Setup
- [ ] Log in to Supabase
- [ ] **New project** → project name `invoice-export-for-bank`
- [ ] **Region** close to users
- [ ] Generate strong DB password
- [ ] After project is ready:  
  - [ ] Copy **Project URL**  
  - [ ] Copy **Anon/public key**
- [ ] In Supabase SQL editor → run `supabase/schema.sql` (from repo) to create tables & RLS
- [ ] In Vercel project settings → **Environment Variables**
  - [ ] `VITE_SUPABASE_URL`  =  _project URL_
  - [ ] `VITE_SUPABASE_ANON_KEY` =  _anon key_
  - [ ] `NODE_ENV` = `production`
  - [ ] Click **Save**

---

## 4. Final Verification
- [ ] Trigger **Redeploy** on Vercel (build uses new env vars)
- [ ] Visit live URL → confirm:
  - [ ] App loads without console errors
  - [ ] Can read/write test data to Supabase
  - [ ] SEPA export & other core features behave as before
- [ ] Smoke-test responsiveness on mobile viewport

---

## 5. Rollback & Safety
- [ ] Keep `*-backup` folder for at least one week
- [ ] Enable **Vercel Git Integration** → every push creates a preview
- [ ] Tag initial production release:  
      `git tag v1.0.0 && git push origin v1.0.0`
- [ ] Document any hotfixes in CHANGELOG.md before next deploy

---

_✔ When all boxes are checked the app is fully backed-up and live!_
