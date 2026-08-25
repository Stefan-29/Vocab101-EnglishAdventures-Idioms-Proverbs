"use client";

import { useEffect, useState } from "react";

type Category = { name: string; slug: string };

export default function AdminPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then((data) => {
        const role = data?.user?.role;
        if (!data?.user || (role !== 'ADMIN' && role !== 'OWNER')) {
          window.location.href = '/auth/signin';
        }
      })
      .catch(() => {
        window.location.href = '/auth/signin';
      });
  }, []);

  // File import state for TXT/DOCX
  const [importFiles, setImportFiles] = useState<FileList | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any | null>(null);

  const [form, setForm] = useState<any>({
    id: "",
    type: "IDIOM",
    phrase: "",
    meaning: "",
    example: "",
    categorySlug: "",
    indonesianEquivalent: "",
    register: "",
    difficulty: "",
    usageNotes: "",
    commonMistakes: "",
    thematicTags: [] as string[],
    exampleContexts: [] as string[],
    audioUrl: "",
    source: "",
  });

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(p => setCategories(p.categories ?? []))
      .catch(() => setCategories([]));
  }, []);

  const handleChange = (k: string, v: any) => setForm((s: any) => ({ ...s, [k]: v }));

  const submit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const payload = { ...form };
      // ensure arrays
      payload.thematicTags = Array.isArray(payload.thematicTags) ? payload.thematicTags : (payload.thematicTags || '').split(',').map((s: string) => s.trim()).filter(Boolean);
      payload.exampleContexts = Array.isArray(payload.exampleContexts) ? payload.exampleContexts : (payload.exampleContexts || '').split('\n').map((s: string) => s.trim()).filter(Boolean);

      const res = await fetch('/api/admin/expressions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      setMessage('Saved successfully');
      // reset
      setForm({ ...form, id: '' });
    } catch (err: any) {
      setMessage(err.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const loadById = async (idToLoad?: string) => {
    const id = idToLoad ?? form.id;
    if (!id) return setMessage('Enter an id to load');
    setLoading(true);
    setMessage(null);
    try {
      const dres = await fetch(`/api/expressions/${id}`);
      if (!dres.ok) throw new Error('Not found');
      const data = await dres.json();
      setForm({
        ...form,
        id: data.id,
        type: data.type,
        phrase: data.phrase,
        meaning: data.meaning,
        example: data.example,
        categorySlug: data.category ?? '',
        indonesianEquivalent: data.indonesianEquivalent ?? '',
        register: data.register ?? '',
        difficulty: data.difficulty ?? '',
        usageNotes: data.usageNotes ?? '',
        commonMistakes: data.commonMistakes ?? '',
        thematicTags: data.thematicTags ?? [],
        exampleContexts: data.exampleContexts ?? [],
        audioUrl: data.audioUrl ?? '',
        source: data.source ?? '',
      });
      setMessage('Loaded');
    } catch (err: any) {
      setMessage(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  // Admin list state
  const [list, setList] = useState<any[]>([]);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [total, setTotal] = useState<number>(0);
  const [listLoading, setListLoading] = useState(false);
  const [listSearch, setListSearch] = useState('');

  const loadList = async (opts?: { page?: number; pageSize?: number; q?: string }) => {
    setListLoading(true);
    setMessage(null);
    try {
      const p = opts?.page ?? page;
      const ps = opts?.pageSize ?? pageSize;
      const q = new URLSearchParams();
      q.set('page', String(p));
      q.set('pageSize', String(ps));
      if (opts?.q ?? listSearch) q.set('q', opts?.q ?? listSearch);
      const res = await fetch('/api/expressions?' + q.toString());
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load list');
      setList(json.items || []);
      setTotal(json.total || 0);
      setPage(json.page || p);
      setPageSize(json.pageSize || ps);
    } catch (err: any) {
      setMessage(err.message || 'Failed to load list');
    } finally {
      setListLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      loadList({ page: 1, pageSize, q: listSearch });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listSearch]);

  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  const handleEditFromList = (id: string) => {
    setForm((s: any) => ({ ...s, id }));
    loadById(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    const ok = confirm('Delete this expression? This cannot be undone.');
    if (!ok) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/expressions?id=' + encodeURIComponent(id), { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Delete failed');
      setMessage('Deleted');
      // refresh list
      loadList();
    } catch (err: any) {
      setMessage(err.message || 'Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 rounded-2xl border border-slate-200 bg-slate-950 px-5 py-4 text-white shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-sky-300">English Adventures</div>
                <h1 className="mt-1 text-2xl font-bold">Admin — Expressions</h1>
              </div>
            </div>

            <nav className="flex flex-wrap items-center gap-2">
              <a href="/admin/dashboard" className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-sm text-slate-200 transition hover:border-slate-500 hover:text-white">Dashboard</a>
              <a href="/admin" className="rounded-full bg-sky-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm">Manage Content</a>
              <a href="/explore" className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-sm text-slate-200 transition hover:border-slate-500 hover:text-white">Explorer</a>
              <a href="/idioms" className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-sm text-slate-200 transition hover:border-slate-500 hover:text-white">Idioms Grid</a>
              <a href="/api/categories" className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-sm text-slate-200 transition hover:border-slate-500 hover:text-white">Categories API</a>
              <a href="/" className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-sm text-slate-200 transition hover:border-slate-500 hover:text-white">Public Site</a>
            </nav>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">

            {/* Import from TXT/DOCX */}
            <div className="mb-4 bg-white p-4 rounded-lg border">
              <div className="text-sm font-semibold mb-2">Import .txt / .docx</div>
              <input type="file" accept=".txt,.docx" multiple onChange={(e) => setImportFiles(e.target.files)} className="mb-2" />
              <div className="flex items-center gap-2">
                <button type="button" onClick={async () => {
                  if (!importFiles || importFiles.length === 0) { setImportResult({ error: 'No files selected' }); return; }
                  setImporting(true);
                  setImportResult(null);
                  try {
                    const fd = new FormData();
                    for (let i = 0; i < importFiles.length; i++) fd.append('file' + i, importFiles[i]);
                    // let server infer type from filename; provide optional 'type' form field if desired
                    const res = await fetch('/api/admin/import-seed', { method: 'POST', body: fd, credentials: 'same-origin' });
                    const json = await res.json();
                    setImportResult(json);
                  } catch (err) {
                    setImportResult({ error: 'Upload failed' });
                  } finally { setImporting(false); }
                }} className="rounded bg-sky-600 px-3 py-2 text-white">Upload & Import</button>

                <button type="button" onClick={() => { setImportFiles(null); setImportResult(null); }} className="rounded border px-3 py-2">Clear</button>
                {importing ? <div className="text-sm text-slate-500">Importing…</div> : null}
              </div>

              {importResult ? (
                <pre className="mt-3 text-xs text-slate-700 overflow-auto max-h-36">{JSON.stringify(importResult, null, 2)}</pre>
              ) : null}
            </div>

            <form onSubmit={submit} className="space-y-4 bg-white p-6 rounded-lg shadow">
              <div className="flex gap-2">
                <input value={form.id} onChange={(e) => handleChange('id', e.target.value)} placeholder="id (leave empty to create)" className="flex-1 rounded-md border px-3 py-2" />
                <button type="button" onClick={() => loadById()} className="rounded-md border px-3 py-2">Load</button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <select value={form.type} onChange={(e) => handleChange('type', e.target.value)} className="rounded-md border px-3 py-2">
                  <option value="IDIOM">Idiom</option>
                  <option value="PROVERB">Proverb</option>
                </select>

                <select value={form.categorySlug} onChange={(e) => handleChange('categorySlug', e.target.value)} className="rounded-md border px-3 py-2">
                  <option value="">No category</option>
                  {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
              </div>

              <input value={form.phrase} onChange={(e) => handleChange('phrase', e.target.value)} placeholder="Phrase" className="w-full rounded-md border px-3 py-2" required />
              <textarea value={form.meaning} onChange={(e) => handleChange('meaning', e.target.value)} placeholder="Meaning" className="w-full rounded-md border px-3 py-2" required />
              <textarea value={form.example} onChange={(e) => handleChange('example', e.target.value)} placeholder="Example" className="w-full rounded-md border px-3 py-2" />

              <div className="grid grid-cols-2 gap-3">
                <input value={form.indonesianEquivalent} onChange={(e) => handleChange('indonesianEquivalent', e.target.value)} placeholder="Indonesian equivalent" className="rounded-md border px-3 py-2" />
                <input value={form.register} onChange={(e) => handleChange('register', e.target.value)} placeholder="Register" className="rounded-md border px-3 py-2" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input value={form.difficulty} onChange={(e) => handleChange('difficulty', e.target.value)} placeholder="Difficulty" className="rounded-md border px-3 py-2" />
                <input value={form.audioUrl} onChange={(e) => handleChange('audioUrl', e.target.value)} placeholder="Audio URL" className="rounded-md border px-3 py-2" />
              </div>

              <textarea value={Array.isArray(form.thematicTags) ? form.thematicTags.join(', ') : form.thematicTags} onChange={(e) => handleChange('thematicTags', e.target.value)} placeholder="Tags (comma separated)" className="w-full rounded-md border px-3 py-2" />

              <textarea value={Array.isArray(form.exampleContexts) ? form.exampleContexts.join('\n') : form.exampleContexts} onChange={(e) => handleChange('exampleContexts', e.target.value)} placeholder="Example contexts (one per line)" className="w-full rounded-md border px-3 py-2" />

              <textarea value={form.usageNotes} onChange={(e) => handleChange('usageNotes', e.target.value)} placeholder="Usage notes" className="w-full rounded-md border px-3 py-2" />

              <textarea value={form.commonMistakes} onChange={(e) => handleChange('commonMistakes', e.target.value)} placeholder="Common mistakes" className="w-full rounded-md border px-3 py-2" />

              <div className="flex items-center gap-3">
                <button type="submit" className="rounded-md bg-violet-600 px-4 py-2 text-white" disabled={loading}>Save</button>
                <button type="button" className="rounded-md border px-4 py-2" onClick={() => { setForm({ ...form, id: '', phrase: '', meaning: '', example: '' }); setMessage(null); }}>Reset</button>
                {message && <div className="text-sm text-slate-600">{message}</div>}
              </div>
            </form>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center gap-3 mb-4">
                <input value={listSearch} onChange={(e) => setListSearch(e.target.value)} placeholder="Search list" className="flex-1 rounded-md border px-3 py-2" />
                <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="rounded-md border px-3 py-2">
                  {[10,20,50,100].map(n => <option key={n} value={n}>{n} / page</option>)}
                </select>
                <button onClick={() => { setPage(1); loadList({ page:1, pageSize, q: listSearch }); }} className="rounded-md border px-3 py-2">Refresh</button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-slate-500">
                    <tr>
                      <th className="py-2">Phrase</th>
                      <th className="py-2">Type</th>
                      <th className="py-2">Category</th>
                      <th className="py-2">Difficulty</th>
                      <th className="py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listLoading && <tr><td colSpan={5} className="py-4 text-center">Loading…</td></tr>}
                    {!listLoading && list.length === 0 && <tr><td colSpan={5} className="py-4 text-center">No items</td></tr>}
                    {list.map(item => (
                      <tr key={item.id} className="border-t">
                        <td className="py-2 align-top">{item.phrase}</td>
                        <td className="py-2 align-top">{item.type}</td>
                        <td className="py-2 align-top">{item.category ?? '-'}</td>
                        <td className="py-2 align-top">{item.difficulty ?? '-'}</td>
                        <td className="py-2 align-top">
                          <div className="flex gap-2">
                            <button onClick={() => handleEditFromList(item.id)} className="rounded-md border px-2 py-1">Edit</button>
                            <button onClick={() => handleDelete(item.id)} className="rounded-md border px-2 py-1 text-red-600">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-slate-600">Total: {total}</div>
                <div className="flex items-center gap-2">
                  <button disabled={page<=1} onClick={() => setPage(1)} className="rounded-md border px-2 py-1">First</button>
                  <button disabled={page<=1} onClick={() => setPage(p => Math.max(1, p-1))} className="rounded-md border px-2 py-1">Prev</button>
                  <div className="px-2">Page {page} / {totalPages}</div>
                  <button disabled={page>=totalPages} onClick={() => setPage(p => Math.min(totalPages, p+1))} className="rounded-md border px-2 py-1">Next</button>
                  <button disabled={page>=totalPages} onClick={() => setPage(totalPages)} className="rounded-md border px-2 py-1">Last</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
