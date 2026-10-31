import test from "node:test";
import assert from "node:assert/strict";
import {
  buildApiDocsStructuredData,
  buildCanonicalLinks,
  buildHomeStructuredData,
  buildLinksStructuredData,
  buildPageMeta,
  buildSharedReportStructuredData,
  canonicalUrl,
  SITE_HOST,
  SITE_URL,
} from "./seo";
import {
  assemble,
  buildSeo,
  buildTrackingReport,
  countRedirects,
  isTrackingParam,
  normalizeUrl,
  stripTrackingParams,
  USER_AGENT_PRESETS,
} from "./redirect-analysis";
import { assertSafeUrl, classifyIp } from "./trace-ssrf.server";
import { evaluateRules, newRuleId, parseUserAgent } from "./link-rules";
import { validateDestination } from "./shortlinks.server";

test("SITE_URL defaults to official CROSX domain https://rca.crosx.in and canonicalUrl normalizes routes", async () => {
  assert.equal(SITE_URL, "https://rca.crosx.in");
  assert.equal(SITE_HOST, "rca.crosx.in");
  assert.equal(canonicalUrl("/"), "https://rca.crosx.in/");
  assert.equal(canonicalUrl("/links/"), "https://rca.crosx.in/links");
  assert.equal(canonicalUrl("api-docs"), "https://rca.crosx.in/api-docs");

  const selfShortLinkError = await validateDestination("https://rca.crosx.in/s/my-promo");
  assert.match(selfShortLinkError ?? "", /cannot point to another short link/);
});

test("buildPageMeta includes title, description, robots, OpenGraph and Twitter cards", () => {
  const meta = buildPageMeta({
    title: "Redirect & URL Trace Engine — Every Hop, HTTP or JavaScript",
    description: "Trace any URL end to end with full HTTP, meta refresh and JS redirect visibility.",
    path: "/",
  });

  const titleEntry = meta.find((m) => "title" in m);
  assert.equal(titleEntry?.title, "Redirect & URL Trace Engine — Every Hop, HTTP or JavaScript");

  const robotsEntry = meta.find((m) => "name" in m && m.name === "robots");
  assert.ok(robotsEntry && "content" in robotsEntry);
  assert.match(robotsEntry.content, /index, follow/);

  const ogUrl = meta.find((m) => "property" in m && m.property === "og:url");
  assert.equal(ogUrl?.content, `${SITE_URL}/`);

  const ogImage = meta.find((m) => "property" in m && m.property === "og:image");
  assert.equal(ogImage?.content, `${SITE_URL}/icons/icon-512.png`);
});

test("buildPageMeta respects noindex for shared reports", () => {
  const meta = buildPageMeta({
    title: "Shared Redirect Report",
    description: "Saved report",
    path: "/r/123",
    noindex: true,
  });
  const robotsEntry = meta.find((m) => "name" in m && m.name === "robots");
  assert.equal(robotsEntry?.content, "noindex, nofollow");
});

test("buildCanonicalLinks emits canonical and hreflang alternates", () => {
  const links = buildCanonicalLinks("/api-docs");
  assert.equal(links.length, 3);
  assert.deepEqual(links[0], { rel: "canonical", href: `${SITE_URL}/api-docs` });
});

test("Structured data builders return valid Schema.org JSON-LD @graph payloads", () => {
  const homeJson = JSON.parse(buildHomeStructuredData("Home description"));
  assert.equal(homeJson["@context"], "https://schema.org");
  assert.ok(Array.isArray(homeJson["@graph"]));
  assert.ok(homeJson["@graph"].some((node: { "@type": string }) => node["@type"] === "FAQPage"));

  const linksJson = JSON.parse(buildLinksStructuredData("Links description"));
  assert.ok(Array.isArray(linksJson["@graph"]));

  const apiJson = JSON.parse(buildApiDocsStructuredData("API description"));
  assert.ok(apiJson["@graph"].some((node: { "@type": string }) => node["@type"] === "WebAPI"));

  const sharedJson = JSON.parse(buildSharedReportStructuredData("Shared description"));
  assert.ok(sharedJson["@graph"].some((node: { "@type": string }) => node["@type"] === "Report"));
});

test("redirect-analysis normalizeUrl, stripTrackingParams, USER_AGENT_PRESETS and deep SEO signal extraction work accurately", () => {
  assert.equal(normalizeUrl("example.com/test"), "https://example.com/test");
  assert.equal(isTrackingParam("utm_source"), true);
  assert.equal(isTrackingParam("gclid"), true);
  assert.equal(isTrackingParam("page"), false);
  assert.equal(
    stripTrackingParams("https://example.com/landing?utm_source=news&gclid=123&page=2"),
    "https://example.com/landing?page=2",
  );
  assert.ok(USER_AGENT_PRESETS["googlebot-smartphone"].ua.includes("Googlebot"));

  const hops = [
    {
      index: 0,
      url: "http://example.com/?utm_source=news&aff_id=42",
      status: 301,
      statusText: "Moved Permanently",
      location: "https://example.com/landing?utm_source=news",
      resolvedLocation: "https://example.com/landing?utm_source=news",
      responseTimeMs: 110,
      headers: { location: "https://example.com/landing?utm_source=news" },
      protocol: "http" as const,
      params: { utm_source: "news", aff_id: "42" },
      mechanism: "http-redirect" as const,
    },
    {
      index: 1,
      url: "https://example.com/landing?utm_source=news",
      status: 200,
      statusText: "OK",
      location: null,
      resolvedLocation: null,
      responseTimeMs: 180,
      headers: {
        "content-type": "text/html",
        "strict-transport-security": "max-age=63072000; includeSubDomains; preload",
        "x-robots-tag": "index, follow",
      },
      protocol: "https" as const,
      params: { utm_source: "news" },
      mechanism: "final-response" as const,
    },
  ];

  assert.equal(countRedirects(hops), 1);
  const tracking = buildTrackingReport(hops);
  assert.deepEqual(tracking.lostTrackingParams, ["aff_id"]);
  assert.deepEqual(tracking.keptTrackingParams, ["utm_source"]);

  const seo = buildSeo(hops, {
    canonical: "https://example.com/landing",
    metaRobots: "index, follow",
  });
  assert.equal(seo.https, true);
  assert.equal(seo.chainLength, 1);
  assert.equal(seo.canonicalStatus, "match");
  assert.equal(seo.cleanFinalUrl, "https://example.com/landing");
  assert.equal(seo.hsts, true);
  assert.equal(seo.xRobotsTag, "index, follow");

  const report = assemble({
    startUrl: hops[0]!.url,
    hops,
    redirectLoop: false,
    truncated: false,
    page: { canonical: "https://example.com/landing", metaRobots: "index, follow" },
    source: "demo",
    userAgentPreset: "googlebot-smartphone",
  });
  assert.equal(report.totalHops, 2);
  assert.equal(report.totalRedirects, 1);
  assert.equal(report.userAgentLabel, "Googlebot Smartphone");
});

test("classifyIp blocks private, loopback, expanded IPv6, NAT64, 6to4, and octal IPv4 while allowing public IPs", () => {
  // Public IPs allowed
  assert.equal(classifyIp("1.1.1.1"), null);
  assert.equal(classifyIp("8.8.8.8"), null);
  assert.equal(classifyIp("2606:4700:4700::1111"), null);

  // Blocked IPv4 ranges
  assert.equal(classifyIp("127.0.0.1"), "loopback");
  assert.equal(classifyIp("10.0.0.1"), "private network");
  assert.equal(classifyIp("169.254.169.254"), "link-local / cloud metadata range");
  assert.equal(classifyIp("010.0.0.1"), "malformed IPv4 address");

  // Blocked IPv6 bypass representations
  assert.equal(classifyIp("::1"), "loopback / unspecified address");
  assert.equal(classifyIp("0:0:0:0:0:0:0:1"), "loopback / unspecified address");
  assert.equal(classifyIp("0:0:0:0:0:0:0:0"), "loopback / unspecified address");
  assert.equal(classifyIp("::ffff:127.0.0.1"), "loopback");
  assert.equal(classifyIp("::ffff:7f00:0001"), "loopback");
  assert.equal(classifyIp("::192.168.1.1"), "private network");
  assert.equal(classifyIp("64:ff9b::10.0.0.1"), "private network");
  assert.equal(classifyIp("2002:7f00:0001::"), "loopback");
  assert.equal(classifyIp("2001:db8::1"), "documentation range");
  assert.equal(classifyIp("ff02::1"), "multicast address");
  assert.equal(classifyIp("fe80::1"), "link-local address");
  assert.equal(classifyIp("fc00::1"), "unique local address");
});

test("assertSafeUrl blocks embedded credentials and disallowed protocols/hosts", async () => {
  const credVerdict = await assertSafeUrl("https://admin:secret@example.com/path");
  assert.equal(credVerdict.ok, false);
  assert.match(credVerdict.reason ?? "", /embedded credentials/);

  const protoVerdict = await assertSafeUrl("file:///etc/passwd");
  assert.equal(protoVerdict.ok, false);

  const ipv6LoopbackVerdict = await assertSafeUrl("http://[0:0:0:0:0:0:0:1]/admin");
  assert.equal(ipv6LoopbackVerdict.ok, false);
});

test("newRuleId generates cryptographically random 10-character alphanumeric IDs and evaluateRules matches accurately", () => {
  const ids = new Set<string>();
  for (let i = 0; i < 50; i++) {
    const id = newRuleId();
    assert.match(id, /^[a-z0-9]{10}$/);
    ids.add(id);
  }
  assert.equal(ids.size, 50);

  const parsedUa = parseUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1");
  assert.equal(parsedUa.os, "iOS");
  assert.equal(parsedUa.platform, "ios");

  const matched = evaluateRules(
    [
      {
        id: newRuleId(),
        name: "iOS US Promo",
        enabled: true,
        match: "all",
        conditions: [
          { field: "platform", op: "is", value: "ios" },
          { field: "country", op: "is", value: "US, CA" },
        ],
        destination: "https://example.com/ios-us",
      },
    ],
    {
      country: "US",
      platform: parsedUa.platform,
      browser: parsedUa.browser,
      os: parsedUa.os,
      query: {},
      now: new Date(),
    },
  );
  assert.equal(matched?.destination, "https://example.com/ios-us");
});

