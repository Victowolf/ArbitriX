import { Header } from "@/components/layout/Header";
import { ChainViewer } from "@/components/blockchain/ChainViewer";
import { Workspace } from "@/components/workspace/Workspace";
import { Enterprise } from "@/components/enterprise/Enterprise";
import { Portfolio } from "@/components/portfolio/Portfolio";
import { useApp } from "@/state/app-context";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ArbitirixChatbot } from "@/components/layout/ArbitirixChatbot";

export function AppShell() {
  const { topTab, chainDrawerOpen, setChainDrawerOpen } = useApp();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <div className="flex min-h-0 flex-1">
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6">
          <div className="mx-auto max-w-[1180px]">
            {topTab === "workspace" ? <Workspace /> : null}
            {topTab === "enterprise" ? <Enterprise /> : null}
            {topTab === "portfolio" ? <Portfolio /> : null}
          </div>
        </main>
        <div className="hidden w-[300px] shrink-0 border-l border-border xl:block">
          <div className="sticky top-[60px] h-[calc(100vh-60px)]">
            <ChainViewer className="h-full" />
          </div>
        </div>
      </div>

      <ArbitirixChatbot />

      <Sheet open={chainDrawerOpen} onOpenChange={setChainDrawerOpen}>
        <SheetContent side="right" className="w-[320px] p-0 sm:max-w-[320px]">
          <SheetTitle className="sr-only">Live chain activity</SheetTitle>
          <ChainViewer className="h-full pt-2" />
        </SheetContent>
      </Sheet>
    </div>
  );
}
