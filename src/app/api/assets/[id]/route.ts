import { NextResponse } from "next/server";

import { findPublicDelivery } from "~/server/media/delivery";
import { storage } from "~/server/storage";

export async function GET(
  request: Request,
  context: RouteContext<"/api/assets/[id]">,
) {
  const { id } = await context.params;
  const requested = new URL(request.url).searchParams.get("variant");
  const asset = await findPublicDelivery(
    id,
    requested === "poster" ? "poster" : "content",
  );
  if (!asset) return new NextResponse(null, { status: 404 });
  const bytes = await storage.getObject(asset.objectKey);
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": asset.mimeType,
      "Content-Length": String(asset.size),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
