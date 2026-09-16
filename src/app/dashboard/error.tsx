"use client";

import { CircleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { Button } from "~/components/ui/button";

export default function DashboardError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const t = useTranslations("errors");
  useEffect(() => {
    console.error("Dashboard render error", { digest: error.digest });
  }, [error.digest]);
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center text-center">
      <span className="mb-4 flex size-11 items-center justify-center rounded-md bg-danger-soft text-danger"><CircleAlert className="size-5" /></span>
      <h2 className="text-lg font-semibold">{t("genericTitle")}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{t("genericDescription")}</p>
      <Button className="mt-5" variant="secondary" onClick={retry}>{t("retry")}</Button>
    </div>
  );
}
