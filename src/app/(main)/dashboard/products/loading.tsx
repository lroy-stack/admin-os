import { ReadState } from "@/ds/feedback";

export default function Loading() {
  return (
    <ReadState state={{ status: "loading" }} emptyTitle="">
      {null}
    </ReadState>
  );
}
