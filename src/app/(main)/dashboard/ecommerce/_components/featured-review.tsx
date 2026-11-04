"use client";

import { useState } from "react";

import { ArrowLeft, ArrowRight, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { format, useLocale, useMessages } from "@/core/i18n/client";

import { ecommerceMessageKey } from "./messages";

export interface Review {
  /** A customer's name: a proper noun. */
  readonly reviewer: string;
  /** Whole stars out of five. */
  readonly rating: number;
  readonly quote: string;
}

/** The index `delta` steps from `index` in a list of `length`, wrapping at both ends. */
export function stepIndex(index: number, delta: number, length: number): number {
  return (((index + delta) % length) + length) % length;
}

const STARS = [1, 2, 3, 4, 5] as const;

/** One review at a time, with Previous and Next stepping through them. */
export function FeaturedReview({ reviews }: { reviews: readonly Review[] }) {
  const text = useMessages(ecommerceMessageKey).reviews;
  const locale = useLocale();
  const [index, setIndex] = useState(0);
  const review = reviews[index];
  if (!review) return null;

  return (
    <div className="bg-muted rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-2" aria-live="polite">
          <div
            className="text-foreground flex gap-0.5"
            role="img"
            aria-label={format(text.stars, locale, { rating: review.rating })}
          >
            {STARS.map((star) => (
              <Star key={star} className={star <= review.rating ? "size-3.5 fill-current" : "size-3.5"} />
            ))}
          </div>
          <div>
            <div className="text-sm font-medium">{review.reviewer}</div>
            <p className="text-muted-foreground mt-2 line-clamp-3 min-h-[4.5em] text-sm break-words hyphens-auto">
              {review.quote}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 gap-1">
          <Button
            aria-label={text.previous}
            size="icon-xs"
            variant="outline"
            onClick={() => setIndex(stepIndex(index, -1, reviews.length))}
          >
            <ArrowLeft />
          </Button>
          <Button
            aria-label={text.next}
            size="icon-xs"
            variant="outline"
            onClick={() => setIndex(stepIndex(index, 1, reviews.length))}
          >
            <ArrowRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
