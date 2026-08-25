"use client";

import { useEffect, useState } from "react";

type Expression = {
  id: string;
  phrase: string;
  meaning: string;
  example: string;
  type: string;
  category: string | null;
  indonesianEquivalent: string | null;
  register: string | null;
  difficulty: string | null;
  usageNotes: string | null;
  commonMistakes: string | null;
  thematicTags: string[] | null;
  exampleContexts: string[] | null;
  audioUrl: string | null;
  source: string | null;
};

export default function ExpressionDetail({ id, onClose }: { id: string | null; onClose: () => void }) {
  const [item, setItem] = useState<Expression | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/expressions/${id}`)
      .then((r) => r.json())
      .then((data) => setItem(data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [id]);

  if (!id) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-auto rounded-t-xl bg-white p-6 shadow-lg sm:rounded-xl">
        <button onClick={onClose} className="absolute right-4 top-4 rounded-full bg-slate-100 px-3 py-1 text-sm">Close</button>

        {loading ? (
          <div>Loading…</div>
        ) : !item ? (
          <div>Not found</div>
        ) : (
          <article>
            <header className="mb-4">
              <h2 className="text-2xl font-bold text-slate-900">{item.phrase}</h2>
              <div className="mt-1 flex gap-2 text-sm text-slate-500">
                <span>{item.type}</span>
                {item.category && <span>• {item.category}</span>}
                {item.difficulty && <span>• {item.difficulty}</span>}
              </div>
            </header>

            <section className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-700">Meaning</h3>
                <p className="mt-1 text-base text-slate-800">{item.meaning}</p>
              </div>

              {item.indonesianEquivalent && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700">Indonesian equivalent</h3>
                  <p className="mt-1 text-base text-slate-800">{item.indonesianEquivalent}</p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-slate-700">Example</h3>
                <p className="mt-1 text-base italic text-slate-800">“{item.example}”</p>
              </div>

              {item.usageNotes && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700">Usage notes</h3>
                  <p className="mt-1 text-sm text-slate-700">{item.usageNotes}</p>
                </div>
              )}

              {item.commonMistakes && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700">Common mistakes</h3>
                  <p className="mt-1 text-sm text-rose-600">{item.commonMistakes}</p>
                </div>
              )}

              {item.exampleContexts && item.exampleContexts.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700">Contexts</h3>
                  <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">
                    {item.exampleContexts.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {item.thematicTags && item.thematicTags.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700">Tags</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.thematicTags.map((t, i) => (
                      <span key={i} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {item.audioUrl && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700">Audio</h3>
                  <audio controls src={item.audioUrl} className="mt-2 w-full" />
                </div>
              )}

              {item.source && (
                <div className="text-sm text-slate-500">Source: {item.source}</div>
              )}
            </section>
          </article>
        )}
      </div>
    </div>
  );
}
