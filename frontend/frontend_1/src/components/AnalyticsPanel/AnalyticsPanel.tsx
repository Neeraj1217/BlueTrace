import type { RankedVessel, SpillData } from '../../types'
import { formatArea, formatConfidence } from '../../utils/formatters'

interface AnalyticsPanelProps {
  vessels: RankedVessel[]
  spill: SpillData
}

export function AnalyticsPanel({ vessels, spill }: AnalyticsPanelProps) {
  const stats = calculateStats(vessels)

  return (
    <section className="panel analytics-panel" aria-label="Investigation analytics">
      <div className="panel__bar">
        <h2 className="panel__title">Investigation summary</h2>
        <p className="panel__context">{vessels.length} vessels analyzed</p>
      </div>

      <div className="analytics-panel__content">
        <div className="analytics-panel__section">
          <h3 className="analytics-panel__section-title">Vessel distribution</h3>
          <div className="analytics-panel__stats-grid">
            <StatCard
              label="High association"
              value={stats.highCount}
              total={vessels.length}
              color="var(--score-high)"
            />
            <StatCard
              label="Medium association"
              value={stats.mediumCount}
              total={vessels.length}
              color="var(--score-medium)"
            />
            <StatCard
              label="Low association"
              value={stats.lowCount}
              total={vessels.length}
              color="var(--score-low)"
            />
          </div>
        </div>

        <div className="analytics-panel__section">
          <h3 className="analytics-panel__section-title">Evidence averages</h3>
          <div className="analytics-panel__evidence-grid">
            <EvidenceStat
              label="Distance"
              value={stats.avgDistance}
              max={100}
            />
            <EvidenceStat
              label="Timing"
              value={stats.avgTiming}
              max={100}
            />
            <EvidenceStat
              label="Direction"
              value={stats.avgDirection}
              max={100}
            />
            <EvidenceStat
              label="Trajectory"
              value={stats.avgTrajectory}
              max={100}
            />
            <EvidenceStat
              label="Data quality"
              value={stats.avgDataQuality}
              max={100}
            />
          </div>
        </div>

        <div className="analytics-panel__section">
          <h3 className="analytics-panel__section-title">Spill metrics</h3>
          <div className="analytics-panel__spill-stats">
            <SimpleStat label="Area" value={formatArea(spill.area_km2)} />
            <SimpleStat label="Confidence" value={formatConfidence(spill.confidence)} />
            <SimpleStat label="Avg vessel distance" value={`${stats.avgDistanceFromSpill.toFixed(1)} km`} />
            <SimpleStat label="Top score" value={stats.topScore.toFixed(1)} />
          </div>
        </div>
      </div>
    </section>
  )
}

function StatCard({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const percentage = total > 0 ? (value / total) * 100 : 0

  return (
    <div className="stat-card">
      <div className="stat-card__header">
        <span className="stat-card__label">{label}</span>
        <span className="stat-card__count">{value}/{total}</span>
      </div>
      <div className="stat-card__bar">
        <div
          className="stat-card__fill"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

function EvidenceStat({ label, value, max }: { label: string; value: number; max: number }) {
  const percentage = (value / max) * 100

  return (
    <div className="evidence-stat">
      <div className="evidence-stat__header">
        <span className="evidence-stat__label">{label}</span>
        <span className="evidence-stat__value">{value.toFixed(1)}</span>
      </div>
      <div className="evidence-stat__bar">
        <div
          className="evidence-stat__fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

function SimpleStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="simple-stat">
      <span className="simple-stat__label">{label}</span>
      <span className="simple-stat__value">{value}</span>
    </div>
  )
}

function calculateStats(vessels: RankedVessel[]) {
  const highCount = vessels.filter(v => v.score >= 75).length
  const mediumCount = vessels.filter(v => v.score >= 50 && v.score < 75).length
  const lowCount = vessels.filter(v => v.score < 50).length

  const avgDistance = vessels.reduce((sum, v) => sum + (v.evidence?.distance || 0), 0) / vessels.length
  const avgTiming = vessels.reduce((sum, v) => sum + (v.evidence?.timing || 0), 0) / vessels.length
  const avgDirection = vessels.reduce((sum, v) => sum + (v.evidence?.direction || 0), 0) / vessels.length
  const avgTrajectory = vessels.reduce((sum, v) => sum + (v.evidence?.trajectory || 0), 0) / vessels.length
  const avgDataQuality = vessels.reduce((sum, v) => sum + (v.evidence?.data_quality || 0), 0) / vessels.length

  const vesselsWithDistance = vessels.filter(v => typeof v.distance_km === 'number')
  const avgDistanceFromSpill = vesselsWithDistance.length > 0
    ? vesselsWithDistance.reduce((sum, v) => sum + (v.distance_km || 0), 0) / vesselsWithDistance.length
    : 0

  const topScore = vessels.length > 0 ? Math.max(...vessels.map(v => v.score)) : 0

  return {
    highCount,
    mediumCount,
    lowCount,
    avgDistance,
    avgTiming,
    avgDirection,
    avgTrajectory,
    avgDataQuality,
    avgDistanceFromSpill,
    topScore,
  }
}
