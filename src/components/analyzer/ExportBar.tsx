import { ClipboardCopy, FileJson, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { downloadFile, toCsv, toJson, toReport } from "@/lib/redirect-export";
import type { RedirectAnalysis } from "@/lib/redirect-types";

export function ExportBar({ results }: { results: RedirectAnalysis[] }) {
  async function copyReport() {
    try {
      await navigator.clipboard.writeText(toReport(results));
      toast.success("Report copied to clipboard");
    } catch {
      toast.error("Clipboard access was blocked");
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="subtle" size="sm" onClick={copyReport}>
            <ClipboardCopy className="size-3.5" />
            Copy report
          </Button>
        </TooltipTrigger>
        <TooltipContent>Plain-text summary of the chain</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="subtle"
            size="sm"
            onClick={() => {
              downloadFile("redirect-chain.json", toJson(results), "application/json");
              toast.success("JSON exported");
            }}
          >
            <FileJson className="size-3.5" />
            JSON
          </Button>
        </TooltipTrigger>
        <TooltipContent>Download full analysis as JSON</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="subtle"
            size="sm"
            onClick={() => {
              downloadFile("redirect-chain.csv", toCsv(results), "text/csv");
              toast.success("CSV exported");
            }}
          >
            <FileSpreadsheet className="size-3.5" />
            CSV
          </Button>
        </TooltipTrigger>
        <TooltipContent>Download hop table as CSV</TooltipContent>
      </Tooltip>
    </div>
  );
}
