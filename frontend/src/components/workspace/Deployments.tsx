import { useState, type ChangeEvent } from "react";

import {
  Bot,
  Box,
  ChevronDown,
  Cloud,
  ExternalLink,
  Github,
  Loader2,
  UploadCloud,
} from "lucide-react";

import { toast } from "sonner";

import { EmptyState, PageHeader, Panel, Pill, SectionTitle } from "@/components/ui/arbx";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AddAgentForm, type AddAgentValues } from "@/components/workspace/AddAgentForm";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { pad2 } from "@/lib/format";
import { useApp } from "@/state/app-context";

import type { AIModel, DeployedModel } from "@/types";
import { gatewayApi } from "@/lib/arbitix-api";

const GITHUB_CLIENT_ID = import.meta.env["VITE_GITHUB_CLIENT_ID"];

const GITHUB_DEVICE_CODE_URL = "https://github.com/login/device/code";

const GITHUB_ACCESS_TOKEN_URL = "https://github.com/login/oauth/access_token";

const GITHUB_API_URL = "https://api.github.com";

const methods = [
  {
    id: "add-agent",
    icon: Bot,
    title: "Add Agent",
    description: "Register a hosted agent, define its JSON contract, and publish it to Discover.",
    cta: "Add Agent",
  },
  {
    id: "docker",
    icon: Cloud,
    title: "Upload Docker",
    description: "Upload your model package as a ZIP file and deploy it on ArbitriX.",
    cta: "Upload Docker",
  },
  {
    id: "github",
    icon: Github,
    title: "Connect GitHub",
    description: "Connect a GitHub repository and deploy your model directly from it.",
    cta: "Connect GitHub",
  },
] as const;

type MethodId = (typeof methods)[number]["id"];

type GitHubRepository = {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description: string | null;
  html_url: string;
  default_branch: string;
  owner: {
    login: string;
  };
};

type GitHubDeviceResponse = {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete?: string;
  expires_in: number;
  interval: number;
};

type GitHubTokenResponse = {
  access_token?: string;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
  interval?: number;
};

type ModelMetadata = {
  name: string;
  overview: string;
  useCases: string;
  capabilities: string;
  input: string;
  output: string;
  monthlyPrice: string;
  annualPrice: string;
};

const emptyMetadata: ModelMetadata = {
  name: "",
  overview: "",
  useCases: "",
  capabilities: "",
  input: "",
  output: "",
  monthlyPrice: "",
  annualPrice: "",
};

export function Deployments() {
  const {
    openModel,
    pushEvent,

    deployedModels,
    addDeployedModel,
    updateDeployedModel,
    removeDeployedModel,

    marketplaceModels,
    addMarketplaceModel,
    updateMarketplaceModel,
    removeMarketplaceModel,
  } = useApp();

  const [method, setMethod] = useState<MethodId | null>(null);

  const [agentFormOpen, setAgentFormOpen] = useState(false);

  const [deploying, setDeploying] = useState(false);

  const [metadata, setMetadata] = useState<ModelMetadata>(emptyMetadata);

  const [dockerFile, setDockerFile] = useState<File | null>(null);

  /*
   * GitHub
   */

  const [githubAccessToken, setGithubAccessToken] = useState<string | null>(null);

  const [githubUser, setGithubUser] = useState<{
    login: string;
    avatar_url: string;
  } | null>(null);

  const [githubLoading, setGithubLoading] = useState(false);

  const [githubDevice, setGithubDevice] = useState<GitHubDeviceResponse | null>(null);

  const [githubRepos, setGithubRepos] = useState<GitHubRepository[]>([]);

  const [selectedRepo, setSelectedRepo] = useState<GitHubRepository | null>(null);

  const [repoDropdownOpen, setRepoDropdownOpen] = useState(false);

  /*
   * Manage
   */

  const [editingModel, setEditingModel] = useState<DeployedModel | null>(null);

  /*
   * ============================================================
   * METADATA
   * ============================================================
   */

  const updateMetadata = (field: keyof ModelMetadata, value: string) => {
    setMetadata((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const resetDeploymentState = () => {
    setMethod(null);
    setDeploying(false);
    setMetadata({
      ...emptyMetadata,
    });
    setDockerFile(null);
    setSelectedRepo(null);
    setRepoDropdownOpen(false);
    setGithubDevice(null);
  };

  const openDeploymentMethod = (id: MethodId) => {
    if (id === "add-agent") {
      setAgentFormOpen(true);
      return;
    }

    setMetadata({
      ...emptyMetadata,
    });

    setDockerFile(null);
    setSelectedRepo(null);
    setRepoDropdownOpen(false);

    setMethod(id);
  };

  /*
   * ============================================================
   * DOCKER
   * ============================================================
   */

  const handleDockerFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".zip")) {
      toast.error("Invalid file", {
        description: "Please upload a ZIP file.",
      });

      event.target.value = "";
      return;
    }

    setDockerFile(file);

    const name = file.name.replace(/\.zip$/i, "");

    setMetadata((previous) => ({
      ...previous,
      name: previous.name || name || "NewModel-v1",
    }));
  };

  /*
   * ============================================================
   * GITHUB AUTH
   * ============================================================
   */

  const startGitHubAuth = async () => {
    if (!GITHUB_CLIENT_ID) {
      toast.error("GitHub Client ID missing", {
        description: "Set VITE_GITHUB_CLIENT_ID in your .env file.",
      });

      return;
    }

    setGithubLoading(true);
    setGithubDevice(null);

    try {
      const response = await fetch(GITHUB_DEVICE_CODE_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: GITHUB_CLIENT_ID,
          scope: "repo",
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to start GitHub authorization.");
      }

      const device = (await response.json()) as GitHubDeviceResponse;

      setGithubDevice(device);

      const verificationUrl = device.verification_uri_complete ?? device.verification_uri;

      window.open(verificationUrl, "_blank", "noopener,noreferrer");

      await pollGitHubAuthorization(device);
    } catch (error) {
      toast.error("GitHub authorization failed", {
        description: error instanceof Error ? error.message : "Unable to connect to GitHub.",
      });

      setGithubDevice(null);
    } finally {
      setGithubLoading(false);
    }
  };

  const pollGitHubAuthorization = async (device: GitHubDeviceResponse) => {
    const interval = Math.max(device.interval ?? 5, 5) * 1000;

    const expiresAt = Date.now() + device.expires_in * 1000;

    while (Date.now() < expiresAt) {
      await new Promise((resolve) => setTimeout(resolve, interval));

      const response = await fetch(GITHUB_ACCESS_TOKEN_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: GITHUB_CLIENT_ID,
          device_code: device.device_code,
          grant_type: "urn:ietf:params:oauth:grant-type:device_code",
        }),
      });

      const token = (await response.json()) as GitHubTokenResponse;

      if (token.access_token) {
        setGithubAccessToken(token.access_token);

        await loadGitHubAccount(token.access_token);

        await loadGitHubRepositories(token.access_token);

        setGithubDevice(null);

        toast.success("GitHub connected");

        return;
      }

      if (token.error === "authorization_pending" || token.error === "slow_down") {
        continue;
      }

      if (token.error === "access_denied") {
        throw new Error("GitHub authorization was denied.");
      }

      if (token.error === "expired_token") {
        throw new Error("GitHub authorization expired.");
      }

      if (token.error) {
        throw new Error(token.error_description ?? "GitHub authorization failed.");
      }
    }

    throw new Error("GitHub authorization timed out.");
  };

  const loadGitHubAccount = async (token: string) => {
    const response = await fetch(`${GITHUB_API_URL}/user`, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (!response.ok) {
      throw new Error("Unable to load GitHub account.");
    }

    const user = (await response.json()) as {
      login: string;
      avatar_url: string;
    };

    setGithubUser(user);
  };

  const loadGitHubRepositories = async (token: string) => {
    const repositories: GitHubRepository[] = [];

    let page = 1;

    while (page <= 10) {
      const response = await fetch(
        `${GITHUB_API_URL}/user/repos?per_page=100&page=${page}&sort=updated`,
        {
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${token}`,
            "X-GitHub-Api-Version": "2022-11-28",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Unable to fetch GitHub repositories.");
      }

      const pageRepos = (await response.json()) as GitHubRepository[];

      repositories.push(...pageRepos);

      if (pageRepos.length < 100) {
        break;
      }

      page++;
    }

    setGithubRepos(repositories);
  };

  const disconnectGitHub = () => {
    setGithubAccessToken(null);
    setGithubUser(null);
    setGithubRepos([]);
    setSelectedRepo(null);
    setGithubDevice(null);
    setGithubLoading(false);

    toast.success("GitHub disconnected");
  };

  const selectRepository = (repository: GitHubRepository) => {
    setSelectedRepo(repository);
    setRepoDropdownOpen(false);

    setMetadata((previous) => ({
      ...previous,
      name: previous.name || repository.name,
    }));
  };

  /*
   * ============================================================
   * VALIDATION
   * ============================================================
   */

  const validateDeployment = () => {
    const requiredFields: Array<keyof ModelMetadata> = [
      "name",
      "overview",
      "useCases",
      "capabilities",
      "input",
      "output",
      "monthlyPrice",
      "annualPrice",
    ];

    for (const field of requiredFields) {
      if (!metadata[field].trim()) {
        toast.error(`${field} is required.`);

        return false;
      }
    }

    const monthly = Number(metadata.monthlyPrice);

    const annual = Number(metadata.annualPrice);

    if (!Number.isFinite(monthly) || monthly < 0) {
      toast.error("Enter a valid monthly ETH price.");

      return false;
    }

    if (!Number.isFinite(annual) || annual < 0) {
      toast.error("Enter a valid annual ETH price.");

      return false;
    }

    if (method === "docker" && !dockerFile) {
      toast.error("Please upload a ZIP file.");

      return false;
    }

    if (method === "github" && !selectedRepo) {
      toast.error("Please select a GitHub repository.");

      return false;
    }

    return true;
  };

  /*
   * ============================================================
   * DEPLOY
   * ============================================================
   */

  const runDeploy = async () => {
    if (!validateDeployment()) {
      return;
    }

    setDeploying(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const id = `model-${Date.now()}`;

      const monthlyPrice = Number(metadata.monthlyPrice);

      const annualPrice = Number(metadata.annualPrice);

      const today = new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });

      /*
       * Deployment list.
       *
       * New model starts at ZERO.
       */
      const deployedModel: DeployedModel = {
        id,
        name: metadata.name.trim(),
        status: "Live",
        users: 0,
        apiCalls: 0,
        revenue: 0,
        created: today,
        tokens: "0",
      };

      /*
       * Marketplace representation.
       *
       * New model starts with zero users,
       * reviews and rating.
       */
      const marketplaceModel: AIModel = {
        id,

        name: metadata.name.trim(),

        category: "Other",

        description: metadata.overview.trim(),

        longDescription: metadata.overview.trim(),

        creator: githubUser?.login ? `@${githubUser.login}` : "ArbitriX Creator",

        rating: 0,

        reviews: 0,

        users: 0,

        priceMonthly: monthlyPrice,

        priceYearly: annualPrice,

        tags: [],

        verified: false,

        featured: false,

        useCases: metadata.useCases
          .split("\n")
          .map((value) => value.trim())
          .filter(Boolean),

        capabilities: metadata.capabilities
          .split("\n")
          .map((value) => value.trim())
          .filter(Boolean),

        input: metadata.input.trim(),

        output: metadata.output.trim(),

        performance: {
          latencyMs: 0,
          accuracy: 0,
          requests: "0",
          tokens: "0",
          uptime: 0,
        },

        chain: {
          modelId: `ARB-${id}`,

          creatorWallet: "0x71A8…A82F",

          modelHash: "0xDEMO",

          deployedAt: today,

          txHash: "0xDEMO",

          status: "Verified",
        },
      };

      /*
       * CRITICAL:
       *
       * Update BOTH global lists.
       */
      addDeployedModel(deployedModel);

      addMarketplaceModel(marketplaceModel);

      pushEvent({
        type: "Model Deployed",
        model: deployedModel.name,
      });

      toast.success("Deployment successful", {
        description: `${deployedModel.name} is now available in Deployed Models and Discover.`,
      });

      resetDeploymentState();
    } catch (error) {
      toast.error("Deployment failed", {
        description: error instanceof Error ? error.message : "Unable to deploy the model.",
      });
    } finally {
      setDeploying(false);
    }
  };

  /*
   * ============================================================
   * MANAGE
   * ============================================================
   */

  const openManage = (model: DeployedModel) => {
    const marketplace = marketplaceModels.find((item) => item.id === model.id);

    setEditingModel(model);

    setMetadata({
      name: marketplace?.name ?? model.name,

      overview: marketplace?.description ?? "",

      useCases: marketplace?.useCases?.join("\n") ?? "",

      capabilities: marketplace?.capabilities?.join("\n") ?? "",

      input: marketplace?.input ?? "",

      output: marketplace?.output ?? "",

      monthlyPrice: marketplace ? String(marketplace.priceMonthly) : "",

      annualPrice: marketplace ? String(marketplace.priceYearly) : "",
    });
  };

  const saveModelChanges = () => {
    if (!editingModel) {
      return;
    }

    if (!metadata.name.trim()) {
      toast.error("Model name is required.");

      return;
    }

    const monthly = Number(metadata.monthlyPrice);

    const annual = Number(metadata.annualPrice);

    if (!Number.isFinite(monthly) || monthly < 0) {
      toast.error("Enter a valid monthly ETH price.");

      return;
    }

    if (!Number.isFinite(annual) || annual < 0) {
      toast.error("Enter a valid annual ETH price.");

      return;
    }

    const existing = marketplaceModels.find((model) => model.id === editingModel.id);

    if (!existing) {
      toast.error("Marketplace model not found.");

      return;
    }

    const updatedMarketplaceModel: AIModel = {
      ...existing,

      name: metadata.name.trim(),

      description: metadata.overview.trim(),

      longDescription: metadata.overview.trim(),

      priceMonthly: monthly,

      priceYearly: annual,

      useCases: metadata.useCases
        .split("\n")
        .map((value) => value.trim())
        .filter(Boolean),

      capabilities: metadata.capabilities
        .split("\n")
        .map((value) => value.trim())
        .filter(Boolean),

      input: metadata.input.trim(),

      output: metadata.output.trim(),
    };

    const updatedDeployedModel: DeployedModel = {
      ...editingModel,

      name: metadata.name.trim(),
    };

    updateMarketplaceModel(updatedMarketplaceModel);

    updateDeployedModel(updatedDeployedModel);

    toast.success("Model updated", {
      description: `${updatedDeployedModel.name} has been updated across the marketplace.`,
    });

    setEditingModel(null);

    setMetadata({
      ...emptyMetadata,
    });
  };

  const addAgent = async (values: AddAgentValues) => {
    const result = await gatewayApi.addAgent({
      agent_name: values.name.trim(),
      description: values.description.trim(),
      sector: values.sector,
      real_hosted_url: values.realHostedUrl.trim(),
      owner: "demo",
      input_example: JSON.parse(values.inputExample),
      output_example: JSON.parse(values.outputExample),
      price_per_call: Number(values.pricePerCall),
    });
    const id = result.agent_id;
    const created = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
    const proxyUrl = result.proxy_url;
    const pricePerCall = Number(values.pricePerCall);

    addDeployedModel({
      id,
      name: values.name.trim(),
      status: "Live",
      users: 0,
      apiCalls: 0,
      revenue: 0,
      created,
      tokens: "0",
      proxyUrl,
    });

    addMarketplaceModel({
      id,
      name: values.name.trim(),
      category: values.sector as AIModel["category"],
      description: values.description.trim(),
      longDescription: values.description.trim(),
      creator: "ArbitriX Creator",
      rating: 0,
      reviews: 0,
      users: 0,
      priceMonthly: 0,
      priceYearly: 0,
      pricePerCall,
      proxyUrl,
      tags: [
        "API",
        ...values.schema.filter((field) => field.name.trim()).map((field) => field.type),
      ],
      verified: false,
      featured: false,
      useCases: ["Agent API integration"],
      capabilities: values.schema
        .filter((field) => field.name.trim())
        .map((field) => `${field.name.trim()} (${field.type})`),
      input: values.inputExample.trim(),
      output: values.outputExample.trim(),
      performance: {
        latencyMs: 0,
        accuracy: 0,
        requests: "0",
        tokens: "0",
        uptime: 0,
      },
      chain: {
        modelId: `ARB-${id}`,
        creatorWallet: "0x71A8…A82F",
        modelHash: "0xDEMO",
        deployedAt: created,
        txHash: "0xDEMO",
        status: "Pending",
      },
    });

    pushEvent({ type: "Model Deployed", model: values.name.trim() });
    toast.success("Agent added", {
      description: `${values.name.trim()} is now listed in Discover.`,
    });

    return proxyUrl;
  };

  /*
   * ============================================================
   * WITHDRAW
   * ============================================================
   */

  const withdraw = (model: DeployedModel) => {
    if (model.users > 0) {
      toast.error("Model cannot be withdrawn", {
        description: "This model currently has active users.",
      });

      return;
    }

    removeDeployedModel(model.id);

    removeMarketplaceModel(model.id);

    toast.success(`${model.name} withdrawn`);
  };

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <div>
      <PageHeader title="Deployments" subtitle="Deploy and manage your AI models." />

      <Panel className="p-5">
        <h2 className="text-base font-semibold tracking-tight">Deploy a Model</h2>

        <p className="mt-1 text-[13px] text-muted-foreground">
          Choose how you want to deploy your AI model.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {methods.map((item) => (
            <Panel key={item.id} hoverable className="flex flex-col p-4">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-md border border-border bg-surface text-muted-foreground">
                  <item.icon className="h-3.5 w-3.5" />
                </span>

                <h3 className="text-sm font-semibold">{item.title}</h3>
              </div>

              <p className="mt-2 flex-1 text-[13px] leading-5 text-muted-foreground">
                {item.description}
              </p>

              <Button
                variant="outline"
                size="sm"
                className="mt-4 h-8 text-[12px]"
                onClick={() => openDeploymentMethod(item.id)}
              >
                {item.cta}
              </Button>
            </Panel>
          ))}
        </div>
      </Panel>

      <div className="mt-8">
        <SectionTitle
          title="Deployed Models"
          right={<Pill tone="outline">{deployedModels.length} models</Pill>}
        />

        {deployedModels.length === 0 ? (
          <EmptyState
            icon={<Box className="h-4 w-4" />}
            title="No deployed models"
            description="Deploy your first AI model to start earning."
            action={
              <Button
                size="sm"
                className="h-8 text-[12px]"
                onClick={() => openDeploymentMethod("add-agent")}
              >
                Deploy Model
              </Button>
            }
          />
        ) : (
          <Panel className="overflow-hidden">
            <div className="hidden md:block">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border bg-surface text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-2 font-medium">Sr. No.</th>

                    <th className="px-4 py-2 font-medium">Model</th>

                    <th className="px-4 py-2 font-medium">Status</th>

                    <th className="px-4 py-2 font-medium">Users</th>

                    <th className="px-4 py-2 font-medium">API Calls</th>

                    <th className="px-4 py-2 font-medium">Revenue</th>

                    <th className="px-4 py-2 font-medium">Created</th>

                    <th className="px-4 py-2 text-right font-medium">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {deployedModels.map((model, index) => (
                    <tr
                      key={model.id}
                      className="border-b border-border last:border-0 hover:bg-surface"
                    >
                      <td className="px-4 py-2.5 text-muted-foreground">{pad2(index)}</td>

                      <td className="px-4 py-2.5">
                        <button
                          type="button"
                          className="font-medium hover:text-brand hover:underline"
                          onClick={() => openModel(model.id)}
                        >
                          {model.name}
                        </button>
                        {model.proxyUrl ? (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText(model.proxyUrl ?? "");
                              toast.success("Agent proxy link copied");
                            }}
                            className="mt-1 block max-w-[180px] truncate font-mono text-[10px] text-brand hover:underline"
                          >
                            {model.proxyUrl}
                          </button>
                        ) : null}
                      </td>

                      <td className="px-4 py-2.5">
                        <Pill tone={model.status === "Live" ? "success" : "outline"}>
                          {model.status}
                        </Pill>
                      </td>

                      <td className="px-4 py-2.5">{model.users}</td>

                      <td className="px-4 py-2.5">{model.apiCalls}</td>

                      <td className="px-4 py-2.5">{Number(model.revenue).toFixed(4)} ETH</td>

                      <td className="px-4 py-2.5 text-muted-foreground">{model.created}</td>

                      <td className="px-4 py-2.5">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-[12px]"
                            onClick={() => openModel(model.id)}
                          >
                            View
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-[12px]"
                            onClick={() => openManage(model)}
                          >
                            Manage
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-[12px] text-destructive hover:text-destructive"
                            onClick={() => withdraw(model)}
                          >
                            Withdraw
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-border md:hidden">
              {deployedModels.map((model, index) => (
                <li key={model.id} className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <button
                        type="button"
                        className="text-sm font-medium hover:text-brand"
                        onClick={() => openModel(model.id)}
                      >
                        {pad2(index)} · {model.name}
                      </button>
                      {model.proxyUrl ? (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(model.proxyUrl ?? "");
                            toast.success("Agent proxy link copied");
                          }}
                          className="mt-1 block max-w-[190px] truncate font-mono text-[10px] text-brand hover:underline"
                        >
                          {model.proxyUrl}
                        </button>
                      ) : null}
                    </div>

                    <Pill tone={model.status === "Live" ? "success" : "outline"}>
                      {model.status}
                    </Pill>
                  </div>

                  <dl className="mt-2 grid grid-cols-2 gap-1 text-[12px] text-muted-foreground">
                    <div>Users: {model.users}</div>

                    <div>API Calls: {model.apiCalls}</div>

                    <div>Revenue: {Number(model.revenue).toFixed(4)} ETH</div>

                    <div>Created: {model.created}</div>
                  </dl>

                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[12px]"
                      onClick={() => openModel(model.id)}
                    >
                      View
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[12px]"
                      onClick={() => openManage(model)}
                    >
                      Manage
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[12px]"
                      onClick={() => withdraw(model)}
                    >
                      Withdraw
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </div>

      {/* ======================================================
          DEPLOY DIALOG
          ====================================================== */}

      <Dialog
        open={method === "docker" || method === "github"}
        onOpenChange={(open) => {
          if (!open && !deploying) {
            resetDeploymentState();
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-[560px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">
              {method === "docker" ? "Upload Docker Model" : "Deploy from GitHub"}
            </DialogTitle>

            <DialogDescription className="text-[13px]">
              Configure the model information that will appear in Discover.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {method === "docker" ? (
              <div>
                <Label className="text-[12px]">Model package</Label>

                <label className="mt-1 flex cursor-pointer flex-col items-center rounded-[10px] border border-dashed border-border bg-surface px-4 py-7 text-center hover:border-brand">
                  <UploadCloud className="h-6 w-6 text-muted-foreground" />

                  <p className="mt-2 text-[13px] font-medium">
                    {dockerFile ? dockerFile.name : "Upload model ZIP"}
                  </p>

                  <p className="mt-1 text-[11px] text-muted-foreground">ZIP files only</p>

                  <input
                    type="file"
                    accept=".zip,application/zip"
                    className="hidden"
                    onChange={handleDockerFile}
                  />
                </label>
              </div>
            ) : null}

            {method === "github" ? (
              <>
                {!githubAccessToken ? (
                  <div className="rounded-[10px] border border-border bg-surface p-4">
                    <div className="flex items-start gap-3">
                      <Github className="h-5 w-5" />

                      <div>
                        <p className="text-[13px] font-semibold">Connect GitHub</p>

                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Authorize the ArbitriX demo app to access your repositories.
                        </p>
                      </div>
                    </div>

                    <Button
                      className="mt-4 h-9 w-full text-[12px]"
                      onClick={startGitHubAuth}
                      disabled={githubLoading}
                    >
                      {githubLoading ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      ) : (
                        <Github className="mr-1.5 h-4 w-4" />
                      )}

                      {githubLoading ? "Waiting for GitHub..." : "Authorize with GitHub"}
                    </Button>

                    {githubDevice ? (
                      <div className="mt-4 rounded-[10px] border border-border bg-background p-3 text-center">
                        <p className="text-[11px] text-muted-foreground">
                          Enter this code on GitHub
                        </p>

                        <p className="mt-1 font-mono text-lg font-semibold tracking-widest">
                          {githubDevice.user_code}
                        </p>

                        <a
                          href={githubDevice.verification_uri}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex text-[11px] text-brand hover:underline"
                        >
                          Open GitHub
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </a>

                        <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Waiting for authorization...
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="rounded-[10px] border border-border bg-surface p-3">
                    <div className="flex items-center gap-3">
                      {githubUser?.avatar_url ? (
                        <img src={githubUser.avatar_url} alt="" className="h-8 w-8 rounded-full" />
                      ) : (
                        <Github className="h-5 w-5" />
                      )}

                      <div className="flex-1">
                        <p className="text-[12px] font-medium">GitHub connected</p>

                        <p className="font-mono text-[11px] text-muted-foreground">
                          @{githubUser?.login}
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[11px]"
                        onClick={disconnectGitHub}
                      >
                        Disconnect
                      </Button>
                    </div>
                  </div>
                )}

                {githubAccessToken ? (
                  <div className="relative">
                    <Label className="text-[12px]">Repository</Label>

                    <button
                      type="button"
                      className="mt-1 flex h-10 w-full items-center justify-between rounded-md border border-border bg-background px-3 text-left text-[12px]"
                      onClick={() => setRepoDropdownOpen((previous) => !previous)}
                    >
                      <span className="font-mono">
                        {selectedRepo ? selectedRepo.full_name : "Select a repository"}
                      </span>

                      <ChevronDown className="h-4 w-4" />
                    </button>

                    {repoDropdownOpen ? (
                      <div className="absolute left-0 right-0 z-50 mt-1 max-h-[240px] overflow-y-auto rounded-md border border-border bg-background shadow-lg">
                        {githubRepos.map((repo) => (
                          <button
                            key={repo.id}
                            type="button"
                            className="w-full border-b border-border px-3 py-2.5 text-left hover:bg-surface"
                            onClick={() => selectRepository(repo)}
                          >
                            <span className="font-mono text-[12px] font-medium">
                              {repo.full_name}
                            </span>

                            <p className="mt-1 text-[11px] text-muted-foreground">
                              {repo.description}
                            </p>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </>
            ) : null}

            {method === "docker" || (method === "github" && selectedRepo) ? (
              <>
                <div>
                  <Label className="text-[12px]">Model name</Label>

                  <Input
                    className="mt-1 h-9 text-[13px]"
                    value={metadata.name}
                    onChange={(event) => updateMetadata("name", event.target.value)}
                    placeholder="VisionPro-v2"
                  />
                </div>

                <div>
                  <Label className="text-[12px]">Overview</Label>

                  <Textarea
                    className="mt-1 text-[13px]"
                    rows={3}
                    value={metadata.overview}
                    onChange={(event) => updateMetadata("overview", event.target.value)}
                  />
                </div>

                <div>
                  <Label className="text-[12px]">Use Cases</Label>

                  <Textarea
                    className="mt-1 text-[13px]"
                    rows={3}
                    value={metadata.useCases}
                    onChange={(event) => updateMetadata("useCases", event.target.value)}
                    placeholder="One use case per line"
                  />
                </div>

                <div>
                  <Label className="text-[12px]">Capabilities</Label>

                  <Textarea
                    className="mt-1 text-[13px]"
                    rows={3}
                    value={metadata.capabilities}
                    onChange={(event) => updateMetadata("capabilities", event.target.value)}
                    placeholder="One capability per line"
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <Label className="text-[12px]">Input</Label>

                    <Textarea
                      className="mt-1 text-[13px]"
                      rows={3}
                      value={metadata.input}
                      onChange={(event) => updateMetadata("input", event.target.value)}
                    />
                  </div>

                  <div>
                    <Label className="text-[12px]">Output</Label>

                    <Textarea
                      className="mt-1 text-[13px]"
                      rows={3}
                      value={metadata.output}
                      onChange={(event) => updateMetadata("output", event.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-[12px]">Subscription Pricing</Label>

                  <div className="mt-1 grid gap-3 md:grid-cols-2">
                    <div>
                      <Label className="text-[11px] text-muted-foreground">Monthly</Label>

                      <div className="relative mt-1">
                        <Input
                          type="number"
                          min="0"
                          step="0.0001"
                          className="h-9 pr-14 text-[13px]"
                          value={metadata.monthlyPrice}
                          onChange={(event) => updateMetadata("monthlyPrice", event.target.value)}
                        />

                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-muted-foreground">
                          ETH
                        </span>
                      </div>
                    </div>

                    <div>
                      <Label className="text-[11px] text-muted-foreground">Annual</Label>

                      <div className="relative mt-1">
                        <Input
                          type="number"
                          min="0"
                          step="0.0001"
                          className="h-9 pr-14 text-[13px]"
                          value={metadata.annualPrice}
                          onChange={(event) => updateMetadata("annualPrice", event.target.value)}
                        />

                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-muted-foreground">
                          ETH
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-[12px]"
              onClick={resetDeploymentState}
              disabled={deploying}
            >
              Cancel
            </Button>

            {method === "docker" || (method === "github" && selectedRepo) ? (
              <Button
                size="sm"
                className="h-8 text-[12px]"
                onClick={runDeploy}
                disabled={deploying}
              >
                {deploying ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}

                {deploying ? "Deploying…" : "Deploy Model"}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddAgentForm open={agentFormOpen} onOpenChange={setAgentFormOpen} onSubmit={addAgent} />

      {/* ======================================================
          MANAGE
          ====================================================== */}

      <Dialog
        open={editingModel !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingModel(null);

            setMetadata({
              ...emptyMetadata,
            });
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-[560px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">Manage Model</DialogTitle>

            <DialogDescription className="text-[13px]">
              Edit the marketplace information and subscription pricing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-[12px]">Model name</Label>

              <Input
                className="mt-1 h-9 text-[13px]"
                value={metadata.name}
                onChange={(event) => updateMetadata("name", event.target.value)}
              />
            </div>

            <div>
              <Label className="text-[12px]">Overview</Label>

              <Textarea
                className="mt-1 text-[13px]"
                rows={3}
                value={metadata.overview}
                onChange={(event) => updateMetadata("overview", event.target.value)}
              />
            </div>

            <div>
              <Label className="text-[12px]">Use Cases</Label>

              <Textarea
                className="mt-1 text-[13px]"
                rows={3}
                value={metadata.useCases}
                onChange={(event) => updateMetadata("useCases", event.target.value)}
                placeholder="One use case per line"
              />
            </div>

            <div>
              <Label className="text-[12px]">Capabilities</Label>

              <Textarea
                className="mt-1 text-[13px]"
                rows={3}
                value={metadata.capabilities}
                onChange={(event) => updateMetadata("capabilities", event.target.value)}
                placeholder="One capability per line"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label className="text-[12px]">Input</Label>

                <Textarea
                  className="mt-1 text-[13px]"
                  rows={3}
                  value={metadata.input}
                  onChange={(event) => updateMetadata("input", event.target.value)}
                />
              </div>

              <div>
                <Label className="text-[12px]">Output</Label>

                <Textarea
                  className="mt-1 text-[13px]"
                  rows={3}
                  value={metadata.output}
                  onChange={(event) => updateMetadata("output", event.target.value)}
                />
              </div>
            </div>

            <div>
              <Label className="text-[12px]">Subscription Pricing</Label>

              <div className="mt-1 grid gap-3 md:grid-cols-2">
                <div>
                  <Label className="text-[11px] text-muted-foreground">Monthly</Label>

                  <div className="relative mt-1">
                    <Input
                      type="number"
                      min="0"
                      step="0.0001"
                      className="h-9 pr-14 text-[13px]"
                      value={metadata.monthlyPrice}
                      onChange={(event) => updateMetadata("monthlyPrice", event.target.value)}
                    />

                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-muted-foreground">
                      ETH
                    </span>
                  </div>
                </div>

                <div>
                  <Label className="text-[11px] text-muted-foreground">Annual</Label>

                  <div className="relative mt-1">
                    <Input
                      type="number"
                      min="0"
                      step="0.0001"
                      className="h-9 pr-14 text-[13px]"
                      value={metadata.annualPrice}
                      onChange={(event) => updateMetadata("annualPrice", event.target.value)}
                    />

                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-muted-foreground">
                      ETH
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-[12px]"
              onClick={() => setEditingModel(null)}
            >
              Cancel
            </Button>

            <Button size="sm" className="h-8 text-[12px]" onClick={saveModelChanges}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
