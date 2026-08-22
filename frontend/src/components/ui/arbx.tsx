import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "success" | "brand" | "warning" | "danger" | "outline";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground border-border",
  success: "bg-success-soft text-success border-success/20",
  brand: "bg-brand-soft text-brand border-brand/20",
  warning: "bg-warning-soft text-foreground border-warning/30",
  danger: "bg-destructive-soft text-destructive border-destructive/20",
  outline: "bg-background text-muted-foreground border-border",
};

export function Pill({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-4",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Panel({
  children,
  className,
  hoverable,
}: {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[10px] border border-border bg-card",
        hoverable &&
          "transition-colors hover:border-border-strong hover:shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function SectionTitle({
  title,
  right,
  className,
}: {
  title: string;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3", className)}>
      <h2 className="truncate text-base font-semibold tracking-tight">{title}</h2>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[10px] border border-dashed border-border bg-surface px-6 py-12 text-center">
      <div className="mb-3 grid h-9 w-9 place-items-center rounded-md border border-border bg-background text-muted-foreground">
        {icon}
      </div>
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 max-w-sm text-[13px] text-muted-foreground">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <Panel className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {icon ? <span className="text-subtle">{icon}</span> : null}
      </div>
      <p className="mt-2 text-xl font-semibold tracking-tight">{value}</p>
      {hint ? <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div> : null}
    </Panel>
  );
}

export function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("font-mono text-[12px] tracking-tight", className)}>{children}</span>;
}
