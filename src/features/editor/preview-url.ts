const allowedSchemes = new Set(["http:", "https:", "mailto:", "tel:"]);

export function safePreviewHref(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return "#";
  try {
    const url = new URL(value);
    return allowedSchemes.has(url.protocol) ? url.toString() : "#";
  } catch {
    return "#";
  }
}
