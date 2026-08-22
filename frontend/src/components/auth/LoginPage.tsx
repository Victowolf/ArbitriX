import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Boxes, Loader2, ShieldCheck, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/arbx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ALLOWED_ADDRESS = "0xBa225F7569e4ec27ddbcCbE9Ac418d26868877Ca";

const demoPhrase = [
  "apple",
  "river",
  "cloud",
  "model",
  "vision",
  "chain",
  "market",
  "node",
  "trust",
  "deploy",
  "token",
  "verify",
];

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

function EthereumBadge() {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      aria-hidden="true"
      className="pointer-events-none fixed bottom-[1px] right-[1px] z-[2147483647] flex h-[35px] items-center gap-1.5 rounded-[10px] border border-black/10 bg-white px-3 shadow-[0_2px_8px_rgba(0,0,0,0.18)]"
    >
      <span className="text-[16px] font-medium leading-none text-[#627EEA]">Ξ</span>
      <span className="whitespace-nowrap text-[12px] font-medium text-gray-800">
        Powered by Ethereum
      </span>
    </div>,
    document.body,
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const [walletOpen, setWalletOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [guestMode, setGuestMode] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);

  useEffect(() => {
    const scriptId = "aidesigner-effects-runtime";
    if (document.getElementById(scriptId)) return;

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://cdn.aidesigner.ai/effects/runtime/v1.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    const resetWallet = async () => {
      setAccount(null);
      setWalletError(null);
      setWalletOpen(false);
      setConnecting(false);

      if (!window.ethereum) return;

      try {
        await window.ethereum.request({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }],
        });
      } catch {
        // Some injected providers do not support permission revocation.
      }
    };

    resetWallet();
  }, []);

  useEffect(() => {
    if (!window.ethereum?.on) return;

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[];

      if (!accounts || accounts.length === 0) {
        setAccount(null);
        setWalletOpen(false);
        setWalletError("Wallet disconnected.");
        return;
      }

      const newAccount = accounts[0];
      if (!newAccount) return;
      if (newAccount.toLowerCase() !== ALLOWED_ADDRESS.toLowerCase()) {
        setAccount(null);
        setWalletError("The connected wallet is not authorized for ArbitriX.");
        return;
      }

      setAccount(newAccount);
      setWalletError(null);
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    return () => window.ethereum?.removeListener?.("accountsChanged", handleAccountsChanged);
  }, []);

  const startWalletConnect = async () => {
    setWalletError(null);
    setConnecting(true);
    setWalletOpen(true);

    try {
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed. Please install MetaMask and try again.");
      }

      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error("No wallet account was returned.");
      }

      const connectedAddress = accounts[0];
      if (!connectedAddress) throw new Error("No wallet account was returned.");
      if (connectedAddress.toLowerCase() !== ALLOWED_ADDRESS.toLowerCase()) {
        setAccount(null);
        setWalletError("Unauthorized wallet. Please connect the approved ArbitriX wallet.");
        return;
      }

      setAccount(connectedAddress);
      setWalletError(null);
    } catch (error) {
      setAccount(null);
      if (
        error instanceof Error &&
        (error.message.toLowerCase().includes("user rejected") ||
          error.message.toLowerCase().includes("user denied"))
      ) {
        setWalletError("Wallet connection was rejected.");
      } else {
        setWalletError(error instanceof Error ? error.message : "Failed to connect wallet.");
      }
    } finally {
      setConnecting(false);
    }
  };

  const continueToApp = () => {
    if (!account) {
      setWalletError("Please connect your wallet first.");
      return;
    }

    if (account.toLowerCase() !== ALLOWED_ADDRESS.toLowerCase()) {
      setAccount(null);
      setWalletError("This wallet is not authorized.");
      return;
    }

    setWalletOpen(false);
    navigate({ to: "/app" });
  };

  const enableGuestMode = () => {
    setGuestMode(true);
    setWalletOpen(false);
    setWalletError(null);
    setAccount(null);
  };

  const continueAsGuest = () => {
    navigate({ to: "/app" });
  };

  return (
    <>
      <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-surface px-4 py-10">
        <div
          data-aifx="noise-shimmer"
          className="pointer-events-none absolute inset-0 -z-10"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 -z-[5] bg-white/10"
          aria-hidden="true"
        />

        <div className="relative z-10 w-full max-w-[400px]">
          <Panel className="border-white/60 bg-white/90 p-6 shadow-[0_20px_70px_rgba(30,20,50,0.15)] backdrop-blur-xl">
            <div className="flex flex-col items-center text-center">
              <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-foreground text-background shadow-sm">
                <Boxes className="h-5 w-5" />
              </span>
              <h1 className="mt-3 text-xl font-semibold tracking-tight">ArbitriX</h1>
              <p className="mt-1 text-[13px] text-muted-foreground">
                AI Marketplace powered by verifiable infrastructure
              </p>
            </div>

            <div className="mt-6 space-y-2">
              {!guestMode ? (
                <>
                  <Button
                    className="h-9 w-full text-[13px]"
                    onClick={startWalletConnect}
                    disabled={connecting}
                  >
                    {connecting ? (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : (
                      <Wallet className="mr-1.5 h-4 w-4" />
                    )}
                    {connecting ? "Connecting..." : "Connect Wallet"}
                  </Button>
                  <Button
                    variant="outline"
                    className="h-9 w-full bg-white/70 text-[13px]"
                    onClick={enableGuestMode}
                  >
                    Login as Guest
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  className="h-9 w-full bg-white/70 text-[13px]"
                  onClick={continueAsGuest}
                >
                  Connect
                </Button>
              )}
            </div>

            {guestMode ? (
              <div className="mt-5 rounded-[10px] border border-border bg-white/60 p-3 backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Demo recovery phrase
                </p>
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  {demoPhrase.map((word, index) => (
                    <div
                      key={word}
                      className="flex items-center gap-1 rounded border border-border bg-background/80 px-1.5 py-1"
                    >
                      <span className="text-[10px] text-subtle">{index + 1}</span>
                      <span className="font-mono text-[11px]">{word}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[11px] leading-4 text-subtle">
                  Sample words for the demo session only. ArbitriX will never ask for a real wallet
                  recovery phrase.
                </p>
              </div>
            ) : null}

            <div className="mt-6 flex items-start gap-2 border-t border-border pt-4">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
              <p className="text-[11px] leading-4 text-muted-foreground">
                Ownership, subscriptions and payments are recorded on-chain. Model execution and API
                infrastructure stay off-chain.
              </p>
            </div>
          </Panel>

          <p className="mt-4 text-center text-[11px] text-subtle">
            Prototype environment · Ethereum Testnet
          </p>
        </div>

        <Dialog open={walletOpen} onOpenChange={setWalletOpen}>
          <DialogContent className="max-w-[360px]">
            <DialogHeader>
              <DialogTitle className="text-base">Connect a wallet</DialogTitle>
              <DialogDescription className="text-[13px]">
                Connect your MetaMask wallet to continue.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-[10px] border border-border bg-surface p-3">
              <div className="flex items-center gap-2">
                {connecting ? (
                  <Loader2 className="h-4 w-4 animate-spin text-brand" />
                ) : account ? (
                  <span className="h-2 w-2 rounded-full bg-success" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-destructive" />
                )}
                <span className="text-[13px] font-medium">
                  {connecting
                    ? "Requesting connection…"
                    : account
                      ? "Wallet connected"
                      : "Connection failed"}
                </span>
              </div>

              {account ? (
                <div className="mt-2 space-y-1 text-[12px] text-muted-foreground">
                  <p>
                    Account: <span className="break-all font-mono">{account}</span>
                  </p>
                  <p>Network: Ethereum Testnet</p>
                </div>
              ) : null}

              {walletError ? (
                <p className="mt-2 text-[12px] leading-4 text-destructive">{walletError}</p>
              ) : null}
            </div>

            <Button
              className="h-9 w-full text-[13px]"
              disabled={connecting || !account}
              onClick={continueToApp}
            >
              Continue to ArbitriX
            </Button>
          </DialogContent>
        </Dialog>
      </main>

      <EthereumBadge />
    </>
  );
}
