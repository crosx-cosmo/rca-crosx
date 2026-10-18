import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { RedirectAnalysis } from "./redirect-types";

const inputSchema = z.object({
  url: z.string().min(1, "URL is required").max(2048),
});

/**
 * The trace engine is server-only (raw HTTP tracing, DNS checks, headless
 * browser fallback) and is loaded inside the handler so it never enters the
 * client bundle.
 */
async function trace(url: string): Promise<RedirectAnalysis> {
  const { traceUrl } = await import("./trace-engine.server");
  return traceUrl(url);
}

export const analyzeRedirectChain = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => trace(data.url));

export const analyzeRedirectChains = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ urls: z.array(z.string().max(2048)).min(1).max(10) }).parse(data),
  )
  .handler(async ({ data }) => {
    const results: RedirectAnalysis[] = [];
    for (const url of data.urls) {
      results.push(await trace(url));
    }
    return results;
  });
