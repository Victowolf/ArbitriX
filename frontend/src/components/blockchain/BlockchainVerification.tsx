import { Check, ExternalLink, ShieldCheck } from "lucide-react";
import { Mono, Panel, Pill } from "@/components/ui/arbx";
import { Button } from "@/components/ui/button";
import type { BlockchainMeta } from "@/types";

const defaultChecks = [
  "Model Ownership",
  "Deployment History",
  "Subscription",
  "Payment",
  "Review",
];

export function BlockchainVerification({
  checks = defaultChecks,
  compactLayout,
}: {
  checks?: string[];
  compactLayout?: boolean;
}) {
  return (
    <Panel className="p-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-brand" />
        <h3 className="text-sm font-semibold">Verified On-Chain</h3>
        <Pill tone="brand" className="ml-auto">
          Testnet
        </Pill>
      </div>
      <ul
        className={compactLayout ? "mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5" : "mt-3 space-y-1.5"}
      >
        {checks.map((c) => (
          <li key={c} className="flex items-center gap-2 text-[13px]">
            <Check className="h-3.5 w-3.5 text-success" />
            <span className="text-muted-foreground">{c}</span>
          </li>
        ))}
      </ul>
      <Button variant="outline" size="sm" className="mt-4 h-8 w-full text-[12px]">
        View On-Chain Record
        <ExternalLink className="ml-1 h-3 w-3" />
      </Button>
      <p className="mt-3 text-[11px] leading-4 text-subtle">
        Ownership, deployment metadata and payments are recorded on-chain. Model files, inference
        and API responses run off-chain.
      </p>
    </Panel>
  );
}

export function ChainMetadata({ chain }: { chain: BlockchainMeta }) {
  const rows: [string, string][] = [
    ["Model ID", chain.modelId],
    ["Creator Wallet", chain.creatorWallet],
    ["Model Hash", chain.modelHash],
    ["Deployment", chain.deployedAt],
    ["Transaction", chain.txHash],
  ];
  return (
    <Panel className="p-4">
      <h3 className="text-sm font-semibold">Blockchain Verification</h3>
      <dl className="mt-3 space-y-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-3">
            <dt className="text-[12px] text-muted-foreground">{k}</dt>
            <Mono className="truncate text-foreground">{v}</Mono>
          </div>
        ))}
        <div className="flex items-center justify-between gap-3 pt-1">
          <dt className="text-[12px] text-muted-foreground">Status</dt>
          <Pill tone="success">
            <Check className="h-3 w-3" />
            {chain.status}
          </Pill>
        </div>
      </dl>
    </Panel>
  );
}
