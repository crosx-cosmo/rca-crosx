import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { RedirectAnalysis, UserAgentPreset } from "./redirect-types";

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

const inputSchema = z.object({
  url: z.string().min(1, "URL is required").max(2048),
  userAgent: uaSchema,
});

/**
 * The trace engine is server-only (raw HTTP tracing, DNS checks, headless
 * browser fallback) and is loaded inside the handler so it never enters the
 * client bundle.
 */
async function trace(url: string, userAgent?: UserAgentPreset): Promise<RedirectAnalysis> {
  const { traceUrl } = await import("./trace-engine.server");
  return traceUrl(url, userAgent);
}

export const analyzeRedirectChain = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => trace(data.url, data.userAgent));

export const analyzeRedirectChains = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        urls: z.array(z.string().max(2048)).min(1).max(20),
        userAgent: uaSchema,
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { traceUrl } = await import("./trace-engine.server");
    const concurrency = 5;
    const results = new Array<RedirectAnalysis>(data.urls.length);
    let cursor = 0;
    const workers = Array.from(
      { length: Math.min(concurrency, data.urls.length) },
      async () => {
        while (cursor < data.urls.length) {
          const index = cursor++;
          const url = data.urls[index]!;
          results[index] = await traceUrl(url, data.userAgent);
        }
      },
    );
    await Promise.all(workers);
    return results;
  });

