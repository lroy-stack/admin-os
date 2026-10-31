import { ArrowLeft, ArrowRight, ArrowUpRight, Star } from "lucide-react";

import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLocale } from "@/config/locale.server";
import { format, formatCompact } from "@/core/i18n/client";

import { ecommerceMessages } from "./messages.server";

/** Customer names are proper nouns, so only their initials are shown. */
const customerInitials = ["EM", "OW", "NO", "MM"] as const;
const featuredReviewer = "Melody Macy";
const featuredStars = ["first", "second", "third", "fourth", "fifth"] as const;
const featuredRating = featuredStars.length;
const averageRating = 4.6;
const reviewCount = 12_800;
const moreReviewers = 42;

export async function CustomerReviews() {
  const locale = await getLocale();
  const text = ecommerceMessages[locale].reviews;

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
        <div className="bg-muted rounded-lg p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-2">
              <div
                className="text-foreground flex gap-0.5"
                role="img"
                aria-label={format(text.stars, locale, { rating: featuredRating })}
              >
                {featuredStars.map((star) => (
                  <Star key={star} className="size-3.5 fill-current" />
                ))}
              </div>
              <div>
                <div className="text-sm font-medium">{featuredReviewer}</div>
                <p className="text-muted-foreground mt-2 line-clamp-3 min-h-[4.5em] text-sm break-words hyphens-auto">
                  {text.quote}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 gap-1">
              <Button aria-label={text.previous} size="icon-xs" variant="outline">
                <ArrowLeft />
              </Button>
              <Button aria-label={text.next} size="icon-xs" variant="outline">
                <ArrowRight />
              </Button>
            </div>
          </div>
        </div>

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
