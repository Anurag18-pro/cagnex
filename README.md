# CAGNEX

CAGNEX is a calm, secure operating space for credit teams. The public experience gives new users a clear product overview, while authenticated users get a focused workspace for deal rooms and review. The backend supports organization-scoped accounts, secure sessions, and deal APIs.

## Run it locally

Open `index.html` in a browser for the public preview. For authenticated local testing, run the API with `vercel dev` after adding local `DATABASE_URL` and `SESSION_SECRET` values; this change has intentionally not been deployed.

## Deploy the backend to Vercel

1. Create a Neon Postgres database and run [`schema.sql`](./schema.sql) in the Neon SQL editor.
2. Create a GitHub repository containing this folder, then import it into Vercel.
3. Add `DATABASE_URL` and a random `SESSION_SECRET` (at least 32 characters) in Vercel project settings.
4. Deploy. The API is available under `/api/auth/*` and `/api/v1/*`.

Authentication uses bcrypt password hashes and a seven-day, HTTP-only, secure session cookie. Workflow queries are scoped to the authenticated user.

## Current product behavior

- Explore the product without an account.
- Register with full name, work email, phone number, and password.
- Sign in through a secure HTTP-only session cookie.
- See an authenticated workspace with organization-scoped deal rooms.
- Create, refresh, and open deal rooms through the backend API.
- CEO/admin workspaces see organization-wide deal, team, and flag metrics.
- Employee workspaces only see deals assigned to the employee.
- Client workspaces only see deals assigned to or created by that client, plus progress/payment placeholders.

The underwriting evidence, covenant, reconciliation, and memo services remain available as backend foundations and can be added into the workspace incrementally without bringing back the previous dense navigation.

The browser workbench is intentionally a high-fidelity product shell with deterministic demo data. Production ingestion should connect the document upload API to encrypted object storage, malware scanning, OCR/layout analysis, extraction workers, and a Python calculation sandbox. The backend schema and `/api/v1` deal/job routes establish those boundaries; no UI-only number should be treated as a real underwriting conclusion.

## Security and production boundaries

- Never put database or model-provider credentials in browser code.
- Run `schema.sql` before creating accounts.
- Set `DATABASE_URL` and `SESSION_SECRET` in Vercel.
- Add object storage credentials and an OCR/LLM provider only in server-side worker environments.
- Keep all calculated totals in a deterministic worker and persist source references for every extracted value.
