"use client";

import { CircleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Button } from "~/components/ui/button";

export default function ApplicationError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");
  const common = useTranslations("common");
  useEffect(() => {
    console.error("Application render error", { digest: error.digest });
  }, [error.digest]);
  return (
    <main id="main-content" tabIndex={-1} className="grid min-h-dvh place-items-center px-5">
      <div className="max-w-md text-center">
        <span className="mx-auto flex size-11 items-center justify-center rounded-md bg-danger-soft text-danger">
          <CircleAlert className="size-5" />
        </span>
        <h1 className="mt-5 text-xl font-semibold">{t("genericTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("genericDescription")}
        </p>
        <Button variant="secondary" className="mt-5" onClick={reset}>
          {common("retry")}
        </Button>
      </div>
    </main>
  );
}
