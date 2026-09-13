# CAGNEX MVP

CAGNEX is a credit intelligence and underwriting workbench for private credit, corporate underwriting, and deal teams. This implementation follows the DealAudit AI product requirements: source-linked evidence, deterministic validation jobs, covenant review, financial reconciliation, deal-level access, and audit-ready exports.

## Run it

Open `index.html` in a browser for the static preview. The API is deployed as Vercel serverless functions.

## Deploy the backend to Vercel

1. Create a Neon Postgres database and run [`schema.sql`](./schema.sql) in the Neon SQL editor.
2. Create a GitHub repository containing this folder, then import it into Vercel.
3. Add `DATABASE_URL` and a random `SESSION_SECRET` (at least 32 characters) in Vercel project settings.
4. Deploy. The API is available under `/api/auth/*`, `/api/workflows`, and the PRD-aligned `/api/v1/*` deal and job routes.

Authentication uses bcrypt password hashes and a seven-day, HTTP-only, secure session cookie. Workflow queries are scoped to the authenticated user.

## MVP behavior

- Review a deal pipeline with processing state and risk signals.
- Open a dual-pane evidence/intelligence workbench.
- Inspect source-linked covenant thresholds, headroom, stress scenarios, and financial variances.
- Queue deterministic compliance and IC memo export jobs.
- Create a new deal room from the UI.

The browser workbench is intentionally a high-fidelity product shell with deterministic demo data. Production ingestion should connect the document upload API to encrypted object storage, malware scanning, OCR/layout analysis, extraction workers, and a Python calculation sandbox. The backend schema and `/api/v1` deal/job routes establish those boundaries; no UI-only number should be treated as a real underwriting conclusion.

## Security and production boundaries

- Never put database or model-provider credentials in browser code.
- Run `schema.sql` before creating accounts.
- Set `DATABASE_URL` and `SESSION_SECRET` in Vercel.
- Add object storage credentials and an OCR/LLM provider only in server-side worker environments.
- Keep all calculated totals in a deterministic worker and persist source references for every extracted value.
