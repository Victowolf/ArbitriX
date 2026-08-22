import { useMemo, useState, type FormEvent } from "react";
import { Check, Clipboard, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pill } from "@/components/ui/arbx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const sectors = [
  "Energy",
  "Logistics",
  "Finance",
  "Healthcare",
  "Retail",
  "Manufacturing",
  "Legal",
  "Data Analysis",
  "Other",
];

const fieldTypes = ["string", "number", "boolean", "object"] as const;

type SchemaField = {
  id: number;
  name: string;
  type: (typeof fieldTypes)[number];
  required: boolean;
};

export type AddAgentValues = {
  name: string;
  description: string;
  sector: string;
  realHostedUrl: string;
  inputExample: string;
  outputExample: string;
  pricePerCall: string;
  schema: SchemaField[];
};

const initialFields: SchemaField[] = [{ id: 1, name: "query", type: "string", required: true }];

const initialValues: AddAgentValues = {
  name: "",
  description: "",
  sector: "",
  realHostedUrl: "",
  inputExample: "",
  outputExample: "",
  pricePerCall: "",
  schema: initialFields,
};

const schemaExample = (fields: SchemaField[]) =>
  JSON.stringify(
    Object.fromEntries(
      fields
        .filter((field) => field.name.trim())
        .map((field) => [
          field.name.trim(),
          field.type === "number"
            ? 0
            : field.type === "boolean"
              ? false
              : field.type === "object"
                ? {}
                : "example value",
        ]),
    ),
    null,
    2,
  );

export function AddAgentForm({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AddAgentValues) => Promise<string>;
}) {
  const [values, setValues] = useState<AddAgentValues>(initialValues);
  const [proxyUrl, setProxyUrl] = useState<string | null>(null);
  const generatedExample = useMemo(() => schemaExample(values.schema), [values.schema]);

  const updateValue = (field: Exclude<keyof AddAgentValues, "schema">, value: string) => {
    setValues((previous) => ({ ...previous, [field]: value }));
  };

  const updateField = (id: number, update: Partial<SchemaField>) => {
    setValues((previous) => ({
      ...previous,
      schema: previous.schema.map((field) => (field.id === id ? { ...field, ...update } : field)),
    }));
  };

  const closeForm = () => {
    setValues(initialValues);
    setProxyUrl(null);
    onOpenChange(false);
  };

  const submitAgent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !values.name.trim() ||
      !values.description.trim() ||
      !values.sector ||
      !values.realHostedUrl.trim() ||
      !values.inputExample.trim() ||
      !values.outputExample.trim() ||
      !values.pricePerCall.trim()
    ) {
      toast.error("Complete all agent details before adding it.");
      return;
    }

    try {
      const url = new URL(values.realHostedUrl);
      if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Invalid URL");
      JSON.parse(values.inputExample);
      JSON.parse(values.outputExample);
    } catch {
      toast.error("Use a valid hosted URL and valid JSON examples.");
      return;
    }

    try {
      setProxyUrl(await onSubmit(values));
    } catch (error) {
      toast.error("Unable to add agent", {
        description: error instanceof Error ? error.message : "The gateway rejected this agent.",
      });
    }
  };

  const copyProxyUrl = () => {
    if (!proxyUrl) return;
    navigator.clipboard?.writeText(proxyUrl);
    toast.success("Proxy URL copied");
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (nextOpen ? onOpenChange(true) : closeForm())}>
      <DialogContent className="max-h-[90vh] max-w-[680px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">{proxyUrl ? "Agent ready" : "Add Agent"}</DialogTitle>
          <DialogDescription className="text-[13px]">
            {proxyUrl
              ? "Share the generated proxy URL with buyers. Your real hosted URL remains private."
              : "Register an agent for Discover and define the JSON contract buyers can use."}
          </DialogDescription>
        </DialogHeader>

        {proxyUrl ? (
          <div className="rounded-[10px] border border-success/25 bg-success-soft p-4">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success" />
              <p className="text-sm font-semibold">Agent added to Discover</p>
            </div>
            <p className="mt-2 text-[12px] leading-5 text-muted-foreground">
              This is the only endpoint you need to share. Buyers never see the hosted backend URL.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-md border border-success/20 bg-background px-3 py-2 font-mono text-[12px] text-foreground">
                {proxyUrl}
              </code>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[12px]"
                onClick={copyProxyUrl}
              >
                <Clipboard className="mr-1 h-3.5 w-3.5" />
                Copy
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={submitAgent} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-[12px]">Agent name</Label>
                <Input
                  value={values.name}
                  onChange={(event) => updateValue("name", event.target.value)}
                  placeholder="Route Optimizer"
                  className="mt-1 h-9 text-[13px]"
                />
              </div>
              <div>
                <Label className="text-[12px]">Sector / category</Label>
                <Select
                  value={values.sector}
                  onValueChange={(value) => updateValue("sector", value)}
                >
                  <SelectTrigger className="mt-1 h-9 text-[13px]">
                    <SelectValue placeholder="Select a sector" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectors.map((sector) => (
                      <SelectItem key={sector} value={sector}>
                        {sector}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-[12px]">Short description</Label>
              <Input
                value={values.description}
                onChange={(event) => updateValue("description", event.target.value)}
                placeholder="One sentence that appears on Discover cards"
                className="mt-1 h-9 text-[13px]"
              />
            </div>

            <div>
              <Label className="text-[12px]">Real hosted URL</Label>
              <Input
                type="url"
                value={values.realHostedUrl}
                onChange={(event) => updateValue("realHostedUrl", event.target.value)}
                placeholder="https://your-service.example.com/run"
                className="mt-1 h-9 font-mono text-[12px]"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Stored for the gateway only. It is never displayed to buyers.
              </p>
            </div>

            <div className="rounded-[10px] border border-border bg-surface p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Label className="text-[12px]">Input schema builder</Label>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Optional field definitions to generate an example request.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-[12px]"
                  onClick={() =>
                    setValues((previous) => ({
                      ...previous,
                      schema: [
                        ...previous.schema,
                        { id: Date.now(), name: "", type: "string", required: false },
                      ],
                    }))
                  }
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Add field
                </Button>
              </div>
              <div className="mt-3 space-y-2">
                {values.schema.map((field) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-[minmax(0,1fr)_120px_auto_auto] items-center gap-2"
                  >
                    <Input
                      value={field.name}
                      onChange={(event) => updateField(field.id, { name: event.target.value })}
                      placeholder="field name"
                      className="h-8 text-[12px]"
                    />
                    <Select
                      value={field.type}
                      onValueChange={(type: SchemaField["type"]) => updateField(field.id, { type })}
                    >
                      <SelectTrigger className="h-8 text-[12px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fieldTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <button
                      type="button"
                      onClick={() => updateField(field.id, { required: !field.required })}
                      className={`rounded-md border px-2 py-1.5 text-[11px] font-medium ${field.required ? "border-brand/20 bg-brand-soft text-brand" : "border-border bg-background text-muted-foreground"}`}
                    >
                      Required
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setValues((previous) => ({
                          ...previous,
                          schema: previous.schema.filter((item) => item.id !== field.id),
                        }))
                      }
                      disabled={values.schema.length === 1}
                      className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-destructive disabled:opacity-40"
                      aria-label="Remove input field"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2 h-7 px-0 text-[11px] text-brand hover:bg-transparent hover:text-brand"
                onClick={() => updateValue("inputExample", generatedExample)}
              >
                Use generated JSON example
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-[12px]">Example input JSON</Label>
                <Textarea
                  value={values.inputExample}
                  onChange={(event) => updateValue("inputExample", event.target.value)}
                  placeholder={'{\n  "query": "example"\n}'}
                  rows={7}
                  className="mt-1 font-mono text-[12px]"
                />
              </div>
              <div>
                <Label className="text-[12px]">Example output JSON</Label>
                <Textarea
                  value={values.outputExample}
                  onChange={(event) => updateValue("outputExample", event.target.value)}
                  placeholder={'{\n  "result": "example"\n}'}
                  rows={7}
                  className="mt-1 font-mono text-[12px]"
                />
              </div>
            </div>

            <div className="max-w-[260px]">
              <Label className="text-[12px]">Token cost per call</Label>
              <div className="relative mt-1">
                <Input
                  type="number"
                  min="0"
                  step="0.0001"
                  value={values.pricePerCall}
                  onChange={(event) => updateValue("pricePerCall", event.target.value)}
                  placeholder="0.0100"
                  className="h-9 pr-16 text-[13px]"
                />
                <Pill
                  tone="outline"
                  className="absolute right-2 top-1/2 -translate-y-1/2 border-0 bg-transparent"
                >
                  tokens
                </Pill>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-[12px]"
                onClick={closeForm}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="h-8 text-[12px]">
                Add Agent
              </Button>
            </DialogFooter>
          </form>
        )}

        {proxyUrl ? (
          <DialogFooter>
            <Button size="sm" className="h-8 text-[12px]" onClick={closeForm}>
              Done
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
