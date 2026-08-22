import {
  Bell,
  Boxes,
  ChevronDown,
  Menu,
  Activity,
  User,
  Settings,
  CreditCard,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useApp, type TopTab } from "@/state/app-context";
import { cn } from "@/lib/utils";

const tabs: { id: TopTab; label: string }[] = [
  { id: "workspace", label: "Workspace" },
  { id: "enterprise", label: "Enterprise" },
  { id: "portfolio", label: "Portfolio" },
];

export function Header() {
  const { topTab, setTopTab, wallet, setChainDrawerOpen } = useApp();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDisconnect = () => {
    setProfileOpen(false);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("wallet");
    sessionStorage.clear();
    navigate({ to: "/" });
  };

  const handleMenuClick = (tab?: TopTab) => {
    setProfileOpen(false);
    if (tab) {
      setTopTab(tab);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-[60px] shrink-0 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-full items-center gap-3 px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-foreground text-background">
            <Boxes className="h-4 w-4" />
          </span>
          <span className="truncate text-[15px] font-semibold tracking-tight">ArbitriX</span>
        </div>

        <nav className="ml-2 hidden items-center gap-1 md:flex">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTopTab(t.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
                topTab === t.id
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-surface hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            <span className="font-mono text-[12px]">{wallet || "0x000...0000"}</span>
            <span className="rounded border border-brand/20 bg-brand-soft px-1 text-[10px] font-medium text-brand">
              Testnet
            </span>
          </div>
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-surface"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setChainDrawerOpen(true)}
            className="grid h-8 w-8 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-surface xl:hidden"
            aria-label="Open chain activity"
          >
            <Activity className="h-4 w-4" />
          </button>

          {/* Profile Section Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((prev) => !prev)}
              className={cn(
                "flex items-center gap-1.5 rounded-md border border-border py-1 pl-1 pr-1.5 transition-colors hover:bg-surface",
                profileOpen && "bg-surface ring-1 ring-border",
              )}
              aria-label="Account menu"
              aria-expanded={profileOpen}
            >
              <span className="grid h-6 w-6 place-items-center rounded bg-brand text-[11px] font-semibold text-brand-foreground shadow-xs">
                VW
              </span>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 text-muted-foreground transition-transform duration-150",
                  profileOpen && "rotate-180",
                )}
              />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-border bg-card p-1.5 text-foreground shadow-lg focus:outline-none animate-in fade-in-0 zoom-in-95">
                <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand text-xs font-semibold text-brand-foreground">
                    VW
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold leading-tight">VictoWolf</p>
                    <p className="truncate font-mono text-[11px] text-muted-foreground">
                      {wallet || "0x71C...3921"}
                    </p>
                  </div>
                </div>

                <div className="my-1 h-px bg-border/60" />

                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => handleMenuClick("portfolio")}
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[12.5px] font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMenuClick("workspace")}
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[12.5px] font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                    Settings
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMenuClick("enterprise")}
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[12.5px] font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                    Billing
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMenuClick("enterprise")}
                    className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[12.5px] font-medium text-brand transition-colors hover:bg-brand/10"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5" />
                      Get PRO
                    </span>
                    <span className="rounded bg-brand/20 px-1 py-0.2 text-[9.5px] font-semibold">
                      NEW
                    </span>
                  </button>
                </div>

                <div className="my-1 h-px bg-border/60" />

                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[12.5px] font-medium text-destructive transition-colors hover:bg-destructive/10"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <nav className="flex items-center gap-1 overflow-x-auto border-t border-border px-3 py-1.5 md:hidden">
        <Menu className="mr-1 h-3.5 w-3.5 shrink-0 text-subtle" />
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTopTab(t.id)}
            className={cn(
              "shrink-0 rounded-md px-2.5 py-1 text-[12px] font-medium",
              topTab === t.id ? "bg-muted text-foreground" : "text-muted-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
