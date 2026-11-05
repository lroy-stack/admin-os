import { Fragment } from "react";

import Link from "next/link";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

/** One level above the current page: a page that exists, named as the nav names it. */
export interface TrailLevel {
  readonly label: string;
  readonly href: string;
}

interface PageTrailProps {
  /** The trail's accessible name, in the page's language ("Breadcrumb"). */
  readonly label: string;
  /** The levels above the current page, outermost first. Every one is a page that exists (ADR 0020 §2). */
  readonly levels: readonly TrailLevel[];
  /** The current page, which is not a link. */
  readonly current: string;
  readonly className?: string;
}

/**
 * Where the page sits (ADR 0020 §2): a labelled `nav` whose levels link to their pages and whose last level is the
 * current page, marked `aria-current="page"` (W3C WAI-ARIA APG, "Breadcrumb"). A level that is not a page, such as a
 * tab or a section, is left out.
 */
export function PageTrail({ label, levels, current, className }: PageTrailProps) {
  return (
    <Breadcrumb aria-label={label} className={className}>
      <BreadcrumbList>
        {levels.map((level) => (
          <Fragment key={level.href}>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={level.href}>{level.label}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </Fragment>
        ))}
        <BreadcrumbItem>
          <BreadcrumbPage>{current}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
