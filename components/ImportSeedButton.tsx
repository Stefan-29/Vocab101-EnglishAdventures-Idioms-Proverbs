"use client";

import { useRef, useState } from "react";

export default function ImportSeedButton() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setMessage(null);

    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const items = Array.isArray(json.items) ? json.items : Array.isArray(json) ? json : null;
      if (!items) throw new Error("Selected file does not contain an exported seed array.");

      const res = await fetch('/api/admin/import-seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');

      setMessage(`Imported ${data.imported} expressions successfully.`);
    } catch (err: any) {
      setMessage(err.message || 'Import failed');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="mt-4">
      <input ref={inputRef} type="file" accept="application/json" onChange={handleFile} className="hidden" />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="rounded-md border px-3 py-2 text-sm disabled:opacity-60"
      >
        {busy ? 'Importing…' : 'Import from seed JSON'}
      </button>
      {message && <div className="mt-2 text-sm text-slate-600">{message}</div>}
    </div>
  );
}
