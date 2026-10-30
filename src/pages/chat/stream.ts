import type { AstroCookies } from "astro";
import { publicId, readToken } from "../../lib/chat-identity";

export const prerender = false;

declare global {
  var __chatStreams: Map<ReadableStreamDefaultController, string>;
}

const encoder = new TextEncoder();
// Controller -> id of the user who opened that stream.
const clients = (globalThis.__chatStreams ??= new Map());

export const escapeHtml = (v: string) =>
  v.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export function broadcast(user: string, msg: string) {
  const name = escapeHtml(user);
  const text = escapeHtml(msg);
  for (const [c, viewer] of clients) {
    const mine = viewer === user;
    try {
      c.enqueue(
        encoder.encode(
          `<p${mine ? ' class="mine"' : ""}><strong>${mine ? "You" : name}</strong>${text}</p>`,
        ),
      );
    } catch {
      clients.delete(c);
    }
  }
}

export async function GET({ cookies }: { cookies: AstroCookies }) {
  const token = readToken(cookies);
  if (!token) return new Response("Missing session", { status: 401 });
  const viewer = await publicId(token);
  let ctrl: ReadableStreamDefaultController;
  const stream = new ReadableStream({
    start(c) {
      ctrl = c;
      clients.set(c, viewer);
      // Browsers buffer the first ~1KB, so pad it.
      c.enqueue(
        encoder.encode(
          /*html*/ `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>
            * { box-sizing: border-box; }
            body {
              min-height: 100vh;
              min-width: 100vw;
              margin: 0;
              background: #020617;
              color: #e2e8f0;
              font-family: ui-sans-serif, system-ui, sans-serif;
              overflow: hidden;
            }
            #a {
              height: 100vh;
              width: 100vw;
              padding: 1rem;
              overflow-x: hidden;
              overflow-y: auto;
            }
            #w {
              display: flex;
              flex-direction: column-reverse;
              align-items: flex-start;
              gap: 0.75rem;
            }
            p {
              max-width: 90%;
              margin: 0;
              overflow-wrap: anywhere;
              border: 1px solid #ffffff12;
              border-radius: 1rem 1rem 1rem 0.25rem;
              background: #0f172a;
              padding: 0.75rem 1rem;
              line-height: 1.5;
            }
            p.mine {
              margin-left: auto;
              border-color: #6366f1;
              border-radius: 1rem 1rem 0.25rem 1rem;
              background: #4338ca;
            }
            p.mine strong { color: #c7d2fe; text-align: right; }
            strong {
              display: block;
              margin-bottom: 0.2rem;
              color: #a5b4fc;
              font-size: 0.75rem;
              font-weight: 600;
            }
          </style></head><body><div id="a"><div id="w">` + " ".repeat(1024),
        ),
      );
    },
    cancel() {
      clients.delete(ctrl);
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
