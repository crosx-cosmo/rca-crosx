import { createServerFn } from "@tanstack/react-start";
import { getRequestHost } from "@tanstack/react-start/server";
import { z } from "zod";

export interface ShortLink {
  id: string;
  slug: string;
  destination: string;
  enabled: boolean;
  clicks: number;
  last_clicked_at: string | null;
  created_at: string;
  expires_at: string | null;
}

const owner = z.string().regex(/^[A-Za-z0-9-]{32,128}$/, "Invalid owner token");
const SLUG_RE = /^[A-Za-z0-9_-]{3,40}$/;
const RESERVED = new Set(["api", "admin", "links", "s", "r", "api-docs", "login", "www"]);

function dbError(message: string): Error {
  if (/fetch failed|ENOTFOUND|resolve/i.test(message)) {
    return new Error("The links database is currently unreachable. Please try again later.");
  }
  return new Error(message);
}

function randomSlug(): string {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(7));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export const createShortLink = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        destination: z.string().trim().min(1).max(2048),
        slug: z.string().trim().max(40).optional(),
        owner,
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { shortLinkDb, validateDestination } = await import("./shortlinks.server");
    const problem = await validateDestination(data.destination, getRequestHost());
    if (problem) throw new Error(problem);

    const custom = data.slug || "";
    if (custom && (!SLUG_RE.test(custom) || RESERVED.has(custom.toLowerCase()))) {
      throw new Error("Slug must be 3–40 letters, numbers, - or _, and not a reserved word.");
    }
    const db = shortLinkDb();
    for (let attempt = 0; attempt < (custom ? 1 : 4); attempt++) {
      const slug = custom || randomSlug();
      const { data: row, error } = await db.rpc("create_short_link", {
        p_slug: slug,
        p_destination: new URL(data.destination).toString(),
        p_owner: data.owner,
      });
      if (!error) return row as ShortLink;
      if (error.code === "23505") {
        if (custom) throw new Error("That slug is already taken.");
        continue;
      }
      throw dbError(error.message);
    }
    throw new Error("Could not generate a unique slug. Try again.");
  });

export const listShortLinks = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ owner }).parse(d))
  .handler(async ({ data }) => {
    const { shortLinkDb } = await import("./shortlinks.server");
    const { data: rows, error } = await shortLinkDb().rpc("list_short_links", {
      p_owner: data.owner,
    });
    if (error) throw dbError(error.message);
    return (rows ?? []) as ShortLink[];
  });

export const setShortLinkEnabled = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid(), enabled: z.boolean(), owner }).parse(d))
  .handler(async ({ data }) => {
    const { shortLinkDb } = await import("./shortlinks.server");
    const { error } = await shortLinkDb().rpc("set_short_link_enabled", {
      p_id: data.id,
      p_owner: data.owner,
      p_enabled: data.enabled,
    });
    if (error) throw dbError(error.message);
    return { ok: true };
  });

export const deleteShortLink = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid(), owner }).parse(d))
  .handler(async ({ data }) => {
    const { shortLinkDb } = await import("./shortlinks.server");
    const { error } = await shortLinkDb().rpc("delete_short_link", {
      p_id: data.id,
      p_owner: data.owner,
    });
    if (error) throw dbError(error.message);
    return { ok: true };
  });
