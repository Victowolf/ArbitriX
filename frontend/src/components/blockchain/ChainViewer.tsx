import { Activity, ExternalLink, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "@/state/app-context";
import { Mono } from "@/components/ui/arbx";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const dotColor: Record<string, string> = {
  "Model Deployed": "bg-brand",
  "Model Subscribed": "bg-indigo-500",
  "Payment Received": "bg-emerald-500",
  "Model Withdrawn": "bg-rose-500",
  "Review Submitted": "bg-amber-500",
  "API Key Generated": "bg-slate-400",
  "Transaction Completed": "bg-emerald-500",
};

export function ChainViewer({ className }: { className?: string }) {
  const { events } = useApp();
  const [, setTick] = useState(0);
  const [filter, setFilter] = useState<string>("All");

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(id);
  }, []);

  const categories = ["All", "Models", "Payments", "Events"];

  const filteredEvents = events.filter((e) => {
    if (filter === "All") return true;
    if (filter === "Models") return e.type.toLowerCase().includes("model");
    if (filter === "Payments")
      return (
        e.type.toLowerCase().includes("payment") || e.type.toLowerCase().includes("transaction")
      );
    return true;
  });

  return (
    <aside
      className={cn("flex h-full flex-col bg-background font-sans text-foreground", className)}
    >
      {/* Header */}
      <div className="border-b border-border/60 px-4 pt-3.5 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
            <Activity className="h-4 w-4 text-brand" />
            <span>Live Chain Activity</span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            LIVE
          </span>
        </div>

        {/* Filter Pills */}
        <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors",
                filter === cat
                  ? "bg-foreground text-background"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Card List Area */}
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <div className="flex flex-col gap-2">
          {filteredEvents.map((e) => (
            <div
              key={e.id}
              className="group relative rounded-xl border border-border/70 bg-card p-3 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all hover:border-border hover:shadow-sm"
            >
              {/* Top Row: Event Icon/Dot, Model Name, Value */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={cn("h-2 w-2 shrink-0 rounded-full", dotColor[e.type] || "bg-brand")}
                  />
                  <span className="truncate text-[12.5px] font-medium text-foreground group-hover:text-brand transition-colors">
                    {e.model || e.type}
                  </span>
                </div>
                {e.value ? (
                  <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-brand/10 px-1.5 py-0.5 text-[10.5px] font-semibold text-brand">
                    <Zap className="h-2.5 w-2.5" />
                    {e.value}
                  </span>
                ) : null}
              </div>

              {/* Sub-info Row: Event Type, Hash, and Relative Time */}
              <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-muted-foreground">
                <span className="font-medium text-foreground/80">{e.type}</span>
                <span>•</span>
                {e.txHash ? (
                  <>
                    <Mono className="text-[10px] text-muted-foreground">{e.txHash}</Mono>
                    <span>•</span>
                  </>
                ) : null}
                <span className="text-[10.5px]">{relativeTime(e.at)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Footer Banner */}
      <div className="border-t border-border/60 p-3">
        <a
          href="#"
          className="flex items-center justify-between rounded-xl bg-gradient-to-r from-brand/10 via-brand/5 to-transparent p-2.5 transition-colors hover:from-brand/15 hover:via-brand/10"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand text-primary-foreground shadow-xs">
              <Activity className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-[11.5px] font-semibold text-foreground">Explorer</p>
              <p className="text-[10px] text-muted-foreground">Inspect on-chain state</p>
            </div>
          </div>
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
        </a>
      </div>
    </aside>
  );
}
