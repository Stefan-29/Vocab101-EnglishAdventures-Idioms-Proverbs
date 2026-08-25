"use client";

import { useMemo, useState } from "react";
import type { ReviewRating } from "@/lib/srs";

type IdiomCardProps = {
  phrase: string;
  meaning: string;
  example: string;
  type?: "IDIOM" | "PROVERB";
  tone?: "kid" | "professional";
  onRate?: (rating: ReviewRating) => void;
};

const ratingMap: Array<{
  value: ReviewRating;
  label: string;
  tone: string;
}> = [
  { value: 5, label: "Perfect", tone: "bg-emerald-500 text-white" },
  { value: 4, label: "Easy", tone: "bg-green-500 text-white" },
  { value: 3, label: "Good", tone: "bg-amber-500 text-white" },
  { value: 2, label: "Hard", tone: "bg-orange-500 text-white" },
  { value: 1, label: "Again", tone: "bg-red-500 text-white" },
];

export default function IdiomCard({
  phrase,
  meaning,
  example,
  type = "IDIOM",
  tone = "kid",
  onRate,
}: IdiomCardProps) {
  const [revealed, setRevealed] = useState(false);
  const [selectedRating, setSelectedRating] = useState<ReviewRating | null>(
    null
  );

  const cardStyles = useMemo(() => {
    if (tone === "professional") {
      return {
        shell: "border-slate-200 bg-white shadow-sm",
        badge: "bg-slate-900 text-white",
        accent: "text-slate-700",
        button: "border-slate-200 bg-slate-50 hover:bg-slate-100",
      };
    }

    return {
      shell:
        "border-purple-200 bg-gradient-to-br from-purple-50 via-white to-pink-50 shadow-md",
      badge: "bg-gradient-to-r from-pink-500 to-violet-500 text-white",
      accent: "text-violet-700",
      button: "border-violet-200 bg-violet-50 hover:bg-violet-100",
    };
  }, [tone]);

  const handleRating = (rating: ReviewRating) => {
    setSelectedRating(rating);
    onRate?.(rating);
  };

  return (
    <div
      className={`w-full max-w-xl rounded-2xl border p-6 transition-all ${cardStyles.shell}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${cardStyles.badge}`}
        >
          {type}
        </span>

        <button
          type="button"
          onClick={() => setRevealed((prev) => !prev)}
          className={`rounded-full border px-3 py-1.5 text-sm font-medium ${cardStyles.button}`}
        >
          {revealed ? "Hide meaning" : "Reveal meaning"}
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Phrase
          </p>

          <h3 className={`mt-2 text-3xl font-bold ${cardStyles.accent}`}>
            {phrase}
          </h3>
        </div>

        {revealed && (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Meaning
              </p>

              <p className="mt-2 text-base text-slate-700">{meaning}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Example
              </p>

              <p className="mt-2 rounded-xl bg-slate-100 p-3 text-sm italic text-slate-700">
                “{example}”
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          How well did you know it?
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {ratingMap.map((item) => {
            const active = selectedRating === item.value;

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => handleRating(item.value)}
                aria-pressed={active}
                className={`rounded-xl border px-2 py-2 text-xs font-semibold transition ${
                  active
                    ? item.tone
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}