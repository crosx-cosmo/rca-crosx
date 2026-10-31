import {
  Bot,
  Link2,
  Loader2,
  Monitor,
  Play,
  Rows3,
  Share2,
  Smartphone,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { USER_AGENT_PRESETS } from "@/lib/redirect-analysis";
import type { UserAgentPreset } from "@/lib/redirect-types";

const UA_ICON: Record<UserAgentPreset, typeof Monitor> = {
  "desktop-chrome": Monitor,
  "mobile-iphone": Smartphone,
  "mobile-android": Smartphone,
  "googlebot-smartphone": Bot,
  "googlebot-desktop": Bot,
  "social-bot": Share2,
};

interface Props {
  loading: boolean;
  onAnalyze: (urls: string[], userAgent: UserAgentPreset) => void;
  onClear: () => void;
  onDemo: () => void;
  initialUrl?: string;
}

export function UrlInputPanel({ loading, onAnalyze, onClear, onDemo, initialUrl }: Props) {
  const [bulk, setBulk] = useState(false);
  const [single, setSingle] = useState(initialUrl ?? "");
  const [many, setMany] = useState("");
  const [userAgent, setUserAgent] = useState<UserAgentPreset>("desktop-chrome");

  useEffect(() => {
    if (initialUrl) {
      setBulk(false);
      setSingle(initialUrl);
    }
  }, [initialUrl]);

  const urls = useMemo(() => {
    const rawUrls = bulk
      ? many
          .split(/[\n,\s]+/)
          .map((u) => u.trim())
          .filter(Boolean)
      : single.trim()
        ? [single.trim()]
        : [];
    return rawUrls.slice(0, 20);
  }, [bulk, many, single]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    onAnalyze(urls, userAgent);
  }

  function clear() {
    setSingle("");
    setMany("");
    onClear();
  }

  return (
    <form onSubmit={submit} className="panel animate-reveal overflow-hidden p-4 sm:p-6">
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/60 to-transparent" />

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
        <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">
          <Link2 className="size-4 shrink-0 text-brand" />
          <span className="truncate">{bulk ? "Bulk analysis" : "Analyze a URL"}</span>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="ua-preset" className="sr-only">
              User-Agent profile
            </Label>
            <Select
              value={userAgent}
              onValueChange={(val) => setUserAgent(val as UserAgentPreset)}
            >
              <SelectTrigger
                id="ua-preset"
                aria-label="User-Agent profile"
                className="h-8 w-auto min-w-[175px] gap-2 border-hairline bg-surface-muted px-2.5 font-mono text-[11px] font-medium text-foreground sm:min-w-[225px]"
              >
                <SelectValue placeholder="Select User-Agent" />
              </SelectTrigger>
              <SelectContent align="end" className="min-w-[265px]">
                <SelectGroup>
                  <SelectLabel>Simulated User-Agent Profile</SelectLabel>
                  {(
                    Object.entries(USER_AGENT_PRESETS) as Array<
                      [UserAgentPreset, (typeof USER_AGENT_PRESETS)[UserAgentPreset]]
                    >
                  ).map(([key, preset]) => {
                    const Icon = UA_ICON[key] ?? Monitor;
                    return (
                      <SelectItem key={key} value={key} className="font-mono text-[11.5px]">
                        <span className="inline-flex items-center gap-2">
                          <Icon className="size-3.5 shrink-0 text-brand" />
                          <span className="truncate">{preset.label}</span>
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Rows3 className="size-3.5 text-muted-foreground" />
            <Label htmlFor="bulk-mode" className="text-[11px] font-medium text-muted-foreground">
              Bulk
            </Label>
            <Switch id="bulk-mode" checked={bulk} onCheckedChange={setBulk} />
          </div>
        </div>
      </div>

      <div className="mt-4">
        {bulk ? (
          <Textarea
            value={many}
            onChange={(e) => setMany(e.target.value)}
            aria-label="URLs to trace in bulk (one per line)"
            placeholder={"https://example.com/go?click_id=123\nhttps://another.com/offer"}
            rows={5}
            className="resize-y rounded-xl border-hairline bg-surface-muted font-mono text-sm transition-shadow focus-visible:shadow-soft"
          />
        ) : (
          <Input
            value={single}
            onChange={(e) => setSingle(e.target.value)}
            aria-label="URL to trace"
            placeholder="https://example.com/go?click_id=123&aff_id=99"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            className="h-12 rounded-xl border-hairline bg-surface-muted font-mono text-sm transition-shadow focus-visible:shadow-soft"
          />
        )}
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button type="submit" variant="hero" size="lg" disabled={loading || !urls.length}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
          {loading ? "Analyzing…" : "Analyze"}
        </Button>
        <Button type="button" variant="outline" size="lg" onClick={clear} disabled={loading}>
          <X className="size-4" />
          Clear
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={onDemo}
          disabled={loading}
          className="text-muted-foreground hover:text-foreground sm:ml-auto"
        >
          <Sparkles className="size-4 text-brand" />
          Load demo data
        </Button>
      </div>

      {bulk && urls.length > 0 ? (
        <p className="animate-fade mt-3 font-mono text-[11px] text-muted-foreground">
          {urls.length} URL{urls.length === 1 ? "" : "s"} queued · max 20 per run
        </p>
      ) : null}
    </form>
  );
}

