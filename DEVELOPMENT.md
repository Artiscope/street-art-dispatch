# Street Art Dispatch — Development & Content Plan

**Domain:** streetartdispatch.com
**Positioning:** *The Urban Art and Culture Publication*
**Homepage line:** Art Doesn't Always Wait for an Invitation.

`index.html` in this repository is the working homepage prototype. It's a single file built on the Marcus Vane motion system (Anton / Onest type, accent red `#ff3b1d`, spring reveals, Lenis smooth scroll). This document covers the editorial strategy, information architecture, SEO, data model and build plan for taking that prototype to a production publication.

---

## 1. Editorial positioning

| | |
|---|---|
| **What we cover** | Artists working beyond conventional gallery spaces: public interventions, urban installations, experimental materials and the collectable works that come out of them. |
| **Who it's for** | (1) Culturally curious readers who meet street art on their phones. (2) Collectors, from first-time buyers to established ones. (3) The trade: galleries, curators, press, auction specialists. |
| **Tone** | Authoritative but not academic. We explain, contextualise and take a view. No hype, and no glamorising damage to property. |
| **What makes us different** | We document things as well as comment on them. The **Intervention Archive** is a sourced, dated and searchable record that no other publication keeps in one place. |
| **Commercial relationship** | We launch around Konn Artiss and expand across the Grove Gallery roster. Any gallery relationship is disclosed on the page (see §8, Standards). |

---

## 2. Information architecture

```
/                                   Homepage (the prototype)
/dispatches/                        All features, newest first
/dispatches/{slug}/                 Article
/artists/                           Artist index (A–Z + "featured")
/artists/{artist}/                  Artist profile hub (pillar page)
/interventions/                     THE ARCHIVE: searchable by artist, city, year
/interventions/{slug}/              Single intervention record
/interventions/city/{city}/         City landing page (Venice, London, Paris, New York…)
/interventions/year/{yyyy}/         Year landing page
/urban-culture/                     Columns: viral art, social media, performance
/exhibitions/                       Listings and previews
/collecting/                        Collecting hub: guides, auction results, glossary
/collecting/auction-results/        Results tracker
/about/  /standards/  /contact/  /newsletter/
```

Homepage sections, in order (as built): **Hero → Marquee → Dispatches → Artists → Interventions (Archive) → Urban Culture → Exhibitions → Collecting → Newsletter/Footer.**

Primary navigation: Dispatches · Artists · Interventions · Urban Culture · Exhibitions · Collecting.

---

## 3. SEO architecture: pillars and clusters

Every pillar page is a hub. Supporting articles link **up** to it, it links **down** to them, and siblings cross-link to each other.

| Pillar (hub URL) | Supporting searches → target content |
|---|---|
| **Konn Artiss** `/artists/konn-artiss/` | *artist profile* → Feature 1 · *Venice intervention* → `/interventions/konn-artiss-venice/` + Feature 3 · *artwork* → works gallery on hub · *auctions* → results block on hub + Feature 4 |
| **Public art** `/interventions/` | *artistic interventions* → Feature 2 · *installations* → archive filtered by type · *performance art* → column "When the Crowd Becomes the Medium" |
| **Street art history** `/artists/` + Feature 5 | *Banksy* → Feature 5 + artist hub · *Invader* → hub + archive · *Shepard Fairey* → hub + archive · *urban movements* → timeline essay (Issue 02) |
| **Cultural attention** `/urban-culture/` | *viral art* → "Anatomy of a Viral Artwork" · *art stunts* → Feature 2 · *social media and artists* → "The Phone Is the New Plinth" |
| **Street art collecting** `/collecting/` | *original works* / *editions* → glossary + Feature 4 · *auction results* → results tracker |

**Technical SEO checklist**
- Render articles on the server (SSR or SSG). The prototype draws its cards with JS, so production must output real HTML.
- Structured data: `NewsMediaOrganization`, `WebSite`, `NewsArticle` (headline, image, datePublished, author, about) and `Person` for artists, with `sameAs` links to the artist's official channels. Use `VisualArtwork` for works, `Event` / `ExhibitionEvent` for listings, `BreadcrumbList` sitewide, and an `ItemList` on archive pages.
- Each archive entry and each city or year page is its own indexable URL. Most of the archive's search traffic will come through these long-tail pages ("art interventions in Venice", "street art 2019").
- Titles should run 55–60 characters and meta descriptions 150–160. Name OG images `/og/{slug}.jpg`.
- Internal links: every feature needs at least 3 contextual links (pillar, one sibling, one archive record). The prototype already does this inside the article bodies.
- Generate the sitemap and news sitemap automatically. Add canonical URLs and an `hreflang` slot for a possible IT/FR edition.
- Core Web Vitals: serve AVIF/WebP, lazy-load below the fold, preload Anton, and keep LCP under 2.5s on 4G. The hero poster is HTML/CSS, so it costs no image request.

---

## 4. Priority commissioned features (Issue 01)

All six are drafted in full in the prototype. Open any card on the homepage to read it. Briefs for the commissioning writer:

| # | Title | Target query cluster | Length | Angle | Status |
|---|---|---|---|---|---|
| 1 | **Konn Artiss: Art, Intervention and Public Attention** | Konn Artiss, artist profile, Venice intervention | 1,800–2,200 | The artist who makes work for "the second before the phones come out". Attention is treated as a material, and the profile follows the work from street to collection. | **Draft. Needs interview and fact-check** (dates, work titles, gallery terms, any auction data) |
| 2 | What Makes an Art Intervention Different from a Publicity Stunt? | artistic interventions, art stunts | 1,500 | Five-question test, illustrated by Banksy in Venice (2019), Cattelan's *Comedian* (2019/2024) and the Christo & Jeanne-Claude Reichstag (1995) | Draft ready for edit |
| 3 | Venice as a Stage for Contemporary Art | Venice intervention, Biennale, public art | 1,400 | Official vs unofficial Venice, and why interventions land there: sightlines, symbolism, documentation | Draft ready for edit |
| 4 | From Public Spectacle to Collectable Object | street art collecting, auction results, editions | 1,600 | Starts from *Girl with Balloon* → *Love is in the Bin* (£1.04m → £18.58m), then covers what collectors actually buy and provenance | Draft ready for edit |
| 5 | Banksy and the Evolution of Art Interventions | Banksy, street art history | 1,600 | Four eras: wall → institution → system → experience | Draft ready for edit |
| 6 | Why Contemporary Artists Are Working Beyond Gallery Walls | public art, installations | 1,400 | Five reasons (Haring, JR, Invader) and the gallery's new role | Draft ready for edit |

**What each feature needs before publication:** a hero image (commissioned photography or a licensed press image with credit), 2–4 inline images, a pull quote, a link to its pillar page, 2+ archive record links, author bio, and fact-check sign-off.

### Issue 02 pipeline (suggested)
- Paris: Invader and the City as Game Board
- The Paste-Up Revival: JR, Swoon and the Return of Paper (artist list to confirm)
- Editions Explained: Reading a Screen-Print Certificate
- Shepard Fairey: From Sticker to Institution
- Grove Gallery roster profiles, one per issue (see §6)

---

## 5. The flagship: Intervention Archive

### Data model (one record per intervention)
```json
{
  "id": "banksy-venice-in-oil-2019",
  "title": "Venice in Oil",
  "artist_ids": ["banksy"],
  "city": "Venice", "country": "Italy", "geo": [45.43, 12.33],
  "date_start": "2019-05", "date_end": null, "year": 2019,
  "type": "Unsanctioned stall",
  "medium": ["oil on canvas", "street stall"],
  "status": "removed",            // extant | removed | relocated | destroyed | ephemeral
  "sanctioned": false,
  "summary": "…40–60 words…",
  "sources": [{"label": "Artist's channel", "url": "…", "accessed": "2026-11-01"}],
  "images": [{"src": "…", "credit": "…", "licence": "…"}],
  "related_articles": ["venice-stage", "banksy-evolution"],
  "verification": "verified"      // verified | pending | disputed
}
```

### Search & filter
- **Phase 1 (launch):** static JSON with client-side filtering, as in the prototype. Filters: artist, city, year, plus free text across title, artist, city, type and summary. This scales comfortably to about 1,000 records.
- **Phase 2:** Pagefind (static) or Algolia/Meilisearch. Add facets for type, sanctioned/unsanctioned, status and decade, plus URL-synced filters so every filter state can be shared and indexed (`/interventions/?city=venice&year=2019`).
- **Phase 3:** map view (MapLibre + city clustering), timeline view and an "on this day" module.

### Editorial rules
- No record goes live without at least one primary or reputable source. Records awaiting confirmation display a **Pending** pill, as Konn Artiss's Venice entry does now.
- Never publish exact locations of extant unsanctioned works where that could encourage removal or theft. Give the neighbourhood instead.
- Reader submissions go to `archive@streetartdispatch.com` → editor review → publish.

---

## 6. Artists: the profile template (for expanding across Grove Gallery)

Each artist hub (`/artists/{slug}/`) uses one template:

1. **Header:** name, practice line, base, active since, gallery (with disclosure).
2. **Summary:** a 60-word standfirst. It's reused on the homepage Artists selector.
3. **Key facts:** the `dl` block from the prototype (Practice / Landmarks / Authentication / Collecting).
4. **Interventions:** a live archive query filtered to this artist.
5. **Works & editions:** grid of collectable works (title, year, medium, edition size, availability through the gallery).
6. **Market notes:** verified auction results only, each with sale, date and source.
7. **Further reading:** every Dispatch article tagged with this artist.

**Rollout:** launch with Konn Artiss (lead), Banksy, Invader and Shepard Fairey as context and history hubs. Then add **one Grove Gallery artist per week**. Each new profile gets an interview-based feature, 3–5 archive records and a newsletter slot. The homepage selector's fifth slot ("Grove Gallery roster") rotates to the newest profile.

**Needed from Grove Gallery:** confirmed artist roster, approved bios, image packs with credits, edition and price policy, and named press contacts.

---

## 7. Design system (as built in `index.html`)

| Token | Value |
|---|---|
| Background / surface / surface-2 | `#08080a` / `#111114` / `#17171b` |
| Foreground / muted / reading text | `#f3f1ea` / `#807f78` / `#dedad0` |
| Accent / accent-2 / paper | `#ff3b1d` / `#ff6a3d` / `#ebe5d5` |
| Display face | Anton (headlines, masthead, figures, pull quotes) |
| Sans face | Onest 400/500/600 (UI, titles, labels) |
| **Reading face (added)** | **Newsreader**, for standfirsts and article bodies, because long-form reading needs a serif |
| Scale | Rem-based adaptive grid on a 1920 base, with breakpoints at 1440 / 1024 / 640 (exactly as in the brief) |

**Editorial additions beyond the Marcus Vane template:**
- **Hero:** the founder portrait is replaced by a wheat-pasted **poster** carrying the headline, composited in front of a giant red "STREET ART / DISPATCH" masthead. It uses the same liquid distortion on hover, with letter-by-letter masthead reveals.
- **Reader view:** a full-screen, hash-routed article view (`#read/{slug}`) with a progress bar, a ~68-character measure, a 20px serif body, drop caps, pull quotes, tags and a "Next dispatch" link. Esc and the back button close it.
- **Generative SVG covers:** placeholders, one per article and artist, that run through the LiquidImage component (grayscale → colour reveal on hover). **They're meant to be replaced with commissioned or licensed photography.**
- **Readability floors:** body text never drops below 15px and eyebrow labels never below 11px, even though the layout scales in rem.
- **Accessibility:** `prefers-reduced-motion` is fully honoured (no preloader, no marquee, no reveals). Focus rings are visible, live regions announce archive results and artist changes, and the article view is a dialog.

---

## 8. Editorial standards (to publish at `/standards/`)

1. **Accuracy.** Every factual claim about a living artist is confirmed with the artist, their studio or their gallery before publication. Auction figures are cited with sale, date and whether they include buyer's premium.
2. **Disclosure.** Where Street Art Dispatch has a commercial relationship with a gallery (for example Grove Gallery), it is stated on every page that features that gallery's artists.
3. **Image rights.** Commission or license every image and credit it. Photographs of public works still need photographer credit.
4. **Legality.** We document unsanctioned work as cultural history. We don't encourage criminal damage or removal of public works.
5. **Quotes.** We never invent quotes. Quotes from artists come from interviews or attributable published sources.
6. **Corrections.** Corrections are dated and shown at the foot of the article.

> **Before publication, verify:** everything written about Konn Artiss in the prototype is deliberately general. That covers the Venice intervention's date and title, the gallery relationship, and any market data. It's marked *Draft / Pending* until confirmed. The facts about Banksy, Invader, Shepard Fairey, Cattelan, Christo & Jeanne-Claude, JR, Ai Weiwei, Lorenzo Quinn, Blek le Rat and Keith Haring are well documented, but they still need a final fact-check against primary sources.

---

## 9. Production build

**Recommended stack**
- **Framework:** Next.js (App Router) or Astro, statically generated, with incremental regeneration for news.
- **CMS:** Sanity (or Storyblok). Schemas: `article`, `column`, `artist`, `intervention`, `exhibition`, `auctionResult`, `author`, `city`. Editors can then add Grove Gallery artists without a developer.
- **Motion:** port the prototype's CSS and JS as they are (Lenis, IntersectionObserver reveals, the Spring class and LiquidImage). No heavy animation library is needed.
- **Search:** Pagefind for v1, Algolia when the archive passes about 1,000 records.
- **Images:** a CDN with AVIF/WebP and focal-point cropping (Sanity image pipeline or Cloudinary).
- **Newsletter:** Beehiiv / Substack / Mailchimp. The prototype's form already has a submit hook.
- **Analytics:** Plausible or GA4. Events to track: article read depth (25/50/75/100%), archive filter usage, newsletter sign-ups, artist hub → gallery click-outs.
- **Hosting:** Vercel or Netlify, with `streetartdispatch.com` as the apex domain plus a `www` redirect.

**Phases**

| Phase | Scope | Deliverable |
|---|---|---|
| 0 (done) | Homepage prototype, Issue 01 drafts, archive v0 (27 records) | `index.html` |
| 1 (weeks 1–3) | CMS schemas, templates (home, article, artist, archive, city/year, collecting), SSR, structured data | Staging site |
| 2 (weeks 3–5) | Commission photography, fact-check Issue 01, Konn Artiss interview, archive to ~80 records | Content-complete launch |
| 3 (week 6) | Launch, newsletter #1, social cut-downs of the six features | Live site |
| 4 (ongoing) | One Grove Gallery profile a week, Pagefind → map view, auction results tracker | Growth |

**Launch KPIs (first 90 days):** 2,000 newsletter subscribers, more than 40% average scroll depth on features, 25% of sessions touching the archive, and top-10 rankings for "Konn Artiss" and "Konn Artiss Venice".
