import { useApp, type WorkspaceTab } from "@/state/app-context";
import { Deployments } from "@/components/workspace/Deployments";
import { Discover } from "@/components/workspace/Discover";
import { ModelDetails } from "@/components/workspace/ModelDetails";
import { Performance } from "@/components/workspace/Performance";
import { cn } from "@/lib/utils";

const tabs: { id: WorkspaceTab; label: string }[] = [
  { id: "deployments", label: "Deployments" },
  { id: "discover", label: "Discover" },
  { id: "performance", label: "Performance" },
];

export function Workspace() {
  const { workspaceTab, setWorkspaceTab, selectedModelId } = useApp();

  return (
    <div>
      <div className="mb-6 flex items-center gap-1 overflow-x-auto rounded-[10px] border border-border bg-surface p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setWorkspaceTab(t.id)}
            className={cn(
              "shrink-0 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
              workspaceTab === t.id
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {selectedModelId ? (
        <ModelDetails modelId={selectedModelId} />
      ) : (
        <>
          {workspaceTab === "deployments" ? <Deployments /> : null}
          {workspaceTab === "discover" ? <Discover /> : null}
          {workspaceTab === "performance" ? <Performance /> : null}
        </>
      )}
    </div>
  );
}
