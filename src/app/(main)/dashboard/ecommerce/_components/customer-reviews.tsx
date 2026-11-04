import { ArrowUpRight } from "lucide-react";

import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLocale } from "@/config/locale.server";
import { format, formatCompact } from "@/core/i18n/client";

import { FeaturedReview } from "./featured-review";
import { ecommerceMessages } from "./messages.server";

/** Customer names are proper nouns, so only their initials are shown. */
const customerInitials = ["EM", "OW", "NO", "MM"] as const;
const averageRating = 4.6;
const reviewCount = 12_800;
const moreReviewers = 42;

export async function CustomerReviews() {
  const locale = await getLocale();
  const text = ecommerceMessages[locale].reviews;
  const reviews = [
    { reviewer: "Melody Macy", rating: 5, quote: text.quote },
    { reviewer: "Emma Smith", rating: 4, quote: text.quoteSecond },
    { reviewer: "Sean Bean", rating: 5, quote: text.quoteThird },
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-muted-foreground text-sm font-normal">{text.title}</CardTitle>
        <CardDescription className="text-foreground text-xl leading-none tracking-tight tabular-nums">
          {format(text.averageRating, locale, {
            rating: averageRating,
          })}
        </CardDescription>
        <CardAction>
          <ArrowUpRight className="size-4" />
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <FeaturedReview reviews={reviews} />

        <div className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3">
          <div className="min-w-0">
            <div className="text-sm font-medium break-words">
              {format(text.count, locale, { count: reviewCount, value: formatCompact(reviewCount, locale) })}
            </div>
            <div className="text-muted-foreground line-clamp-2 min-h-[3em] text-xs break-words hyphens-auto">
              {text.thisMonth}
            </div>
          </div>

          <AvatarGroup className="shrink-0">
            {customerInitials.map((initials) => (
              <Avatar key={initials}>
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            ))}

            <AvatarGroupCount>{format(text.moreReviewers, locale, { count: moreReviewers })}</AvatarGroupCount>
          </AvatarGroup>
        </div>
      </CardContent>
    </Card>
  );
}
