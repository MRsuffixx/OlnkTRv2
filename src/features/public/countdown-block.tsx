"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

function remaining(targetAt: string) {
  const milliseconds = Math.max(0, new Date(targetAt).getTime() - Date.now());
  return {
    complete: milliseconds === 0,
    days: Math.floor(milliseconds / 86_400_000),
    hours: Math.floor((milliseconds / 3_600_000) % 24),
    minutes: Math.floor((milliseconds / 60_000) % 60),
    seconds: Math.floor((milliseconds / 1000) % 60),
  };
}

export function CountdownBlock({
  title,
  targetAt,
  expiredLabel,
}: {
  title: string;
  targetAt: string;
  expiredLabel: string;
}) {
  const t = useTranslations("publicBlocks");
  const [value, setValue] = useState(() => remaining(targetAt));
  useEffect(() => {
    const update = () => setValue(remaining(targetAt));
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [targetAt]);

  return (
    <section className="w-full rounded-2xl border border-current/15 bg-current/5 p-4 backdrop-blur-sm">
      <p className="text-sm font-semibold">{title}</p>
      {value.complete ? (
        <p className="mt-3 text-lg font-semibold">{expiredLabel}</p>
      ) : (
        <div className="mt-3 grid grid-cols-4 gap-2" aria-live="off">
          {[
            [value.days, t("days")],
            [value.hours, t("hours")],
            [value.minutes, t("minutes")],
            [value.seconds, t("seconds")],
          ].map(([amount, label]) => (
            <span key={label} className="rounded-xl bg-current/8 px-2 py-2">
              <span className="block text-lg font-semibold tabular-nums">
                {String(amount).padStart(2, "0")}
              </span>
              <span className="block text-[10px] uppercase opacity-60">
                {label}
              </span>
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
