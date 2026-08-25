import Link from 'next/link';
import ExportSeedButton from '../../../components/ExportSeedButton';
import ImportSeedButton from '../../../components/ImportSeedButton';

async function fetchCounts() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const expr = await fetch(`${baseUrl}/api/expressions?page=1&pageSize=1`, { cache: 'no-store' });
    const exprJson = await expr.json();
    const categories = await fetch(`${baseUrl}/api/categories`, { cache: 'no-store' });
    const catsJson = await categories.json();
    return {
      totalExpressions: exprJson.total || 0,
      totalCategories: (catsJson.categories || []).length || 0,
    };
  } catch (err) {
    return { totalExpressions: 0, totalCategories: 0 };
  }
}

export default async function AdminDashboardPage() {
  const counts = await fetchCounts();

  const navItems = [
    { label: 'Overview', href: '/admin/dashboard', active: true },
    { label: 'Manage Content', href: '/admin' },
    { label: 'Explorer', href: '/explore' },
    { label: 'Idioms Grid', href: '/idioms' },
    { label: 'Categories API', href: '/api/categories' },
    { label: 'Public Site', href: '/' },
  ];

  return (
    <main className="min-h-screen bg-slate-100 text-slate-800">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <header className="border-b border-slate-200 bg-slate-950 text-white">
            <div className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-sky-300">English Adventures</div>
                <h1 className="mt-1 text-2xl font-bold">Admin Dashboard</h1>
              </div>

              <nav className="flex flex-wrap items-center gap-2">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={
                      item.active
                        ? 'rounded-full bg-sky-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm'
                        : 'rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-sm text-slate-200 transition hover:border-slate-500 hover:text-white'
                    }
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>

          {process.env.NODE_ENV === 'production' && !process.env.ADMIN_SECRET ? (
            <div className="border-t border-b border-amber-200 bg-amber-50 px-5 py-3 text-amber-800">
              <div className="max-w-7xl mx-auto text-sm">
                <strong>Warning:</strong> ADMIN_SECRET is not set. Admin APIs are unprotected in production. Set <code className="bg-amber-100 px-1 py-0.5 rounded">ADMIN_SECRET</code> in your environment to secure the admin area.
              </div>
            </div>
          ) : null}

          <div className="grid gap-6 p-5 lg:grid-cols-[250px_minmax(0,1fr)]">
            <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-4">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Navigation</div>
              </div>

              <div className="space-y-2">
                <Link href="/admin/dashboard" className="flex items-center justify-between rounded-xl bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200">
                  <span>Overview</span>
                  <span className="text-xs text-slate-400">Home</span>
                </Link>
                <Link href="/admin" className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-900">
                  <span>Manage Content</span>
                  <span className="text-xs text-slate-400">Admin</span>
                </Link>
                <Link href="/explore" className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-900">
                  <span>Explore Library</span>
                  <span className="text-xs text-slate-400">Search</span>
                </Link>
                <Link href="/idioms" className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-900">
                  <span>Idioms Grid</span>
                  <span className="text-xs text-slate-400">Cards</span>
                </Link>
                <Link href="/api/categories" className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-900">
                  <span>Categories API</span>
                  <span className="text-xs text-slate-400">JSON</span>
                </Link>
                <Link href="/" className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-900">
                  <span>Public App</span>
                  <span className="text-xs text-slate-400">Live</span>
                </Link>
              </div>
            </aside>

            <div className="space-y-6">
              <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Expressions</div>
                  <div className="mt-4 flex items-end justify-between gap-3">
                    <div>
                      <div className="text-4xl font-bold text-slate-900">{counts.totalExpressions}</div>
                      <div className="mt-1 text-sm text-slate-600">Total idioms & proverbs</div>
                    </div>
                    <Link href="/admin" className="rounded-xl bg-violet-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-violet-500">Manage</Link>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Categories</div>
                  <div className="mt-4 flex items-end justify-between gap-3">
                    <div>
                      <div className="text-4xl font-bold text-slate-900">{counts.totalCategories}</div>
                      <div className="mt-1 text-sm text-slate-600">Distinct thematic groups</div>
                    </div>
                    <Link href="/explore" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Explore</Link>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Content tools</div>
                  <div className="mt-4 space-y-2">
                    <Link href="/admin" className="block rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">Create / Edit content</Link>
                    <Link href="/idioms" className="block rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">Browse idioms</Link>
                    <Link href="/explore" className="block rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">Open finder</Link>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold">Quick actions</h2>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">Live tools</span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Link href="/admin" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-medium text-slate-700 hover:bg-slate-100">Add new expression</Link>
                  <Link href="/explore" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-medium text-slate-700 hover:bg-slate-100">Open Explorer</Link>
                  <Link href="/api/categories" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-medium text-slate-700 hover:bg-slate-100">View categories API</Link>
                </div>

                <div className="mt-5 space-y-4">
                  <ExportSeedButton />
                  <ImportSeedButton />
                </div>

                <p className="mt-5 text-sm text-slate-600">Some tools open raw API endpoints during local development for quick debugging. For production, secure admin routes with ADMIN_SECRET and server-side auth.</p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
