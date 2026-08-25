"use client";

import { useState } from "react";

export default function ExportSeedButton() {
  const [scope, setScope] = useState("all");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const doExport = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const body: any = {};
      if (scope === "since7") {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        body.since = d.toISOString();
      }

      const res = await fetch('/api/admin/export-seed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Export failed');

      // trigger download of the returned items as JSON
      const blob = new Blob([JSON.stringify(json.items || [], null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = json.filename || 'exported-seed.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setMessage(`Exported ${json.count} items to ${json.filename}`);
    } catch (err: any) {
      setMessage(err.message || 'Export failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4">
      <label className="text-sm text-slate-600 mr-2">Export scope:</label>
      <select value={scope} onChange={(e) => setScope(e.target.value)} className="rounded-md border px-2 py-1 mr-3">
        <option value="all">All expressions</option>
        <option value="since7">Created in last 7 days</option>
      </select>
      <button onClick={doExport} disabled={busy} className="rounded-md bg-sky-600 px-3 py-1 text-white text-sm">{busy ? 'Exporting…' : 'Export to seed'}</button>
      {message && <div className="mt-2 text-sm text-slate-600">{message}</div>}
    </div>
  );
}
