// Simple static file server for development (not needed in production)
import { file } from "bun";

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    let path = url.pathname;

    if (path === "/") path = "/index.html";

    const filePath = `.${path}`;
    const f = file(filePath);
    if (await f.exists()) return new Response(f);

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Dev server running at http://localhost:${server.port}`);


