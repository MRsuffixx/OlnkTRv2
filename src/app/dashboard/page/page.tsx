import { notFound } from "next/navigation";

import { Editor } from "~/features/editor/editor";
import type { EditorDocument } from "~/features/editor/editor-reducer";
import { normalizeThemeConfig, seoConfigSchema } from "~/server/publishing/snapshot";
import { api } from "~/trpc/server";

export default async function PageEditor() {
  const profile = (await api.profile.mine())[0];
  if (!profile?.page) notFound();
  const page = await api.page.draft({ pageId: profile.page.id });
  const initialDocument: EditorDocument = {
    pageId: page.id,
    title: page.title,
    description: page.description,
    visibility: page.visibility,
    theme: normalizeThemeConfig(page.draft.themeConfig),
    seo: seoConfigSchema.parse(page.draft.seoConfig),
    blocks: page.blocks.map((block) => ({ id: block.id, type: block.type, config: block.config, position: block.position, enabled: block.enabled })),
  };
  return <Editor initialDocument={initialDocument} profile={{ username: profile.username, displayName: profile.displayName, bio: profile.bio }} />;
}
