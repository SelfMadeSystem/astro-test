import type { AstroCookies } from "astro";

const COOKIE = "chat_token";
const TOKEN_RE = /^[0-9a-f-]{36}$/;

export const MAX_MESSAGE_LENGTH = 500;

/** Returns the secret token from the cookie, or undefined if missing/malformed. */
export function readToken(cookies: AstroCookies): string | undefined {
  const value = cookies.get(COOKIE)?.value;
  return value && TOKEN_RE.test(value) ? value : undefined;
}

/** Reads the token cookie, creating it if the visitor doesn't have one yet. */
export function ensureToken(cookies: AstroCookies, url: URL): string {
  const existing = readToken(cookies);
  if (existing) return existing;
  const token = crypto.randomUUID();
  cookies.set(COOKIE, token, {
    path: "/chat",
    httpOnly: true,
    sameSite: "strict",
    secure: url.protocol === "https:",
  });
  return token;
}

/** Public name derived from the secret, so the secret itself is never exposed. */
export async function publicId(token: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  return Array.from(new Uint8Array(digest).slice(0, 4), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

/** Rejects cross-site POSTs when the browser reports an Origin. */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}
