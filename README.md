# Samarthya

Samarthya connects community challenges with university student teams and
industry partners. It includes citizen reporting, moderation, solution
proposals, industry support, progress updates, map coordinates, image uploads,
and impact tracking.

## Render services

- A Node web service runs the full Next.js application.
- Render PostgreSQL stores challenges, photos, proposals, offers, votes, and
  progress updates.
- `render.yaml` creates and connects both services automatically.
- `ADMIN_PASSWORD` is entered securely during Blueprint creation and is never
  committed to this repository.

## Local development

Requirements: Node.js 22.13 or newer.

```bash
npm ci
cp env.example .env.local
npm run db:migrate
npm run dev
```

You need a local PostgreSQL database and must update `DATABASE_URL` in
`.env.local` before running the migration.

## Deploy to Render

1. Upload this source to a GitHub repository.
2. In Render, choose **New > Blueprint** and connect that repository.
3. Render reads `render.yaml` and creates the web service plus PostgreSQL.
4. When prompted for `ADMIN_PASSWORD`, use a unique password of at least 12
   characters.
5. Wait for deployment, open the assigned `onrender.com` address, then visit
   `/admin` to moderate submissions.

The migration is idempotent, so the free Render service safely runs it whenever
the service starts.
Photos are limited to 4 MB and stored in PostgreSQL to avoid relying on the
web service's temporary filesystem.

Never commit passwords, API tokens, `.dev.vars`, or `.env` files.
