import type { CSSProperties } from "react";

import { cn } from "~/lib/cn";
import type { ThemeConfig } from "~/server/publishing/snapshot";

type EffectStyle = CSSProperties & {
  "--effect-x"?: string;
  "--effect-y"?: string;
  "--effect-size"?: string;
  "--effect-delay"?: string;
  "--effect-duration"?: string;
  "--effect-opacity"?: string;
};

const rainGlyphs = ["01", "10", "11", "00", "0", "1"];

export function VibeLayer({ theme }: { theme: ThemeConfig }) {
  const { layer, density, speed, intensity, reducedMotion } = theme.effects;
  if (layer === "none") return null;
  const count = Math.min(42, Math.max(8, Math.round(density / 2.5)));
  const duration = Math.max(5, 22 - speed * 0.15);
  const opacity = Math.max(0.08, intensity / 180);
  const items = Array.from({ length: count }, (_, index) => index);

  return (
    <div
      aria-hidden="true"
      data-vibe-layer={layer}
      className={cn(
        "pointer-events-none absolute inset-0 z-0 overflow-hidden",
        reducedMotion === "off" && "motion-reduce:hidden",
      )}
    >
      {layer === "waves" || layer === "animated-gradient" ? (
        <>
          <span className="olnk-vibe-blob olnk-vibe-blob-a" />
          <span className="olnk-vibe-blob olnk-vibe-blob-b" />
          <span className="olnk-vibe-blob olnk-vibe-blob-c" />
        </>
      ) : null}
      {layer === "stars" || layer === "snow" || layer === "digital-rain"
        ? items.map((index) => {
            const style: EffectStyle = {
              "--effect-x": `${(index * 37 + 11) % 101}%`,
              "--effect-y": `${(index * 61 + 7) % 101}%`,
              "--effect-size": `${2 + (index % 4)}px`,
              "--effect-delay": `${-((index * 0.73) % duration)}s`,
              "--effect-duration": `${duration + (index % 7)}s`,
              "--effect-opacity": String(
                Math.min(0.82, opacity + (index % 5) * 0.035),
              ),
            };
            return layer === "digital-rain" ? (
              <span key={index} className="olnk-digital-rain" style={style}>
                {rainGlyphs[index % rainGlyphs.length]}
              </span>
            ) : (
              <span
                key={index}
                className={cn(
                  "olnk-vibe-particle",
                  layer === "snow" ? "olnk-snow" : "olnk-star",
                )}
                style={style}
              />
            );
          })
        : null}
    </div>
  );
}
