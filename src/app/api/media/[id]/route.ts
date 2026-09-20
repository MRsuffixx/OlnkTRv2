import { NextResponse } from "next/server";

import { auth } from "~/server/auth";
import { findOwnedDelivery } from "~/server/media/delivery";
import { storage } from "~/server/storage";

export async function GET(
  request: Request,
  context: RouteContext<"/api/media/[id]">,
) {
  const session = await auth();
  if (!session?.user) return new NextResponse(null, { status: 401 });
  const { id } = await context.params;
  const requested = new URL(request.url).searchParams.get("variant");
  const asset = await findOwnedDelivery(
    id,
    session.user.id,
    requested === "poster" ? "poster" : "content",
  );
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
