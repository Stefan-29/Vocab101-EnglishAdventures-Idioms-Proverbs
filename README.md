English Adventures — Vocabulary Web App

One-line summary
A compact Next.js + Prisma (SQLite) web app for browsing, managing and seeding English idioms and proverbs. Designed for local development and small self-hosted deployments.

Requirements
- Node.js (v18+ recommended)
- npm
- Windows: PowerShell is used in docs; paths in this repo use Windows separators in examples

Environment variables (create a .env from .env.example)
- DATABASE_URL (default: file:./dev.db)
- NEXT_PUBLIC_APP_URL (default: http://localhost:3000)
- NEXTAUTH_URL (default: http://localhost:3000)
- NEXTAUTH_SECRET / AUTH_SECRET (required for cookie/session auth)
- ADMIN_SECRET (set to secure the admin APIs in production)
- GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET (optional for Google OAuth; leave blank for local credential-based sign-in)
- OWNER_EMAIL / OWNER_PASSWORD (seeded owner account defaults)

Quick start (development)
1. Clone the repo and open a PowerShell terminal in the project root.
2. Install dependencies:
   npm install

3. Generate Prisma client (postinstall runs this automatically):
   npm run prisma:generate

4. Apply schema (dev):
   npm run prisma:migrate
   Note: This creates a local migration for development. For production use prisma migrate deploy.

5. Seed sample content (reads all .txt files in public/data):
   npm run seed

6. Start local dev server:
   npm run dev
   Open http://localhost:3000

Seeding workflows
- Full folder seed (recommended during content authoring):
  Place .txt files in public/data and run:
    npm run seed
  Behavior: script parses files, upserts categories and expressions by unique phrase (idempotent).

- Seed a single file (test only):
  npx tsx "scripts/seed-data.ts" "public/data/newIdioms.txt" IDIOM

- Auto-watch (development only):
  npm run watch-seed
  This uses nodemon to run the seed script when .txt files change.

Admin and content management
- Public dashboard: /dashboard — browse featured idioms/proverbs and access sign-in/register flow.
- Sign-in page: /auth/signin — supports local email/password sign-up and login. The seeded owner account is stefanustankaemingk2@gmail.com.
- Admin UI: /admin — create, edit, delete expressions and import/export seed JSON.
- Owner user management: /admin/users — owner/admin can view all users and change roles (USER, ADMIN, OWNER).
- Import via API: POST /api/admin/import-seed (requires x-admin-secret header in production)
- Export via API: GET /api/admin/export-seed (same protection applies)

Security recommendations (production)
- Always set ADMIN_SECRET in production; middleware enforces it for /admin and /api/admin routes. The middleware accepts either an x-admin-secret header or an ea_admin_secret cookie.
- Prefer Postgres (managed) when deploying on serverless platforms — SQLite is not suitable for ephemeral filesystems.
- Use environment-specific backups before large seed/import operations.

Production build & deploy
1. Build:
   npm run build
   (build runs prisma generate first)
2. Start server:
   npm start

Hosting options
- Vercel: straightforward for Next.js; use Postgres for DB. Set environment vars in project settings.
- Render / DigitalOcean App / small VM: can host with persistent filesystem (SQLite ok) and env vars.

Vercel deployment checklist
1. Create a hosted Postgres database, for example a Neon database connected through the Vercel Storage/Marketplace integration. Do not use `file:./dev.db` on Vercel.
2. Change the Prisma datasource provider in `prisma/schema.prisma` from `sqlite` to `postgresql`.
3. With the hosted Postgres `DATABASE_URL` configured locally, create and commit the first migration:
   `npx prisma migrate dev --name init`
4. Change the build command in Vercel (or the `build` script) to run migrations before the Next.js build:
   `prisma migrate deploy && prisma generate && next build`
5. Add these variables in Vercel Project Settings -> Environment Variables for Production and Preview as appropriate:
   `DATABASE_URL` (the hosted Postgres connection string), `NEXTAUTH_URL` (the deployed site URL), `NEXTAUTH_SECRET` (a long random value), `AUTH_SECRET`, `ADMIN_SECRET`, `NEXT_PUBLIC_APP_URL` (the deployed site URL), `OWNER_EMAIL`, and `OWNER_PASSWORD`.
6. Redeploy after saving the variables. Then seed the hosted database once from a machine that can access it:
   PowerShell: `$env:DATABASE_URL="<hosted-url>"; npm run seed`
7. Check Vercel Runtime Logs if `/api/session` still returns 500. A missing table indicates migrations were not deployed; a Prisma connection error indicates an incorrect or unavailable `DATABASE_URL`.

Migrations & schema changes
- Development: prisma migrate dev --name <desc>
- Production: prisma migrate deploy
- After schema changes: npm run prisma:generate

Backups & rollback
- For SQLite: copy the dev.db (or prod.db) file before large operations.
- Use Admin -> Export to JSON to produce a re-importable snapshot.

Troubleshooting
- Seed parsing errors: check public/data text formatting; the parser expects numbered items with Meaning: and Example: labels.
- Prisma errors (missing tables): run prisma migrate dev and prisma generate, then rerun seed.
- Port conflicts: Next dev will choose a different port if 3000 is busy — check the terminal for the URL.

Contacts & next steps
- For CI/CD, add a GitHub Actions job that runs npm ci && npm run build on push to main.
- If you plan to deploy serverless (Vercel/Cloudflare), I can prepare a Postgres migration guide and CI workflow.

This README is intentionally concise — ask if you want a longer deployment checklist, a GitHub Actions workflow, or a sample Dockerfile for VM hosting.
