# CAGNEX MVP

CAGNEX is a front-end MVP for a workflow automation product aimed at professional services firms such as agencies, consultants, and law firms.

## Run it

Open `index.html` in a browser for the static preview. The API is deployed as Vercel serverless functions.

## Deploy the backend to Vercel

1. Create a Neon Postgres database and run [`schema.sql`](./schema.sql) in the Neon SQL editor.
2. Create a GitHub repository containing this folder, then import it into Vercel.
3. Add `DATABASE_URL` and a random `SESSION_SECRET` (at least 32 characters) in Vercel project settings.
4. Deploy. The API will be available under `/api/auth/*` and `/api/workflows`.

Authentication uses bcrypt password hashes and a seven-day, HTTP-only, secure session cookie. Workflow queries are scoped to the authenticated user.

## MVP behavior

- Search the workflow list.
- Toggle workflows between Active and Paused.
- Create a workflow from the header, workflow section, or quick-start card.
- See the new workflow immediately in the dashboard.

## Suggested paid product direction

The next product slice should connect the workflow builder to the tools these firms already use (email, calendar, CRM, forms, and invoicing). A simple subscription can start at $29/month for a solo professional and $79/month for a small team, with usage-based limits that map to the “runs” metric shown here.
