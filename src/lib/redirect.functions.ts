import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  MAX_HOPS,
  assemble,
  isRedirect,
  normalizeUrl,
  paramsOf,
  protocolOf,
  redirectTypeLabel,
} from "./redirect-analysis";
import type { RedirectAnalysis, RedirectHop } from "./redirect-types";

const inputSchema = z.object({
  url: z.string().min(1, "URL is required"),
});

const USER_AGENT =
  "Mozilla/5.0 (compatible; RedirectChainAnalyzer/1.0; +https://lovable.dev)";

function headersToObject(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

function extractMeta(html: string) {
  const canonical =
    html.match(/<link[^>]+rel=["']canonical["'][^>]*>/i)?.[0]?.match(/href=["']([^"']+)["']/i)?.[1] ??
    null;
  const metaRobots =
    html
      .match(/<meta[^>]+name=["']robots["'][^>]*>/i)?.[0]
      ?.match(/content=["']([^"']*)["']/i)?.[1] ?? null;
  return { canonical, metaRobots };
}

async function followChain(rawUrl: string): Promise<RedirectAnalysis> {
  const startUrl = normalizeUrl(rawUrl);
  const hops: RedirectHop[] = [];
  const seen = new Set<string>();
  let current = startUrl;
  let redirectLoop = false;
  let truncated = false;
  let error: string | null = null;
  let page = { canonical: null as string | null, metaRobots: null as string | null };

  try {
    new URL(startUrl);
  } catch {
    return assemble({
      startUrl: rawUrl,
      hops: [],
      redirectLoop: false,
      truncated: false,
      page,
      source: "live",
      error: "That does not look like a valid URL.",
    });
  }

  for (let i = 0; i < MAX_HOPS; i += 1) {
    if (seen.has(current)) {
      redirectLoop = true;
      break;
    }
    seen.add(current);

    const started = Date.now();
    let response: Response;
    try {
      response = await fetch(current, {
        method: "GET",
        redirect: "manual",
        headers: { "user-agent": USER_AGENT, accept: "*/*" },
        signal: AbortSignal.timeout(15000),
      });
    } catch (e) {
      error = e instanceof Error ? e.message : "Request failed";
      break;
    }
    const responseTimeMs = Date.now() - started;
    const headers = headersToObject(response.headers);
    const location = response.headers.get("location");
    let resolvedLocation: string | null = null;
    if (location) {
      try {
        resolvedLocation = new URL(location, current).toString();
      } catch {
        resolvedLocation = null;
      }
    }

    hops.push({
      index: i,
      url: current,
      protocol: protocolOf(current),
      status: response.status,
      statusText: response.statusText || "",
      redirectType: redirectTypeLabel(response.status),
      responseTimeMs,
      location,
      resolvedLocation,
      server: response.headers.get("server"),
      ip:
        response.headers.get("x-served-by") ??
        response.headers.get("x-amz-cf-pop") ??
        response.headers.get("cf-ray") ??
        null,
      headers,
      params: paramsOf(current),
    });

    if (isRedirect(response.status)) {
      if (!resolvedLocation) break;
      current = resolvedLocation;
      try {
        await response.body?.cancel();
      } catch {
        /* ignore */
      }
      if (i === MAX_HOPS - 1) truncated = true;
      continue;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("html")) {
      try {
        const html = (await response.text()).slice(0, 300_000);
        page = extractMeta(html);
      } catch {
        /* ignore body read errors */
      }
    }
    break;
  }

  return assemble({
    startUrl,
    hops,
    redirectLoop,
    truncated,
    page,
    source: "live",
    error,
  });
}

export const analyzeRedirectChain = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => followChain(data.url));

export const analyzeRedirectChains = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ urls: z.array(z.string()).min(1).max(20) }).parse(data))
  .handler(async ({ data }) => {
    const results: RedirectAnalysis[] = [];
    for (const url of data.urls) {
      results.push(await followChain(url));
    }
    return results;
  });
