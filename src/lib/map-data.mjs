// The places on the street art map (map/), gathered from the site's own data:
// the Intervention Archive, the works listed on artist profiles and the current exhibitions.
// Positions come from data/map-places.json, one per town or city. Nothing is placed more
// precisely than that, and anything without a listed town stays off the map.
import fs from "node:fs";
import path from "node:path";

const read = (p) => JSON.parse(fs.readFileSync(path.resolve(p), "utf8"));
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const plain = (s) => String(s || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const firstSentence = (s) => { const m = s.match(/^.*?[.!?](?=\s|$)/); return m ? m[0] : s; };
const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

// "16 September 2026 to 10 January 2027" -> the closing day, or null if it cannot be read
function closes(when) {
  const m = String(when || "").match(/(\d{1,2}) ([A-Za-z]+) (\d{4})\s*$/);
  if (!m) return null;
  const mo = MONTHS.indexOf(m[2].toLowerCase());
  return mo < 0 ? null : new Date(Date.UTC(+m[3], mo, +m[1], 23, 59));
}

export function mapData(today = new Date()) {
  const content = read("data/content.json"), gaz = read("data/map-places.json");
  const places = gaz.places || {};
  const features = new Set([...(content.features || []), ...(content.columns || [])].map((f) => f.slug));
  const columns = new Set((content.columns || []).map((c) => c.slug));
  const profiles = new Map((content.artists || []).filter((a) => a.facts).map((a) => [a.name, a.slug || slug(a.name)]));
  const readHref = (s) => (s && features.has(s) ? (columns.has(s) ? "/urban-culture/" : "/dispatches/") + s + "/" : "");
  const artistHref = (name) => (profiles.has(name) ? "/artists/" + profiles.get(name) + "/" : "");

  const items = [], off = [];
  // the Intervention Archive
  (content.archive || []).forEach((x, i) => {
    const key = x.city + ", " + x.country;
    if (!places[key]) { off.push({ title: x.title, artist: x.artist, where: x.city }); return; }
    items.push({
      id: "a" + i, kind: "work", title: x.title, artist: x.artist, artistHref: artistHref(x.artist),
      type: x.type, year: typeof x.y === "number" ? x.y : null, note: x.note || "", pending: !!x.pending,
      href: readHref(x.read), hrefLabel: x.read && features.has(x.read) ? (columns.has(x.read) ? "Read the column" : "Read the dispatch") : "", place: key,
    });
  });
  // works named on the artist profiles, if the archive does not already have them
  const inArchive = new Set(items.map((x) => slug(x.title)));
  (gaz.profile_works || []).forEach((w, i) => {
    const artist = (content.artists || []).find((a) => a.name === w.artist);
    const work = artist && (artist.works || []).find((k) => k.t === w.work);
    if (!work) throw new Error("data/map-places.json lists \"" + w.work + "\" by " + w.artist + ", but that artist profile has no such work.");
    if (!places[w.place]) throw new Error("data/map-places.json has no position for " + w.place + ".");
    if (inArchive.has(slug(w.work))) return;
    const y = /^\d{4}$/.test(String(work.y)) ? Number(work.y) : null;
    items.push({
      id: "p" + i, kind: "work", title: plain(work.t), artist: w.artist, artistHref: artistHref(w.artist), type: w.type,
      year: y, note: firstSentence(plain(work.note)), pending: y === null, href: artistHref(w.artist), hrefLabel: "Open the artist profile", place: w.place, placeLabel: w.place_label || "",
    });
  });
  // exhibitions still open
  (content.exhibitions || []).forEach((e, i) => {
    const info = (gaz.exhibitions || {})[e.t];
    const end = closes(e.when);
    if (!info || !places[info.place] || (end && end < today)) return;
    items.push({
      id: "e" + i, kind: "show", title: plain(e.t), artist: info.artist, artistHref: artistHref(info.artist), type: e.status || "Exhibition",
      year: null, note: plain(e.venue) + ". " + plain(e.when) + ".", pending: false, ends: end ? end.toISOString() : null, href: "/exhibitions/", hrefLabel: "See the listing", place: info.place,
    });
  });

  const used = new Set(items.map((x) => x.place));
  const cities = Object.entries(places).filter(([k]) => used.has(k)).map(([k, p]) => {
    const cut = k.lastIndexOf(", ");
    return { key: k, city: k.slice(0, cut), country: k.slice(cut + 2), lat: p.lat, lon: p.lon };
  });
  return { items, cities, off };
}
