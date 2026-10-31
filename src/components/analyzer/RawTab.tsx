import type { RedirectAnalysis } from "@/lib/redirect-types";
import { CopyButton } from "./CopyButton";

export function RawTab({ result }: { result: RedirectAnalysis }) {
  const json = JSON.stringify(result, null, 2);
  return (
    <div className="panel animate-rise overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-hairline bg-surface-muted px-3 py-2">
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          analysis.json
        </span>
        <CopyButton value={json} label="Copy raw JSON" />
      </div>
      <pre className="max-h-[520px] overflow-auto bg-surface p-4 font-mono text-[11px] leading-relaxed text-foreground">
        {json}
      </pre>
    </div>
  );
}
