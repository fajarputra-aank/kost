import { createServer } from "node:http";

const port = Number(process.env.SANDBOX_PROVIDER_PORT ?? 8787);
const operations = new Map();

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);
  response.setHeader("content-type", "application/json");

  if (request.method === "POST" && url.pathname === "/renders") {
    let body = "";
    for await (const chunk of request) body += chunk;
    const input = body ? JSON.parse(body) : {};
    const operationId = `sandbox-${operations.size + 1}`;
    operations.set(operationId, { ...input, polls: 0 });
    response.writeHead(202);
    response.end(JSON.stringify({ operationId }));
    return;
  }

  const match = url.pathname.match(/^\/renders\/([^/]+)$/);
  if (request.method === "GET" && match && operations.has(match[1])) {
    const operation = operations.get(match[1]);
    operation.polls += 1;
    if (process.env.SANDBOX_FAIL_FIRST_POLL === "1" && operation.polls === 1) {
      response.writeHead(503);
      response.end(JSON.stringify({ error: "temporary_sandbox_failure" }));
      return;
    }
    response.writeHead(200);
    response.end(JSON.stringify({
      status: "completed",
      outputUrl: `/sandbox-video/${match[1]}.mp4`,
      operationId: match[1],
      received: { aspectRatio: operation.aspectRatio, durationSeconds: operation.durationSeconds },
    }));
    return;
  }

  response.writeHead(404);
  response.end(JSON.stringify({ error: "not_found" }));
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Sandbox video provider listening on http://127.0.0.1:${port}`);
});

process.on("SIGTERM", () => server.close(() => process.exit(0)));
