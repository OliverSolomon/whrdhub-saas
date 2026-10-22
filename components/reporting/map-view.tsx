"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ExternalLink, MapPin, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { loadLeaflet } from "@/lib/leaflet";
import { incidentLabel, OTHER_COUNTRIES } from "@/lib/reporting-options";
import { URGENCY_META, urgencyMeta } from "@/lib/urgency";

/** A report as the map sees it: a general area, never the exact point. */
export interface MapReport {
  id: string;
  area: { lat: number; lng: number; radiusM: number } | null;
  incident_types: string[] | null;
  county: string | null;
  urgency: string | null;
  reporter_type: string | null;
  verification_status: string | null;
  created_at: string | null;
}

/** Light to deep violet: the more cases in a county, the darker it is. */
const SCALE = ["#f3eefb", "#dccdf1", "#b999e0", "#8f62c4", "#6a3f9d", "#4d2f73"];

const colourFor = (count: number, max: number) => {
  if (count <= 0) return "#f7f5fa";
  const step = Math.min(SCALE.length - 1, Math.max(1, Math.ceil((count / Math.max(max, 1)) * (SCALE.length - 1))));
  return SCALE[step];
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

export function MapView({ reports }: { reports: MapReport[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const circlesRef = useRef<Map<string, any>>(new Map());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const countyLayerRef = useRef<any>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [countyFilter, setCountyFilter] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showAreas, setShowAreas] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);

  // Cases per county, from the county every report names (not only the ones with a GPS point).
  const { counts, outside, max } = useMemo(() => {
    const c = new Map<string, number>();
    const out: Record<string, number> = {};
    for (const r of reports) {
      if (!r.county) continue;
      if ((OTHER_COUNTRIES as readonly string[]).includes(r.county)) {
        out[r.county] = (out[r.county] ?? 0) + 1;
        continue;
      }
      const key = norm(r.county);
      c.set(key, (c.get(key) ?? 0) + 1);
    }
    return { counts: c, outside: out, max: Math.max(0, ...c.values()) };
  }, [reports]);

  const placed = useMemo(() => reports.filter((r) => r.area), [reports]);
  const listed = useMemo(
    () => (countyFilter ? reports.filter((r) => r.county && norm(r.county) === norm(countyFilter)) : reports).filter((r) => r.area),
    [reports, countyFilter],
  );

  useEffect(() => {
    if (!mapRef.current || typeof window === "undefined" || mapInstanceRef.current) return;
    let cancelled = false;

    loadLeaflet()
      .then(async (L) => {
        if (cancelled || !mapRef.current) return;
        const map = L.map(mapRef.current, { zoomControl: true }).setView([0.2, 37.9], 6);
        mapInstanceRef.current = map;

        // A quiet base map, so the shading carries the message.
        L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", {
          attribution: '© <a href="https://www.openstreetmap.org">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a> · county boundaries: geoBoundaries',
          maxZoom: 12,
        }).addTo(map);

        try {
          const res = await fetch("/geo/kenya-counties.json");
          const geo = await res.json();
          if (cancelled) return;
          const layer = L.geoJSON(geo, {
            style: (f: { properties: { name: string } }) => ({
              fillColor: colourFor(counts.get(norm(f.properties.name)) ?? 0, max),
              fillOpacity: 0.85,
              color: "#ffffff",
              weight: 1,
            }),
            onEachFeature: (f: { properties: { name: string } }, l: { bindTooltip: (s: string, o: object) => void; on: (e: object) => void }) => {
              const n = counts.get(norm(f.properties.name)) ?? 0;
              l.bindTooltip(`<strong>${f.properties.name}</strong><br/>${n} report${n === 1 ? "" : "s"}`, { sticky: true });
              l.on({ click: () => setCountyFilter((cur) => (cur && norm(cur) === norm(f.properties.name) ? null : f.properties.name)) });
            },
          }).addTo(map);
          countyLayerRef.current = layer;
          map.fitBounds(layer.getBounds(), { padding: [10, 10] });
        } catch {
          setMapError("The county boundaries could not be loaded.");
        }

        // Areas, not pins: each report is a soft circle around the centre of a wide grid cell.
        for (const r of placed) {
          const colour = urgencyMeta(r.urgency).hex;
          const circle = L.circle([r.area!.lat, r.area!.lng], {
            radius: r.area!.radiusM,
            color: colour,
            weight: 1.5,
            fillColor: colour,
            fillOpacity: 0.28,
          }).addTo(map);
          circle.bindPopup(`
            <div style="font-family:sans-serif;font-size:12px;min-width:190px">
              <p style="font-weight:700;margin:0 0 4px;font-size:13px">${(r.incident_types || []).map(incidentLabel).join(", ") || "Incident"}</p>
              <p style="color:#666;margin:0 0 2px"><strong>${r.county || "County not given"}</strong> · approximate area</p>
              <p style="margin:0 0 2px">Urgency: <span style="color:${colour};font-weight:600">${urgencyMeta(r.urgency).label}</span></p>
              <p style="margin:4px 0 0"><a href="/hub/reporting/reports/${r.id}" style="color:#734e9e;font-weight:600;text-decoration:underline">Open report →</a></p>
            </div>`);
          circle.on("click", () => setSelectedId(r.id));
          circlesRef.current.set(r.id, circle);
        }
      })
      .catch(() => setMapError("The map could not be loaded."));

    const circles = circlesRef.current;
    return () => {
      cancelled = true;
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
      countyLayerRef.current = null;
      circles.clear();
    };
    // Built once from the server-rendered set; this view does not refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Area circles on and off.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    circlesRef.current.forEach((c) => (showAreas ? c.addTo(map) : c.remove()));
  }, [showAreas]);

  // Outline the county chosen from the map or the list.
  useEffect(() => {
    const layer = countyLayerRef.current;
    if (!layer) return;
    layer.eachLayer((l: { feature: { properties: { name: string } }; setStyle: (s: object) => void; bringToFront: () => void }) => {
      const on = countyFilter && norm(l.feature.properties.name) === norm(countyFilter);
      l.setStyle({ color: on ? "#ce2087" : "#ffffff", weight: on ? 3 : 1 });
      if (on) l.bringToFront();
    });
  }, [countyFilter]);

  const handleSelect = (r: MapReport) => {
    setSelectedId(r.id);
    const map = mapInstanceRef.current;
    const circle = circlesRef.current.get(r.id);
    if (map && r.area) map.flyTo([r.area.lat, r.area.lng], 9, { duration: 0.8 });
    circle?.openPopup();
  };

  const legendSteps = SCALE.slice(1).map((c, i) => ({
    c,
    label: i === 0 ? "1" : `${Math.max(2, Math.ceil((max * i) / (SCALE.length - 1)))}+`,
  }));

  return (
    <div className="relative flex h-full">
      {sidebarOpen && (
        <aside className="hidden w-80 shrink-0 flex-col overflow-hidden border-r border-line bg-surface md:flex">
          <div className="border-b border-line p-4">
            <p className="text-sm font-black text-ink">
              {countyFilter ? `${countyFilter}: ${listed.length} mapped` : `${placed.length} mapped reports`}
            </p>
            <p className="mt-1 flex items-start gap-1.5 text-[11px] leading-snug text-muted">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
              Locations are shown as wide areas, never exact points, to protect reporters.
            </p>
            {countyFilter && (
              <button onClick={() => setCountyFilter(null)} className="mt-2 text-xs font-semibold text-purple hover:underline">
                Clear county filter
              </button>
            )}
          </div>
          <div className="feed-scroll flex-1 divide-y divide-line overflow-y-auto">
            {listed.length === 0 && <p className="p-4 text-sm text-muted">No mapped reports here.</p>}
            {listed.map((r) => (
              <button
                key={r.id}
                onClick={() => handleSelect(r)}
                className={`w-full p-3.5 text-left transition-colors hover:bg-paper ${selectedId === r.id ? "bg-purple-050" : ""}`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: urgencyMeta(r.urgency).hex }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      {(r.incident_types || []).map(incidentLabel).join(", ") || "Incident"}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                      <MapPin className="h-3 w-3" />
                      <span>{r.county || "Area only"}</span>
                      <span>·</span>
                      <span>{r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Badge variant={urgencyMeta(r.urgency).badge} className="px-1.5 py-0 text-[10px]">
                        {urgencyMeta(r.urgency).label}
                      </Badge>
                      <Link
                        href={`/hub/reporting/reports/${r.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-purple hover:underline"
                      >
                        Open <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>
      )}

      <div className="relative flex-1">
        <div ref={mapRef} className="h-full w-full" />
        {mapError && (
          <p className="absolute left-4 top-4 z-[1000] rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">{mapError}</p>
        )}

        <div className="absolute left-4 top-4 z-[1000] hidden gap-2 md:flex">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-xl border border-line bg-surface px-3 py-2 text-xs font-semibold shadow-sm hover:bg-paper"
          >
            {sidebarOpen ? "Hide list" : "Show list"}
          </button>
          <button
            onClick={() => setShowAreas(!showAreas)}
            aria-pressed={showAreas}
            className="rounded-xl border border-line bg-surface px-3 py-2 text-xs font-semibold shadow-sm hover:bg-paper"
          >
            {showAreas ? "Hide areas" : "Show areas"}
          </button>
        </div>

        <div className="absolute bottom-4 right-4 z-[1000] space-y-2 rounded-2xl border border-line bg-surface/95 p-3 text-xs shadow-premium backdrop-blur-sm">
          <p className="font-bold">Reports per county</p>
          <div className="flex items-center gap-1">
            <span className="h-3 w-6 rounded-sm border border-line" style={{ background: "#f7f5fa" }} />
            <span className="mr-2 text-muted">0</span>
            {legendSteps.map((s) => (
              <span key={s.c} className="flex items-center gap-1">
                <span className="h-3 w-6 rounded-sm" style={{ background: s.c }} />
                <span className="text-muted">{max > 0 ? s.label : ""}</span>
              </span>
            ))}
          </div>
          <div className="space-y-1 border-t border-line pt-2">
            <p className="font-bold">Urgency (areas)</p>
            {Object.entries(URGENCY_META).map(([key, v]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ background: v.hex, opacity: 0.7 }} />
                <span className="text-muted">{v.label}</span>
              </div>
            ))}
          </div>
          {Object.keys(outside).length > 0 && (
            <p className="border-t border-line pt-2 text-muted">
              Outside Kenya: {Object.entries(outside).map(([k, v]) => `${k} ${v}`).join(", ")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
