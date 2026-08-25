"use client";

import { useEffect, useState } from "react";
import IdiomCard from "@/components/IdiomCard";
import type { ReviewRating } from "@/lib/srs";

type SessionItem = {
  id: string;
  phrase: string;
  meaning: string;
  example: string;
  type: "IDIOM" | "PROVERB";
  category?: string | null;
};

type Props = {
  tone?: "kid" | "professional";
};

export default function SessionPlayer({ tone = "kid" }: Props) {
  const [item, setItem] = useState<SessionItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNextItem = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/session", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error ?? "Failed to load item");
      }

      const payload = await res.json();
      setItem(payload.item ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load item");
      setItem(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNextItem();
  }, []);

  const handleRate = async (rating: ReviewRating) => {
    if (!item) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId: item.id,
          rating,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error ?? "Failed to submit rating");
      }

      await fetchNextItem();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit rating");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
          <p className="mt-4 text-sm font-medium text-slate-600">Loading session…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em]">Session error</p>
        <p className="mt-2 text-sm">{error}</p>
        <button
          type="button"
          onClick={fetchNextItem}
          className="mt-4 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center shadow-sm">
        <p className="text-lg font-semibold text-slate-700">No items ready</p>
        <p className="mt-2 text-sm text-slate-500">You’re all caught up for now.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
          Session
        </p>
        {submitting && (
          <span className="text-xs font-medium text-violet-600">Submitting…</span>
        )}
      </div>

      <IdiomCard
        phrase={item.phrase}
        meaning={item.meaning}
        example={item.example}
        type={item.type}
        tone={tone}
        onRate={handleRate}
      />
    </div>
  );
}