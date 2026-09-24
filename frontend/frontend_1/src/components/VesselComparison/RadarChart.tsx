import type { VesselEvidence } from '../../types'

interface RadarChartProps {
  data: Array<{ name: string; evidence: VesselEvidence; color: string }>
}

export function RadarChart({ data }: RadarChartProps) {
  const size = 200
  const center = size / 2
  const radius = 80
  const labels = ['Distance', 'Timing', 'Direction', 'Trajectory', 'Data Quality']
  const maxScore = 100

  const getPointCoordinates = (value: number, index: number, total: number) => {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2
    const normalizedValue = value / maxScore
    const x = center + radius * normalizedValue * Math.cos(angle)
    const y = center + radius * normalizedValue * Math.sin(angle)
    return { x, y }
  }

  const getLabelCoordinates = (index: number, total: number) => {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2
    const labelRadius = radius + 20
    const x = center + labelRadius * Math.cos(angle)
    const y = center + labelRadius * Math.sin(angle)
    return { x, y }
  }

  const evidenceKeys: (keyof VesselEvidence)[] = ['distance', 'timing', 'direction', 'trajectory', 'data_quality']

  return (
    <div className="radar-chart">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circles */}
        {[0.2, 0.4, 0.6, 0.8, 1].map((level) => (
          <circle
            key={level}
            cx={center}
            cy={center}
            r={radius * level}
            fill="none"
            stroke="rgba(62, 201, 201, 0.1)"
            strokeWidth="1"
          />
        ))}

        {/* Axis lines */}
        {evidenceKeys.map((_, index) => {
          const angle = (Math.PI * 2 * index) / evidenceKeys.length - Math.PI / 2
          const x = center + radius * Math.cos(angle)
          const y = center + radius * Math.sin(angle)
          return (
            <line
              key={index}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="rgba(62, 201, 201, 0.2)"
              strokeWidth="1"
            />
          )
        })}

        {/* Data polygons */}
        {data.map((item, dataIndex) => {
          const points = evidenceKeys.map((key, index) => {
            const coords = getPointCoordinates(item.evidence[key], index, evidenceKeys.length)
            return `${coords.x},${coords.y}`
          }).join(' ')

          return (
            <polygon
              key={dataIndex}
              points={points}
              fill={item.color}
              fillOpacity="0.2"
              stroke={item.color}
              strokeWidth="2"
            />
          )
        })}

        {/* Labels */}
        {labels.map((label, index) => {
          const coords = getLabelCoordinates(index, labels.length)
          return (
            <text
              key={index}
              x={coords.x}
              y={coords.y}
              fontSize="8"
              fill="var(--text-secondary)"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {label}
            </text>
          )
        })}
      </svg>

      {/* Legend */}
      <div className="radar-chart__legend">
        {data.map((item, index) => (
          <div key={index} className="radar-chart__legend-item">
            <span
              className="radar-chart__legend-color"
              style={{ backgroundColor: item.color }}
            />
            <span className="radar-chart__legend-label">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
