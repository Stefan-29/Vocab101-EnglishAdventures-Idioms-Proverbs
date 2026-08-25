import { PrismaClient } from "@prisma/client";
import React from "react";

const prisma = new PrismaClient();

export default async function Page({ params }: { params: { id: string } }) {
  const { id } = params;

  const [idiom, proverb] = await Promise.all([
    prisma.idiom.findUnique({ where: { id }, include: { category: true } }),
    prisma.proverb.findUnique({ where: { id }, include: { category: true } }),
  ]);

  const item = idiom ?? proverb;

  if (!item) {
    return (
      <main className="min-h-screen p-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-bold">Expression not found</h1>
          <p className="mt-2 text-sm text-slate-600">No expression matched the given id.</p>
        </div>
      </main>
    );
  }

  // parse tags/contexts stored as JSON-string or comma-separated
  const parseList = (v: string | null | undefined) => {
    if (!v) return [];
    try {
      const parsed = JSON.parse(v);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    return v.split(/\s*,\s*/).filter(Boolean);
  };

  const tags = parseList((item as any).thematicTags);
  const contexts = parseList((item as any).exampleContexts);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow">
        <header>
          <h1 className="text-3xl font-extrabold text-slate-900">{item.phrase}</h1>
          <div className="mt-2 text-sm text-slate-600">
            {item.type} {item.category ? `• ${item.category.name}` : null} {item.difficulty ? `• ${item.difficulty}` : null}
          </div>
        </header>

        <article className="mt-6 space-y-6">
          <section>
            <h2 className="text-sm font-semibold text-slate-700">Meaning</h2>
            <p className="mt-1 text-base text-slate-800">{item.meaning}</p>
          </section>

          { (item as any).indonesianEquivalent && (
            <section>
              <h3 className="text-sm font-semibold text-slate-700">Indonesian equivalent</h3>
              <p className="mt-1 text-base text-slate-800">{(item as any).indonesianEquivalent}</p>
            </section>
          )}

          <section>
            <h3 className="text-sm font-semibold text-slate-700">Example</h3>
            <p className="mt-1 italic text-slate-800">“{item.example}”</p>
          </section>

          { (item as any).usageNotes && (
            <section>
              <h3 className="text-sm font-semibold text-slate-700">Usage notes</h3>
              <p className="mt-1 text-sm text-slate-700">{(item as any).usageNotes}</p>
            </section>
          )}

          { (item as any).commonMistakes && (
            <section>
              <h3 className="text-sm font-semibold text-slate-700">Common mistakes</h3>
              <p className="mt-1 text-sm text-rose-600">{(item as any).commonMistakes}</p>
            </section>
          )}

          {contexts.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-slate-700">Contexts</h3>
              <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">
                {contexts.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </section>
          )}

          {tags.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-slate-700">Tags</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {tags.map((t, i) => <span key={i} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">{t}</span>)}
              </div>
            </section>
          )}

          { (item as any).audioUrl && (
            <section>
              <h3 className="text-sm font-semibold text-slate-700">Audio</h3>
              <audio controls className="mt-2 w-full" src={(item as any).audioUrl} />
            </section>
          )}

          { (item as any).source && (
            <div className="text-sm text-slate-500">Source: {(item as any).source}</div>
          )}
        </article>
      </div>
    </main>
  );
}
