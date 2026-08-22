import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { AIModel, ChainEvent, ChainEventType, DeployedModel } from "@/types";

import { deployedModels as initialDeployedModels, models } from "@/data/models";

import { randomHash, randomWallet } from "@/lib/format";
import { gatewayApi, type GatewayAgent } from "@/lib/arbitix-api";

export type TopTab = "workspace" | "enterprise" | "portfolio";

export type WorkspaceTab = "deployments" | "discover" | "performance";

export interface Subscription {
  modelId: string;
  plan: "Monthly" | "Yearly";
  apiKey: string;
  validUntil: string;
  createdAt: number;
  txHash: string;
}

interface AppState {
  wallet: string;
  network: string;

  plan: "GO" | "PLUS" | "PRO";
  setPlan: (p: "GO" | "PLUS" | "PRO") => void;

  topTab: TopTab;
  setTopTab: (t: TopTab) => void;

  workspaceTab: WorkspaceTab;
  setWorkspaceTab: (t: WorkspaceTab) => void;

  selectedModelId: string | null;

  openModel: (id: string) => void;

  closeModel: () => void;

  /*
   * ============================================================
   * MARKETPLACE
   * ============================================================
   */

  marketplaceModels: AIModel[];

  addMarketplaceModel: (model: AIModel) => void;

  updateMarketplaceModel: (model: AIModel) => void;

  removeMarketplaceModel: (modelId: string) => void;

  getMarketplaceModel: (modelId: string) => AIModel | undefined;

  /*
   * ============================================================
   * DEPLOYMENTS
   * ============================================================
   */

  deployedModels: DeployedModel[];

  addDeployedModel: (model: DeployedModel) => void;

  updateDeployedModel: (model: DeployedModel) => void;

  removeDeployedModel: (modelId: string) => void;

  /*
   * ============================================================
   * EVENTS
   * ============================================================
   */

  events: ChainEvent[];

  pushEvent: (e: Omit<ChainEvent, "id" | "at">) => void;

  /*
   * ============================================================
   * SUBSCRIPTIONS
   * ============================================================
   */

  subscriptions: Subscription[];

  subscribe: (s: Subscription) => void;

  updateApiKey: (modelId: string, key: string) => void;

  /*
   * ============================================================
   * CHAIN DRAWER
   * ============================================================
   */

  chainDrawerOpen: boolean;

  setChainDrawerOpen: (v: boolean) => void;
}

const AppContext = createContext<AppState | null>(null);

function toMarketplaceModel(agent: GatewayAgent): AIModel {
  return {
    id: agent.agent_id,
    name: agent.agent_name,
    category: agent.sector as AIModel["category"],
    description: agent.description,
    longDescription: agent.description,
    creator: agent.owner,
    rating: 0,
    reviews: 0,
    users: 0,
    priceMonthly: 0,
    priceYearly: 0,
    pricePerCall: agent.price_per_call,
    proxyUrl: agent.proxy_url,
    tags: ["API", agent.sector],
    verified: false,
    useCases: [],
    capabilities: [],
    input: JSON.stringify(agent.input_example, null, 2),
    output: JSON.stringify(agent.output_example, null, 2),
    performance: { latencyMs: 0, accuracy: 0, requests: "0", tokens: "0", uptime: 0 },
    chain: {
      modelId: `ARB-${agent.agent_id}`,
      creatorWallet: "0x71A8…A82F",
      modelHash: "Gateway",
      deployedAt: agent.created_at,
      txHash: "Gateway",
      status: "Pending",
    },
  };
}

/*
 * ==============================================================
 * DEMO CHAIN EVENTS
 * ==============================================================
 */

const seedTypes: ChainEventType[] = [
  "Model Subscribed",
  "Review Submitted",
  "Model Deployed",
  "Payment Received",
  "API Key Generated",
  "Transaction Completed",
];

const valueFor = (type: ChainEventType) => {
  if (type === "Model Subscribed" || type === "Payment Received") {
    return `${(Math.random() * 0.14 + 0.01).toFixed(2)} ETH`;
  }

  if (type === "Review Submitted") {
    return `Rating: ${Math.random() > 0.4 ? 5 : 4}★`;
  }

  return undefined;
};

const makeEvent = (offsetSeconds: number): ChainEvent => {
  const type = seedTypes[Math.floor(Math.random() * seedTypes.length)] ?? "Model Subscribed";

  const value = valueFor(type);
  const txHash = Math.random() > 0.35 ? randomHash() : undefined;

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    model: models[Math.floor(Math.random() * models.length)]?.name ?? "Unknown Model",
    ...(value === undefined ? {} : { value }),
    wallet: randomWallet(),
    ...(txHash === undefined ? {} : { txHash }),
    at: Date.now() - offsetSeconds * 1000,
  };
};

/*
 * ==============================================================
 * PROVIDER
 * ==============================================================
 */

export function AppProvider({ children }: { children: ReactNode }) {
  const [topTab, setTopTab] = useState<TopTab>("workspace");

  const [workspaceTab, setWorkspaceTabState] = useState<WorkspaceTab>("deployments");

  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  const [plan, setPlan] = useState<"GO" | "PLUS" | "PRO">("GO");

  const [chainDrawerOpen, setChainDrawerOpen] = useState(false);

  /*
   * ============================================================
   * MARKETPLACE MODELS
   * ============================================================
   *
   * IMPORTANT:
   *
   * This state starts with the preloaded models from models.ts.
   *
   * Newly deployed models are added to this SAME array.
   *
   * Therefore Discover never needs to combine two separate
   * sources of models.
   */

  const [marketplaceModels, setMarketplaceModels] = useState<AIModel[]>(models);

  useEffect(() => {
    gatewayApi
      .listAgents()
      .then((agents) => {
        setMarketplaceModels((current) => [
          ...agents.map(toMarketplaceModel),
          ...current.filter((model) => !agents.some((agent) => agent.agent_id === model.id)),
        ]);
      })
      .catch(() => undefined);
  }, []);

  const addMarketplaceModel = useCallback((model: AIModel) => {
    setMarketplaceModels((previous) => [
      model,
      ...previous.filter((existing) => existing.id !== model.id),
    ]);
  }, []);

  const updateMarketplaceModel = useCallback((model: AIModel) => {
    setMarketplaceModels((previous) =>
      previous.map((existing) => (existing.id === model.id ? model : existing)),
    );
  }, []);

  const removeMarketplaceModel = useCallback((modelId: string) => {
    setMarketplaceModels((previous) => previous.filter((model) => model.id !== modelId));
  }, []);

  const getMarketplaceModel = useCallback(
    (modelId: string) => marketplaceModels.find((model) => model.id === modelId),
    [marketplaceModels],
  );

  /*
   * ============================================================
   * DEPLOYED MODELS
   * ============================================================
   */

  const [deployedModels, setDeployedModels] = useState<DeployedModel[]>(initialDeployedModels);

  const addDeployedModel = useCallback((model: DeployedModel) => {
    setDeployedModels((previous) => [
      model,
      ...previous.filter((existing) => existing.id !== model.id),
    ]);
  }, []);

  const updateDeployedModel = useCallback((model: DeployedModel) => {
    setDeployedModels((previous) =>
      previous.map((existing) => (existing.id === model.id ? model : existing)),
    );
  }, []);

  const removeDeployedModel = useCallback((modelId: string) => {
    setDeployedModels((previous) => previous.filter((model) => model.id !== modelId));
  }, []);

  /*
   * ============================================================
   * EVENTS
   * ============================================================
   */

  const [events, setEvents] = useState<ChainEvent[]>(() =>
    [2, 18, 120, 340, 700, 1400, 2600].map((seconds) => makeEvent(seconds)),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setEvents((previous) => [makeEvent(0), ...previous].slice(0, 40));
    }, 6500);

    return () => clearInterval(interval);
  }, []);

  const pushEvent = useCallback((event: Omit<ChainEvent, "id" | "at">) => {
    setEvents((previous) =>
      [
        {
          ...event,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          at: Date.now(),
        },
        ...previous,
      ].slice(0, 40),
    );
  }, []);

  /*
   * ============================================================
   * NAVIGATION
   * ============================================================
   */

  const setWorkspaceTab = useCallback((tab: WorkspaceTab) => {
    /*
     * Normal tab switching clears the currently opened
     * model.
     */
    setSelectedModelId(null);

    setWorkspaceTabState(tab);
  }, []);

  /*
   * View button uses this function.
   *
   * IMPORTANT:
   * We intentionally do NOT call setWorkspaceTab() here,
   * because that function clears selectedModelId.
   */

  const openModel = useCallback((id: string) => {
    setTopTab("workspace");

    setWorkspaceTabState("discover");

    setSelectedModelId(id);
  }, []);

  const closeModel = useCallback(() => {
    setSelectedModelId(null);
  }, []);

  /*
   * ============================================================
   * CONTEXT VALUE
   * ============================================================
   */

  const value = useMemo<AppState>(
    () => ({
      wallet: "0x71A8…A82F",

      network: "Ethereum Testnet",

      plan,
      setPlan,

      topTab,
      setTopTab,

      workspaceTab,
      setWorkspaceTab,

      selectedModelId,

      openModel,

      closeModel,

      marketplaceModels,

      addMarketplaceModel,

      updateMarketplaceModel,

      removeMarketplaceModel,

      getMarketplaceModel,

      deployedModels,

      addDeployedModel,

      updateDeployedModel,

      removeDeployedModel,

      events,

      pushEvent,

      subscriptions,

      subscribe: (subscription) => {
        setSubscriptions((previous) => [
          ...previous.filter((existing) => existing.modelId !== subscription.modelId),
          subscription,
        ]);
      },

      updateApiKey: (modelId, key) => {
        setSubscriptions((previous) =>
          previous.map((subscription) =>
            subscription.modelId === modelId
              ? {
                  ...subscription,
                  apiKey: key,
                }
              : subscription,
          ),
        );
      },

      chainDrawerOpen,

      setChainDrawerOpen,
    }),

    [
      plan,
      topTab,
      workspaceTab,
      setWorkspaceTab,

      selectedModelId,

      openModel,
      closeModel,

      marketplaceModels,
      addMarketplaceModel,
      updateMarketplaceModel,
      removeMarketplaceModel,
      getMarketplaceModel,

      deployedModels,
      addDeployedModel,
      updateDeployedModel,
      removeDeployedModel,

      events,
      pushEvent,

      subscriptions,

      chainDrawerOpen,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/*
 * ==============================================================
 * HOOK
 * ==============================================================
 */

export function useApp() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useApp must be used inside AppProvider");
  }

  return context;
}
