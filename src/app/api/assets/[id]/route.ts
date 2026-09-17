import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { storage } from "~/server/storage";

export async function GET(_request: Request, context: RouteContext<"/api/assets/[id]">) {
  const { id } = await context.params;
  const asset = await db.mediaAsset.findFirst({ where: { id, status: "READY", private: false } });
  if (!asset) return new NextResponse(null, { status: 404 });
  const bytes = await storage.getObject(asset.objectKey);
  return new NextResponse(Buffer.from(bytes), { headers: { "Content-Type": asset.mimeType, "Content-Length": String(asset.size), "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" } });
}
