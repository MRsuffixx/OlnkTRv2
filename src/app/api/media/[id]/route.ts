import { NextResponse } from "next/server";

import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { storage } from "~/server/storage";

export async function GET(_request: Request, context: RouteContext<"/api/media/[id]">) {
  const session = await auth();
  if (!session?.user) return new NextResponse(null, { status: 401 });
  const { id } = await context.params;
  const asset = await db.mediaAsset.findFirst({ where: { id, ownerId: session.user.id, status: "READY" } });
  if (!asset) return new NextResponse(null, { status: 404 });
  const bytes = await storage.getObject(asset.objectKey);
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": asset.mimeType,
      "Content-Length": String(asset.size),
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
