# CAGNEX

CAGNEX is a calm, secure operating space for credit teams. The public experience gives new users a clear product overview, while authenticated users get a focused workspace for deal rooms and review. Vercel hosts the application/API, Supabase provides PostgreSQL and private document storage, and the backend enforces organization-scoped accounts and secure sessions.

## Run it locally

Open `index.html` in a browser for the public preview. For authenticated local testing, log in with the Vercel CLI and pull the project variables into the ignored local file, then run the API:

```bash
vercel env pull .env.local --environment=development
vercel dev
```

The local file must contain `DATABASE_URL`, `SESSION_SECRET` (at least 32 characters), `SUPABASE_URL`, and `SUPABASE_ANON_KEY`. The server-only `SUPABASE_SERVICE_ROLE_KEY` can securely sign sessions only as a fallback if `SESSION_SECRET` is absent. Never commit `.env.local`.

## Deploy the backend to Vercel

1. Create a Supabase project and run [`schema.sql`](./schema.sql) in the Supabase SQL editor. If the database already existed before phone-based registration was added, also run [`migrations/001_add_phone_number.sql`](./migrations/001_add_phone_number.sql).
2. Create a GitHub repository containing this folder, then import it into Vercel.
3. Add `DATABASE_URL` and a random `SESSION_SECRET` (at least 32 characters) in Vercel project settings.
4. Deploy. The API is available under `/api/auth/*` and `/api/v1/*`.

Authentication uses bcrypt password hashes and a seven-day, HTTP-only, secure session cookie. Workflow queries are scoped to the authenticated user.

## Current product behavior

- Explore the product without an account.
- Register with full name, work email, phone number, and password.
- Sign in through a secure HTTP-only session cookie.
- Reset a forgotten password with a time-limited email OTP.
- See an authenticated workspace with organization-scoped deal rooms.
- Create, refresh, and open deal rooms through the backend API.
- CEO/admin workspaces see organization-wide deal, team, and flag metrics.
- Employee workspaces only see deals assigned to the employee.
- Client workspaces only see deals assigned to or created by that client, plus progress/payment placeholders.

Role registration is intentionally restricted: only client accounts can self-register by default. Set `ALLOW_ROLE_REGISTRATION=true` only for local role-flow testing; hosted employee and admin accounts should be provisioned by an administrator.
Password reset uses Supabase Auth email OTP. Add the public `SUPABASE_ANON_KEY` alongside `SUPABASE_URL` in Vercel for Production and Preview, enable email OTP in Supabase Auth, and set the email template to include `{{ .Token }}`. The browser verifies the OTP with Supabase Auth; the server only trusts the resulting access token when replacing the CAGNEX password.

Supabase's default email template sends a magic link, not a visible six-digit code. CAGNEX is configured for a custom SMTP provider and its **Magic link or OTP** template uses `{{ .Token }}` to display the six-digit code. Supabase also rate-limits repeated requests; wait for the limit window to clear before requesting another code.

## Supabase document storage

Create a private Supabase Storage bucket named `cagnex-documents`. Add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET` to Vercel. The service-role key is server-only and must never be added to browser code. Authenticated document creation returns a short-lived signed upload URL; the browser uploads directly to Supabase, while PostgreSQL stores only the document metadata and storage key.

The underwriting evidence, covenant, reconciliation, and memo services remain available as backend foundations and can be added into the workspace incrementally without bringing back the previous dense navigation.

The browser workbench is intentionally a high-fidelity product shell with deterministic demo data. Production ingestion should connect the document upload API to encrypted object storage, malware scanning, OCR/layout analysis, extraction workers, and a Python calculation sandbox. The backend schema and `/api/v1` deal/job routes establish those boundaries; no UI-only number should be treated as a real underwriting conclusion.

## Security and production boundaries

- Never put database or model-provider credentials in browser code.
- Run `schema.sql` before creating accounts.
- Set `DATABASE_URL` and `SESSION_SECRET` in Vercel.
- Add object storage credentials and an OCR/LLM provider only in server-side worker environments.
- Keep all calculated totals in a deterministic worker and persist source references for every extracted value.
