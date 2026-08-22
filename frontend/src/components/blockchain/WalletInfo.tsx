import { Copy, ExternalLink, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Panel, Pill } from "@/components/ui/arbx";
import { Button } from "@/components/ui/button";
import { useApp } from "@/state/app-context";

export function WalletInfo() {
  const { wallet, network } = useApp();
  return (
    <Panel className="p-4">
      <div className="flex items-center gap-2">
        <Wallet className="h-4 w-4 text-brand" />
        <h3 className="text-sm font-semibold">Connected Wallet</h3>
        <Pill tone="success" className="ml-auto">
          Connected
        </Pill>
      </div>
      <div className="mt-3 grid gap-2 text-[13px] sm:grid-cols-2">
        <div>
          <p className="text-[11px] text-muted-foreground">Address</p>
          <p className="font-mono text-[12px]">{wallet}</p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">Network</p>
          <p>{network}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-[12px]"
          onClick={() => {
            navigator.clipboard?.writeText("0x71A8f3C4d5E6B7a8C9d0E1f2A3b4C5d6E7A82F");
            toast.success("Wallet address copied");
          }}
        >
          <Copy className="mr-1 h-3 w-3" />
          Copy Address
        </Button>
        <Button variant="outline" size="sm" className="h-8 text-[12px]">
          <ExternalLink className="mr-1 h-3 w-3" />
          View on Explorer
        </Button>
      </div>
    </Panel>
  );
}
