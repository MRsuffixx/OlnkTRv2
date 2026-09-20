import { db } from "~/server/db";

interface DeliveryFile {
  id: string;
  objectKey: string;
  mimeType: string;
  kind: "IMAGE" | "VIDEO" | "AUDIO" | "OTHER";
  size: bigint;
}

interface DeliverySource extends DeliveryFile {
  derivatives: Array<
    DeliveryFile & { variant: "ORIGINAL" | "OPTIMIZED" | "POSTER" }
  >;
}

export function selectDeliveryVariant(
  source: DeliverySource,
  requested: "content" | "poster",
): DeliveryFile | undefined {
  if (requested === "poster") {
    return source.derivatives.find((item) => item.variant === "POSTER");
  }
  if (source.kind === "VIDEO") {
    return source.derivatives.find((item) => item.variant === "OPTIMIZED");
  }
  return source;
}

const deliverySelect = {
  id: true,
  objectKey: true,
  mimeType: true,
  kind: true,
  size: true,
  derivatives: {
    where: { status: "READY" as const },
    select: {
      id: true,
      objectKey: true,
      mimeType: true,
      kind: true,
      variant: true,
      size: true,
    },
  },
};

export async function findPublicDelivery(
  id: string,
  requested: "content" | "poster",
) {
  const source = await db.mediaAsset.findFirst({
    where: { id, status: "READY", private: false, variant: "ORIGINAL" },
    select: deliverySelect,
  });
  return source ? selectDeliveryVariant(source, requested) : undefined;
}

export async function findOwnedDelivery(
  id: string,
  ownerId: string,
  requested: "content" | "poster",
) {
  const source = await db.mediaAsset.findFirst({
    where: {
      id,
      ownerId,
      status: "READY",
      variant: "ORIGINAL",
    },
    select: deliverySelect,
  });
  return source ? selectDeliveryVariant(source, requested) : undefined;
}
