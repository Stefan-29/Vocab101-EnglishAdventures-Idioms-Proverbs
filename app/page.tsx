"use client";

import { useState } from "react";
import SessionPlayer from "@/components/SessionPlayer";

type Tone = "kid" | "professional";

export default function Page() {
  const [tone, setTone] = useState<Tone>("kid");

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 rounded-3xl bg-gradient-to-r from-violet-600 via-purple-600 to-pink-500 p-6 text-white shadow-lg shadow-violet-200 sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-100">
                Learning platform
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                English Adventures
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex rounded-full border border-white/20 bg-white/10 p-1 backdrop-blur-sm">
                <button
                  type="button"
                  onClick={() => setTone("kid")}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    tone === "kid"
                      ? "bg-white text-violet-700 shadow-sm"
                      : "text-white hover:bg-white/10"
                  }`}
                >
                  Kid mode
                </button>
                <button
                  type="button"
                  onClick={() => setTone("professional")}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    tone === "professional"
                      ? "bg-white text-violet-700 shadow-sm"
                      : "text-white hover:bg-white/10"
                  }`}
                >
                  Professional mode
                </button>
              </div>
              <a href="/dashboard" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-violet-700 shadow-sm transition hover:bg-violet-50">Open dashboard</a>
            </div>
          </div>
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Daily session
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                Review and grow
              </h2>
            </div>

            <div className="rounded-full bg-violet-50 px-3 py-1.5 text-sm font-medium text-violet-700">
              {tone === "kid" ? "Friendly learning" : "Professional practice"}
            </div>
          </div>

          <SessionPlayer tone={tone} />
        </section>
      </div>
    </main>
  );
}