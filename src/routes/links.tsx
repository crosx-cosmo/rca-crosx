import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  CalendarClock,
  Check,
  Download,
  Link2,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CopyButton } from "@/components/analyzer/CopyButton";
import { ShortLinkQr } from "@/components/ShortLinkQr";
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
  setShortLinkExpiry,
  updateShortLinkDestination,
  type ShortLink,
} from "@/lib/shortlinks.functions";

const TITLE = "Short Links — Redirect Chain Analyzer";
const DESCRIPTION =
  "Create transparent short URLs with custom slugs, QR codes, expiry, click counts and simple management — validated against unsafe destinations.";

export const Route = createFileRoute("/links")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://redirect-tracer-pro.lovable.app/links" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://redirect-tracer-pro.lovable.app/links" }],
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

const isExpired = (l: ShortLink) =>
  !!l.expires_at && new Date(l.expires_at).getTime() <= Date.now();

function exportCsv(rows: ShortLink[], origin: string) {
  const header = [
    "slug",
    "short_url",
    "destination",
    "enabled",
    "clicks",
    "created_at",
    "last_clicked_at",
    "expires_at",
  ];
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = rows.map((l) =>
    [
      l.slug,
      `${origin}/s/${l.slug}`,
      l.destination,
      String(l.enabled),
      String(l.clicks),
      l.created_at,
      l.last_clicked_at ?? "",
      l.expires_at ?? "",
    ]
      .map(esc)
      .join(","),
  );
  const blob = new Blob([header.join(",") + "\n" + lines.join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "short-links.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

function LinksPage() {
  const owner = useOwner();
  const qc = useQueryClient();
  const [destination, setDestination] = useState("");
  const [slug, setSlug] = useState("");
  const [search, setSearch] = useState("");
  const [origin, setOrigin] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [expiryId, setExpiryId] = useState<string | null>(null);
  const [expiryValue, setExpiryValue] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);

  const list = useServerFn(listShortLinks);
  const create = useServerFn(createShortLink);
  const toggle = useServerFn(setShortLinkEnabled);
  const remove = useServerFn(deleteShortLink);
  const updateDest = useServerFn(updateShortLinkDestination);
  const setExpiry = useServerFn(setShortLinkExpiry);

  const links = useQuery({
    queryKey: ["short-links", owner],
    queryFn: () => list({ data: { owner: owner! } }),
    enabled: !!owner,
    retry: false,
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["short-links"] });

  const createMut = useMutation({
    mutationFn: () =>
      create({
        data: { destination: destination.trim(), slug: slug.trim() || undefined, owner: owner! },
      }),
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

  const all = links.data ?? [];
  const filtered = all.filter((l) =>
    `${l.slug} ${l.destination}`.toLowerCase().includes(search.toLowerCase()),
  );
  const totalClicks = all.reduce((sum, l) => sum + l.clicks, 0);
  const activeCount = all.filter((l) => l.enabled && !isExpired(l)).length;

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
          <h1 className="min-w-0 flex-1 truncate text-[15px] font-semibold text-foreground">
            Short Links
          </h1>
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
              <span className="shrink-0 truncate">
                {origin ? `${new URL(origin).host}/s/` : "/s/"}
              </span>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value.replace(/[^A-Za-z0-9_-]/g, ""))}
                placeholder="custom-slug (optional)"
                maxLength={40}
                className="h-11 border-0 bg-transparent font-mono shadow-none focus-visible:ring-0"
              />
            </div>
            <Button
              type="submit"
              variant="hero"
              size="lg"
              disabled={!owner || !destination.trim() || createMut.isPending}
            >
              {createMut.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Shorten
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Short links use a standard 302 redirect. Local/internal addresses, non-http(s) schemes,
            embedded credentials and links to other short links are rejected. Links are tied to this
            browser.
          </p>
        </form>

        {all.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total links", value: all.length },
              { label: "Active", value: activeCount },
              { label: "Total clicks", value: totalClicks },
            ].map((s) => (
              <div key={s.label} className="panel animate-rise p-3 text-center sm:p-4">
                <p className="text-xl font-bold text-foreground sm:text-2xl">{s.value}</p>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        <section className="panel animate-rise p-4 sm:p-6">
          <div className="mb-3 flex items-center gap-2">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your links"
              className="h-9 border-hairline bg-surface-muted text-sm"
            />
            {all.length > 0 && (
              <Button
                variant="subtle"
                size="sm"
                className="shrink-0"
                onClick={() => exportCsv(filtered, origin)}
              >
                <Download className="size-3.5" />
                <span className="hidden sm:inline">Export CSV</span>
              </Button>
            )}
          </div>

          {links.isLoading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
          ) : links.isError ? (
            <p className="py-6 text-center text-sm text-destructive">
              {(links.error as Error).message}
            </p>
          ) : filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {links.data?.length ? "No links match your search." : "No short links yet."}
            </p>
          ) : (
            <ul className="divide-y divide-hairline">
              {filtered.map((l) => {
                const shortUrl = `${origin}/s/${l.slug}`;
                const expired = isExpired(l);
                const editing = editingId === l.id;
                const settingExpiry = expiryId === l.id;
                return (
                  <li key={l.id} className="flex flex-col gap-2 py-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <a
                            href={shortUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="truncate font-mono text-sm font-semibold text-brand"
                          >
                            /s/{l.slug}
                          </a>
                          <CopyButton value={shortUrl} label="Copy short URL" />
                          {expired && (
                            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                              Expired
                            </span>
                          )}
                        </div>
                        <p className="truncate font-mono text-[11.5px] text-muted-foreground">
                          {l.destination}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {l.clicks} click{l.clicks === 1 ? "" : "s"} · created {fmt(l.created_at)}{" "}
                          · last click {fmt(l.last_clicked_at)}
                          {l.expires_at && ` · expires ${fmt(l.expires_at)}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <ShortLinkQr url={shortUrl} slug={l.slug} />
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Edit destination"
                          onClick={() => {
                            setEditingId(editing ? null : l.id);
                            setEditValue(l.destination);
                            setExpiryId(null);
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Set expiry"
                          onClick={() => {
                            setExpiryId(settingExpiry ? null : l.id);
                            setExpiryValue(
                              l.expires_at ? new Date(l.expires_at).toISOString().slice(0, 16) : "",
                            );
                            setEditingId(null);
                          }}
                        >
                          <CalendarClock className="size-4" />
                        </Button>
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
                    </div>

                    {editing && (
                      <form
                        className="flex flex-col gap-2 sm:flex-row"
                        onSubmit={(e) => {
                          e.preventDefault();
                          updateDest({
                            data: { id: l.id, destination: editValue.trim(), owner: owner! },
                          })
                            .then(() => {
                              toast.success("Destination updated");
                              setEditingId(null);
                              refresh();
                            })
                            .catch((err: Error) => toast.error(err.message));
                        }}
                      >
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          inputMode="url"
                          spellCheck={false}
                          className="h-9 flex-1 border-hairline bg-surface-muted font-mono text-sm"
                        />
                        <div className="flex gap-2">
                          <Button
                            type="submit"
                            variant="hero"
                            size="sm"
                            disabled={!editValue.trim()}
                          >
                            <Check className="size-3.5" /> Save
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingId(null)}
                          >
                            <X className="size-3.5" /> Cancel
                          </Button>
                        </div>
                      </form>
                    )}

                    {settingExpiry && (
                      <form
                        className="flex flex-col gap-2 sm:flex-row sm:items-center"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const iso = expiryValue ? new Date(expiryValue).toISOString() : null;
                          setExpiry({ data: { id: l.id, expiresAt: iso, owner: owner! } })
                            .then(() => {
                              toast.success(iso ? "Expiry set" : "Expiry removed");
                              setExpiryId(null);
                              refresh();
                            })
                            .catch((err: Error) => toast.error(err.message));
                        }}
                      >
                        <Input
                          type="datetime-local"
                          value={expiryValue}
                          onChange={(e) => setExpiryValue(e.target.value)}
                          className="h-9 flex-1 border-hairline bg-surface-muted text-sm"
                        />
                        <div className="flex gap-2">
                          <Button type="submit" variant="hero" size="sm">
                            <Check className="size-3.5" />{" "}
                            {expiryValue ? "Set expiry" : "Remove expiry"}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpiryId(null)}
                          >
                            <X className="size-3.5" /> Cancel
                          </Button>
                        </div>
                      </form>
                    )}
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
