import { Link2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function ShareButton({ shareId }: { shareId: string }) {
  async function share() {
    const url = `${window.location.origin}/r/${shareId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Share link copied", { description: url });
    } catch {
      toast.error("Clipboard access was blocked", { description: url });
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="subtle" size="sm" onClick={share}>
          <Link2 className="size-3.5" />
          Share
        </Button>
      </TooltipTrigger>
      <TooltipContent>Copy a public link to this report</TooltipContent>
    </Tooltip>
  );
}
