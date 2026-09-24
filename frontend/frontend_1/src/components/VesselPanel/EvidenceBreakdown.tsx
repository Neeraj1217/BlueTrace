import type { VesselEvidence } from '../../types'
import { getEvidenceLabel } from '../../utils/formatters'

interface EvidenceBreakdownProps {
  evidence: VesselEvidence
  summary: string
}

const EVIDENCE_KEYS = [
  'distance',
  'timing',
  'direction',
  'trajectory',
  'data_quality',
] as const

export function EvidenceBreakdown({ evidence, summary }: EvidenceBreakdownProps) {
  return (
    <div className="evidence">
      <p className="evidence__summary">{summary}</p>
      <div className="evidence__grid">
        {EVIDENCE_KEYS.map((key) => (
          <EvidenceBar
            key={key}
            label={getEvidenceLabel(key)}
            value={evidence[key]}
          />
        ))}
      </div>
    </div>
  )
}

function EvidenceBar({ label, value }: { label: string; value: number }) {
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0

  return (
    <div className="evidence__row">
      <div className="evidence__row-head">
        <span className="evidence__label">{label}</span>
        <span className="evidence__value">{safeValue.toFixed(1)}</span>
      </div>
      <div className="evidence__track" aria-hidden="true">
        <div
          className="evidence__fill"
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  )
}
