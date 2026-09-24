# Blue Trace — Dashboard Build Specification

This document describes exactly what the dashboard should show and how it
should behave. It's written so it can be handed directly to a developer,
or pasted into an AI coding tool, to build the frontend.

The dashboard consumes ONE JSON object (see `sample_api_response.json`)
with this shape:

```json
{
  "spill": {
    "lat": 17.7216,
    "lon": 83.3438,
    "area_km2": 55.55,
    "confidence": 0.65,
    "detected_at": "2026-09-04T03:42:00Z",
    "note": "Candidate dark region -- not yet confirmed as oil"
  },
  "drift": {
    "origin_lat": 17.7969,
    "origin_lon": 83.4004,
    "drift_path": [[17.7969, 83.4004], [17.7781, 83.3863], [17.7593, 83.3721], [17.7404, 83.358], [17.7216, 83.3438]],
    "drift_hours": 6.0,
    "assumptions": { "wind_speed_mps": 6.0, "wind_direction_from_deg": 45.0, "current_speed_mps": 0.3, "current_direction_to_deg": 210.0 },
    "note": "Simplified linear backtrack using wind leeway + current vectors"
  },
  "ranked_vessels": [
    {
      "mmsi": "419998877",
      "name": "MV Coastal Runner",
      "score": 85.6,
      "evidence": { "distance": 90.0, "timing": 97.8, "direction": 52.5, "trajectory": 92.0, "data_quality": 98.7 }
    }
  ]
}
```

`ranked_vessels` arrives already sorted highest score first — do not re-sort.

---

## Layout: 3 zones

### Zone 1 — Header (top of screen)

A horizontal strip showing the spill's key facts at a glance:

| Field | Source | Notes |
|---|---|---|
| Detected time | `spill.detected_at` | format as a readable date/time |
| Location | `spill.lat`, `spill.lon` | show as "17.72°N, 83.34°E" |
| Estimated area | `spill.area_km2` | append "km²" |
| Confidence | `spill.confidence` | multiply by 100, show as a percentage |

Also show `spill.note` somewhere visible near this header (small text) — it
says the spill is a *candidate*, not confirmed. This caveat should not be
hidden in a tooltip; it should be visible without interaction.

### Zone 2 — Map (left / main area)

Show a map (can be a real map library like Leaflet/Mapbox, or a stylized
custom chart if a real map isn't available):

1. **Spill marker** — plot at `spill.lat`, `spill.lon`. Style it as an
   alert/danger color (red/orange). Size can scale with `area_km2`.
2. **Drift path** — plot `drift.drift_path` as a connected line/polyline,
   in order, from first point to last. Style it distinctly (e.g. dashed,
   teal/cyan) so it reads as "estimated," not certain.
3. **Origin marker** — plot a marker at `drift.origin_lat`,
   `drift.origin_lon` (the first point in `drift_path`), labeled
   something like "Estimated origin."
4. **Vessel markers** — plot one marker per entry in `ranked_vessels` at
   its `lat`/`lon` (vessel lat/lon comes from the vessel object if you
   pass the full vessel data through — otherwise the ranked_vessels
   objects should be extended to include lat/lon before reaching the
   frontend). Color/size each marker based on `score`:
   - score ≥ 75 → strong warning color (red/orange), larger
   - score 50–74 → amber/yellow
   - score < 50 → neutral/muted color, smaller
5. A small legend explaining what each marker color/style means.

### Zone 3 — Ranked Vessel List (right / sidebar)

A vertical list, one row per vessel in `ranked_vessels`, in the order
given (already sorted best match first):

**Collapsed row shows:**
- Rank number (1, 2, 3...)
- `name`
- `mmsi` (smaller/muted text)
- `score`, shown prominently (large number + a horizontal bar/progress
  indicator showing score out of 100)

**Expanded row (on click/tap) shows:**
- All 5 values inside `evidence`, each as a labeled bar out of 100:
  - Distance
  - Timing
  - Direction
  - Trajectory
  - Data quality
- A short plain-language sentence explaining the overall score (this can
  be generated on the frontend from the evidence values, e.g. "High
  distance and timing match, but direction alignment is weak" — or the
  backend can supply this text directly if you add a `note` field per
  vessel)

Only one vessel's evidence should be expanded at a time (accordion
behavior) to avoid a cluttered screen.

---

## Interaction summary

| Action | Result |
|---|---|
| Load page | Fetch/read the JSON, render header + map + vessel list |
| Click a vessel row | Expand that row's evidence breakdown; collapse any other open row |
| Click a vessel marker on the map (optional, nice-to-have) | Scroll to / highlight that vessel's row in the sidebar |

---

## Visual tone

This is an investigation/analysis tool, not a consumer app — lean toward
a serious, data-dense, "control room" aesthetic rather than a playful
one. Dark background works well here (easier to read map data, feels
appropriately serious for an environmental incident tool). Use color
purposefully: red/orange = alert/high suspicion, teal/cyan = estimated/
informational, muted grey-blue = neutral/low relevance.

---

## What NOT to hardcode

Nothing on this dashboard should have fixed/hardcoded numbers once
connected to the real API — every value shown must come from the JSON
response described above. If real data changes (new spill, different
ships), the dashboard should update automatically on the next fetch,
with zero code changes needed.

---

## Reference

A working non-React prototype already exists (`bluetrace_prototype.html`)
implementing this exact layout with mock data — useful as a visual/
behavioral reference for exact styling and interaction feel, even if
rebuilt in React.
