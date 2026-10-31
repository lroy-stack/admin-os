import type { Metadata } from "next";

import { Reservations } from "./_components/reservations";

export const metadata: Metadata = {
  title: "Reservations",
  description:
    "Tonight's service: floor occupancy, a table-by-table timeline and the reservation list with next steps.",
  alternates: {
    canonical: "/dashboard/reservas",
  },
};

export default function Page() {
  return <Reservations />;
}
