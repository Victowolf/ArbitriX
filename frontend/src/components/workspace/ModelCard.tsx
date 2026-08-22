import { ShieldCheck, Star, Users } from "lucide-react";
import { Panel, Pill } from "@/components/ui/arbx";
import { compact } from "@/lib/format";
import type { AIModel } from "@/types";

export function ModelCard({ model, onOpen }: { model: AIModel; onOpen: (id: string) => void }) {
  return (
    <Panel hoverable className="flex cursor-pointer flex-col p-4">
      <button
        type="button"
        onClick={() => onOpen(model.id)}
        className="flex flex-1 flex-col text-left"
      >
        <div className="flex items-start gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-surface text-[12px] font-semibold text-brand ring-1 ring-border">
            {model.name.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-sm font-semibold">{model.name}</h3>
              {model.verified ? (
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-success" />
              ) : null}
            </div>
            <p className="truncate text-[11px] text-muted-foreground">{model.category}</p>
          </div>
        </div>

        <p className="mt-2.5 line-clamp-2 flex-1 text-[13px] leading-5 text-muted-foreground">
          {model.description}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1 text-foreground">
            <Star className="h-3 w-3 fill-warning text-warning" />
            {model.rating.toFixed(1)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" />
            {compact(model.users)} users
          </span>
          <span className="font-medium text-foreground">
            ${model.priceMonthly.toFixed(2)} / month
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-1">
          {model.tags.map((t) => (
            <Pill key={t} tone="outline">
              {t}
            </Pill>
          ))}
        </div>
      </button>

      <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5">
        <span className="truncate text-[11px] text-muted-foreground">{model.creator}</span>
        {model.verified ? <Pill tone="success">Verified</Pill> : null}
      </div>
    </Panel>
  );
}
