import {
  formatArea,
  formatConfidence,
  formatCoordinates,
  formatDetectedAt,
} from '../../utils/formatters'
import type { SpillData, DriftData, DashboardResponse } from '../../types'
import { ExportButton } from '../ExportButton/ExportButton'

interface HeaderProps {
  spill: SpillData
  drift: DriftData
  data: DashboardResponse
  onFilterClick?: () => void
  onReportClick?: () => void
}

export function Header({ spill, drift, data, onFilterClick, onReportClick }: HeaderProps) {
  const getStatusBadge = () => {
    if (spill.confidence >= 0.8) return { text: 'Confirmed', className: 'status-badge--confirmed' }
    if (spill.confidence >= 0.5) return { text: 'Candidate', className: 'status-badge--candidate' }
    return { text: 'Investigating', className: 'status-badge--investigating' }
  }

  const status = getStatusBadge()

  return (
    <header className="header">
      <div className="header__inner">
        <div className="header__brand">
          <div className="header__logo" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="14" height="14">
              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M6 14c2-3 4-4 6-4s4 1 6 4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <div className="header__title-row">
              <h1 className="header__title">Blue Trace</h1>
              <span className={`status-badge ${status.className}`}>{status.text}</span>
            </div>
            <p className="header__subtitle">Maritime spill investigation</p>
          </div>
        </div>

        <div className="header__metrics">
          <MetricBlock
            label="Spill detected"
            value={formatDetectedAt(spill.detected_at)}
            valueClassName="header__value--alert"
          />
          <MetricBlock
            label="Location"
            value={formatCoordinates(spill.lat, spill.lon)}
          />
          <MetricBlock
            label="Est. area"
            value={formatArea(spill.area_km2)}
          />
          <MetricBlock
            label="Detection confidence"
            value={formatConfidence(spill.confidence)}
          />
        </div>

        <div className="header__actions">
          {onFilterClick && (
            <button
              type="button"
              className="header__filter-btn"
              onClick={onFilterClick}
              aria-label="Open filters"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              <span>Filters</span>
            </button>
          )}
          {onReportClick && (
            <button
              type="button"
              className="header__report-btn"
              onClick={onReportClick}
              aria-label="Generate report"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <span>Report</span>
            </button>
          )}
          <ExportButton data={data} />
        </div>
      </div>

      {/* Weather/Ocean Conditions */}
      {drift.assumptions && (
        <div className="header__conditions">
          <ConditionBlock
            label="Wind"
            value={`${drift.assumptions.wind_speed_mps?.toFixed(1) || 'N/A'} m/s`}
            subvalue={`${drift.assumptions.wind_direction_from_deg?.toFixed(0) || 'N/A'}°`}
          />
          <ConditionBlock
            label="Current"
            value={`${drift.assumptions.current_speed_mps?.toFixed(1) || 'N/A'} m/s`}
            subvalue={`${drift.assumptions.current_direction_to_deg?.toFixed(0) || 'N/A'}°`}
          />
          <ConditionBlock
            label="Drift period"
            value={`${drift.drift_hours}h`}
            subvalue="back-track"
          />
        </div>
      )}

      {spill.note && (
        <p className="header__note">{spill.note}</p>
      )}

      <div className="header__divider" />
    </header>
  )
}

function MetricBlock({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="header__metric">
      <span className="header__label">{label}</span>
      <span className={`header__value ${valueClassName ?? ''}`.trim()}>
        {value}
      </span>
    </div>
  )
}

function ConditionBlock({
  label,
  value,
  subvalue,
}: {
  label: string
  value: string
  subvalue: string
}) {
  return (
    <div className="header__condition">
      <span className="header__condition-label">{label}</span>
      <div className="header__condition-values">
        <span className="header__condition-value">{value}</span>
        <span className="header__condition-subvalue">{subvalue}</span>
      </div>
    </div>
  )
}
