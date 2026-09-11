import { ChevronRight, Clock, Globe, Lock, MapPin, Server, Unlock } from "lucide-react";
import type { CSSProperties } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SLOW_HOP_MS, isRedirect } from "@/lib/redirect-analysis";
import type { RedirectAnalysis } from "@/lib/redirect-types";
import { CopyButton } from "./CopyButton";
import { StatusBadge, statusTone } from "./StatusBadge";
import { IssueList } from "./IssueList";

const dotTone: Record<string, string> = {
  success: "bg-success",
  info: "bg-info",
  warning: "bg-warning",
  error: "bg-destructive",
  neutral: "bg-muted-foreground",
};

const ringTone: Record<string, string> = {
  success: "border-success/40",
  info: "border-info/40",
  warning: "border-warning/45",
  error: "border-destructive/40",
  neutral: "border-hairline",
};

function FlowStrip({ result }: { result: RedirectAnalysis }) {
  let host = result.startUrl;
  try {
    host = new URL(result.startUrl).host;
  } catch {
    /* keep raw value when the URL cannot be parsed */
  }

  return (
    <div className="panel overflow-x-auto p-3">
      <div className="flex min-w-max items-center gap-2">
        <span className="animate-rise stagger max-w-[180px] truncate rounded-md border border-hairline bg-surface px-2 py-1 font-mono text-[11px] text-muted-foreground sm:max-w-[260px]">
          {host}
        </span>
        {result.hops.map((hop, i) => (
          <span key={hop.index} className="flex items-center gap-2">
            <ChevronRight
              className="animate-fade stagger size-3.5 text-muted-foreground/70"
              style={{ "--stagger": i * 2 + 1 } as CSSProperties}
            />
            <span
              className="animate-node stagger inline-flex"
              style={{ "--stagger": i * 2 + 2 } as CSSProperties}
            >
              <StatusBadge status={hop.status} label={hop.status === 200 ? "OK" : undefined} />
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
  mono = true,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        <Icon className="size-3 shrink-0" />
        <span className="truncate">{label}</span>
      </p>
      <p
        className={cn("mt-0.5 truncate text-xs text-foreground", mono && "font-mono tabular-nums")}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}

export function ChainTab({ result }: { result: RedirectAnalysis }) {
  return (
    <div className="space-y-5">
      <FlowStrip result={result} />

      <ol className="relative space-y-3 pl-7 sm:pl-9">
        {/* connecting rail */}
        <span
          className="animate-draw pointer-events-none absolute bottom-4 left-[10px] top-4 w-px origin-top bg-gradient-to-b from-brand/50 via-hairline to-transparent sm:left-[14px]"
          aria-hidden
        />
        {result.hops.map((hop, i) => {
          const tone = statusTone(hop.status);
          const slow = hop.responseTimeMs > SLOW_HOP_MS;
          return (
            <li
              key={hop.index}
              className="animate-rise stagger relative"
              style={{ "--stagger": i * 2 } as CSSProperties}
            >
              <span
                className={cn(
                  "animate-node stagger absolute -left-7 top-5 grid size-5 place-items-center rounded-full border bg-background sm:-left-9",
                  ringTone[tone],
                )}
                style={{ "--stagger": i * 2 + 1 } as CSSProperties}
                aria-hidden
              >
                <span className={cn("size-2 rounded-full", dotTone[tone])} />
              </span>

              <div className="panel panel-hover p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="font-mono text-[10px] tabular-nums">
                    HOP {hop.index + 1}
                  </Badge>
                  <StatusBadge status={hop.status} />
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {hop.redirectType}
                  </span>
                  {hop.protocol === "https" ? (
                    <span className="ml-auto inline-flex items-center gap-1 rounded-md border border-success/25 bg-success/10 px-1.5 py-0.5 text-[10px] font-semibold text-success">
                      <Lock className="size-3" /> HTTPS
                    </span>
                  ) : (
                    <span className="ml-auto inline-flex items-center gap-1 rounded-md border border-destructive/25 bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
                      <Unlock className="size-3" /> HTTP
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-start gap-2">
                  <p className="min-w-0 break-all font-mono text-xs leading-relaxed text-foreground">
                    {hop.url}
                  </p>
                  <CopyButton value={hop.url} label="Copy URL" />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 border-t border-hairline pt-3 sm:grid-cols-4">
                  <Meta
                    icon={Clock}
                    label="Response"
                    value={`${hop.responseTimeMs} ms${slow ? " · slow" : ""}`}
                  />
                  <Meta icon={Globe} label="Protocol" value={hop.protocol.toUpperCase()} />
                  <Meta icon={Server} label="Server" value={hop.server ?? "not exposed"} />
                  <Meta icon={MapPin} label="Node / IP" value={hop.ip ?? "not exposed"} />
                </div>

                {isRedirect(hop.status) ? (
                  <div className="mt-3 rounded-lg border border-hairline bg-surface-muted px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Location header
                    </p>
                    <p
                      className={cn(
                        "mt-0.5 break-all font-mono text-xs",
                        hop.location ? "text-foreground" : "text-destructive",
                      )}
                    >
                      {hop.location ?? "missing — broken redirect"}
                    </p>
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-foreground">Detected findings</h3>
        <IssueList issues={result.issues} />
      </div>
    </div>
  );
}
