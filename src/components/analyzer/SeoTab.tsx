import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";
import type { RedirectAnalysis } from "@/lib/redirect-types";

function Row({
  label,
  value,
  tone,
  index,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad" | "warn";
  index: number;
}) {
  return (
    <div
      className="animate-rise stagger-fast flex flex-col gap-1 border-b border-hairline py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
      style={{ "--stagger": index } as CSSProperties}
    >
      <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
      <span
        className={cn(
          "min-w-0 break-all font-mono text-[13px] font-medium text-foreground sm:text-right",
          tone === "good" && "text-success",
          tone === "bad" && "text-destructive",
          tone === "warn" && "text-warning-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function SeoTab({ result }: { result: RedirectAnalysis }) {
  const { seo } = result;
  return (
    <div className="panel px-4 py-1">
      <Row
        index={0}
        label="Final HTTP status"
        value={seo.finalStatus ? String(seo.finalStatus) : "—"}
        tone={seo.finalStatus && seo.finalStatus < 400 ? "good" : "bad"}
      />
      <Row
        index={1}
        label="HTTPS on final URL"
        value={seo.https ? "Secure" : "Not secure"}
        tone={seo.https ? "good" : "bad"}
      />
      <Row index={2} label="Canonical URL" value={seo.canonical ?? "not found"} />
      <Row index={3} label="Meta robots" value={seo.metaRobots ?? "not found"} />
      <Row
        index={4}
        label="Redirect chain length"
        value={String(seo.chainLength)}
        tone={seo.chainLength <= 1 ? "good" : seo.chainLength <= 2 ? "warn" : "bad"}
      />
      <Row index={5} label="Final URL" value={result.finalUrl} />
    </div>
  );
}
