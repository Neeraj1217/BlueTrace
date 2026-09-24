import { useState } from 'react'
import type { RankedVessel } from '../../types'
import { getScoreTier, shortVesselName } from '../../utils/formatters'
import { getScoreColors } from '../../utils/scoreColors'
import { RadarChart } from './RadarChart'

interface VesselComparisonProps {
  vessels: RankedVessel[]
  onClose: () => void
}

export function VesselComparison({ vessels, onClose }: VesselComparisonProps) {
  const [selectedVessels, setSelectedVessels] = useState<Set<string>>(new Set())

  const toggleVessel = (mmsi: string) => {
    const newSelected = new Set(selectedVessels)
    if (newSelected.has(mmsi)) {
      newSelected.delete(mmsi)
    } else if (newSelected.size < 3) {
      newSelected.add(mmsi)
    }
    setSelectedVessels(newSelected)
  }

  const selectedVesselData = vessels
    .filter(v => selectedVessels.has(v.mmsi))
    .map(v => ({
      name: shortVesselName(v.name),
      evidence: v.evidence,
      color: getScoreColors(getScoreTier(v.score)).marker,
    }))

  const calculateSimilarity = (v1: RankedVessel, v2: RankedVessel) => {
    const keys: (keyof typeof v1.evidence)[] = ['distance', 'timing', 'direction', 'trajectory', 'data_quality']
    const differences = keys.map(key => Math.abs(v1.evidence[key] - v2.evidence[key]))
    const avgDifference = differences.reduce((a, b) => a + b, 0) / differences.length
    return Math.max(0, 100 - avgDifference)
  }

  return (
    <div className="vessel-comparison">
      <div className="vessel-comparison__header">
        <h2 className="vessel-comparison__title">Vessel Comparison</h2>
        <button
          type="button"
          className="vessel-comparison__close"
          onClick={onClose}
          aria-label="Close comparison"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="vessel-comparison__content">
        <div className="vessel-comparison__sidebar">
          <p className="vessel-comparison__hint">
            Select up to 3 vessels to compare
          </p>
          <div className="vessel-comparison__list">
            {vessels.map(vessel => {
              const tier = getScoreTier(vessel.score)
              const colors = getScoreColors(tier)
              const isSelected = selectedVessels.has(vessel.mmsi)

              return (
                <button
                  key={vessel.mmsi}
                  type="button"
                  className={`vessel-comparison__item ${isSelected ? 'vessel-comparison__item--selected' : ''}`}
                  onClick={() => toggleVessel(vessel.mmsi)}
                  disabled={!isSelected && selectedVessels.size >= 3}
                >
                  <span
                    className="vessel-comparison__color"
                    style={{ backgroundColor: colors.marker }}
                  />
                  <span className="vessel-comparison__name">{shortVesselName(vessel.name)}</span>
                  <span className="vessel-comparison__score">{vessel.score.toFixed(1)}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="vessel-comparison__main">
          {selectedVesselData.length === 0 ? (
            <div className="vessel-comparison__empty">
              <p>Select vessels from the list to view comparison</p>
            </div>
          ) : (
            <>
              <div className="vessel-comparison__chart">
                <RadarChart data={selectedVesselData} />
              </div>

              <div className="vessel-comparison__details">
                <h3 className="vessel-comparison__details-title">Evidence Breakdown</h3>
                <div className="vessel-comparison__evidence-grid">
                  {selectedVesselData.map((item, index) => (
                    <div key={index} className="vessel-comparison__evidence-card">
                      <div className="vessel-comparison__evidence-header">
                        <span
                          className="vessel-comparison__evidence-color"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="vessel-comparison__evidence-name">{item.name}</span>
                      </div>
                      <div className="vessel-comparison__evidence-stats">
                        <EvidenceStat label="Distance" value={item.evidence.distance} />
                        <EvidenceStat label="Timing" value={item.evidence.timing} />
                        <EvidenceStat label="Direction" value={item.evidence.direction} />
                        <EvidenceStat label="Trajectory" value={item.evidence.trajectory} />
                        <EvidenceStat label="Data Quality" value={item.evidence.data_quality} />
                      </div>
                    </div>
                  ))}
                </div>

                {selectedVesselData.length === 2 && (
                  <div className="vessel-comparison__similarity">
                    <span className="vessel-comparison__similarity-label">
                      Similarity Score:
                    </span>
                    <span className="vessel-comparison__similarity-value">
                      {calculateSimilarity(
                        vessels.find(v => v.mmsi === Array.from(selectedVessels)[0])!,
                        vessels.find(v => v.mmsi === Array.from(selectedVessels)[1])!
                      ).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function EvidenceStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="vessel-comparison__evidence-stat">
      <span className="vessel-comparison__evidence-stat-label">{label}</span>
      <span className="vessel-comparison__evidence-stat-value">{value.toFixed(1)}</span>
    </div>
  )
}
