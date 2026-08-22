import { createFileRoute } from "@tanstack/react-router";

import { ARBITIX_BACKEND_URL } from "@/lib/arbitix-api";

const allowedPaths = new Set([
  "/agents",
  "/add-agent",
  "/purchase-agent",
  "/regenerate-key",
  "/ai/recommend-agent",
  "/ai/chatbot",
]);

const isAllowedPath = (path: string) =>
  allowedPaths.has(path) || /^\/agent\/[A-Za-z0-9_-]+$/.test(path);

async function proxyGatewayRequest({
  request,
  params,
}: {
  request: Request;
  params: { _splat: string };
}) {
  const path = `/${params._splat}`;
  if (!isAllowedPath(path)) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const apiKey = request.headers.get("x-api-key");
  if (contentType) headers.set("content-type", contentType);
  if (apiKey) headers.set("x-api-key", apiKey);

  const response = await fetch(`${ARBITIX_BACKEND_URL}${path}`, {
    method: request.method,
    headers,
    ...(request.method === "GET" || request.method === "HEAD"
      ? {}
      : { body: await request.text() }),
  });

  return new Response(response.body, {
    status: response.status,
    headers: { "content-type": response.headers.get("content-type") ?? "application/json" },
  });
}

export const Route = createFileRoute("/api/gateway/$")({
  server: {
    handlers: {
      GET: proxyGatewayRequest,
      POST: proxyGatewayRequest,
    },
  },
});
