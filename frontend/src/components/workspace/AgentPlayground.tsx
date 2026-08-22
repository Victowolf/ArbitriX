import { useState } from "react";
import { Play, TerminalSquare } from "lucide-react";
import { toast } from "sonner";
import { gatewayApi } from "@/lib/arbitix-api";

import { Panel, Pill, SectionTitle } from "@/components/ui/arbx";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { AIModel } from "@/types";

export function AgentPlayground({ model, hasApiKey }: { model: AIModel; hasApiKey: boolean }) {
  const [request, setRequest] = useState(model.input);
  const [response, setResponse] = useState("");
  const [running, setRunning] = useState(false);

  const runAgent = async () => {
    try {
      JSON.parse(request);
    } catch {
      toast.error("Enter valid request JSON before running the agent.");
      return;
    }

    setRunning(true);
    try {
      const apiKey = window.localStorage.getItem(`arbitix-api-key:${model.id}`);
      if (!apiKey) throw new Error("Generate an API key before running the agent.");
      const result = await gatewayApi.callAgent(model.id, apiKey, JSON.parse(request));
      setResponse(JSON.stringify(result, null, 2));
    } catch (error) {
      toast.error("Agent request failed", {
        description:
          error instanceof Error ? error.message : "The gateway could not reach this agent.",
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div>
      <SectionTitle title="Playground" right={<Pill tone="brand">Test console</Pill>} />
      <Panel className="overflow-hidden">
        <div className="flex items-start gap-2 border-b border-border bg-surface px-4 py-3">
          <TerminalSquare className="mt-0.5 h-4 w-4 text-brand" />
          <div>
            <p className="text-[13px] font-medium">Test {model.name}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Send a JSON request through your API key.
            </p>
          </div>
        </div>
        <div className="grid gap-px bg-border sm:grid-cols-2">
          <div className="bg-card p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Request JSON
            </p>
            <Textarea
              value={request}
              onChange={(event) => setRequest(event.target.value)}
              rows={9}
              className="mt-2 font-mono text-[12px]"
            />
          </div>
          <div className="bg-card p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Response
            </p>
            <pre className="mt-2 min-h-[208px] overflow-auto rounded-md border border-border bg-surface p-3 font-mono text-[12px] leading-5 text-foreground">
              {response || "Run the agent to view its response."}
            </pre>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
          <p className="text-[11px] text-muted-foreground">
            {hasApiKey
              ? "Backend execution will be connected to your generated API key."
              : "Get an API key to run a live request."}
          </p>
          <Button
            size="sm"
            className="h-8 text-[12px]"
            onClick={runAgent}
            disabled={!hasApiKey || running}
          >
            <Play className="mr-1 h-3.5 w-3.5" />
            {running ? "Running…" : "Run"}
          </Button>
        </div>
      </Panel>
    </div>
  );
}
