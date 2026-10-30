import type { AstroCookies } from "astro";
import {
  MAX_MESSAGE_LENGTH,
  isSameOrigin,
  publicId,
  readToken,
} from "../../lib/chat-identity";
import { broadcast } from "./stream";
export const prerender = false;

export async function POST({
  request,
  cookies,
}: {
  request: Request;
  cookies: AstroCookies;
}) {
  if (!isSameOrigin(request)) return new Response(null, { status: 403 });
  const token = readToken(cookies);
  if (!token) return new Response(null, { status: 401 });

  const data = await request.formData();
  const msg = String(data.get("msg") ?? "")
    .trim()
    .slice(0, MAX_MESSAGE_LENGTH);
  if (msg) broadcast(await publicId(token), msg);
  return new Response(null, { status: 204 }); // 204 = browser stays on the page
}
