import { useEffect, useState } from 'react'
import { useMap } from 'react-leaflet'
import type { LeafletMouseEvent } from 'leaflet'

interface MapControlsProps {
  showLayer?: boolean
  onLayerToggle?: (show: boolean) => void
  showHeatMap?: boolean
  onHeatMapToggle?: (show: boolean) => void
}

export function MapControls({ showLayer = true, onLayerToggle, showHeatMap = false, onHeatMapToggle }: MapControlsProps) {
  const map = useMap()
  const [coordinates, setCoordinates] = useState<string>('')

  useEffect(() => {
    if (!map) return

    const handleMouseMove = (e: LeafletMouseEvent) => {
      const { lat, lng } = e.latlng
      setCoordinates(`${lat.toFixed(4)}°, ${lng.toFixed(4)}°`)
    }

    map.on('mousemove', handleMouseMove)

    return () => {
      map.off('mousemove', handleMouseMove)
    }
  }, [map])

  return (
    <div className="map-controls">
      <div className="map-controls__layers">
        <button
          type="button"
          className={`map-controls__layer-btn ${showLayer ? 'map-controls__layer-btn--active' : ''}`}
          onClick={() => onLayerToggle?.(!showLayer)}
          aria-label="Toggle map layer"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18" />
            <path d="M9 21V9" />
          </svg>
          <span>Map Layer</span>
        </button>
        <button
          type="button"
          className={`map-controls__layer-btn ${showHeatMap ? 'map-controls__layer-btn--active' : ''}`}
          onClick={() => onHeatMapToggle?.(!showHeatMap)}
          aria-label="Toggle heat map"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="4" />
          </svg>
          <span>Heat Map</span>
        </button>
      </div>
      <div className="map-controls__coordinates">
        <span className="map-controls__coord-label">Cursor:</span>
        <span className="map-controls__coord-value">{coordinates || 'Move over map'}</span>
      </div>
    </div>
  )
}
