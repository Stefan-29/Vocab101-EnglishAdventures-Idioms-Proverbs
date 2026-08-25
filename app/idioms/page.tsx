import Link from "next/link";
import { PrismaClient } from "@prisma/client";
import IdiomCard from "@/components/IdiomCard";

// Server component: fetch idioms from the database and render a professional grid
export default async function Page() {
  const prisma = new PrismaClient();

  // Fetch latest idioms with their category and any user progress (demo-user)
  const idioms = await prisma.idiom.findMany({
    take: 60,
    orderBy: { createdAt: "desc" },
    include: {
      category: true,
      userProgress: { where: { userId: "demo-user" }, take: 1 },
    },
  });

  await prisma.$disconnect();

  const navItems = [
    { label: 'Overview', href: '/admin/dashboard' },
    { label: 'Manage Content', href: '/admin' },
    { label: 'Explorer', href: '/explore', active: true },
    { label: 'Idioms Grid', href: '/idioms', active: true },
    { label: 'Categories API', href: '/api/categories' },
    { label: 'Public Site', href: '/' },
  ];

  return (
    <main className="min-h-screen bg-slate-100 text-slate-800">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 bg-slate-950 text-white">
            <div className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-sky-300">English Adventures</div>
                <h1 className="mt-1 text-2xl font-bold">Idiom Library</h1>
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

          <div className="grid gap-6 p-5 lg:grid-cols-[240px_minmax(0,1fr)]">
            <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Navigation</div>
              <div className="space-y-2">
                <Link href="/admin/dashboard" className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-900"><span>Dashboard</span><span className="text-xs text-slate-400">Admin</span></Link>
                <Link href="/admin" className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-900"><span>Manage Content</span><span className="text-xs text-slate-400">Edit</span></Link>
                <Link href="/explore" className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-900"><span>Explore Library</span><span className="text-xs text-slate-400">Search</span></Link>
                <Link href="/idioms" className="flex items-center justify-between rounded-xl bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200"><span>Idioms Grid</span><span className="text-xs text-slate-400">Cards</span></Link>
                <Link href="/api/categories" className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-900"><span>Categories API</span><span className="text-xs text-slate-400">JSON</span></Link>
                <Link href="/" className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-900"><span>Public App</span><span className="text-xs text-slate-400">Home</span></Link>
              </div>
            </aside>

            <div>
              <section className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-slate-700">
                  Showing <span className="font-medium">{idioms.length}</span> items
                </div>
                <div className="text-sm text-slate-500">Professional view — suitable for SaaS</div>
              </section>

              <section>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {idioms.map((it) => (
                    <div key={it.id} className="flex justify-center">
                      <IdiomCard
                        phrase={it.phrase}
                        meaning={it.meaning}
                        example={it.example}
                        type={it.type as "IDIOM" | "PROVERB"}
                        tone="professional"
                      />
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
