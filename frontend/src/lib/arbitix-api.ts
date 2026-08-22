export const ARBITIX_BACKEND_URL = "https://arbitix-deploy.onrender.com";
export const ARBITIX_API_URL = "/api/gateway";

export type GatewayAgent = {
  agent_id: string;
  agent_name: string;
  description: string;
  sector: string;
  owner: string;
  proxy_url: string;
  price_per_call: number;
  input_example: Record<string, unknown>;
  output_example: Record<string, unknown>;
  created_at: string;
};

export type GatewayKey = {
  api_key: string;
  username: string;
  tokens_left: number;
  expires_on: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${ARBITIX_API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = (await response.json()) as T | { detail?: string };
  if (!response.ok) {
    throw new Error(
      typeof body === "object" && body && "detail" in body
        ? String(body.detail)
        : "Gateway request failed",
    );
  }
  return body as T;
}

export const gatewayApi = {
  listAgents: () => request<GatewayAgent[]>("/agents"),
  addAgent: (body: Record<string, unknown>) =>
    request<{ agent_id: string; proxy_url: string }>("/add-agent", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  purchaseAgent: (username: string, agentId: string) =>
    request<GatewayKey & { agent_id: string; agent_name: string; proxy_url: string }>(
      "/purchase-agent",
      { method: "POST", body: JSON.stringify({ username, agent_id: agentId }) },
    ),
  regenerateKey: (username: string) =>
    request<GatewayKey>("/regenerate-key", { method: "POST", body: JSON.stringify({ username }) }),
  callAgent: (agentId: string, apiKey: string, body: unknown) =>
    request<Record<string, unknown>>(`/agent/${encodeURIComponent(agentId)}`, {
      method: "POST",
      headers: { "x-api-key": apiKey },
      body: JSON.stringify(body),
    }),
  chatbot: (message: string, history: { role: "user" | "assistant"; text: string }[]) =>
    request<{ reply: string }>("/ai/chatbot", {
      method: "POST",
      body: JSON.stringify({ message, history }),
    }),
  recommendAgent: (query: string) =>
    request<{ recommended: GatewayAgent | null; runner_ups: string[]; raw_query: string }>(
      "/ai/recommend-agent",
      { method: "POST", body: JSON.stringify({ query }) },
    ),
};
