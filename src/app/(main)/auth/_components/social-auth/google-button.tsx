import { cn } from "cn";
import { siGoogle } from "simple-icons";

import { SimpleIcon } from "@/components/simple-icon";
import { Button } from "@/components/ui/button";
import { getMessages } from "@/config/locale.server";

import { authMessages } from "../messages.server";

export async function GoogleButton({ className, ...props }: React.ComponentProps<typeof Button>) {
  const text = await getMessages(authMessages);

  return (
    <Button variant="secondary" className={cn(className)} {...props}>
      <SimpleIcon icon={siGoogle} className="size-4" />
      {text.actions.google}
    </Button>
  );
}
