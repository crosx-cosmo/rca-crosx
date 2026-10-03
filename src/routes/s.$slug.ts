import { createFileRoute } from "@tanstack/react-router";

const page = (status: number, msg: string) =>
  new Response(
    `<!doctype html><meta charset="utf-8"><title>Short link</title><body style="font-family:system-ui;padding:3rem;text-align:center"><h1>${status}</h1><p>${msg}</p><a href="/">Redirect Chain Analyzer</a></body>`,
    { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } },
  );

export const Route = createFileRoute("/s/$slug")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        if (!/^[A-Za-z0-9_-]{3,40}$/.test(params.slug)) return page(404, "Short link not found.");
        const { shortLinkDb, validateDestination } = await import("@/lib/shortlinks.server");
        const { data, error } = await shortLinkDb().rpc("resolve_short_link", { p_slug: params.slug });
        if (error) return page(503, "Short links are temporarily unavailable.");
        const destination = typeof data === "string" ? data : null;
        if (!destination) return page(404, "This short link does not exist or has been disabled.");
        // Re-validate at redirect time so a destination can never become an open redirect to internal hosts.
        const problem = await validateDestination(destination, new URL(request.url).host);
        if (problem) return page(410, "This short link's destination is no longer allowed.");
        return new Response(null, {
          status: 302,
          headers: {
            location: destination,
            "cache-control": "no-store",
            "referrer-policy": "strict-origin-when-cross-origin",
            "x-robots-tag": "noindex",
          },
        });
      },
    },
  },
});
