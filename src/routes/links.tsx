import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Link2, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CopyButton } from "@/components/analyzer/CopyButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { CROSX_LOGO_URL } from "@/lib/brand";
import {
  createShortLink,
  deleteShortLink,
  listShortLinks,
  setShortLinkEnabled,
} from "@/lib/shortlinks.functions";

const TITLE = "Short Links — Redirect Chain Analyzer";
const DESCRIPTION =
  "Create transparent short URLs with custom slugs, click counts and simple management — validated against unsafe destinations.";

export const Route = createFileRoute("/links")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LinksPage,
});

const OWNER_KEY = "crosx-shortlink-owner";

function useOwner(): string | null {
  const [owner, setOwner] = useState<string | null>(null);
  useEffect(() => {
    let value = localStorage.getItem(OWNER_KEY);
    if (!value) {
      value = `${crypto.randomUUID()}-${crypto.randomUUID()}`;
      localStorage.setItem(OWNER_KEY, value);
    }
    setOwner(value);
  }, []);
  return owner;
}

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : "—");

function LinksPage() {
  const owner = useOwner();
  const qc = useQueryClient();
  const [destination, setDestination] = useState("");
  const [slug, setSlug] = useState("");
  const [search, setSearch] = useState("");
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);

  const list = useServerFn(listShortLinks);
  const create = useServerFn(createShortLink);
  const toggle = useServerFn(setShortLinkEnabled);
  const remove = useServerFn(deleteShortLink);

  const links = useQuery({
    queryKey: ["short-links", owner],
    queryFn: () => list({ data: { owner: owner! } }),
    enabled: !!owner,
    retry: false,
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["short-links"] });

  const createMut = useMutation({
    mutationFn: () =>
      create({ data: { destination: destination.trim(), slug: slug.trim() || undefined, owner: owner! } }),
    onSuccess: (row) => {
      const url = `${origin}/s/${row.slug}`;
      toast.success("Short link created", { description: url });
      void navigator.clipboard?.writeText(url).catch(() => {});
      setDestination("");
      setSlug("");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = (links.data ?? []).filter((l) =>
    `${l.slug} ${l.destination}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="bg-hero min-h-screen">
      <header className="app-safe-top sticky top-0 z-30 border-b border-hairline bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link to="/" aria-label="CROSX home" className="flex shrink-0 items-center">
            <img
              src={CROSX_LOGO_URL}
              alt="CROSX Advertising & Marketing Agency"
              className="h-6 w-auto max-w-[130px] object-contain object-left sm:h-7 sm:max-w-[160px]"
            />
          </Link>
          <span aria-hidden="true" className="h-6 w-px shrink-0 bg-hairline" />
          <h1 className="min-w-0 flex-1 truncate text-[15px] font-semibold text-foreground">Short Links</h1>
          <Button asChild variant="subtle" size="sm">
            <Link to="/">
              <ArrowLeft className="size-3.5" />
              <span className="hidden sm:inline">Analyzer</span>
            </Link>
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-5 px-4 py-7 sm:px-6 sm:py-10">
        <form
          className="panel animate-reveal space-y-3 p-4 sm:p-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (owner && destination.trim()) createMut.mutate();
          }}
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Link2 className="size-4 text-brand" /> Create a short link
          </div>
          <Input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="https://example.com/landing?utm_source=newsletter"
            inputMode="url"
            spellCheck={false}
            className="h-12 rounded-xl border-hairline bg-surface-muted font-mono text-sm"
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex flex-1 items-center rounded-xl border border-hairline bg-surface-muted pl-3 font-mono text-sm text-muted-foreground">
              <span className="shrink-0 truncate">{origin ? `${new URL(origin).host}/s/` : "/s/"}</span>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value.replace(/[^A-Za-z0-9_-]/g, ""))}
                placeholder="custom-slug (optional)"
                maxLength={40}
                className="h-11 border-0 bg-transparent font-mono shadow-none focus-visible:ring-0"
              />
            </div>
            <Button type="submit" variant="hero" size="lg" disabled={!owner || !destination.trim() || createMut.isPending}>
              {createMut.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Shorten
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Short links use a standard 302 redirect. Local/internal addresses, non-http(s) schemes,
            embedded credentials and links to other short links are rejected. Links are tied to this
            browser.
          </p>
        </form>

        <section className="panel animate-rise p-4 sm:p-6">
          <div className="mb-3 flex items-center gap-2">
            <Search className="size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your links"
              className="h-9 border-hairline bg-surface-muted text-sm"
            />
          </div>

          {links.isLoading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
          ) : links.isError ? (
            <p className="py-6 text-center text-sm text-destructive">{(links.error as Error).message}</p>
          ) : filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {links.data?.length ? "No links match your search." : "No short links yet."}
            </p>
          ) : (
            <ul className="divide-y divide-hairline">
              {filtered.map((l) => {
                const shortUrl = `${origin}/s/${l.slug}`;
                return (
                  <li key={l.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <a href={shortUrl} target="_blank" rel="noreferrer" className="truncate font-mono text-sm font-semibold text-brand">
                          /s/{l.slug}
                        </a>
                        <CopyButton value={shortUrl} label="Copy short URL" />
                      </div>
                      <p className="truncate font-mono text-[11.5px] text-muted-foreground">{l.destination}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {l.clicks} click{l.clicks === 1 ? "" : "s"} · created {fmt(l.created_at)} · last click {fmt(l.last_clicked_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={l.enabled}
                        aria-label={l.enabled ? "Disable link" : "Enable link"}
                        onCheckedChange={(v) =>
                          toggle({ data: { id: l.id, enabled: v, owner: owner! } })
                            .then(refresh)
                            .catch((e: Error) => toast.error(e.message))
                        }
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Delete link"
                        onClick={() => {
                          if (!confirm(`Delete /s/${l.slug}?`)) return;
                          remove({ data: { id: l.id, owner: owner! } })
                            .then(() => {
                              toast.success("Link deleted");
                              refresh();
                            })
                            .catch((e: Error) => toast.error(e.message));
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
