import { Box } from "lucide-react";

import { EmptyState, PageHeader, Panel, Pill, SectionTitle } from "@/components/ui/arbx";

import { Button } from "@/components/ui/button";

import { pad2 } from "@/lib/format";
import { useApp } from "@/state/app-context";

export function Performance() {
  const {
    openModel,
    setWorkspaceTab,

    /*
     * Dynamic deployed models.
     *
     * This comes from AppContext, so newly deployed models
     * immediately appear here.
     */
    deployedModels,

    /*
     * Dynamic subscriptions.
     *
     * This is updated when a user subscribes from Discover.
     */
    subscriptions,

    /*
     * Marketplace models contain the actual model metadata.
     */
    marketplaceModels,
  } = useApp();

  /*
   * ============================================================
   * SUBSCRIBED MODELS
   * ============================================================
   *
   * Convert the subscription records into the same kind of
   * display data that the old static subscribedModels array
   * provided.
   */
  const subscribedModels = subscriptions.map((subscription) => {
    const model = marketplaceModels.find((item) => item.id === subscription.modelId);

    return {
      id: subscription.modelId,

      name: model?.name ?? "Unknown Model",

      /*
       * New subscriptions start with zero usage.
       *
       * These can later be incremented when actual
       * inference/API usage is implemented.
       */
      tokens: 0,
      apiCalls: 0,

      plan: subscription.plan,

      status: "Active" as const,
    };
  });

  return (
    <div>
      <PageHeader
        title="Performance"
        subtitle="Usage and revenue across models you publish and consume."
      />

      {/* ======================================================
          DEPLOYED MODELS
          ====================================================== */}

      <div className="mb-8">
        <SectionTitle title="Deployed Models" />

        {deployedModels.length === 0 ? (
          <EmptyState
            icon={<Box className="h-4 w-4" />}
            title="No deployed models"
            description="Deploy an AI model to start tracking its performance."
            action={
              <Button
                size="sm"
                className="h-8 text-[12px]"
                onClick={() => setWorkspaceTab("deployments")}
              >
                Deploy a Model
              </Button>
            }
          />
        ) : (
          <Panel className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-[13px]">
              <thead>
                <tr className="border-b border-border bg-surface text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Sr. No.</th>

                  <th className="px-4 py-2 font-medium">Model</th>

                  <th className="px-4 py-2 font-medium">Tokens Processed</th>

                  <th className="px-4 py-2 font-medium">API Calls</th>

                  <th className="px-4 py-2 font-medium">Users</th>

                  <th className="px-4 py-2 font-medium">Revenue</th>
                </tr>
              </thead>

              <tbody>
                {deployedModels.map((model, index) => (
                  <tr
                    key={model.id}
                    className="border-b border-border last:border-0 transition-colors hover:bg-surface"
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
                    </td>

                    <td className="px-4 py-2.5">{model.tokens ?? 0}</td>

                    <td className="px-4 py-2.5">{model.apiCalls ?? 0}</td>

                    <td className="px-4 py-2.5">{model.users ?? 0}</td>

                    <td className="px-4 py-2.5 font-medium">
                      {Number(model.revenue ?? 0).toFixed(4)} ETH
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        )}
      </div>

      {/* ======================================================
          SUBSCRIBED MODELS
          ====================================================== */}

      <div>
        <SectionTitle title="Subscribed Models" />

        {subscribedModels.length === 0 ? (
          <EmptyState
            icon={<Box className="h-4 w-4" />}
            title="No subscriptions"
            description="Discover AI models and subscribe to start using them."
            action={
              <Button
                size="sm"
                className="h-8 text-[12px]"
                onClick={() => setWorkspaceTab("discover")}
              >
                Discover Models
              </Button>
            }
          />
        ) : (
          <Panel className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-[13px]">
              <thead>
                <tr className="border-b border-border bg-surface text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Sr. No.</th>

                  <th className="px-4 py-2 font-medium">Model</th>

                  <th className="px-4 py-2 font-medium">Tokens Consumed</th>

                  <th className="px-4 py-2 font-medium">API Calls</th>

                  <th className="px-4 py-2 font-medium">Subscription</th>

                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>

              <tbody>
                {subscribedModels.map((model, index) => (
                  <tr
                    key={model.id}
                    className="border-b border-border last:border-0 transition-colors hover:bg-surface"
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
                    </td>

                    <td className="px-4 py-2.5">{model.tokens}</td>

                    <td className="px-4 py-2.5">{model.apiCalls}</td>

                    <td className="px-4 py-2.5">{model.plan}</td>

                    <td className="px-4 py-2.5">
                      <Pill tone="success">{model.status}</Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        )}
      </div>
    </div>
  );
}
