import { BellOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMessages } from "@/config/locale.server";

import { productivityMessages } from "./messages.server";

const FOCUS_MINUTES = 90;

export async function FocusCard() {
  const text = (await getMessages(productivityMessages)).focus;

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <CardTitle>{text.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <div className="shrink-0 text-3xl tracking-tight tabular-nums">{`${FOCUS_MINUTES}:00`}</div>
            <Button className="min-w-24">{text.start}</Button>
          </div>

          <div className="text-muted-foreground flex items-start gap-2 text-xs">
            <BellOff className="mt-0.5 size-3 shrink-0" />
            <span className="min-w-0 break-words">{text.noNotifications}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
