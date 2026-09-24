import { Circle } from 'react-leaflet'
import { LatLngBounds } from 'leaflet'

interface HeatMapProps {
  vessels: Array<{ lat: number; lon: number; score: number }>
  spill: { lat: number; lon: number }
  enabled: boolean
}

export function HeatMap({ vessels, spill, enabled }: HeatMapProps) {
  if (!enabled) return null

  // Generate heat map data points
  const heatPoints = generateHeatPoints(vessels, spill)

  return (
    <>
      {heatPoints.map((point, index) => (
        <Circle
          key={index}
          center={[point.lat, point.lon]}
          radius={point.radius}
          pathOptions={{
            color: 'transparent',
            fillColor: point.color,
            fillOpacity: point.intensity,
            weight: 0,
          }}
        />
      ))}
    </>
  )
}

function generateHeatPoints(
  vessels: Array<{ lat: number; lon: number; score: number }>,
  spill: { lat: number; lon: number }
) {
  const points: Array<{ lat: number; lon: number; radius: number; color: string; intensity: number }> = []

  // Add spill origin heat point
  points.push({
    lat: spill.lat,
    lon: spill.lon,
    radius: 3000,
    color: '#e85d3a',
    intensity: 0.3,
  })

  // Add vessel-based heat points
  vessels.forEach(vessel => {
    const intensity = (vessel.score / 100) * 0.4
    const radius = 2000 + (vessel.score * 20)

    // Main heat point
    points.push({
      lat: vessel.lat,
      lon: vessel.lon,
      radius,
      color: getHeatColor(vessel.score),
      intensity,
    })

    // Secondary influence points
    points.push({
      lat: vessel.lat + 0.01,
      lon: vessel.lon + 0.01,
      radius: radius * 0.6,
      color: getHeatColor(vessel.score),
      intensity: intensity * 0.5,
    })
  })

  // Add intermediate probability zones
  const bounds = new LatLngBounds([
    [spill.lat - 0.1, spill.lon - 0.1],
    [spill.lat + 0.1, spill.lon + 0.1],
  ])

  for (let i = 0; i < 8; i++) {
    const lat = spill.lat + (Math.random() - 0.5) * 0.15
    const lon = spill.lon + (Math.random() - 0.5) * 0.15

    if (bounds.contains([lat, lon])) {
      points.push({
        lat,
        lon,
        radius: 1500 + Math.random() * 1000,
        color: '#3ec9c9',
        intensity: 0.1 + Math.random() * 0.15,
      })
    }
  }

  return points
}

function getHeatColor(score: number): string {
  if (score >= 75) return '#e85d3a'
  if (score >= 50) return '#d4a032'
  return '#6b8a9e'
}
