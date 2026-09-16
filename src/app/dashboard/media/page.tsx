import { getTranslations } from "next-intl/server";

import { PageHeader } from "~/components/shell/page-header";
import { MediaLibrary } from "~/features/media/media-library";
import { api } from "~/trpc/server";

export default async function MediaPage() {
  const [t, assets] = await Promise.all([getTranslations("media"), api.media.list()]);
  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <MediaLibrary initialAssets={assets} />
    </div>
  );
}
