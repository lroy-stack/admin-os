import type { Metadata } from "next";

import { GrowthReports } from "./_components/growth-reports";

export const metadata: Metadata = {
  title: "Growth Reports",
  description: "Won revenue by segment, lead sources, new customers and win rate over the last 3, 6 or 12 months.",
  alternates: {
    canonical: "/dashboard/analytics",
  },
};

export default function Page() {
  return <GrowthReports />;
}
