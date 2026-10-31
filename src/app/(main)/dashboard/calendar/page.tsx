import type { Metadata } from "next";

import { Calendar } from "./_components/calendar";

export const metadata: Metadata = {
  title: "Team Schedule",
  description: "Meetings, focus time and all-day events alongside the deals closing in the next 30 days.",
  alternates: {
    canonical: "/dashboard/calendar",
  },
};

export default function Page() {
  return <Calendar />;
}
