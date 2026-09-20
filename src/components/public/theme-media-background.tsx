import Image from "next/image";

import type { ThemeConfig } from "~/server/publishing/snapshot";

export function ThemeMediaBackground({
  theme,
  assetBase,
}: {
  theme: ThemeConfig;
  assetBase: "/api/assets" | "/api/media";
}) {
  if (theme.background.type === "IMAGE") {
    return (
      <Image
        aria-hidden="true"
        alt=""
        fill
        priority
        unoptimized
        src={`${assetBase}/${theme.background.assetId}`}
        sizes="100vw"
        className="pointer-events-none absolute inset-0"
        style={{
          objectFit: theme.background.fit,
          objectPosition: `${theme.background.focalX}% ${theme.background.focalY}%`,
          opacity: theme.background.opacity / 100,
        }}
      />
    );
  }
  if (theme.background.type === "VIDEO") {
    return (
      <video
        aria-hidden="true"
        autoPlay
        muted
        loop
        playsInline
        disablePictureInPicture
        poster={`${assetBase}/${theme.background.assetId}?variant=poster`}
        className="pointer-events-none absolute inset-0 size-full object-cover"
        style={{ opacity: theme.background.opacity / 100 }}
      >
        <source
          src={`${assetBase}/${theme.background.assetId}`}
          type="video/mp4"
        />
      </video>
    );
  }
  return null;
}
