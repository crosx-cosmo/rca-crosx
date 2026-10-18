import { Link2, Loader2, Play, Rows3, Sparkles, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Props {
  loading: boolean;
  onAnalyze: (urls: string[]) => void;
  onClear: () => void;
  onDemo: () => void;
}

export function UrlInputPanel({ loading, onAnalyze, onClear, onDemo }: Props) {
  const [bulk, setBulk] = useState(false);
  const [single, setSingle] = useState("");
  const [many, setMany] = useState("");

  const urls = bulk
    ? many
        .split(/[\n,\s]+/)
        .map((u) => u.trim())
        .filter(Boolean)
    : single.trim()
      ? [single.trim()]
      : [];

  function submit(event: React.FormEvent) {
    event.preventDefault();
    onAnalyze(urls);
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
        <div className="flex shrink-0 items-center gap-2">
          <Rows3 className="size-3.5 text-muted-foreground" />
          <Label htmlFor="bulk-mode" className="text-[11px] font-medium text-muted-foreground">
            Bulk
          </Label>
          <Switch id="bulk-mode" checked={bulk} onCheckedChange={setBulk} />
        </div>
      </div>

      <div className="mt-4">
        {bulk ? (
          <Textarea
            value={many}
            onChange={(e) => setMany(e.target.value)}
            placeholder={"https://example.com/go?click_id=123\nhttps://another.com/offer"}
            rows={5}
            className="resize-y rounded-xl border-hairline bg-surface-muted font-mono text-sm transition-shadow focus-visible:shadow-soft"
          />
        ) : (
          <Input
            value={single}
            onChange={(e) => setSingle(e.target.value)}
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
