import { useState } from "react";
import { Check, Copy, Eye, EyeOff, KeyRound, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { gatewayApi } from "@/lib/arbitix-api";
import { Mono, Panel, Pill, SectionTitle } from "@/components/ui/arbx";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { mockApiKey } from "@/lib/format";
import { useApp, type Subscription } from "@/state/app-context";
import type { AIModel } from "@/types";

const nodeSnippet = (model: AIModel) => `const response = await fetch(
  "${model.proxyUrl ?? `https://api.arbitrix.ai/v1/inference`}",
  {
    method: "POST",
    headers: {
      "x-api-key": "YOUR_API_KEY",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "${model.id}",
      input: { image_url: "https://example.com/frame.jpg" }
    })
  }
);

const data = await response.json();`;

const pythonSnippet = (model: AIModel) => `import requests

response = requests.post(
    "${model.proxyUrl ?? `https://api.arbitrix.ai/v1/inference`}",
    headers={
        "x-api-key": "YOUR_API_KEY"
    },
    json={
        "model": "${model.id}",
        "input": {"image_url": "https://example.com/frame.jpg"}
    }
)

data = response.json()`;

export function ApiAccess({ model, subscription }: { model: AIModel; subscription: Subscription }) {
  const { updateApiKey, pushEvent } = useApp();
  const [revealed, setRevealed] = useState(false);
  const [lang, setLang] = useState<"node" | "python">("node");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [revoked, setRevoked] = useState(false);

  const code = lang === "node" ? nodeSnippet(model) : pythonSnippet(model);

  return (
    <div className="space-y-4">
      <Panel className="p-4">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-success-soft text-success">
            <Check className="h-3.5 w-3.5" />
          </span>
          <h3 className="text-sm font-semibold">Subscription Successful</h3>
        </div>
        <dl className="mt-3 grid gap-2 text-[13px] sm:grid-cols-3">
          <div>
            <dt className="text-[11px] text-muted-foreground">Model</dt>
            <dd className="font-medium">{model.name}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted-foreground">Plan</dt>
            <dd className="font-medium">{subscription.plan}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted-foreground">Valid Until</dt>
            <dd className="font-medium">{subscription.validUntil}</dd>
          </div>
        </dl>
      </Panel>

      <Panel className="p-4">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-[11px] font-semibold uppercase tracking-wide">API Key</h3>
          {revoked ? <Pill tone="danger">Previous key revoked</Pill> : null}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-md border border-border bg-surface px-3 py-2 font-mono text-[12px]">
            {revealed ? subscription.apiKey : "sk-••••••••••••••••••••"}
          </code>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-[12px]"
            onClick={() => setRevealed((v) => !v)}
          >
            {revealed ? <EyeOff className="mr-1 h-3 w-3" /> : <Eye className="mr-1 h-3 w-3" />}
            {revealed ? "Hide" : "Reveal API Key"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-[12px]"
            onClick={() => {
              navigator.clipboard?.writeText(subscription.apiKey);
              toast.success("API key copied");
            }}
          >
            <Copy className="mr-1 h-3 w-3" />
            Copy
          </Button>
        </div>
        <p className="mt-2 text-[11px] text-warning">
          Save this key securely. It will only be shown once.
        </p>
      </Panel>

      <Panel className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
          <h3 className="text-sm font-semibold">Use {model.name}</h3>
          <div className="ml-auto flex items-center gap-1 rounded-md border border-border bg-surface p-0.5">
            {(["node", "python"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={cn(
                  "rounded px-2 py-1 text-[12px] font-medium transition-colors",
                  lang === l
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {l === "node" ? "Node.js" : "Python"}
              </button>
            ))}
          </div>
        </div>
        <div className="relative">
          <pre className="overflow-x-auto bg-[oklch(0.2046_0_0)] p-4 font-mono text-[12px] leading-5 text-[oklch(0.93_0.01_260)]">
            {code}
          </pre>
          <Button
            variant="outline"
            size="sm"
            className="absolute right-3 top-3 h-7 text-[11px]"
            onClick={() => {
              navigator.clipboard?.writeText(code);
              toast.success("Code copied");
            }}
          >
            <Copy className="mr-1 h-3 w-3" />
            Copy Code
          </Button>
        </div>
      </Panel>

      <div>
        <SectionTitle title="Manage API Access" />
        <Panel className="p-4">
          <dl className="grid gap-3 text-[13px] sm:grid-cols-4">
            <div>
              <dt className="text-[11px] text-muted-foreground">API Status</dt>
              <dd className="mt-0.5">
                <Pill tone="success">Active</Pill>
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-muted-foreground">Requests</dt>
              <dd className="font-medium">{model.performance.requests}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-muted-foreground">Last Request</dt>
              <dd className="font-medium">2 min ago</dd>
            </div>
            <div>
              <dt className="text-[11px] text-muted-foreground">Subscription</dt>
              <dd className="mt-0.5">
                <Pill tone="success">Active</Pill>
              </dd>
            </div>
          </dl>
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
            <Mono className="text-subtle">tx {subscription.txHash}</Mono>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-[12px]"
              onClick={() => setConfirmOpen(true)}
            >
              <RefreshCcw className="mr-1 h-3 w-3" />
              Regenerate API Key
            </Button>
          </div>
        </Panel>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-base">Regenerate API key</DialogTitle>
            <DialogDescription className="text-[13px]">
              Regenerating your API key will invalidate the previous key. Continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-[12px]"
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-8 text-[12px]"
              onClick={async () => {
                try {
                  const result =
                    model.pricePerCall !== undefined
                      ? await gatewayApi.regenerateKey("demo")
                      : { api_key: mockApiKey() };
                  updateApiKey(model.id, result.api_key);
                  window.localStorage.setItem(`arbitix-api-key:${model.id}`, result.api_key);
                  setRevoked(true);
                  setRevealed(true);
                  setConfirmOpen(false);
                  pushEvent({ type: "API Key Generated", model: model.name });
                  toast.success("New API key generated", {
                    description: "The previous key has been revoked.",
                  });
                } catch (error) {
                  toast.error("Unable to regenerate API key", {
                    description:
                      error instanceof Error ? error.message : "The gateway rejected the request.",
                  });
                }
              }}
            >
              Regenerate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
