import { useRef } from 'react'
import type { RankedVessel } from '../../types'
import { VesselRow } from './VesselRow'

interface VesselPanelProps {
  vessels: RankedVessel[]
  expandedMmsi: string | null
  highlightedMmsi: string | null
  onToggleVessel: (mmsi: string) => void
  onCompareClick: () => void
}

export function VesselPanel({
  vessels,
  expandedMmsi,
  highlightedMmsi,
  onToggleVessel,
  onCompareClick,
}: VesselPanelProps) {
  const listRef = useRef<HTMLDivElement>(null)

  return (
    <section className="panel vessel-panel" aria-label="Ranked vessels">
      <div className="panel__bar">
        <h2 className="panel__title">Ranked vessels</h2>
        <div className="panel__actions">
          <p className="panel__context">tap a row for evidence</p>
          <button
            type="button"
            className="panel__compare-btn"
            onClick={onCompareClick}
            aria-label="Compare vessels"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
            <span>Compare</span>
          </button>
        </div>
      </div>

      <div className="vessel-panel__list" ref={listRef}>
        {vessels.length === 0 ? (
          <p className="vessel-panel__empty">No vessels matched this spill zone.</p>
        ) : (
          vessels.map((vessel, index) => (
            <VesselRow
              key={vessel.mmsi ?? `${vessel.name}-${index}`}
              vessel={vessel}
              rank={index + 1}
              isExpanded={expandedMmsi === vessel.mmsi}
              isHighlighted={highlightedMmsi === vessel.mmsi}
              onToggle={() => onToggleVessel(vessel.mmsi)}
            />
          ))
        )}
      </div>
    </section>
  )
}
