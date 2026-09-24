export function MapLegend() {
  return (
    <div className="map-legend" aria-label="Map legend">
      <LegendItem colorClass="legend-dot--spill" label="Spill extent" />
      <LegendItem colorClass="legend-dot--drift" label="Estimated drift path" />
      <LegendItem colorClass="legend-dot--high" label="High-association vessel" />
      <LegendItem colorClass="legend-dot--other" label="Other tracked vessel" />
    </div>
  )
}

function LegendItem({
  colorClass,
  label,
}: {
  colorClass: string
  label: string
}) {
  return (
    <span className="map-legend__item">
      <span className={`legend-dot ${colorClass}`} aria-hidden="true" />
      {label}
    </span>
  )
}
