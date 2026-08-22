import { useMemo, useState } from "react";
import { ArrowUpRight, BarChart3, Coins, CreditCard, Sparkles, Users } from "lucide-react";

import { Mono, PageHeader, Panel, Pill, SectionTitle, StatCard } from "@/components/ui/arbx";

import {
  ChartCard,
  GrowthChart,
  RevenueChart,
  SimpleBar,
  SplitPie,
  TokenChart,
} from "@/components/portfolio/Charts";

import { WalletInfo } from "@/components/blockchain/WalletInfo";
import { BlockchainVerification } from "@/components/blockchain/BlockchainVerification";

import {
  planSplit,
  ratingDistribution,
  revenueSeries,
  sentiment,
  tokenUsageSeries,
  userGrowthSeries,
} from "@/data/portfolio";

import { useApp } from "@/state/app-context";
import { cn } from "@/lib/utils";

import type { TimeRange } from "@/types";

const ranges: TimeRange[] = ["7D", "30D", "90D", "1Y"];

export function Portfolio() {
  const {
    openModel,

    /*
     * Live marketplace models.
     *
     * Contains both preloaded models and newly deployed
     * models added through AppContext.
     */
    marketplaceModels,

    /*
     * Live deployed models.
     */
    deployedModels,

    /*
     * Live subscriptions.
     */
    subscriptions,

    /*
     * Live chain events.
     */
    events,
  } = useApp();

  const [range, setRange] = useState<TimeRange>("30D");

  /* ============================================================
     LIVE PORTFOLIO STATS
     ============================================================ */

  /*
   * Only deployed models contribute to the creator's earnings.
   *
   * Revenue is already stored as ETH in your DeployedModel.
   */
  const totalEarnings = useMemo(
    () => deployedModels.reduce((total, model) => total + Number(model.revenue ?? 0), 0),
    [deployedModels],
  );

  /*
   * Number of currently deployed models.
   */
  const activeModels = deployedModels.length;

  /*
   * Total users/subscribers across deployed models.
   *
   * This is useful for the creator portfolio.
   */
  const totalSubscribers = deployedModels.reduce(
    (total, model) => total + Number(model.users ?? 0),
    0,
  );

  /*
   * Use the live chain events count instead of the old hardcoded
   * 1,842 transactions.
   *
   * We still cap this visually at the event history size your
   * AppContext maintains.
   */
  const totalTransactions = events.length;

  /*
   * ============================================================
   * MODEL-WISE ANALYSIS
   * ============================================================
   *
   * Use deployedModels as the source of creator-side analytics.
   *
   * If a deployed model has missing values, display 0.
   */

  const modelAnalysis = useMemo(() => {
    return deployedModels.map((deployed) => {
      const marketplace = marketplaceModels.find((model) => model.id === deployed.id);

      return {
        id: deployed.id,
        name: deployed.name ?? marketplace?.name ?? "Unknown Model",

        revenue: Number(deployed.revenue ?? 0),

        users: Number(deployed.users ?? 0),

        rating: Number(marketplace?.rating ?? 0),

        /*
         * Growth is not yet persisted in the model state.
         * Keep it at 0 instead of showing fake growth.
         */
        growth: 0,
      };
    });
  }, [deployedModels, marketplaceModels]);

  /*
   * ============================================================
   * DYNAMIC MODEL EARNINGS
   * ============================================================
   *
   * This replaces the hardcoded:
   *
   * VisionPro 7820
   * CodeGen   2430
   * TextAI    2232
   */

  const dynamicModelEarnings = useMemo(
    () =>
      modelAnalysis.map((model) => ({
        label: model.name,
        value: model.revenue,
      })),
    [modelAnalysis],
  );

  /*
   * ============================================================
   * TRANSACTION COUNTS
   * ============================================================
   */

  const subscriptionTransactions = events.filter(
    (event) => event.type === "Model Subscribed",
  ).length;

  const paymentTransactions = events.filter((event) => event.type === "Payment Received").length;

  const deploymentTransactions = events.filter((event) => event.type === "Model Deployed").length;

  /*
   * Reviews are represented by Review Submitted events.
   */
  const reviewTransactions = events.filter((event) => event.type === "Review Submitted").length;

  /*
   * ============================================================
   * OPEN MODEL
   * ============================================================
   */

  const handleOpenModel = (modelId: string) => {
    openModel(modelId);
  };

  return (
    <div>
      {/* ======================================================
          HEADER
          ====================================================== */}

      <PageHeader
        title="Portfolio"
        subtitle="Track your AI business performance and on-chain activity."
        action={
          <div className="flex items-center gap-1 rounded-md border border-border bg-surface p-0.5">
            {ranges.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={cn(
                  "rounded px-2 py-1 text-[12px] font-medium transition-colors",
                  range === r
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {r}
              </button>
            ))}
          </div>
        }
      />

      {/* ======================================================
          TOP STATS
          ====================================================== */}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Earnings"
          value={`${totalEarnings.toFixed(4)} ETH`}
          hint="Total creator revenue"
          icon={<Coins className="h-3.5 w-3.5" />}
        />

        <StatCard
          label="Active Models"
          value={String(activeModels)}
          hint="Currently deployed"
          icon={<BarChart3 className="h-3.5 w-3.5" />}
        />

        <StatCard
          label="Subscribers"
          value={totalSubscribers.toLocaleString()}
          hint={`${subscriptions.length} active subscriptions from this wallet`}
          icon={<Users className="h-3.5 w-3.5" />}
        />

        <StatCard
          label="Transactions"
          value={String(totalTransactions)}
          hint="Recorded in current session"
          icon={<CreditCard className="h-3.5 w-3.5" />}
        />
      </div>

      {/* ======================================================
          MODEL-WISE ANALYSIS
          ====================================================== */}

      <div className="mt-8">
        <SectionTitle title="Model-wise analysis" />

        {modelAnalysis.length === 0 ? (
          <Panel className="p-6 text-center">
            <p className="text-sm font-medium">No deployed models yet</p>

            <p className="mt-1 text-[12px] text-muted-foreground">
              Deploy a model to start tracking its revenue and performance.
            </p>
          </Panel>
        ) : (
          <Panel className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-[13px]">
              <thead>
                <tr className="border-b border-border bg-surface text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Model</th>

                  <th className="px-4 py-2 font-medium">Revenue</th>

                  <th className="px-4 py-2 font-medium">Users</th>

                  <th className="px-4 py-2 font-medium">Growth</th>

                  <th className="px-4 py-2 font-medium">Rating</th>
                </tr>
              </thead>

              <tbody>
                {modelAnalysis.map((model) => (
                  <tr
                    key={model.id}
                    className="border-b border-border last:border-0 transition-colors hover:bg-surface"
                  >
                    <td className="px-4 py-2.5">
                      <button
                        type="button"
                        className="font-medium hover:text-brand hover:underline"
                        onClick={() => handleOpenModel(model.id)}
                      >
                        {model.name}
                      </button>
                    </td>

                    <td className="px-4 py-2.5 font-medium">{model.revenue.toFixed(4)} ETH</td>

                    <td className="px-4 py-2.5">{model.users.toLocaleString()}</td>

                    <td className="px-4 py-2.5">
                      {model.growth > 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-success">
                          <ArrowUpRight className="h-3 w-3" />+{model.growth}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0%</span>
                      )}
                    </td>

                    <td className="px-4 py-2.5">
                      {model.rating > 0 ? model.rating.toFixed(1) : "0.0"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        )}
      </div>

      {/* ======================================================
          ANALYTICS
          ====================================================== */}

      <div className="mt-8">
        <SectionTitle title="Analytics" right={<Pill tone="outline">{range}</Pill>} />

        <div className="grid gap-3 lg:grid-cols-2">
          <ChartCard title="Revenue over time">
            <RevenueChart data={revenueSeries(range)} />
          </ChartCard>

          <ChartCard title="User & subscription growth">
            <GrowthChart data={userGrowthSeries(range)} />
          </ChartCard>

          <ChartCard title="Token usage (millions)">
            <TokenChart data={tokenUsageSeries(range)} />
          </ChartCard>

          <ChartCard title="Model-wise earnings">
            {dynamicModelEarnings.length > 0 ? (
              <SimpleBar data={dynamicModelEarnings} />
            ) : (
              <div className="flex h-full min-h-[180px] items-center justify-center text-[12px] text-muted-foreground">
                No model earnings yet
              </div>
            )}
          </ChartCard>

          <ChartCard title="Monthly vs yearly subscriptions">
            <SplitPie data={planSplit} />
          </ChartCard>

          <ChartCard title="Ratings distribution">
            <SimpleBar data={ratingDistribution} color="var(--color-indigo)" />
          </ChartCard>

          <ChartCard title="Platform fees">
            <SimpleBar
              data={revenueSeries(range).map((d) => ({
                label: d.label,
                value: d.fees,
              }))}
              color="var(--color-subtle)"
            />
          </ChartCard>

          <ChartCard title="Review sentiment">
            <SimpleBar data={sentiment} />
          </ChartCard>
        </div>
      </div>

      {/* ======================================================
          ON-CHAIN ACTIVITY
          ====================================================== */}

      <div className="mt-8">
        <SectionTitle title="On-Chain Activity" />

        <div className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Transactions" value={String(totalTransactions)} />

          <StatCard label="Subscriptions" value={String(subscriptionTransactions)} />

          <StatCard label="Payments" value={String(paymentTransactions)} />

          <StatCard label="Deployments" value={String(deploymentTransactions)} />
        </div>

        {events.length === 0 ? (
          <Panel className="p-6 text-center">
            <p className="text-sm font-medium">No activity yet</p>

            <p className="mt-1 text-[12px] text-muted-foreground">
              Your model deployments, subscriptions and payments will appear here.
            </p>
          </Panel>
        ) : (
          <Panel className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-[13px]">
              <thead>
                <tr className="border-b border-border bg-surface text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Type</th>

                  <th className="px-4 py-2 font-medium">Model</th>

                  <th className="px-4 py-2 font-medium">Amount</th>

                  <th className="px-4 py-2 font-medium">Wallet</th>

                  <th className="px-4 py-2 font-medium">Transaction Hash</th>

                  <th className="px-4 py-2 font-medium">Timestamp</th>

                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>

              <tbody>
                {events.map((event) => (
                  <tr
                    key={event.id}
                    className="border-b border-border last:border-0 transition-colors hover:bg-surface"
                  >
                    <td className="px-4 py-2.5">{event.type}</td>

                    <td className="px-4 py-2.5 font-medium">{event.model}</td>

                    <td className="px-4 py-2.5">{event.value ?? "—"}</td>

                    <td className="px-4 py-2.5">
                      <Mono className="text-muted-foreground">{event.wallet}</Mono>
                    </td>

                    <td className="px-4 py-2.5">
                      {event.txHash ? <Mono className="text-brand">{event.txHash}</Mono> : "—"}
                    </td>

                    <td className="px-4 py-2.5 text-muted-foreground">
                      {new Date(event.at).toLocaleString()}
                    </td>

                    <td className="px-4 py-2.5">
                      <Pill tone="success">Confirmed</Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        )}
      </div>

      {/* ======================================================
          INSIGHTS
          ====================================================== */}

      <div className="mt-8 grid gap-3 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-3">
          <Panel className="p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand" />

              <h3 className="text-sm font-semibold">AI Portfolio Insights</h3>
            </div>

            <div className="mt-3 space-y-3">
              <Insight
                label="Revenue"
                text={
                  deployedModels.length > 0
                    ? `${deployedModels.length} deployed model${
                        deployedModels.length === 1 ? "" : "s"
                      } currently generate ${totalEarnings.toFixed(4)} ETH in recorded revenue.`
                    : "Deploy your first model to start generating portfolio revenue."
                }
              />

              <Insight
                label="Subscribers"
                text={
                  totalSubscribers > 0
                    ? `Your deployed models currently have ${totalSubscribers.toLocaleString()} recorded users.`
                    : "Your models do not have any recorded subscribers yet."
                }
              />

              <Insight
                label="Activity"
                text={
                  totalTransactions > 0
                    ? `${totalTransactions} blockchain-style events have been recorded in the current session.`
                    : "No portfolio activity has been recorded yet."
                }
              />
            </div>
          </Panel>

          <Panel className="p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo" />

              <h3 className="text-sm font-semibold">Review Summary</h3>
            </div>

            <p className="mt-2 text-[13px] leading-5 text-muted-foreground">
              Review analytics are currently based on the marketplace demo dataset. Newly deployed
              models start with zero reviews until subscribers submit them.
            </p>

            <div className="mt-4 space-y-2">
              {sentiment.map((s) => (
                <div key={s.label}>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-muted-foreground">{s.label}</span>

                    <span className="font-medium">{s.value}%</span>
                  </div>

                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        s.label === "Positive"
                          ? "bg-success w-[78%]"
                          : s.label === "Neutral"
                            ? "bg-subtle w-[15%]"
                            : "bg-destructive w-[7%]",
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* ====================================================
            WALLET / BLOCKCHAIN
            ==================================================== */}

        <div className="space-y-3">
          <WalletInfo />

          <BlockchainVerification
            checks={[
              "Model Ownership",
              "Deployment History",
              "Subscription",
              "Payment",
              "Review",
              "Withdrawal",
            ]}
            compactLayout
          />
        </div>
      </div>
    </div>
  );
}

function Insight({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-[10px] border border-border bg-surface p-3">
      <Pill tone="brand">{label}</Pill>

      <p className="mt-2 text-[13px] leading-5 text-muted-foreground">{text}</p>
    </div>
  );
}
