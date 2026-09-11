/**
 * API service layer.
 *
 * The UI never fabricates redirect data — it always goes through this layer.
 *
 * Resolution order:
 *  1. `VITE_REDIRECT_API_URL` — an external backend endpoint, if configured.
 *     Expected: POST { urls: string[] } -> RedirectAnalysis[]  (or a single object)
 *  2. The built-in server function, which performs the real HTTP requests.
 *  3. Demo mode (explicit user action only) for previewing the UI with no API.
 */
import { analyzeRedirectChain, analyzeRedirectChains } from "./redirect.functions";
import { buildDemoAnalysis } from "./redirect-demo";
import { normalizeUrl } from "./redirect-analysis";
import { saveAnalyses, type ShareIdMap } from "./analysis-store";
import type { RedirectAnalysis } from "./redirect-types";

export interface AnalyzeOutcome {
  results: RedirectAnalysis[];
  shareIds: ShareIdMap;
}

const EXTERNAL_ENDPOINT = import.meta.env["VITE_REDIRECT_API_URL"] as string | undefined;

export function activeBackend(): "external" | "server-function" {
  return EXTERNAL_ENDPOINT ? "external" : "server-function";
}

async function callExternal(urls: string[]): Promise<RedirectAnalysis[]> {
  const response = await fetch(EXTERNAL_ENDPOINT!, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ urls }),
  });
  if (!response.ok) {
    throw new Error(`Analyzer API responded with ${response.status}`);
  }
  const payload = await response.json();
  return Array.isArray(payload) ? payload : [payload];
}

export async function analyzeUrls(rawUrls: string[]): Promise<AnalyzeOutcome> {
  const urls = rawUrls.map(normalizeUrl).filter(Boolean);
  if (!urls.length) throw new Error("Enter at least one URL to analyze.");

  const results = EXTERNAL_ENDPOINT
    ? await callExternal(urls)
    : urls.length === 1
      ? [await analyzeRedirectChain({ data: { url: urls[0]! } })]
      : await analyzeRedirectChains({ data: { urls } });

  // Saving powers shareable links; a failure must never fail the analysis.
  const shareIds = await saveAnalyses(results).catch(() => ({}) as ShareIdMap);
  return { results, shareIds };
}

export function demoAnalysis(): RedirectAnalysis[] {
  return [buildDemoAnalysis("http://demo-offer.example/go?click_id=abc123&aff_id=5541")];
}
