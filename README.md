# Echra

Phase 1 foundation for the Echra GBP content engine.

## Quick Run Guide

See [HOW_TO_RUN.md](HOW_TO_RUN.md) for the simple step-by-step version to start the app and view the current screens.

For Google Business Profile OAuth and review sync setup, see [PHASE2_SETUP.md](PHASE2_SETUP.md).

## Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS and shadcn/ui
- Supabase Auth, Postgres, RLS
- Supabase magic link login
- Resend-ready environment variable for Supabase SMTP setup

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a Supabase project and run:

   ```text
   supabase/schema.sql
   ```

   Paste the SQL into the Supabase SQL editor. The file creates the six Phase 1 tables, RLS
   policies, admin helper, auth profile trigger, and seed-data template.

3. Replace placeholders in `.env.local`:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   RESEND_API_KEY=your_resend_key
   ADMIN_EMAIL=your@email.com
   ```

4. In Supabase Auth settings, set the site URL to `http://localhost:3000` and add
   `http://localhost:3000/auth/callback` as an allowed redirect URL.

5. To send magic links through Resend, configure Supabase Auth SMTP with your Resend SMTP
   credentials. The app keeps `RESEND_API_KEY` available for later product emails.

6. Run the app:

   ```bash
   npm run dev
   ```

## Routes

- `/login` magic link login
- `/auth/callback` Supabase auth callback and role redirect
- `/admin/clients` admin clients table with live Supabase data
- `/dashboard` client dashboard shell

## Verification

These commands passed locally:

```bash
npm run lint
npm run build
```

The dev server responds on `http://localhost:3000/login`, and unauthenticated visits to
`/admin/clients` and `/dashboard` redirect to `/login`.
