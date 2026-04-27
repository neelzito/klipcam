# KlipCam v1 Project Plan

Last updated: 2025-08-08

## Context (v1 locked)
- Pricing: single $9/month (900 credits). Tiers deferred to v1.1
- Concurrency: max 2 running jobs/user (tiered later)
- Retention: no automated cleanup in v1; trial watermarking only
- Tech: Next.js App Router, TS strict, Tailwind, Clerk, Supabase, Stripe, Replicate
- References: `MVP.md`, `styleguide.md`, `CLAUDE.md`, `.cursorrules`

## Milestones & Timeline
- Week 1
  - API hardening (signatures, idempotency, rate limiting)
  - User provisioning (Clerk → `users` row), header credit badge
  - Preset gallery (6 styles) + T2I/I2I flows
  - Upload validations + EXIF strip
- Week 2
  - Video base + Spider effect flows
  - Upscale UI + flow completion
  - Billing polish, fallback logic, queue cap UX
- Week 3
  - Library polish (filters/favorites), tests (unit + smoke e2e)
  - Deployment config (Vercel + env), copy/accessibility polish

## Task Tracker
Legend: [x] done, [ ] todo

### Foundation
- [x] Next.js + TS strict scaffold (`package.json`, `tsconfig.json`, `next.config.js`)
- [x] Tailwind setup (`tailwind.config.js`, `postcss.config.js`, `styles/globals.css`)
- [x] Env validation (`src/lib/env.ts`)
- [x] Repo rules (`.cursorrules`) and spec updates (`MVP.md` v1 decisions)
- [ ] ESLint + Prettier configured (scripts + basic rules)
- [ ] `.env.example` committed with documented keys
- [ ] Vercel deployment config documented

### Database
- [x] Minimal schema + enums (`db/schema.sql`)
- [x] Indexes for jobs/users/assets/ledger
- [x] Trial credit trigger on user insert
- [x] Seed user (`db/seed.sql`)
- [ ] Migrations/README for applying schema in Supabase

### Credits & Ledger
- [x] Cost map (`src/lib/credits.ts`)
- [x] Reserve/finalize/refund helpers (`src/lib/creditsLedger.ts`)
- [x] Concurrency cap (2 jobs/user)
- [ ] Atomic reservation via DB transaction / row-level locking

### Providers & Clients
- [x] Supabase server client (`src/lib/supabaseServer.ts`)
- [x] Replicate client (`src/lib/replicateClient.ts`)
- [x] Replicate jobs: image + upscale (`src/lib/replicateJobs.ts`)
- [ ] Replicate video + spider effect adapters

### APIs (App Router)
- [x] POST `/api/jobs` (validate, concurrency, reserve, insert, start image job)
- [x] GET `/api/jobs` (recent jobs)
- [x] POST `/api/replicate/webhook` (store assets, finalize/refund)
- [x] GET `/api/assets` (signed URLs)
- [x] POST `/api/assets/:id/upscale` (reserve, job, start ESRGAN)
- [x] POST `/api/checkout` (Stripe)
- [x] POST `/api/stripe/webhook` (verify, +900 credits)
- [ ] Input schemas for all routes (finalize upscale target params)
- [ ] Webhook idempotency (event de-duplication table)
- [ ] Rate limiting (e.g., 20 generations/hour/user)
- [ ] Replicate webhook signature verification (if supported) or HMAC guard

### Media & Storage
- [x] Storage helper (download, upload) (`src/lib/storage.ts`)
- [x] Trial watermarking for images (`src/lib/watermark.ts`), applied in webhook
- [ ] EXIF stripping on upload (server-side) + file type/size/dim validation
- [ ] Video storage and signed delivery policy

### Models & Presets
- [x] Image T2I (qwen) + premium (FLUX) defaults in `MVP.md`
- [x] Upscale (real-esrgan)
- [ ] I2I support (reference image upload + strength)
- [ ] Video base (wan-2.2) + Spider effect (hailuo-2)
- [ ] Fallback triggers + subtle UI notice
- [ ] Preset templates (6 styles) wired to UI
- [ ] LoRA training (v1): minimal fine-tuning workflow or adapter, cost guardrails

### UI/UX (mobile-first per `styleguide.md`)
- [x] Basic dashboard form to submit image jobs (`app/dashboard/page.tsx`)
- [x] Jobs list with polling + toasts (`JobList`, `Toaster`)
- [x] Assets grid with signed previews (`AssetGrid`)
- [x] Billing page + CTA from home
- [ ] Preset grid (6 styles) with sample prompts and cost labels
- [ ] Upscale button on asset detail + cost label
- [ ] Bottom nav (Images / Videos / Library / Billing) and sticky top on desktop
- [ ] Header credit badge + low-credit warnings
- [ ] Accessibility passes (focus states, 44px targets, contrast)
- [ ] Mobile-first navigation (hamburger on desktop), responsive PresetGrid

Tasks added (frontend):
- [x] Header with credit badge + low-credit warning (`src/components/Header.tsx`, added to layout)
- [x] PresetGrid with 6 styles and cost labels (`src/components/PresetGrid.tsx`, wired in dashboard)

### Billing
- [x] Checkout session creation (`/api/checkout`)
- [x] Webhook grants +900 credits on checkout/invoice
- [ ] Map Stripe customer consistently to `users` (metadata / lookup)
- [ ] Billing status UI (plan, next renewal)

### Testing & Quality
- [ ] Unit: credit estimation + reservation/finalize/refund
- [ ] Unit: `POST /api/jobs` happy-path and invalid input
- [ ] Unit: webhook success/failure paths
- [ ] Smoke e2e: submit job → asset appears
- [x] Lint/type-check clean gates
- [ ] Add Vitest + setup, unit tests for helpers and routes
- [ ] (Optional) Playwright basic e2e

### Observability & Ops
- [ ] Structured logs (jobId/userId context) in route handlers
- [ ] Basic error reporting plan (Sentry v1.1 optional)
- [ ] Vercel project + env variables documented

## Risks & Mitigations
- Replicate variability/cost spikes → fallback triggers, monthly review of credits
- Webhook reliability → idempotent handlers + active-job polling
- Storage growth → copy about retention; bulk-delete UI (no auto cleanup in v1)

## How to Update Progress
- Mark tasks with `[x]` when done; add brief note/date if helpful
- Keep "Last updated" date current
- Open issues for larger items; link them next to tasks as `(#123)`
