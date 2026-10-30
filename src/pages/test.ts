export const prerender = false;
export function GET() {
  return Response.json({ message: "get success" });
}
export function QUERY() {
  return Response.json({ message: "query success" });
}
export function HEAD() {
  return new Response(); // no body in HEAD
}
// no OPTIONS; auto generated
export function TRACE() {
  return Response.json({ message: "trace success" });
}
export function PUT() {
  return Response.json({ message: "put success" });
}
export function DELETE() {
  return Response.json({ message: "delete success" });
}
export function POST() {
  return Response.json({ message: "post success" });
}
export function PATCH() {
  return new Response('{"message":"patch success"}', {
    headers: {
      ETag: "e0023aa4f"
    }
  });
}
export function CONNECT() {
  return Response.json({ message: "connect success" });
}
export function ALL({ request }: { request: Request }) {
  return Response.json({ message: "Unknown route? Found: " + request.method });
}
