"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import IdiomCard from "@/components/IdiomCard";
import ExpressionDetail from "@/components/ExpressionDetail";
import ThemeToggle from "@/components/ThemeToggle";
import { useRef } from "react";

type Expression = {
  id: string;
  phrase: string;
  meaning: string;
  example: string;
  type: string;
  category: string | null;
  difficulty: string | null;
  indonesianEquivalent: string | null;
  usageNotes: string | null;
};

export default function ExplorePage() {
  const [items, setItems] = useState<Expression[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(12);
  const [total, setTotal] = useState<number>(0);
  const [categories, setCategories] = useState<Array<{name:string;slug:string,counts?:any}>>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null); // 'IDIOM' | 'PROVERB' | null
  const searchTimer = useRef<number | null>(null);
  const [searching, setSearching] = useState(false);
  const [statusText, setStatusText] = useState<string>('');

  const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;
  const [gotoInput, setGotoInput] = useState<string>(String(page));
  const [announcement, setAnnouncement] = useState<string>("");

  // keep goto input synced when page changes from controls
  useEffect(() => {
    setGotoInput(String(page));
    setAnnouncement(`Page ${page} of ${totalPages || 1}`);
  }, [page, totalPages]);

  // generate a concise page number list (first, prev neighbors, current, next neighbors, last)
  const generatePageNumbers = () => {
    const pages: Array<number | "..."> = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    const left = Math.max(2, page - 1);
    const right = Math.min(totalPages - 1, page + 1);

    pages.push(1);
    if (left > 2) pages.push("...");
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push("...");
    pages.push(totalPages);
    return pages;
  };


  const fetchCategories = async () => {
    try {
      const res = await fetch(`/api/categories`);
      if (!res.ok) return;
      const payload = await res.json();
      setCategories(payload.categories ?? []);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const fetchList = async (query = "", pageToFetch = page, size = pageSize, categorySlug: string | null = category, typeFilter: string | null = selectedType) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      params.set('page', String(pageToFetch));
      params.set('pageSize', String(size));
      if (categorySlug) params.set('category', categorySlug);
      if (typeFilter) params.set('type', typeFilter);

      const res = await fetch(`/api/expressions?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load");
      const payload = await res.json();
      setItems(payload.items ?? []);
      setTotal(payload.total ?? 0);
    } catch (err) {
      console.error(err);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // realtime search with debounce
  useEffect(() => {
    setSearching(true);
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => {
      setPage(1);
      fetchList(q, 1, pageSize, category, selectedType);
      setSearching(false);
    }, 300);

    return () => {
      if (searchTimer.current) window.clearTimeout(searchTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, pageSize, category, selectedType]);

  useEffect(() => {
    // Refetch when page changes
    fetchList(q, page, pageSize, category, selectedType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const navItems = [
    { label: 'Dashboard', href: '/admin/dashboard' },
    { label: 'Manage Content', href: '/admin' },
    { label: 'Explorer', href: '/explore', active: true },
    { label: 'Idioms Grid', href: '/idioms' },
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
                <h1 className="mt-1 text-2xl font-bold">Explore Expressions</h1>
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
                <Link href="/explore" className="flex items-center justify-between rounded-xl bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200"><span>Explore Library</span><span className="text-xs text-slate-400">Search</span></Link>
                <Link href="/idioms" className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-900"><span>Idioms Grid</span><span className="text-xs text-slate-400">Cards</span></Link>
                <Link href="/api/categories" className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-900"><span>Categories API</span><span className="text-xs text-slate-400">JSON</span></Link>
                <Link href="/" className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-900"><span>Public App</span><span className="text-xs text-slate-400">Home</span></Link>
              </div>
            </aside>

            <div>
              <header className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Search, filter and review idioms and proverbs.</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Search idioms or proverbs..."
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-0 transition focus:border-sky-400"
                      aria-label="Search expressions"
                    />

                    <select
                      value={selectedType ?? ""}
                      onChange={(e) => { setSelectedType(e.target.value || null); setCategory(null); setPage(1); }}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
                      aria-label="Filter by type"
                    >
                      <option value="">All types</option>
                      <option value="IDIOM">Idioms</option>
                      <option value="PROVERB">Proverbs</option>
                    </select>

                    <select
                      value={category ?? ""}
                      onChange={(e) => { setCategory(e.target.value || null); setPage(1); }}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
                      aria-label="Filter by category"
                    >
                      <option value="">All categories</option>
                      {categories
                        .filter((c) => {
                          if (!selectedType) return true;
                          if (selectedType === 'IDIOM') return (c.counts?.idioms ?? 0) > 0;
                          if (selectedType === 'PROVERB') return (c.counts?.proverbs ?? 0) > 0;
                          return true;
                        })
                        .map((c) => (
                          <option key={c.slug} value={c.slug}>{c.name} {c.counts ? `(${selectedType === 'IDIOM' ? c.counts.idioms : selectedType === 'PROVERB' ? c.counts.proverbs : ''})` : ''}</option>
                        ))}
                    </select>

                    <ThemeToggle />
                    <Link href="/admin" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">Add expression</Link>
                  </div>
                </div>

                <div className="mt-3 text-sm text-slate-500">
                  {searching ? 'Searching…' : items.length > 0 ? `Showing ${items.length} results` : 'No results found'}
                </div>
              </header>

              <section>
                {loading ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-600">Loading…</div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                      {items.map((it) => (
                        <div key={it.id} className="flex justify-center">
                          <button className="w-full text-left" onClick={() => setSelectedId(it.id)}>
                            <IdiomCard
                              phrase={it.phrase}
                              meaning={it.meaning}
                              example={it.example}
                              type={it.type as "IDIOM" | "PROVERB"}
                              tone="professional"
                            />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      <div className="text-sm text-slate-600">
                        Showing <span className="font-medium">{items.length}</span> of <span className="font-medium">{total}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-sm text-slate-600">Per page:</label>
                        <select
                          value={pageSize}
                          onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                          className="rounded-md border px-2 py-1 text-sm"
                          aria-label="Items per page"
                        >
                          <option value={6}>6</option>
                          <option value={12}>12</option>
                          <option value={24}>24</option>
                        </select>

                        <button
                          onClick={() => { setPage(1); }}
                          disabled={page <= 1}
                          className="ml-4 rounded-md border px-3 py-1 text-sm"
                          aria-label="First page"
                        >
                          First
                        </button>

                        <button
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page <= 1}
                          className="ml-2 rounded-md border px-3 py-1 text-sm"
                          aria-label="Previous page"
                        >
                          Prev
                        </button>

                        <nav aria-label="Pagination" className="px-3 text-sm">
                          {totalPages > 0 ? (
                            <div className="flex items-center gap-2">
                              {generatePageNumbers().map((p, idx) =>
                                p === "..." ? (
                                  <span key={`e-${idx}`} className="px-2">…</span>
                                ) : (
                                  <button
                                    key={`p-${p}`}
                                    onClick={() => setPage(Number(p))}
                                    className={`rounded-md px-2 py-1 text-sm ${p === page ? 'bg-violet-600 text-white' : 'border'}`}
                                    aria-current={p === page ? 'page' : undefined}
                                  >
                                    {p}
                                  </button>
                                )
                              )}
                            </div>
                          ) : (
                            <span>Page 0</span>
                          )}
                        </nav>

                        <button
                          onClick={() => setPage((p) => Math.min(totalPages || p + 1, p + 1))}
                          disabled={page >= (totalPages || 1)}
                          className="rounded-md border px-3 py-1 text-sm"
                          aria-label="Next page"
                        >
                          Next
                        </button>

                        <button
                          onClick={() => { if (totalPages) setPage(totalPages); }}
                          disabled={page >= (totalPages || 1)}
                          className="ml-2 rounded-md border px-3 py-1 text-sm"
                          aria-label="Last page"
                        >
                          Last
                        </button>

                        <div className="ml-4 flex items-center gap-2">
                          <label className="text-sm text-slate-600">Go to</label>
                          <input
                            type="number"
                            min={1}
                            max={totalPages || 1}
                            value={gotoInput}
                            onChange={(e) => setGotoInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const v = Number(gotoInput || 1);
                                if (!totalPages) return setPage(Math.max(1, v));
                                setPage(Math.max(1, Math.min(totalPages, v)));
                              }
                            }}
                            onBlur={() => {
                              const v = Number(gotoInput || 1);
                              if (!totalPages) return setPage(Math.max(1, v));
                              setPage(Math.max(1, Math.min(totalPages, v)));
                            }}
                            disabled={totalPages === 0}
                            className="w-16 rounded-md border px-2 py-1 text-sm"
                            aria-label="Go to page number"
                          />
                        </div>
                      </div>
                    </div>

                    <div aria-live="polite" className="sr-only">{announcement}</div>
                  </>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>
      {selectedId && <ExpressionDetail id={selectedId} onClose={() => setSelectedId(null)} />}
    </main>
  );
}
