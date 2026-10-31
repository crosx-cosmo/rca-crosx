import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import type { RedirectAnalysis } from "@/lib/redirect-types";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type, accept, authorization, x-requested-with",
  "access-control-expose-headers": "x-ratelimit-limit, x-ratelimit-remaining, x-ratelimit-reset",
  "access-control-max-age": "86400",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  vary: "Origin",
};

const MAX_URLS = 5;
const RATE_LIMIT = 30; // requests per window
const WINDOW_MS = 60_000;
const MAX_BUCKETS = 5_000;

const buckets = new Map<string, { count: number; reset: number }>();

function rateLimit(key: string) {
  const now = Date.now();
  if (buckets.size > MAX_BUCKETS) {
    for (const [k, v] of buckets) {
      if (v.reset < now) buckets.delete(k);
    }
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.reset < now) {
    buckets.set(key, { count: 1, reset: now + WINDOW_MS });
    return { ok: true, remaining: RATE_LIMIT - 1, reset: now + WINDOW_MS };
  }
  bucket.count += 1;
  return {
    ok: bucket.count <= RATE_LIMIT,
    remaining: Math.max(0, RATE_LIMIT - bucket.count),
    reset: bucket.reset,
  };
}

function constantTimeEquals(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const bufA = enc.encode(a);
  const bufB = enc.encode(b);
  const len = Math.max(bufA.length, bufB.length);
  let diff = bufA.length ^ bufB.length;
  for (let i = 0; i < len; i++) {
    diff |= (bufA[i] ?? 0) ^ (bufB[i] ?? 0);
  }
  return diff === 0;
}

const uaSchema = z
  .enum([
    "desktop-chrome",
    "mobile-iphone",
    "mobile-android",
    "googlebot-smartphone",
    "googlebot-desktop",
    "social-bot",
  ])
  .optional();

const bodySchema = z.object({
  url: z.string().min(1).max(2048).optional(),
  urls: z.array(z.string().min(1).max(2048)).min(1).max(MAX_URLS).optional(),
  userAgent: uaSchema,
});

function json(data: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...CORS,
      ...extra,
    },
  });
}

async function run(
  urls: string[],
  userAgent?: z.infer<typeof uaSchema>,
): Promise<RedirectAnalysis[]> {
  const { traceUrl } = await import("@/lib/trace-engine.server");
  return Promise.all(urls.map((url) => traceUrl(url, userAgent)));
}

const USAGE = {
  endpoint: "/api/public/trace",
  methods: ["GET", "POST"],
  get: "/api/public/trace?url=https://example.com&userAgent=googlebot-smartphone (repeat ?url= or comma-separate for batches)",
  post: { url: "https://example.com", userAgent: "desktop-chrome" },
  batch: { urls: ["https://example.com", "https://bit.ly/x"], userAgent: "mobile-iphone" },
  userAgents: [
    "desktop-chrome",
    "mobile-iphone",
    "mobile-android",
    "googlebot-smartphone",
    "googlebot-desktop",
    "social-bot",
  ],
  limits: {
    maxUrlsPerRequest: MAX_URLS,
    requestsPerMinute: RATE_LIMIT,
    maxHops: 20,
    perHopTimeoutSeconds: 15,
    overallTimeoutSeconds: 55,
  },
  mechanisms: [
    "http-redirect",
    "meta-refresh",
    "javascript-redirect",
    "browser-navigation",
    "blocked",
    "final-response",
  ],
  docs: "/api-docs",
};

async function handle(
  request: Request,
  urls: string[],
  userAgent?: z.infer<typeof uaSchema>,
) {
  const configuredApiKey =
    typeof process !== "undefined" ? process.env["REDIRECT_TRACER_API_KEY"]?.trim() : undefined;
  const authHeader = request.headers.get("authorization");
  if (configuredApiKey && authHeader) {
    const provided = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!constantTimeEquals(provided, configuredApiKey)) {
      return json({ error: "Invalid API key." }, 401);
    }
  }

  if (!urls.length) {
    return json({ error: "Provide a 'url' (or 'urls' array) to trace.", usage: USAGE }, 400);
  }
  if (urls.length > MAX_URLS) {
    return json({ error: `A maximum of ${MAX_URLS} URLs per request is allowed.` }, 400);
  }

  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "anonymous";
  const limit = rateLimit(ip);
  const headers = {
    "x-ratelimit-limit": String(RATE_LIMIT),
    "x-ratelimit-remaining": String(limit.remaining),
    "x-ratelimit-reset": String(Math.ceil(limit.reset / 1000)),
  };
  if (!limit.ok) {
    return json(
      {
        error: "Rate limit exceeded. Try again shortly.",
        limit: RATE_LIMIT,
        windowSeconds: WINDOW_MS / 1000,
      },
      429,
      headers,
    );
  }

  try {
    const results = await run(urls, userAgent);
    return json({ count: results.length, results }, 200, headers);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Trace failed" }, 500, headers);
  }
}

export const Route = createFileRoute("/api/public/trace")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ request }) => {
        const params = new URL(request.url).searchParams;
        const urls = [...params.getAll("url"), ...params.getAll("urls")]
          .flatMap((v) => v.split(","))
          .map((v) => v.trim())
          .filter(Boolean)
          .slice(0, MAX_URLS + 1);
        const parsedUa = uaSchema.safeParse(params.get("userAgent") ?? undefined);
        if (!urls.length) return json({ ok: true, usage: USAGE });
        return handle(request, urls, parsedUa.success ? parsedUa.data : undefined);
      },
      POST: async ({ request }) => {
        let parsed: z.infer<typeof bodySchema>;
        try {
          parsed = bodySchema.parse(await request.json());
        } catch {
          return json(
            { error: "Invalid JSON body. Expected { url: string } or { urls: string[] }." },
            400,
          );
        }
        const urls = [...(parsed.url ? [parsed.url] : []), ...(parsed.urls ?? [])];
        return handle(request, urls, parsed.userAgent);
      },
    },
  },
});

