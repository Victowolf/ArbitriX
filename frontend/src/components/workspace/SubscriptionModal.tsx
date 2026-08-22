import { useEffect, useState } from "react";
import { ArrowDown, Check, Copy, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mono, Pill } from "@/components/ui/arbx";
import { mockApiKey, randomHash } from "@/lib/format";
import { useApp } from "@/state/app-context";
import type { AIModel } from "@/types";
import { gatewayApi } from "@/lib/arbitix-api";

type Stage = "review" | "confirming" | "processing" | "done";

const flow = ["Consumer Wallet", "Smart Contract", "Platform Fee", "Developer"];

export function SubscriptionModal({
  model,
  plan,
  open,
  onOpenChange,
}: {
  model: AIModel;
  plan: "Monthly" | "Yearly";
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { wallet, network, subscribe, pushEvent } = useApp();
  const [stage, setStage] = useState<Stage>("review");
  const [txHash, setTxHash] = useState("");
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    if (open) {
      setStage("review");
      setTxHash("");
      setApiKey("");
    }
  }, [open]);

  const price = plan === "Monthly" ? model.priceMonthly : model.priceYearly;
  const isAgent = model.pricePerCall !== undefined;
  const generatedKey = apiKey || `sk_${model.id}_${txHash.slice(2, 10)}`;

  const confirm = async () => {
    const hash = randomHash();
    if (isAgent) {
      try {
        const purchase = await gatewayApi.purchaseAgent("demo", model.id);
        setApiKey(purchase.api_key);
        window.localStorage.setItem(`arbitix-api-key:${model.id}`, purchase.api_key);
        setTxHash(hash);
        setStage("done");
        subscribe({
          modelId: model.id,
          plan,
          apiKey: purchase.api_key,
          validUntil: purchase.expires_on,
          createdAt: Date.now(),
          txHash: hash,
        });
        pushEvent({ type: "API Key Generated", model: model.name });
      } catch (error) {
        toast.error("Unable to generate API key", {
          description:
            error instanceof Error ? error.message : "The gateway rejected the purchase.",
        });
      }
      return;
    }
    setTxHash(hash);
    setStage("confirming");
    setTimeout(() => setStage("processing"), 1100);
    setTimeout(() => {
      setStage("done");
      const validUntil = plan === "Monthly" ? "21 Sep 2026" : "21 Aug 2027";
      subscribe({
        modelId: model.id,
        plan,
        apiKey: mockApiKey(),
        validUntil,
        createdAt: Date.now(),
        txHash: hash,
      });
      pushEvent({
        type: "Model Subscribed",
        model: model.name,
        value: isAgent
          ? `${model.pricePerCall?.toFixed(4)} tokens / call`
          : `${(price / 100).toFixed(2)} ETH`,
        txHash: hash,
        wallet,
      });
      pushEvent({ type: "API Key Generated", model: model.name });
    }, 2600);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-base">
            {stage === "done"
              ? isAgent
                ? "API key generated"
                : "Transaction confirmed"
              : isAgent
                ? "Generate API key"
                : "Confirm subscription"}
          </DialogTitle>
          <DialogDescription className="text-[13px]">
            {stage === "done"
              ? isAgent
                ? "Save this key now. It will not be shown again."
                : "Your subscription is recorded on-chain."
              : isAgent
                ? "Review agent access before generating your key."
                : "Review the payment details before signing."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 rounded-[10px] border border-border bg-surface p-3 text-[13px]">
          <Row label="Model" value={model.name} />
          <Row label={isAgent ? "Access" : "Plan"} value={isAgent ? "API key" : plan} />
          <Row
            label="Price"
            value={
              isAgent
                ? `${model.pricePerCall?.toFixed(4)} tokens / call`
                : `${price.toFixed(4)} ETH`
            }
          />
          <Row label="Payment method" value="Connected Wallet" />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Network</span>
            <Pill tone="brand">{network.includes("Testnet") ? "Testnet" : network}</Pill>
          </div>
        </div>

        {stage === "review" ? (
          <div className="rounded-[10px] border border-border p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Transaction preview
            </p>
            <div className="mt-2 space-y-1">
              {flow.map((step, i) => (
                <div key={step}>
                  <div className="flex items-center gap-2 text-[13px]">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                    {step}
                  </div>
                  {i < flow.length - 1 ? (
                    <ArrowDown className="ml-[1px] h-3 w-3 text-subtle" />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {stage === "confirming" || stage === "processing" ? (
          <div className="flex items-center gap-2 rounded-[10px] border border-border bg-surface p-3 text-[13px]">
            <Loader2 className="h-4 w-4 animate-spin text-brand" />
            <span className="animate-pulse">
              {stage === "confirming" ? "Confirming…" : "Processing transaction…"}
            </span>
          </div>
        ) : null}

        {stage === "done" ? (
          <div className="rounded-[10px] border border-success/20 bg-success-soft p-3">
            <div className="flex items-center gap-2 text-[13px] font-medium text-success">
              <Check className="h-4 w-4" />
              Transaction confirmed
            </div>
            {isAgent ? (
              <div className="mt-3">
                <p className="text-[11px] text-muted-foreground">API key — copy it now</p>
                <div className="mt-1 flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-md border border-success/20 bg-background px-2 py-1.5 font-mono text-[11px] text-foreground">
                    {generatedKey}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-[11px]"
                    onClick={() => navigator.clipboard?.writeText(generatedKey)}
                  >
                    <Copy className="mr-1 h-3 w-3" /> Copy
                  </Button>
                </div>
              </div>
            ) : null}
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[12px] text-muted-foreground">Transaction Hash</span>
              <Mono>{txHash}</Mono>
            </div>
          </div>
        ) : null}

        {stage === "review" ? (
          <Button className="h-9 w-full text-[13px]" onClick={confirm}>
            {isAgent ? "Generate API Key" : "Confirm Subscription"}
          </Button>
        ) : null}

        {stage === "done" ? (
          <div className="flex gap-2">
            <Button variant="outline" className="h-9 flex-1 text-[13px]">
              View Transaction
              <ExternalLink className="ml-1 h-3 w-3" />
            </Button>
            <Button className="h-9 flex-1 text-[13px]" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
