Dev seed workflow

This project supports a small development helper to automatically re-run the seed script whenever you add or edit .txt files in public/data.

Why use it?
- Speeds up iterative content editing during local development
- Safe for dev environments only — do not enable automatic seeding in production

How to run (Windows PowerShell)

1. Install dev dependencies (only once):
   npm install

2. Start the watcher (in a separate terminal):
   npm run watch-seed

Behavior
- The watcher uses nodemon to watch for changes to files ending in .txt under public/data and runs the seed script with a short delay.
- The seed script upserts items by phrase, so re-running is idempotent: existing phrases are updated, new ones are created.

Notes & safety
- If you use SQLite (default), avoid running a heavy re-seed while the app is actively serving writes — file locks can occur. If you see errors, stop the dev server briefly while running a large seed.
- For production, use the Admin Import workflow (/admin import) or the /api/admin/import-seed endpoint with ADMIN_SECRET set. Do not rely on file-system watchers in production.

Seeding single files
- To seed a single file, run:
  npx tsx "scripts/seed-data.ts" "public/data/my-file.txt" IDIOM

Contact
- If you want this behavior changed (e.g., use chokidar directly or integrate into Next.js dev server), open an issue or request a different implementation.
