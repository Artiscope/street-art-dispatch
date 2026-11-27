// Checks on the site's content. data/content.json stays the one place the words live,
// because Artiscope Digital Home reads and writes it. These rules stop a build if a dispatch,
// column or artist profile is malformed, so a mistake shows up before it reaches the live site.
import { defineCollection } from "astro:content";
import { file } from "astro/loaders";
import { z } from "astro/zod";

const slug = z.string().regex(/^[a-z0-9][a-z0-9-]{0,80}$/, "a web address of small letters, digits and hyphens");
const slugOf = (s: unknown) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const fromContent = (key: string, id: (x: Record<string, unknown>) => unknown) => (text: string) =>
  (JSON.parse(text)[key] || []).map((x: Record<string, unknown>) => ({ ...x, id: id(x) }));

const article = z.object({
  slug,
  title: z.string().min(1),
  kicker: z.string().min(1),
  standfirst: z.string().min(1),
  body: z.string().min(1),
  tags: z.array(z.string()).default([]),
  cover: z.string().optional(),
}).passthrough();

const dispatches = defineCollection({ loader: file("data/content.json", { parser: fromContent("features", (x) => x.slug) }), schema: article });
const columns = defineCollection({ loader: file("data/content.json", { parser: fromContent("columns", (x) => x.slug) }), schema: article });

const artists = defineCollection({
  loader: file("data/content.json", { parser: fromContent("artists", (x) => slugOf(x.name)) }),
  schema: z.object({
    name: z.string().min(1),
    role: z.string().optional(),
    summary: z.string().optional(),
    // each source is [what it is, its web address]
    sources: z.array(z.tuple([z.string().min(1), z.string().url()]).rest(z.unknown())).optional(),
  }).passthrough(),
});

export const collections = { dispatches, columns, artists };
