// Builds the Street Art Dispatch pages from the data files into a folder.
// The drawing itself is in assets/render.js, which the page editor in Artiscope
// Digital Home also uses, so the preview and the published page always match.
//   node tools/build.mjs <folder>        (python3 tools/build.py <folder> does the same)
// With no folder, the pages are written next to this folder, as before.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.resolve(process.argv[2] || ROOT);
const SAD = createRequire(import.meta.url)(path.join(ROOT, "assets", "render.js"));
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));
const fail = (msg) => { console.error(msg); process.exit(1); };

const content = read("data/content.json"), pages = read("data/pages.json");

// The colours and typefaces chosen in Artiscope Digital Home, for the page head.
function themeHead() {
  const p = path.join(ROOT, "data", "theme.json");
  if (!fs.existsSync(p)) return "";
  const theme = JSON.parse(fs.readFileSync(p, "utf8"));
  let out = "";
  for (const link of theme.font_links || []) {
    if (typeof link === "string" && link.startsWith("https://fonts.googleapis.com/css2?") && !/["<>\s]/.test(link)) out += '<link href="' + link.replace(/&/g, "&amp;") + '" rel="stylesheet">\n';
  }
  const css = theme.css || "";
  if (css && /^:root\{[^<>{}]*\}$/.test(css)) out += '<style id="theme">' + css + "</style>\n";
  const rules = theme.rules || "";
  if (typeof rules === "string" && rules.trim() && !rules.includes("<")) out += '<style id="theme-rules">\n' + rules + "\n</style>\n";
  return out;
}
// The social media addresses and favicon chosen in the theme.
function themeExtras() {
  const p = path.join(ROOT, "data", "theme.json");
  if (!fs.existsSync(p)) return {};
  const theme = JSON.parse(fs.readFileSync(p, "utf8"));
  return { social: theme.social && typeof theme.social === "object" ? theme.social : {}, favicon: typeof theme.favicon === "string" ? theme.favicon : "" };
}

// Refuses to build if the page list would not draw, so a bad edit cannot blank the site.
const KINDS = ["hero", "features", "profiles", "archive", "exhibition-list", "collecting", "signup", "text-page",
  "announcement", "columns", "space", "quote", "faq", "button",
  "picture-banner", "slideshow", "gallery", "logo-row", "picture", "text-picture",
  "artworks", "exhibitions", "career", "press",
  "visit", "contact-form", "signup-popup", "search"];
function checkPages() {
  for (const key of ["header", "footer"]) {
    const part = (pages.shared || {})[key];
    if (!part || typeof part !== "object" || typeof part.settings !== "object") fail("data/pages.json must have the shared part '" + key + "' with settings.");
  }
  for (const [key, pg] of Object.entries(pages.pages || {})) {
    if (!pg || !Array.isArray(pg.sections) || !String(pg.path || "").endsWith("index.html")) fail("The page '" + key + "' in data/pages.json needs a path ending in index.html and a list of sections.");
    if (pg.path.includes("..") || pg.path.startsWith("/")) fail("The page '" + key + "' has a path that is not allowed.");
    const seen = new Set();
    for (const sec of pg.sections) {
      if (!sec || !KINDS.includes(sec.type)) fail("The page '" + key + "' has a section of a kind the site cannot draw: " + JSON.stringify(sec && sec.type));
      const sid = String(sec.id || "");
      if (!/^[A-Za-z0-9_-]+$/.test(sid) || seen.has(sid)) fail("Every section on page '" + key + "' needs its own id of letters, digits and hyphens: " + JSON.stringify(sid));
      seen.add(sid);
      if (sec.settings != null && typeof sec.settings !== "object") fail("The settings of section '" + sid + "' on page '" + key + "' must be a list of fields.");
    }
  }
  const gseen = new Set();
  for (const where of ["top", "popups", "bottom"]) {
    for (const sec of ((pages.groups || {})[where] || [])) {
      if (!sec || !KINDS.includes(sec.type)) fail("A section shared by every page is of a kind the site cannot draw: " + JSON.stringify(sec && sec.type));
      const sid = String(sec.id || "");
      if (!/^every-[a-z0-9-]+$/.test(sid) || gseen.has(sid)) fail("Every shared section needs its own id starting every-: " + JSON.stringify(sid));
      gseen.add(sid);
    }
  }
  // templates: the sections article and artist pages are drawn with, around their own content ("main")
  const templates = pages.templates || {};
  if (typeof templates !== "object" || Array.isArray(templates)) fail("The templates in data/pages.json must be grouped by kind of page.");
  for (const [kind, all] of Object.entries(templates)) {
    if (!["article", "artist"].includes(kind) || !all || typeof all !== "object" || !all.default) fail("Templates are for articles and artists, and each kind needs a default: " + JSON.stringify(kind));
    for (const [tid, t] of Object.entries(all)) {
      const secs = t && t.sections;
      if (!Array.isArray(secs) || secs.filter((x) => x && x.type === "main").length !== 1) fail("The template '" + tid + "' needs a list of sections with the page's own content in it once.");
      for (const sec of secs) {
        if (!sec || (sec.type !== "main" && !KINDS.includes(sec.type))) fail("The template '" + tid + "' has a section of a kind the site cannot draw.");
        if (sec.type !== "main" && !/^t-[a-z0-9-]+$/.test(String(sec.id || ""))) fail("Every section in a template needs its own id starting t-: " + JSON.stringify(sec.id));
      }
    }
  }
  // changed fixed words, from Edit default text: plain words only
  if (pages.words != null && (typeof pages.words !== "object" || Array.isArray(pages.words) || Object.values(pages.words).some((v) => typeof v !== "string"))) fail("The changed words in data/pages.json must be a list of plain words.");
  if (pages.assign != null && (typeof pages.assign !== "object" || Array.isArray(pages.assign))) fail("The templates chosen for articles and artists must be listed by kind.");
  if (!pages.pages || !pages.pages.home) fail("data/pages.json must have the home page.");
}

// Who may read the site. Everyone is welcome; the search engines and the AI search tools that
// link back to their sources are also named, so there is no doubt they are allowed in.
const ROBOTS = "User-agent: *\nAllow: /\n\nUser-agent: Googlebot\nUser-agent: Bingbot\nUser-agent: OAI-SearchBot\nUser-agent: ChatGPT-User\nUser-agent: PerplexityBot\nUser-agent: Perplexity-User\nUser-agent: Claude-SearchBot\nUser-agent: Claude-User\nUser-agent: Applebot\nUser-agent: DuckDuckBot\nAllow: /\n";
const LLMS_SECTIONS = [["artists", "Artist profiles"], ["dispatches", "Dispatches"], ["urban-culture", "Urban culture"]];
checkPages();
const site = SAD.Site(SAD.fromFiles(content), pages, themeHead(), themeExtras());
const written = [];
const write = (p, text) => { const out = path.join(OUT, p); fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, text); written.push(p); };
const pagesOut = site.all();
for (const pg of pagesOut) write(pg.path, pg.html);
// the list the site search reads (see the search section in assets/render.js)
write("search-index.json", JSON.stringify(site.searchIndex()));
const urls = pagesOut.filter((p) => p.path !== "404.html").map((p) => p.url);
write("sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.map((u) => "<url><loc>" + SAD.SITE_URL + u + "</loc></url>\n").join("") + "</urlset>\n");
write("robots.txt", ROBOTS + "\nSitemap: " + SAD.SITE_URL + "sitemap.xml\n");
const listed = pagesOut.filter((p) => p.path !== "404.html");
// llms.txt: a plain guide to the site for AI search tools, built from the finished pages so it always matches them.
{
  const meta = (html, re) => { const m = re.exec(html); return m ? m[1].replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim() : ""; };
  const titleOf = (h) => meta(h, /<title>([^<]*)<\/title>/).replace(/ \| [^|]*$/, "");
  const descOf = (h) => meta(h, /<meta name="description" content="([^"]*)"/);
  const home = pagesOut.find((p) => p.path === "index.html");
  const lines = ["# " + titleOf(home.html), "", "> " + descOf(home.html), ""];
  for (const [folder, heading] of LLMS_SECTIONS) {
    const items = listed.filter((p) => p.path.startsWith(folder + "/") && p.path !== folder + "/index.html" && !/<meta name="robots" content="noindex/.test(p.html));
    if (!items.length) continue;
    lines.push("## " + heading, "");
    for (const p of items) { const d = descOf(p.html); lines.push("- [" + titleOf(p.html) + "](" + SAD.SITE_URL + p.url + ")" + (d ? ": " + d : "")); }
    lines.push("");
  }
  write("llms.txt", lines.join("\n"));
}
if (OUT !== ROOT) {
  fs.cpSync(path.join(ROOT, "assets"), path.join(OUT, "assets"), { recursive: true });
  write("CNAME", "streetartdispatch.com\n");
  write(".nojekyll", "");
}
console.log("built " + pagesOut.length + " pages into " + OUT);
