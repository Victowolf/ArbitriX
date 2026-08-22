import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";

import { Panel, Pill, SectionTitle } from "@/components/ui/arbx";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { reviews as seedReviews } from "@/data/models";
import { useApp } from "@/state/app-context";
import type { Review } from "@/types";
import { cn } from "@/lib/utils";

export function Reviews({
  modelName,
  average,
  total,
}: {
  modelName: string;
  average: number;
  total: number;
}) {
  const { wallet, pushEvent } = useApp();

  /*
   * ============================================================
   * REVIEW STATE
   * ============================================================
   *
   * Existing/preloaded models:
   *   total > 0
   *   -> show demo/seed reviews
   *
   * Newly deployed models:
   *   total === 0
   *   -> start with an empty review list
   */
  const [items, setItems] = useState<Review[]>(() => (total > 0 ? seedReviews : []));

  /*
   * Keep the displayed review count independent from the
   * original model prop so submitting a review immediately
   * updates the UI.
   */
  const [submittedReviews, setSubmittedReviews] = useState(0);

  const [submittedRatingTotal, setSubmittedRatingTotal] = useState(0);

  const [open, setOpen] = useState(false);

  const [rating, setRating] = useState(5);

  const [text, setText] = useState("");

  const [usage, setUsage] = useState("2 months");

  /*
   * ============================================================
   * RESET WHEN MODEL CHANGES
   * ============================================================
   *
   * Important because ModelDetails can remain mounted while
   * selectedModelId changes.
   */
  useEffect(() => {
    setItems(total > 0 ? seedReviews : []);

    setSubmittedReviews(0);
    setSubmittedRatingTotal(0);

    setOpen(false);
    setRating(5);
    setText("");
    setUsage("2 months");
  }, [modelName, total]);

  /*
   * ============================================================
   * EFFECTIVE REVIEW COUNT
   * ============================================================
   */

  const effectiveTotal = total + submittedReviews;

  /*
   * ============================================================
   * EFFECTIVE AVERAGE
   * ============================================================
   *
   * For a model with no existing reviews:
   *
   * 0 reviews
   * 1 new 5-star review
   * -> 5.0
   *
   * For a model that already has reviews:
   * we combine the model's existing average with newly
   * submitted reviews.
   */
  const effectiveAverage =
    effectiveTotal === 0 ? 0 : (average * total + submittedRatingTotal) / effectiveTotal;

  /*
   * ============================================================
   * SUBMIT REVIEW
   * ============================================================
   */

  const submit = () => {
    const reviewText = text.trim() || "Solid model — consistent output quality in production.";

    const review: Review = {
      id: `r-${Date.now()}`,
      author: wallet,
      rating,
      text: reviewText,
      usage,
      verified: true,
      date: "Aug 21, 2026",
    };

    /*
     * Add the review to the current model's visible list.
     */
    setItems((prev) => [review, ...prev]);

    /*
     * Keep local counters so the summary updates immediately.
     */
    setSubmittedReviews((prev) => prev + 1);

    setSubmittedRatingTotal((prev) => prev + rating);

    /*
     * Record blockchain-style event.
     */
    pushEvent({
      type: "Review Submitted",
      model: modelName,
      value: `Rating: ${rating}★`,
      wallet,
    });

    /*
     * Close and reset form.
     */
    setOpen(false);
    setText("");
    setRating(5);
    setUsage("2 months");

    toast.success("Review submitted", {
      description: "Verified against your wallet.",
    });
  };

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <div>
      {/* ======================================================
          HEADER
          ====================================================== */}

      <SectionTitle
        title="Reviews"
        right={
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-[12px]"
            onClick={() => setOpen(true)}
          >
            Write a Review
          </Button>
        }
      />

      {/* ======================================================
          REVIEW SUMMARY
          ====================================================== */}

      <Panel className="mb-3 flex flex-wrap items-center gap-x-6 gap-y-2 p-4">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-semibold">{effectiveAverage.toFixed(1)}</span>

          <Stars value={Math.round(effectiveAverage)} />
        </div>

        <span className="text-[13px] text-muted-foreground">
          {effectiveTotal} {effectiveTotal === 1 ? "total review" : "total reviews"}
        </span>

        <Pill tone="brand" className="ml-auto">
          Reviews verified on-chain
        </Pill>
      </Panel>

      {/* ======================================================
          EMPTY STATE
          ====================================================== */}

      {effectiveTotal === 0 ? (
        <Panel className="p-8 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface">
            <Star className="h-4 w-4 text-muted-foreground" />
          </div>

          <h3 className="mt-3 text-sm font-semibold">No reviews yet</h3>

          <p className="mx-auto mt-1 max-w-md text-[12px] leading-5 text-muted-foreground">
            {modelName} has not received any reviews yet. Be the first subscriber to share your
            experience.
          </p>

          <Button
            variant="outline"
            size="sm"
            className="mt-4 h-8 text-[12px]"
            onClick={() => setOpen(true)}
          >
            Write the first review
          </Button>
        </Panel>
      ) : null}

      {/* ======================================================
          REVIEW LIST
          ====================================================== */}

      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map((r) => (
            <Panel key={r.id} className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Stars value={r.rating} />

                {r.verified ? <Pill tone="success">Verified Subscriber</Pill> : null}

                <span className="font-mono text-[11px] text-subtle">{r.author}</span>

                <span className="ml-auto text-[11px] text-subtle">{r.date}</span>
              </div>

              <p className="mt-2 text-[13px] leading-5 text-muted-foreground">{r.text}</p>

              <p className="mt-2 text-[11px] text-subtle">Usage: {r.usage}</p>
            </Panel>
          ))}
        </div>
      ) : null}

      {/* ======================================================
          WRITE REVIEW DIALOG
          ====================================================== */}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-base">Write a review</DialogTitle>

            <DialogDescription className="text-[13px]">
              Reviews are linked to your wallet and subscription record.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {/* Rating */}

            <div>
              <Label className="text-[12px]">Rating</Label>

              <div className="mt-1 flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    aria-label={`${n} star rating`}
                  >
                    <Star
                      className={cn(
                        "h-5 w-5",
                        n <= rating ? "fill-warning text-warning" : "text-border-strong",
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Review */}

            <div>
              <Label className="text-[12px]">Review</Label>

              <Textarea
                rows={4}
                className="mt-1 text-[13px]"
                placeholder="What worked well? Anything to watch for?"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>

            {/* Usage */}

            <div>
              <Label className="text-[12px]">Usage duration (optional)</Label>

              <Input
                className="mt-1 h-9 text-[13px]"
                value={usage}
                onChange={(e) => setUsage(e.target.value)}
              />
            </div>
          </div>

          {/* Footer */}

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-[12px]"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>

            <Button size="sm" className="h-8 text-[12px]" onClick={submit}>
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ==============================================================
   STARS
   ============================================================== */

function Stars({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(5, value));

  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            "h-3.5 w-3.5",
            n <= safeValue ? "fill-warning text-warning" : "text-border-strong",
          )}
        />
      ))}
    </span>
  );
}
