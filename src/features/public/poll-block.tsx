"use client";

import { useEffect, useState } from "react";

interface PollResults {
  options: Array<{ key: string; label: string; votes: number }>;
  total: number;
  selectedOptionKey: string | null;
}

export function PollBlock({
  blockId,
  question,
  options,
}: {
  blockId: string;
  question: string;
  options: Array<{ key: string; label: string }>;
}) {
  const [results, setResults] = useState<PollResults | null>(null);
  const [pending, setPending] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/public/polls/${blockId}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((value: PollResults | null) => value && setResults(value));
    return () => controller.abort();
  }, [blockId]);

  async function vote(optionKey: string) {
    if (pending || results?.selectedOptionKey) return;
    setPending(true);
    try {
      const response = await fetch(`/api/public/polls/${blockId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ optionKey }),
      });
      if (response.ok) setResults((await response.json()) as PollResults);
    } finally {
      setPending(false);
    }
  }

  const display = results?.options ?? options.map((option) => ({ ...option, votes: 0 }));
  return (
    <section className="w-full rounded-2xl border border-current/15 bg-current/5 p-4 text-left backdrop-blur-sm">
      <p className="font-semibold">{question}</p>
      <div className="mt-3 grid gap-2">
        {display.map((option) => {
          const percentage = results?.total
            ? Math.round((option.votes / results.total) * 100)
            : 0;
          const selected = results?.selectedOptionKey === option.key;
          return (
            <button
              key={option.key}
              type="button"
              disabled={pending || Boolean(results?.selectedOptionKey)}
              onClick={() => void vote(option.key)}
              className="relative isolate min-h-10 overflow-hidden rounded-xl border border-current/15 px-3 text-left text-sm transition-[transform,opacity] enabled:hover:scale-[1.01] disabled:cursor-default"
            >
              {results ? (
                <span
                  aria-hidden="true"
                  className="absolute inset-y-0 left-0 -z-10 bg-current/10 transition-[width]"
                  style={{ width: `${percentage}%` }}
                />
              ) : null}
              <span className="flex justify-between gap-3">
                <span className={selected ? "font-semibold" : undefined}>
                  {option.label}
                </span>
                {results ? <span className="tabular-nums">{percentage}%</span> : null}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
