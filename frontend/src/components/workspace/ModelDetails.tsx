import { useState } from "react";
import { ArrowLeft, ShieldCheck, Star } from "lucide-react";

import { Panel, Pill, SectionTitle } from "@/components/ui/arbx";

import { Button } from "@/components/ui/button";

import {
  BlockchainVerification,
  ChainMetadata,
} from "@/components/blockchain/BlockchainVerification";

import { SubscriptionModal } from "@/components/workspace/SubscriptionModal";
import { ApiAccess } from "@/components/workspace/ApiAccess";
import { AgentPlayground } from "@/components/workspace/AgentPlayground";
import { Reviews } from "@/components/workspace/Reviews";

import { compact } from "@/lib/format";
import { useApp } from "@/state/app-context";
import { cn } from "@/lib/utils";

export function ModelDetails({ modelId }: { modelId: string }) {
  const { closeModel, subscriptions, getMarketplaceModel } = useApp();

  /*
   * IMPORTANT:
   *
   * Do NOT use getModel() from data/models.ts here.
   *
   * getModel() only searches the original static models array.
   *
   * getMarketplaceModel() searches the AppContext marketplace
   * state, which contains:
   *
   * 1. Preloaded models
   * 2. Newly deployed models
   * 3. Models updated through Manage
   */
  const model = getMarketplaceModel(modelId);

  const [plan, setPlan] = useState<"Monthly" | "Yearly">("Monthly");

  const [modalOpen, setModalOpen] = useState(false);

  /*
   * Model may have been withdrawn.
   */
  if (!model) {
    return (
      <div>
        <button
          type="button"
          onClick={closeModel}
          className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Discover
        </button>

        <Panel className="p-6">
          <h2 className="text-sm font-semibold">Model not found</h2>

          <p className="mt-1 text-[13px] text-muted-foreground">
            This model may have been withdrawn from the marketplace.
          </p>
        </Panel>
      </div>
    );
  }

  /*
   * Because this model comes from AppContext, this subscription
   * lookup remains tied to the current model ID.
   */
  const subscription = subscriptions.find((item) => item.modelId === model.id);

  return (
    <div>
      {/* ======================================================
          BACK
          ====================================================== */}

      <button
        type="button"
        onClick={closeModel}
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Discover
      </button>

      {/* ======================================================
          MODEL HEADER
          ====================================================== */}

      <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-surface text-sm font-semibold text-brand ring-1 ring-border">
          {model.name.slice(0, 2).toUpperCase()}
        </span>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{model.name}</h1>

            {model.verified ? (
              <Pill tone="success">
                <ShieldCheck className="h-3 w-3" />
                Verified
              </Pill>
            ) : null}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
            <span>{model.category}</span>

            <span className="inline-flex items-center gap-1 text-foreground">
              <Star className="h-3 w-3 fill-warning text-warning" />

              {model.rating > 0 ? model.rating.toFixed(1) : "No ratings"}
            </span>

            <span>{compact(model.users)} users</span>

            <span>Creator: {model.creator}</span>
          </div>
        </div>
      </div>

      {/* ======================================================
          MAIN LAYOUT
          ====================================================== */}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        {/* ====================================================
            LEFT
            ==================================================== */}

        <div className="min-w-0 space-y-5">
          {/* Overview */}

          <Panel className="p-4">
            <h2 className="text-sm font-semibold">Overview</h2>

            <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
              {model.longDescription || model.description}
            </p>
          </Panel>

          {/* Use Cases / Capabilities */}

          <div className="grid gap-3 sm:grid-cols-2">
            <Panel className="p-4">
              <h2 className="text-sm font-semibold">Use Cases</h2>

              {model.useCases.length > 0 ? (
                <ul className="mt-2 space-y-1.5">
                  {model.useCases.map((useCase) => (
                    <li key={useCase} className="flex gap-2 text-[13px] text-muted-foreground">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand" />

                      {useCase}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-[13px] text-muted-foreground">No use cases provided.</p>
              )}
            </Panel>

            <Panel className="p-4">
              <h2 className="text-sm font-semibold">Capabilities</h2>

              {model.capabilities.length > 0 ? (
                <ul className="mt-2 space-y-1.5">
                  {model.capabilities.map((capability) => (
                    <li key={capability} className="flex gap-2 text-[13px] text-muted-foreground">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-indigo" />

                      {capability}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-[13px] text-muted-foreground">No capabilities provided.</p>
              )}
            </Panel>
          </div>

          {/* Input / Output */}

          <div>
            <SectionTitle title="Input / Output" />

            <div className="grid gap-3 sm:grid-cols-2">
              <Panel className="p-4">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Input</p>

                <p className="mt-1 font-mono text-[13px]">{model.input || "Not specified"}</p>
              </Panel>

              <Panel className="p-4">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Output</p>

                <p className="mt-1 font-mono text-[13px]">{model.output || "Not specified"}</p>
              </Panel>
            </div>
          </div>

          {/* Performance */}

          <div>
            <SectionTitle title="Performance" />

            <Panel className="grid grid-cols-2 divide-border sm:grid-cols-4 sm:divide-x">
              <Metric label="Latency" value={`${model.performance.latencyMs} ms`} />

              <Metric label="Accuracy" value={`${model.performance.accuracy}%`} />

              <Metric label="Requests" value={model.performance.requests || "0"} />

              <Metric label="Tokens" value={model.performance.tokens || "0"} />
            </Panel>
          </div>

          {/* API access */}

          {subscription ? <ApiAccess model={model} subscription={subscription} /> : null}

          {model.pricePerCall !== undefined ? (
            <AgentPlayground model={model} hasApiKey={Boolean(subscription)} />
          ) : null}

          {/* Reviews */}

          <Reviews modelName={model.name} average={model.rating} total={model.reviews} />
        </div>

        {/* ====================================================
            RIGHT SIDEBAR
            ==================================================== */}

        <div className="space-y-4 lg:sticky lg:top-[76px] lg:self-start">
          {/* ==================================================
              PRICING
              ================================================== */}

          <Panel className="p-4">
            <h2 className="text-sm font-semibold">Pricing</h2>

            <div className="mt-3 flex items-center gap-1 rounded-md border border-border bg-surface p-0.5">
              {(["Monthly", "Yearly"] as const).map((pricingPlan) => (
                <button
                  key={pricingPlan}
                  type="button"
                  onClick={() => setPlan(pricingPlan)}
                  className={cn(
                    "flex-1 rounded px-2 py-1 text-[12px] font-medium transition-colors",

                    plan === pricingPlan
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {pricingPlan}
                </button>
              ))}
            </div>

            {/* ==================================================
                UPDATED ETH PRICE
                ================================================== */}

            <div className="mt-3 flex flex-wrap items-baseline gap-2">
              <span className="text-xl font-semibold">
                {model.pricePerCall !== undefined
                  ? model.pricePerCall.toFixed(4)
                  : (plan === "Monthly" ? model.priceMonthly : model.priceYearly).toFixed(4)}{" "}
                {model.pricePerCall !== undefined ? "tokens" : "ETH"}
              </span>

              <span className="text-[12px] text-muted-foreground">
                /{" "}
                {model.pricePerCall !== undefined ? "call" : plan === "Monthly" ? "month" : "year"}
              </span>

              {model.pricePerCall === undefined && plan === "Yearly" ? (
                <Pill tone="success">Save 17%</Pill>
              ) : null}
            </div>

            <Button
              className="mt-4 h-9 w-full text-[13px]"
              onClick={() => setModalOpen(true)}
              disabled={Boolean(subscription)}
            >
              {subscription
                ? "Subscribed"
                : model.pricePerCall !== undefined
                  ? "Get API Key"
                  : "Subscribe"}
            </Button>

            <p className="mt-2 text-[11px] text-subtle">
              Payment settles on-chain. Inference runs on ArbitriX off-chain infrastructure.
            </p>
          </Panel>

          {/* ==================================================
              BLOCKCHAIN METADATA
              ================================================== */}

          <ChainMetadata chain={model.chain} />

          {/* ==================================================
              BLOCKCHAIN VERIFICATION
              ================================================== */}

          <BlockchainVerification />
        </div>
      </div>

      {/* ======================================================
          SUBSCRIPTION MODAL
          ====================================================== */}

      <SubscriptionModal model={model} plan={plan} open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}

/* ==============================================================
   METRIC
   ============================================================== */

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>

      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
