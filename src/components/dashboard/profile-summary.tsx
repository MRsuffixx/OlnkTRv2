import { ArrowUpRight, Palette } from "lucide-react";
import Link from "next/link";

import { CopyButton } from "~/components/shared/copy-button";
import { Badge } from "~/components/ui/badge";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/cn";

export function ProfileSummary({ username, pageUrl, published, labels }: { username: string; pageUrl: string; published: boolean; labels: { title: string; published: string; draft: string; edit: string; view: string; copy: string; copied: string } }) {
  const path = `/${username}`;
  return (
    <section className="rounded-lg border border-border-subtle bg-card p-5 shadow-xs">
      <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-medium text-muted-foreground">{labels.title}</p><p className="mt-2 text-base font-semibold tracking-[-0.02em]">olnk.tr/{username}</p></div><Badge variant={published ? "success" : "neutral"}>{published ? labels.published : labels.draft}</Badge></div>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/dashboard/page" className={cn(buttonVariants({ variant: "primary", size: "sm" }))}><Palette />{labels.edit}</Link>
        {published ? <Link href={path} target="_blank" className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>{labels.view}<ArrowUpRight /></Link> : null}
        <CopyButton value={pageUrl} copiedMessage={labels.copied} variant="ghost" size="sm">{labels.copy}</CopyButton>
      </div>
    </section>
  );
}
