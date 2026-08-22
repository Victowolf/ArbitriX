import { type FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Search, SlidersHorizontal, Sparkles, Star } from "lucide-react";

import { toast } from "sonner";
import { gatewayApi } from "@/lib/arbitix-api";

import { EmptyState, PageHeader, Panel, Pill } from "@/components/ui/arbx";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ModelCard } from "@/components/workspace/ModelCard";

import { compact } from "@/lib/format";

import { useApp } from "@/state/app-context";

import type { AIModel } from "@/types";

/*
 * ==============================================================
 * FILTERS
 * ==============================================================
 */

const pricingOptions = ["Any price", "Under 1 ETH", "1 – 5 ETH", "Over 5 ETH"];

const ratingOptions = ["Any rating", "4.5+", "4.0+"];

const sortOptions = ["Trending", "Most Users", "Highest Rated", "Newest"];

type SubscriptionPlan = "Monthly" | "Yearly";

/*
 * ==============================================================
 * DISCOVER
 * ==============================================================
 */

export function Discover() {
  const {
    marketplaceModels,
    selectedModelId,
    openModel,
    closeModel,
    subscribe,
    subscriptions,
    pushEvent,
  } = useApp();

  const [loading, setLoading] = useState(true);
  const [recommending, setRecommending] = useState(false);
  const [recommendation, setRecommendation] = useState<{
    agentId: string;
    text: string;
  } | null>(null);

  const [query, setQuery] = useState("");

  const [category, setCategory] = useState("All categories");

  const [pricing, setPricing] = useState(pricingOptions[0] ?? "Any price");

  const [rating, setRating] = useState(ratingOptions[0] ?? "Any rating");

  const [technology, setTechnology] = useState("All technologies");

  const [creator, setCreator] = useState("All creators");

  const [sort, setSort] = useState(sortOptions[0] ?? "Trending");

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);

    return () => clearTimeout(timer);
  }, []);

  /*
   * ============================================================
   * DYNAMIC FILTER OPTIONS
   * ============================================================
   *
   * These are calculated from marketplaceModels rather than
   * static models.ts.
   *
   * Therefore a newly deployed "Other" model can immediately
   * participate in the filters.
   */

  const categories = useMemo(
    () => [
      "All categories",
      ...Array.from(new Set(marketplaceModels.map((model) => model.category))),
    ],
    [marketplaceModels],
  );

  const technologies = useMemo(
    () => [
      "All technologies",
      ...Array.from(new Set(marketplaceModels.flatMap((model) => model.tags))),
    ],
    [marketplaceModels],
  );

  const creators = useMemo(
    () => ["All creators", ...Array.from(new Set(marketplaceModels.map((model) => model.creator)))],
    [marketplaceModels],
  );

  /*
   * ============================================================
   * SELECTED MODEL
   * ============================================================
   *
   * IMPORTANT:
   *
   * Never use getModel() from data/models.ts here.
   *
   * getModel() only knows about preloaded static models.
   *
   * getMarketplaceModel() from AppContext is represented by
   * marketplaceModels here, which includes dynamically deployed
   * models.
   */

  const selectedModel = selectedModelId
    ? marketplaceModels.find((model) => model.id === selectedModelId)
    : undefined;

  /*
   * ============================================================
   * FEATURED
   * ============================================================
   */

  const featured = marketplaceModels.find((model) => model.featured) ?? marketplaceModels[0];

  /*
   * ============================================================
   * RESULTS
   * ============================================================
   */

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = marketplaceModels.filter((model) => {
      if (
        q &&
        !`${model.name} ${model.creator} ${model.category} ${model.description} ${model.tags.join(" ")} ${model.useCases.join(" ")} ${model.capabilities.join(" ")}`
          .toLowerCase()
          .includes(q)
      ) {
        return false;
      }

      if (category !== "All categories" && model.category !== category) {
        return false;
      }

      if (technology !== "All technologies" && !model.tags.includes(technology)) {
        return false;
      }

      if (creator !== "All creators" && model.creator !== creator) {
        return false;
      }

      if (pricing === "Under 1 ETH" && model.priceMonthly >= 1) {
        return false;
      }

      if (pricing === "1 – 5 ETH" && (model.priceMonthly < 1 || model.priceMonthly > 5)) {
        return false;
      }

      if (pricing === "Over 5 ETH" && model.priceMonthly <= 5) {
        return false;
      }

      if (rating === "4.5+" && model.rating < 4.5) {
        return false;
      }

      if (rating === "4.0+" && model.rating < 4) {
        return false;
      }

      return true;
    });

    list = [...list].sort((a, b) => {
      if (sort === "Most Users") {
        return b.users - a.users;
      }

      if (sort === "Highest Rated") {
        return b.rating - a.rating;
      }

      if (sort === "Newest") {
        return new Date(b.chain.deployedAt).getTime() - new Date(a.chain.deployedAt).getTime();
      }

      /*
       * Trending
       */
      return b.users * Math.max(b.rating, 1) - a.users * Math.max(a.rating, 1);
    });

    return list;
  }, [marketplaceModels, query, category, pricing, rating, technology, creator, sort]);

  /*
   * ============================================================
   * RESET FILTERS
   * ============================================================
   */

  const resetFilters = () => {
    setQuery("");
    setCategory("All categories");
    setPricing(pricingOptions[0] ?? "Any price");
    setRating(ratingOptions[0] ?? "Any rating");
    setTechnology("All technologies");
    setCreator("All creators");
    setSort(sortOptions[0] ?? "Trending");
    setRecommendation(null);
  };

  const handleRecommendation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const searchQuery = query.trim();
    if (!searchQuery) return;

    setRecommending(true);
    setRecommendation(null);
    try {
      const result = await gatewayApi.recommendAgent(searchQuery);
      setRecommendation(
        result.recommended
          ? {
              agentId: result.recommended.agent_id,
              text: `${result.recommended.agent_name}: ${result.recommended.description}`,
            }
          : { agentId: "", text: "No matching agent found." },
      );
    } catch (error) {
      toast.error("Unable to recommend an agent", {
        description: error instanceof Error ? error.message : "The recommender is unavailable.",
      });
    } finally {
      setRecommending(false);
    }
  };

  /*
   * ============================================================
   * MODEL DETAIL
   * ============================================================
   */

  if (selectedModelId) {
    /*
     * The model may have been withdrawn.
     *
     * In that case don't leave the UI stuck on an invalid model.
     */
    if (!selectedModel) {
      return (
        <EmptyState
          icon={<Search className="h-4 w-4" />}
          title="Model not found"
          description="This model may have been withdrawn from the marketplace."
          action={
            <Button variant="outline" size="sm" className="h-8 text-[12px]" onClick={closeModel}>
              Back to Discover
            </Button>
          }
        />
      );
    }

    return (
      <ModelDetails
        model={selectedModel}
        subscriptions={subscriptions}
        onBack={closeModel}
        onSubscribe={(plan) => {
          const apiKey = `arbx_${selectedModel.id}_${crypto.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(36).slice(2)}`}`;

          const createdAt = Date.now();

          const validUntilDate = new Date();

          if (plan === "Monthly") {
            validUntilDate.setMonth(validUntilDate.getMonth() + 1);
          } else {
            validUntilDate.setFullYear(validUntilDate.getFullYear() + 1);
          }

          const subscription = {
            modelId: selectedModel.id,

            plan,

            apiKey,

            validUntil: validUntilDate.toLocaleDateString("en-US", {
              month: "short",
              day: "2-digit",
              year: "numeric",
            }),

            createdAt,

            txHash: `0x${Math.random().toString(16).slice(2).padEnd(16, "0")}`,
          };

          subscribe(subscription);

          pushEvent({
            type: "Model Subscribed",

            model: selectedModel.name,

            value: `${plan === "Monthly" ? selectedModel.priceMonthly : selectedModel.priceYearly} ETH`,
          });

          toast.success("Model subscribed", {
            description: "Your API key is now available in your subscription.",
          });
        }}
      />
    );
  }

  /*
   * ============================================================
   * DISCOVER LIST
   * ============================================================
   */

  return (
    <div>
      <PageHeader
        title="Discover AI Models"
        subtitle="Find, evaluate and subscribe to AI models."
      />

      {featured ? (
        <Panel className="mb-5 p-4">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <Pill tone="warning">
                <Sparkles className="h-3 w-3" />
                Featured Model
              </Pill>

              <span className="hidden text-[11px] text-subtle sm:inline">Curated by ArbitriX</span>
            </div>

            <Button
              size="sm"
              className="h-8 shrink-0 text-[12px]"
              onClick={() => openModel(featured.id)}
            >
              View Model
            </Button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
            <h2 className="text-base font-semibold">{featured.name}</h2>

            <span className="text-[13px] text-muted-foreground">{featured.category}</span>

            <span className="inline-flex items-center gap-1 text-[13px]">
              <Star className="h-3 w-3 fill-warning text-warning" />

              {featured.rating > 0 ? featured.rating.toFixed(1) : "No ratings"}
            </span>

            <span className="text-[13px] text-muted-foreground">
              {compact(featured.users)} users
            </span>

            <span className="text-[13px] font-medium">
              {featured.priceMonthly.toFixed(4)} ETH / month
            </span>
          </div>
        </Panel>
      ) : null}

      <Panel className="mb-5 p-4">
        <form onSubmit={handleRecommendation} className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setRecommendation(null);
              }}
              placeholder="Search models, creators, categories, use cases…"
              className="h-10 pl-9 text-[13px]"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            variant="outline"
            className="h-10 shrink-0 text-[12px]"
            disabled={!query.trim() || recommending}
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            {recommending ? "Finding…" : "Ask AI"}
          </Button>
        </form>

        {recommendation ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-brand/20 bg-brand-soft px-3 py-2">
            <p className="min-w-0 flex-1 text-[12px] text-brand">{recommendation.text}</p>
            {recommendation.agentId ? (
              <Button
                size="sm"
                className="h-8 shrink-0 text-[12px]"
                onClick={() => openModel(recommendation.agentId)}
              >
                View agent
              </Button>
            ) : null}
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="h-3.5 w-3.5 text-subtle" />

          <FilterSelect value={category} onChange={setCategory} options={categories} />

          <FilterSelect value={pricing} onChange={setPricing} options={pricingOptions} />

          <FilterSelect value={rating} onChange={setRating} options={ratingOptions} />

          <FilterSelect value={technology} onChange={setTechnology} options={technologies} />

          <FilterSelect value={creator} onChange={setCreator} options={creators} />

          <div className="ml-auto flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">Sort</span>

            <FilterSelect value={sort} onChange={setSort} options={sortOptions} />
          </div>
        </div>
      </Panel>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({
            length: 6,
          }).map((_, index) => (
            <Panel key={index} className="space-y-3 p-4">
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded-md" />

                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-2.5 w-16" />
                </div>
              </div>

              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-2/3" />
            </Panel>
          ))}
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          icon={<Search className="h-4 w-4" />}
          title="No models match your filters"
          description="Try a different search term or reset the filters."
          action={
            <Button variant="outline" size="sm" className="h-8 text-[12px]" onClick={resetFilters}>
              Reset filters
            </Button>
          }
        />
      ) : (
        <>
          <p className="mb-3 text-[12px] text-muted-foreground">{results.length} models</p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((model) => (
              <ModelCard key={model.id} model={model} onOpen={openModel} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/*
 * ==============================================================
 * MODEL DETAILS
 * ==============================================================
 */

function ModelDetails({
  model,
  subscriptions,
  onBack,
  onSubscribe,
}: {
  model: AIModel;
  subscriptions: {
    modelId: string;
    plan: SubscriptionPlan;
    apiKey: string;
    validUntil: string;
    createdAt: number;
    txHash: string;
  }[];
  onBack: () => void;
  onSubscribe: (plan: SubscriptionPlan) => void;
}) {
  const existingSubscription = subscriptions.find(
    (subscription) => subscription.modelId === model.id,
  );

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>("Monthly");

  const hasSubscription = Boolean(existingSubscription);

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-4 h-8 px-2 text-[12px]" onClick={onBack}>
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
        Back to Discover
      </Button>

      <Panel className="p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{model.name}</h1>

              {model.verified ? (
                <Pill tone="success">
                  <CheckCircle2 className="h-3 w-3" />
                  Verified
                </Pill>
              ) : (
                <Pill tone="outline">Unverified</Pill>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
              <span>{model.category}</span>

              <span>by {model.creator}</span>

              <span className="inline-flex items-center gap-1">
                <Star className="h-3 w-3 fill-warning text-warning" />

                {model.rating > 0 ? model.rating.toFixed(1) : "No ratings"}
              </span>

              <span>{model.reviews} reviews</span>

              <span>{compact(model.users)} users</span>
            </div>

            <p className="mt-4 max-w-3xl text-[13px] leading-6 text-muted-foreground">
              {model.longDescription || model.description}
            </p>
          </div>

          <div className="w-full shrink-0 lg:w-[260px]">
            <div className="rounded-[10px] border border-border bg-surface p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Subscription
              </p>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={`rounded-md border px-3 py-2 text-left ${
                    selectedPlan === "Monthly" ? "border-brand bg-background" : "border-border"
                  }`}
                  onClick={() => setSelectedPlan("Monthly")}
                >
                  <p className="text-[11px] text-muted-foreground">Monthly</p>

                  <p className="mt-1 text-sm font-semibold">{model.priceMonthly.toFixed(4)} ETH</p>
                </button>

                <button
                  type="button"
                  className={`rounded-md border px-3 py-2 text-left ${
                    selectedPlan === "Yearly" ? "border-brand bg-background" : "border-border"
                  }`}
                  onClick={() => setSelectedPlan("Yearly")}
                >
                  <p className="text-[11px] text-muted-foreground">Annual</p>

                  <p className="mt-1 text-sm font-semibold">{model.priceYearly.toFixed(4)} ETH</p>
                </button>
              </div>

              {hasSubscription ? (
                <div className="mt-3 rounded-md border border-border bg-background p-3">
                  <p className="text-[11px] font-medium text-success">Subscribed</p>

                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Valid until {existingSubscription?.validUntil}
                  </p>

                  <p className="mt-2 font-mono text-[10px] text-muted-foreground">
                    API key available in your subscription.
                  </p>
                </div>
              ) : (
                <Button
                  className="mt-3 h-9 w-full text-[12px]"
                  onClick={() => onSubscribe(selectedPlan)}
                >
                  Subscribe {selectedPlan}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Panel>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel className="p-4">
          <h2 className="text-sm font-semibold">Overview</h2>

          <p className="mt-2 text-[13px] leading-5 text-muted-foreground">{model.description}</p>
        </Panel>

        <Panel className="p-4">
          <h2 className="text-sm font-semibold">Input / Output</h2>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-border p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Input
              </p>

              <p className="mt-1 text-[12px]">{model.input || "Not specified"}</p>
            </div>

            <div className="rounded-md border border-border p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Output
              </p>

              <p className="mt-1 text-[12px]">{model.output || "Not specified"}</p>
            </div>
          </div>
        </Panel>

        <Panel className="p-4">
          <h2 className="text-sm font-semibold">Use Cases</h2>

          {model.useCases.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {model.useCases.map((useCase) => (
                <Pill key={useCase} tone="outline">
                  {useCase}
                </Pill>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-[12px] text-muted-foreground">No use cases provided.</p>
          )}
        </Panel>

        <Panel className="p-4">
          <h2 className="text-sm font-semibold">Capabilities</h2>

          {model.capabilities.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {model.capabilities.map((capability) => (
                <li key={capability} className="flex gap-2 text-[12px] text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                  {capability}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-[12px] text-muted-foreground">No capabilities provided.</p>
          )}
        </Panel>
      </div>

      <Panel className="mt-4 p-4">
        <h2 className="text-sm font-semibold">Performance</h2>

        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric
            label="Latency"
            value={model.performance.latencyMs > 0 ? `${model.performance.latencyMs} ms` : "0"}
          />

          <Metric
            label="Accuracy"
            value={model.performance.accuracy > 0 ? `${model.performance.accuracy}%` : "0"}
          />

          <Metric label="Requests" value={model.performance.requests || "0"} />

          <Metric
            label="Uptime"
            value={model.performance.uptime > 0 ? `${model.performance.uptime}%` : "0"}
          />
        </div>
      </Panel>

      <Panel className="mt-4 p-4">
        <h2 className="text-sm font-semibold">On-chain Information</h2>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <ChainValue label="Model ID" value={model.chain.modelId} />

          <ChainValue label="Creator Wallet" value={model.chain.creatorWallet} />

          <ChainValue label="Model Hash" value={model.chain.modelHash} />

          <ChainValue label="Deployment" value={model.chain.deployedAt} />

          <ChainValue label="Transaction" value={model.chain.txHash} />

          <ChainValue label="Status" value={model.chain.status} />
        </div>
      </Panel>
    </div>
  );
}

/*
 * ==============================================================
 * SMALL COMPONENTS
 * ==============================================================
 */

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-surface p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function ChainValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-surface p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 break-all font-mono text-[11px]">{value || "—"}</p>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 w-auto min-w-0 gap-1 text-[12px]">
        <SelectValue />
      </SelectTrigger>

      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option} className="text-[13px]">
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
