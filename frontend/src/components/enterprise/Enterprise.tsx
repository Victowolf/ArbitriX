import { Check } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel, Pill, SectionTitle } from "@/components/ui/arbx";
import { Button } from "@/components/ui/button";
import { useApp } from "@/state/app-context";
import { cn } from "@/lib/utils";

const plans = [
  {
    id: "GO" as const,
    label: "For getting started",
    price: "$0",
    period: "/ month",
    features: [
      "Limited models deployed",
      "Higher platform fee",
      "Basic analytics",
      "Basic support",
    ],
  },
  {
    id: "PLUS" as const,
    label: "For growing creators",
    price: "$49",
    period: "/ month",
    features: [
      "Higher deployment capacity",
      "Medium platform fee",
      "Advanced analytics",
      "Priority support",
    ],
  },
  {
    id: "PRO" as const,
    label: "For serious AI businesses",
    price: "$199",
    period: "/ month",
    features: [
      "Unlimited deployments",
      "Lowest platform fee",
      "AI-powered analytics",
      "Premium support",
    ],
  },
];

const comparison: [string, string, string, string][] = [
  ["Models Deployed", "Up to 3", "Up to 25", "Unlimited"],
  ["Platform Fee", "8%", "5%", "2.5%"],
  ["Analytics", "Basic", "Advanced", "AI-powered"],
  ["Support", "Community", "Priority", "Premium (24/7)"],
  ["On-chain records", "Included", "Included", "Included"],
  ["API rate limit", "60 req/min", "600 req/min", "Custom"],
];

export function Enterprise() {
  const { plan: currentPlan, setPlan } = useApp();

  return (
    <div>
      <PageHeader
        title="Choose your ArbitriX plan"
        subtitle="Scale your AI model business with higher deployment capacity and lower platform fees."
      />

      <div className="grid gap-3 md:grid-cols-3">
        {plans.map((p) => {
          const isCurrent = p.id === currentPlan;
          const emphasised = p.id === "PRO";
          return (
            <Panel
              key={p.id}
              hoverable
              className={cn("flex flex-col p-5", emphasised && "border-brand/30 bg-brand-soft/30")}
            >
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold tracking-tight">{p.id}</h2>
                {emphasised ? <Pill tone="brand">Recommended</Pill> : null}
              </div>
              <p className="mt-0.5 text-[12px] text-muted-foreground">{p.label}</p>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl font-semibold tracking-tight">{p.price}</span>
                <span className="text-[12px] text-muted-foreground">{p.period}</span>
              </div>
              <ul className="mt-4 flex-1 space-y-1.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[13px]">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant={isCurrent ? "outline" : emphasised ? "default" : "outline"}
                size="sm"
                disabled={isCurrent}
                className="mt-5 h-8 text-[12px]"
                onClick={() => {
                  setPlan(p.id);
                  toast.success(`Upgraded to ${p.id}`, {
                    description: "Plan change recorded on-chain.",
                  });
                }}
              >
                {isCurrent ? "Current Plan" : "Upgrade"}
              </Button>
            </Panel>
          );
        })}
      </div>

      <div className="mt-8">
        <SectionTitle title="Compare plans" />
        <Panel className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-[13px]">
            <thead>
              <tr className="border-b border-border bg-surface text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2 font-medium">Feature</th>
                <th className="px-4 py-2 font-medium">Go</th>
                <th className="px-4 py-2 font-medium">Plus</th>
                <th className="px-4 py-2 font-medium">Pro</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row) => (
                <tr
                  key={row[0]}
                  className="border-b border-border last:border-0 transition-colors hover:bg-surface"
                >
                  <td className="px-4 py-2.5 font-medium">{row[0]}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{row[1]}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{row[2]}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}
