import { useEffect, useRef } from 'react'
import type { RankedVessel } from '../../types'
import {
  buildVesselMetadata,
  formatLastSeen,
  formatScore,
  generateEvidenceSummary,
  getScoreTier,
} from '../../utils/formatters'
import { getScoreColors } from '../../utils/scoreColors'
import { EvidenceBreakdown } from './EvidenceBreakdown'

interface VesselRowProps {
  vessel: RankedVessel
  rank: number
  isExpanded: boolean
  isHighlighted: boolean
  onToggle: () => void
}

export function VesselRow({
  vessel,
  rank,
  isExpanded,
  isHighlighted,
  onToggle,
}: VesselRowProps) {
  const rowRef = useRef<HTMLDivElement>(null)
  const tier = getScoreTier(vessel.score)
  const colors = getScoreColors(tier)
  const metadata = buildVesselMetadata(vessel)
  const scorePercent = Math.max(0, Math.min(100, vessel.score))

  useEffect(() => {
    if (isHighlighted && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [isHighlighted])

  const evidence = vessel.evidence ?? {
    distance: 0,
    timing: 0,
    direction: 0,
    trajectory: 0,
    data_quality: 0,
  }

  return (
    <div
      ref={rowRef}
      className={`vessel-row ${isExpanded ? 'vessel-row--expanded' : ''} ${isHighlighted ? 'vessel-row--highlighted' : ''}`}
      data-mmsi={vessel.mmsi}
    >
      <button
        type="button"
        className="vessel-row__trigger"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={`evidence-${vessel.mmsi}`}
      >
        <span className="vessel-row__rank">{rank}</span>

        <span className="vessel-row__main">
          <span className="vessel-row__name">{vessel.name}</span>
          <div className="vessel-row__details">
            {vessel.vessel_type && (
              <span className="vessel-row__type">{vessel.vessel_type}</span>
            )}
            {metadata && (
              <span className="vessel-row__meta">{metadata}</span>
            )}
          </div>
        </span>

        <span className="vessel-row__score-block">
          <span
            className="vessel-row__score"
            style={{ color: colors.text }}
          >
            {formatScore(vessel.score)}
          </span>
          <span className="vessel-row__score-track" aria-hidden="true">
            <span
              className="vessel-row__score-fill"
              style={{ width: `${scorePercent}%`, backgroundColor: colors.bar }}
            />
          </span>
        </span>

        {/* FIX #2 — always render the same glyph; CSS rotates it based on
            the .vessel-row--expanded class on the parent div above */}
        <span className="vessel-row__chevron" aria-hidden="true">
          ▸
        </span>
      </button>

      {isExpanded && (
        <div
          id={`evidence-${vessel.mmsi}`}
          className="vessel-row__evidence"
        >
          <VesselDetails vessel={vessel} />
          <EvidenceBreakdown
            evidence={evidence}
            summary={generateEvidenceSummary(evidence, vessel.note)}
          />
        </div>
      )}
    </div>
  )
}

function VesselDetails({ vessel }: { vessel: RankedVessel }) {
  return (
    <div className="vessel-details">
      <div className="vessel-details__grid">
        {vessel.vessel_type && (
          <DetailItem label="Type" value={vessel.vessel_type} />
        )}
        {vessel.mmsi && (
          <DetailItem label="MMSI" value={vessel.mmsi} />
        )}
        {typeof vessel.distance_km === 'number' && (
          <DetailItem label="Distance from spill" value={`${vessel.distance_km.toFixed(1)} km`} />
        )}
        {vessel.last_seen_at && (
          <DetailItem label="Last seen" value={formatLastSeen(vessel.last_seen_at)} />
        )}
        {vessel.lat && vessel.lon && (
          <DetailItem
            label="Position"
            value={`${vessel.lat.toFixed(4)}°, ${vessel.lon.toFixed(4)}°`}
          />
        )}
      </div>
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="vessel-details__item">
      <span className="vessel-details__label">{label}</span>
      <span className="vessel-details__value">{value}</span>
    </div>
  )
}
