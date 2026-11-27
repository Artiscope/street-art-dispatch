// The street art map (map/). A React island: the filters and the full list are drawn on the
// server, so the page reads properly without JavaScript and for search engines; the map itself
// (Leaflet, with country outlines from Natural Earth served from this site) starts in the browser.
// Pins sit on towns and cities only, never on a wall or a street.
import { useEffect, useMemo, useRef, useState } from "react";

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const decadeOf = (y) => (typeof y === "number" ? String(Math.floor(y / 10) * 10) : "");
const KINDS = [["", "Everything"], ["work", "Street works"], ["show", "Shows on now"]];
const plural = (n, one, many) => n + " " + (n === 1 ? one : many);

// Natural Earth closes a few shapes (eastern Russia, Fiji) across the 180th meridian, which a flat map
// would draw as a stripe across the world; carry those edges on past the edge instead. Antarctica is left out.
function landShapes(fc) {
  const unwrap = (ring) => { let prev = ring[0][0]; return ring.map(([x, y]) => { while (x - prev > 180) x -= 360; while (x - prev < -180) x += 360; prev = x; return [x, y]; }); };
  const polys = [];
  (fc.type === "FeatureCollection" ? fc.features : [fc]).forEach((f) => {
    const g = f.geometry;
    (g.type === "Polygon" ? [g.coordinates] : g.coordinates).forEach((p) => { if (p[0].some(([, y]) => y > -60)) polys.push(p.map(unwrap)); });
  });
  return { type: "Feature", properties: {}, geometry: { type: "MultiPolygon", coordinates: polys } };
}

function Entry({ x }) {
  const when = x.kind === "show" ? "" : x.year ? String(x.year) : x.pending ? "Date to confirm" : "";
  return (
    <li className={"mcard mcard--" + x.kind}>
      <p className="kicker">{x.type}{when ? " · " + when : ""}</p>
      <h4>{x.title}</h4>
      <p className="who">{x.artistHref ? <a href={x.artistHref}>{x.artist}</a> : x.artist}</p>
      {x.note ? <p className="mnote">{x.note}</p> : null}
      {x.href ? <p className="mlink"><a href={x.href}>{x.hrefLabel}</a></p> : null}
    </li>
  );
}

export default function StreetMap({ items, cities, off, today }) {
  const [artist, setArtist] = useState("");
  const [city, setCity] = useState("");
  const [decade, setDecade] = useState("");
  const [kind, setKind] = useState("");
  const [picked, setPicked] = useState("");
  const [now, setNow] = useState(today);
  const [ready, setReady] = useState(false);
  const [more, setMore] = useState(false);
  const mapEl = useRef(null), panelEl = useRef(null), live = useRef({});

  const byKey = useMemo(() => Object.fromEntries(cities.map((c) => [c.key, c])), [cities]);
  const artists = useMemo(() => Array.from(new Set(items.map((x) => x.artist))).sort((a, b) => a.localeCompare(b)), [items]);
  const cityKeys = useMemo(() => cities.map((c) => c.key).sort((a, b) => byKey[a].city.localeCompare(byKey[b].city)), [cities, byKey]);
  const decades = useMemo(() => Array.from(new Set(items.map((x) => decadeOf(x.year)).filter(Boolean))).sort().reverse(), [items]);

  // shows that have closed since the site was last built drop off by themselves
  const open = useMemo(() => items.filter((x) => x.kind !== "show" || !x.ends || x.ends >= now), [items, now]);
  const shown = useMemo(() => open.filter((x) =>
    (!artist || slug(x.artist) === artist) && (!city || x.place === city) &&
    (!decade || decadeOf(x.year) === decade) && (!kind || x.kind === kind)), [open, artist, city, decade, kind]);
  const groups = useMemo(() => {
    const g = {};
    shown.forEach((x) => { (g[x.place] = g[x.place] || []).push(x); });
    Object.values(g).forEach((list) => list.sort((a, b) => (a.kind === b.kind ? (b.year || 0) - (a.year || 0) : a.kind === "show" ? 1 : -1)));
    return g;
  }, [shown]);
  const shownCities = cityKeys.filter((k) => groups[k]);
  const filtered = !!(artist || city || decade || kind);

  // filters arrive in the address (?artist=banksy&city=Paris, France&decade=2010&show=work), so a view can be shared
  useEffect(() => {
    setNow(new Date().toISOString());
    const q = new URLSearchParams(location.search);
    if (q.get("artist") && artists.some((a) => slug(a) === q.get("artist"))) setArtist(q.get("artist"));
    if (q.get("city") && byKey[q.get("city")]) setCity(q.get("city"));
    if (q.get("decade") && decades.includes(q.get("decade"))) setDecade(q.get("decade"));
    if (q.get("show") === "work" || q.get("show") === "show") setKind(q.get("show"));
  }, []);
  useEffect(() => {
    if (!ready) return;
    const q = new URLSearchParams();
    if (artist) q.set("artist", artist);
    if (city) q.set("city", city);
    if (decade) q.set("decade", decade);
    if (kind) q.set("show", kind);
    const s = q.toString();
    history.replaceState(history.state, "", location.pathname + (s ? "?" + s : ""));
  }, [artist, city, decade, kind, ready]);

  // the map: Leaflet and the clustering only load here, in the browser
  useEffect(() => {
    let gone = false;
    (async () => {
      const L = (await import("leaflet")).default;
      window.L = L;
      await import("leaflet.markercluster");
      const topo = await import("topojson-client");
      if (gone || !mapEl.current) return;
      const map = L.map(mapEl.current, {
        minZoom: 1, maxZoom: 7, zoomSnap: 0.5, worldCopyJump: false, scrollWheelZoom: false,
        maxBounds: [[-75, -200], [85, 200]], maxBoundsViscosity: 0.8, attributionControl: false, zoomControl: false,
      });
      L.control.zoom({ position: "topright", zoomInTitle: "Zoom in", zoomOutTitle: "Zoom out" }).addTo(map);
      L.control.attribution({ prefix: false, position: "bottomleft" }).addAttribution(
        'Country outlines: <a href="https://www.naturalearthdata.com/">Natural Earth</a>. Town positions: <a href="https://www.geonames.org/">GeoNames</a>').addTo(map);
      map.setView([30, 0], 2);
      // a click or tap on the map lets the mouse wheel zoom it, so scrolling the page never gets stuck
      map.once("focus", () => map.scrollWheelZoom.enable());
      map.on("click", () => map.scrollWheelZoom.enable());
      fetch("/assets/map/countries-50m.json").then((r) => r.json()).then((w) => {
        if (gone) return;
        L.geoJSON(landShapes(topo.feature(w, w.objects.land)), { interactive: false, style: { stroke: false, fillOpacity: 1, className: "mland" } }).addTo(map).bringToBack();
        L.geoJSON(topo.mesh(w, w.objects.countries, (a, b) => a !== b), { interactive: false, style: { weight: 1, opacity: 1, fill: false, className: "mborder" } }).addTo(map);
      }).catch(() => {});
      const group = L.markerClusterGroup({
        showCoverageOnHover: false, spiderfyOnMaxZoom: false, zoomToBoundsOnClick: true, maxClusterRadius: 60,
        iconCreateFunction: (c) => {
          const n = c.getAllChildMarkers().reduce((t, m) => t + m.options.count, 0);
          return L.divIcon({ html: "<span>" + n + "</span>", className: "mpin mpin--group", iconSize: [46, 46] });
        },
      });
      map.addLayer(group);
      live.current = { L, map, group };
      setReady(true);
    })();
    return () => { gone = true; if (live.current.map) live.current.map.remove(); live.current = {}; };
  }, []);

  // pins follow the filters: one per town or city, with how many entries it holds
  useEffect(() => {
    const { L, map, group } = live.current;
    if (!ready || !L) return;
    group.clearLayers();
    const markers = shownCities.map((k) => {
      const c = byKey[k], list = groups[k], works = list.some((x) => x.kind === "work");
      const label = c.city + ", " + plural(list.length, "entry", "entries");
      const icon = (on) => L.divIcon({ html: "<span>" + list.length + "</span>", className: "mpin " + (works ? "mpin--work" : "mpin--show") + (on ? " is-picked" : ""), iconSize: [34, 34] });
      const m = L.marker([c.lat, c.lon], { count: list.length, key: k, makeIcon: icon, keyboard: true, title: label, alt: label, riseOnHover: true, icon: icon(k === picked) });
      m.on("click", () => pick(k, false));
      return m;
    });
    group.addLayers(markers);
    if (markers.length) {
      const b = L.latLngBounds(shownCities.map((k) => [byKey[k].lat, byKey[k].lon]));
      map.fitBounds(b.pad(0.15), { maxZoom: 5, padding: [24, 24] });
    }
  }, [ready, groups]);

  // keep the picked pin marked, and drop the pick if the filters hide its town
  useEffect(() => {
    if (picked && !groups[picked]) { setPicked(""); return; }
    const { group } = live.current;
    if (!group) return;
    group.eachLayer((m) => {
      const on = m.options.key === picked;
      if (on !== !!m.options.picked) { m.options.picked = on; m.setIcon(m.options.makeIcon(on)); }
    });
    group.refreshClusters();
  }, [picked, groups]);

  function pick(k, fly) {
    setPicked(k);
    const { map } = live.current;
    if (fly && map) {
      const z = Math.max(map.getZoom(), 6);
      // on a phone the card covers the foot of the map, so the pin lands in the clear part above it
      const to = innerWidth < 960 ? map.unproject(map.project([byKey[k].lat, byKey[k].lon], z).add([0, map.getSize().y * 0.22]), z) : [byKey[k].lat, byKey[k].lon];
      map.flyTo(to, z, { duration: 0.6 });
      mapEl.current.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    } else if (map && innerWidth < 960) {
      // on a phone the card covers the foot of the map, so move the picked pin up into the clear part
      requestAnimationFrame(() => {
        const pt = map.project([byKey[k].lat, byKey[k].lon], map.getZoom()).add([0, map.getSize().y * 0.25]);
        map.panTo(map.unproject(pt, map.getZoom()), { animate: true, duration: 0.4 });
      });
    }
  }
  function clear() { setArtist(""); setCity(""); setDecade(""); setKind(""); }

  const p = picked && groups[picked] ? byKey[picked] : null;
  const count = shownCities.length
    ? plural(shown.length, "entry", "entries") + " in " + plural(shownCities.length, "town or city", "towns and cities")
    : "Nothing on the map matches that.";

  return (
    <div className="smap">
      <form className={"mapform" + (more ? " open" : "")} role="search" aria-label="Filter the map" onSubmit={(e) => e.preventDefault()}>
        <button type="button" className="ftoggle" aria-expanded={more} aria-controls="mMore" onClick={() => setMore(!more)}>Artist, place and year</button>
        <div className="mfilters" id="mMore">
        <div className="field">
          <label htmlFor="mArtist">Artist</label>
          <select id="mArtist" value={artist} onChange={(e) => setArtist(e.target.value)}>
            <option value="">All artists</option>
            {artists.map((a) => <option key={a} value={slug(a)}>{a}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="mCity">Town or city</label>
          <select id="mCity" value={city} onChange={(e) => { setCity(e.target.value); if (e.target.value) setPicked(e.target.value); }}>
            <option value="">Everywhere</option>
            {cityKeys.map((k) => <option key={k} value={k}>{byKey[k].city}, {byKey[k].country}</option>)}
          </select>
        </div>
        <div className="field mchips" role="group" aria-labelledby="mYear">
          <span className="lbl" id="mYear">Year</span>
          <div className="chips">
            <button type="button" className="chip" aria-pressed={!decade} onClick={() => setDecade("")}>Any year</button>
            {decades.map((d) => <button type="button" key={d} className="chip" aria-pressed={decade === d} onClick={() => setDecade(decade === d ? "" : d)}>{d}s</button>)}
          </div>
        </div>
        <div className="field mchips" role="group" aria-labelledby="mKind">
          <span className="lbl" id="mKind">Show</span>
          <div className="chips">
            {KINDS.map(([v, l]) => <button type="button" key={v || "all"} className="chip" aria-pressed={kind === v} onClick={() => setKind(v)}>{l}</button>)}
          </div>
        </div>
        </div>
      </form>
      <div className="mstatus">
        <p aria-live="polite">{count}</p>
        {filtered ? <button type="button" className="tlink" onClick={clear}>Clear filters</button> : null}
      </div>

      <div className="mstage">
        <div className="mcanvas" ref={mapEl} role="region" aria-label="Map of street art by town and city. Use the list below the map for the same places as text.">
          {!ready ? <p className="mwait">The map is loading. Every place is also listed below.</p> : null}
        </div>
        <aside className={"mpanel" + (p ? " is-open" : "")} ref={panelEl} aria-live="polite" aria-label="Picked place">
          {p ? (
            <>
              <button type="button" className="tlink mclose" onClick={() => setPicked("")}>Close</button>
              <p className="kicker">{p.country}</p>
              <h3>{groups[picked][0].placeLabel || p.city}</h3>
              <ul className="mlist">{groups[picked].map((x) => <Entry key={x.id} x={x} />)}</ul>
            </>
          ) : (
            <>
              <p className="kicker">How to use it</p>
              <h3>Pick a pin</h3>
              <p>Each pin is a town or city, and the number says how many entries it holds. Red pins hold street works, green pins hold shows only. Zoom in to split a group of pins apart.</p>
              <p>We pin the town, never the wall. Some of these works were made without permission and some are still there.</p>
            </>
          )}
        </aside>
      </div>

      <section className="mall" aria-labelledby="mAll">
        <h2 id="mAll">Every place on the map</h2>
        {shownCities.length ? null : <p>Nothing matches those filters. <button type="button" className="tlink" onClick={clear}>Clear filters</button></p>}
        <div className="mgrid">
          {shownCities.map((k) => (
            <div className="mplace" key={k}>
              <h3><button type="button" className="mgo" onClick={() => pick(k, true)} aria-label={"Show " + byKey[k].city + " on the map"}>{byKey[k].city}</button></h3>
              <p className="kicker">{byKey[k].country} · {plural(groups[k].length, "entry", "entries")}</p>
              <ul className="mlist">{groups[k].map((x) => <Entry key={x.id} x={x} />)}</ul>
            </div>
          ))}
        </div>
        {off.length ? (
          <p className="moff">Not on the map, because they have no single place: {off.map((o, i) => (
            <span key={i}>{i ? (i === off.length - 1 ? " and " : ", ") : ""}<i>{o.title}</i> by {o.artist} ({o.where.toLowerCase()})</span>
          ))}. You will find them in the <a href="/interventions/">Intervention Archive</a>.</p>
        ) : null}
      </section>
    </div>
  );
}
