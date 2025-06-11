# Invoice Export for Bank

Multi-company invoice management web application with one-click SEPA export for Dutch banks.

## Table of Contents
1. [Features](#features)  
2. [Supported Companies](#supported-companies)  
3. [Getting Started](#getting-started)  
4. [Development Commands](#development-commands)  
5. [Technology Stack](#technology-stack)  
6. [Planned Online Deployment](#planned-online-deployment)  

---

## Features
- **Multi-company support** – switch context between Teddy Kids B.V., TISA – Teddy Kids B.V., Teddy Kids Daycare, and Teddy’s Cafe B.V.  
- **Paid / Unpaid tabs** – instantly filter invoices by payment status.  
- **Client management sidebar** – add, edit, and search clients without leaving the invoice view.  
- **Sortable & filterable tables** – organise invoices by date, amount, client, or urgency.  
- **Urgency indicators** – automatic colour-coding for overdue invoices.  
- **Bulk actions** – mark paid / export multiple invoices in one click.  
- **SEPA XML export** – generate bank-ready files for batch payments.  
- **Company-specific exports** – each company’s IBAN and details are correctly embedded.  
- **Keyboard shortcuts & drag-and-drop** – fast power-user workflow.  
- **Responsive design** – works on desktop, tablet, and upcoming PWA mobile view.

---

## Supported Companies
| ID | Legal Name           | IBAN              |
|----|----------------------|-------------------|
| 1  | Teddy Kids B.V.      | NL00TKID012345678 |
| 2  | TISA – Teddy Kids B.V.| NL00TISA012345678 |
| 3  | Teddy Kids Daycare   | NL00DAYC012345678 |
| 4  | Teddy’s Cafe B.V.    | NL00CAFE012345678 |

*(IBANs shown are placeholders for README illustration.)*

---

## Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/your-org/invoice-export-for-bank.git
cd invoice-export-for-bank

# 2. Install dependencies
npm install            # or pnpm install / yarn install

# 3. Start the development server
npm run dev            # opens http://localhost:5173 (default Vite port)

# 4. Open your browser
open http://localhost:5173
```

### Build for Production

```bash
npm run build          # outputs static bundle to ./dist
npm run preview        # serves ./dist locally for a final sanity-check
```

---

## Development Commands

| Command               | Description                                    |
|-----------------------|------------------------------------------------|
| `npm run dev`         | Start Vite dev server with hot-reload          |
| `npm run build`       | Build production bundle                        |
| `npm run preview`     | Serve built bundle locally                     |
| `npm run lint`        | ESLint check (`.ts` / `.tsx`)                  |

---

## Technology Stack
| Layer            | Tech                               |
|------------------|------------------------------------|
| Frontend UI      | **React 18** + **TypeScript**      |
| Build Tooling    | **Vite 5**                         |
| Styling          | **Tailwind CSS 3** + CVA utilities |
| State / Helpers  | React Context, Fuse.js search, uuid|
| Charts           | Recharts                           |
| Drag & Drop      | React DND + HTML5 backend          |
| Date Utilities   | date-fns                           |

---

## Planned Online Deployment

We are migrating from a desktop prototype to a fully managed cloud setup:

| Component              | Service                 | Notes |
|------------------------|-------------------------|-------|
| Static Frontend        | **Vercel**              | Zero-config CI/CD; instant preview URLs |
| Database               | **Supabase Postgres**   | Hosted in EU; nightly backups |
| Authentication         | Supabase Auth (Google)  | SSO for staff; JWT for API |
| Storage (PDF / XML)    | Supabase Storage        | Signed download URLs |
| Serverless Functions   | Vercel Functions        | API endpoints & SEPA generation |
| Domain & SSL           | `invoices.teddykids.nl` via Vercel DNS |

_ETA_: first online Alpha in < 3 days after Vercel/Supabase project creation.

---

### Contributing

Internal project – contributions by Teddy Kids engineering team only.  
For bug reports or feature requests, open an issue or chat with the Droid.

---

MIT License • © 2025 Teddy Kids B.V.
