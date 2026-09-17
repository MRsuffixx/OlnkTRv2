import { ArrowLeft, Link2Off } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Logo } from "~/components/shared/logo";
import { buttonVariants } from "~/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("errors");
  return (
    <main id="main-content" tabIndex={-1} className="grid min-h-dvh place-items-center px-5">
      <div className="max-w-md text-center">
        <Logo href="/" className="mb-10 justify-center" />
        <span className="mx-auto flex size-11 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Link2Off className="size-5" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold tracking-[-0.03em]">
          {t("notFoundTitle")}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {t("notFoundDescription")}
        </p>
        <Link
          href="/"
          className={`${buttonVariants({ variant: "secondary" })} mt-6`}
        >
          <ArrowLeft />
          OlnkTR
        </Link>
      </div>
    </main>
  );
}
