import type { Metadata } from "next";

import { privateRouteMetadata } from "~/lib/seo-metadata";

export const metadata: Metadata = privateRouteMetadata("Administration");

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
