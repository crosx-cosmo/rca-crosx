import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";
import type { RedirectAnalysis } from "@/lib/redirect-types";
import { CopyButton } from "./CopyButton";

function Row({
  label,
  value,
  tone,
  index,
  copyValue,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad" | "warn";
  index: number;
  copyValue?: string;
}) {
  return (
    <div
      className="animate-rise stagger-fast flex flex-col gap-1 border-b border-hairline py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
      style={{ "--stagger": index } as CSSProperties}
    >
      <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
      <span
        className={cn(
          "flex min-w-0 items-center gap-2 break-all font-mono text-[13px] font-medium text-foreground sm:justify-end sm:text-right",
          tone === "good" && "text-success",
          tone === "bad" && "text-destructive",
          tone === "warn" && "text-warning-foreground",
        )}
      >
        <span>{value}</span>
        {copyValue ? <CopyButton value={copyValue} label={`Copy ${label}`} /> : null}
      </span>
    </div>
  );
}

export function SeoTab({ result }: { result: RedirectAnalysis }) {
  const { seo } = result;
  const canonicalStatusLabel =
    seo.canonicalStatus === "match"
      ? "Matches final URL (self-referencing)"
      : seo.canonicalStatus === "mismatch"
        ? "Points to a different URL"
        : "Not declared";
  const canonicalStatusTone =
    seo.canonicalStatus === "match"
      ? "good"
      : seo.canonicalStatus === "mismatch"
        ? "warn"
        : undefined;

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
        value={seo.https ? "Secure (HTTPS)" : "Not secure (HTTP)"}
        tone={seo.https ? "good" : "bad"}
      />
      <Row
        index={2}
        label="HSTS (Strict-Transport-Security)"
        value={seo.hsts ? "Enabled" : "Not set"}
        tone={seo.hsts ? "good" : "warn"}
      />
      <Row
        index={3}
        label="Canonical URL"
        value={seo.canonical ?? "not found"}
        copyValue={seo.canonical ?? undefined}
      />
      <Row
        index={4}
        label="Canonical alignment"
        value={canonicalStatusLabel}
        tone={canonicalStatusTone}
      />
      <Row
        index={5}
        label="Meta robots"
        value={seo.metaRobots ?? "not found (indexable by default)"}
        tone={seo.metaRobots?.toLowerCase().includes("noindex") ? "bad" : "good"}
      />
      <Row
        index={6}
        label="X-Robots-Tag HTTP header"
        value={seo.xRobotsTag ?? "not set"}
        tone={seo.xRobotsTag?.toLowerCase().includes("noindex") ? "bad" : undefined}
      />
      <Row index={7} label="Cache-Control policy" value={seo.cacheControl ?? "not set"} />
      <Row
        index={8}
        label="Redirect chain length"
        value={String(seo.chainLength)}
        tone={seo.chainLength <= 1 ? "good" : seo.chainLength <= 2 ? "warn" : "bad"}
      />
      <Row
        index={9}
        label="Temporary redirects (302 / 307 / client)"
        value={String(seo.temporaryRedirectsCount ?? 0)}
        tone={(seo.temporaryRedirectsCount ?? 0) === 0 ? "good" : "warn"}
      />
      {result.userAgentLabel ? (
        <Row index={10} label="Simulated User-Agent" value={result.userAgentLabel} />
      ) : null}
      <Row
        index={11}
        label="Final URL"
        value={result.finalUrl}
        copyValue={result.finalUrl}
      />
      {seo.cleanFinalUrl && seo.cleanFinalUrl !== result.finalUrl ? (
        <Row
          index={12}
          label="Clean URL (tracking stripped)"
          value={seo.cleanFinalUrl}
          tone="good"
          copyValue={seo.cleanFinalUrl}
        />
      ) : null}
    </div>
  );
}

