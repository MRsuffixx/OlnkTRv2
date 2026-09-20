const allowedHosts = new Set([
  "api.github.com",
  "www.googleapis.com",
  "id.twitch.tv",
  "api.twitch.tv",
  "accounts.spotify.com",
  "api.spotify.com",
]);

export async function fetchIntegrationJson(
  url: URL,
  init: RequestInit = {},
) {
  if (url.protocol !== "https:" || !allowedHosts.has(url.hostname)) {
    throw new Error("INTEGRATION_HOST_NOT_ALLOWED");
  }
  const response = await fetch(url, {
    ...init,
    redirect: "error",
    signal: AbortSignal.timeout(7000),
    headers: { "user-agent": "OlnkTR/1.0", ...init.headers },
  });
  if (!response.ok) {
    throw new Error(`INTEGRATION_HTTP_${response.status}`);
  }
  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength > 512_000) throw new Error("INTEGRATION_RESPONSE_TOO_LARGE");
  const text = await response.text();
  if (Buffer.byteLength(text, "utf8") > 512_000) {
    throw new Error("INTEGRATION_RESPONSE_TOO_LARGE");
  }
  return JSON.parse(text) as unknown;
}
