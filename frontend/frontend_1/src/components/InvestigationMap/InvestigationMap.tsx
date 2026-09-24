import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Circle,
  Marker,
  MapContainer,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet'
import { DivIcon, LatLngBounds } from 'leaflet'
import 'leaflet/dist/leaflet.css'

import type {
  DriftData,
  RankedVessel,
  SpillData,
} from '../../types'

import {
  formatDriftContext,
  formatOriginLabel,
  getScoreTier,
  hasValidCoordinates,
  shortVesselName,
} from '../../utils/formatters'

import { getScoreColors } from '../../utils/scoreColors'
import { MapLegend } from './MapLegend'
import { MapControls } from './MapControls'
import { HeatMap } from '../HeatMap/HeatMap'


interface InvestigationMapProps {
  spill: SpillData
  drift: DriftData
  vessels: RankedVessel[]
  selectedMmsi: string | null
  onSelectVessel: (mmsi: string) => void
  currentTime: number
}


/*
 * Calculate the investigation zoom from the geographic range
 * of all relevant points.
 *
 * Important:
 * - This does NOT move the map.
 * - This does NOT call fitBounds().
 * - It only determines how close the map should be when
 *   focusing on a vessel.
 *
 * The resulting zoom is therefore consistent regardless
 * of which vessel is selected.
 */
function getInvestigationZoom(
  map: ReturnType<typeof useMap>,
  vessels: RankedVessel[],
  spill: SpillData,
  drift: DriftData,
): number {
  const points: [number, number][] = []

  /*
   * Vessel positions.
   */
  vessels
    .filter(hasValidCoordinates)
    .forEach((vessel) => {
      points.push([
        vessel.lat!,
        vessel.lon!,
      ])
    })

  /*
   * Spill detection point.
   */
  points.push([
    spill.lat,
    spill.lon,
  ])

  /*
   * Estimated origin is also part of the investigation
   * geography, so include it when calculating the scale.
   */
  if (
    Number.isFinite(drift.origin_lat) &&
    Number.isFinite(drift.origin_lon)
  ) {
    points.push([
      drift.origin_lat,
      drift.origin_lon,
    ])
  }

  /*
   * No meaningful range.
   */
  if (points.length <= 1) {
    return 13
  }

  const bounds = new LatLngBounds(points)

  /*
   * Ask Leaflet what zoom level can contain the geographic
   * investigation range inside the actual map viewport.
   *
   * This is ONLY a zoom calculation.
   * We never use fitBounds() for the animation.
   */
  const fitZoom = map.getBoundsZoom(
    bounds,
    false,
  )

  /*
   * Give the investigation some breathing room.
   *
   * getBoundsZoom() can be slightly too tight visually,
   * especially with labels and markers.
   *
   * Subtracting one level creates a more useful analytical
   * view instead of filling the entire map with the points.
   */
  const comfortableZoom = fitZoom - 1

  /*
   * Clamp the result so:
   *
   * - very close vessels don't produce an absurdly close zoom
   * - very distant vessels don't make the map uselessly wide
   */
  return Math.max(
    9,
    Math.min(13, comfortableZoom),
  )
}


/*
 * Handles vessel -> map focus.
 *
 * There is intentionally ONE animation.
 *
 * PAN + ZOOM begin on the same frame.
 *
 * We do NOT:
 *   panTo()
 *   wait for moveend
 *   setZoom()
 *
 * That staged approach is what caused the visible delay and
 * inconsistent feeling in the previous implementation.
 */
function SelectedVesselFocus({
  selectedMmsi,
  vessels,
  spill,
  drift,
}: {
  selectedMmsi: string | null
  vessels: RankedVessel[]
  spill: SpillData
  drift: DriftData
}) {
  const map = useMap()

  /*
   * Prevent the same selection from triggering another
   * animation when React receives an unrelated update.
   */
  const lastFocusedMmsi = useRef<string | null>(null)

  useEffect(() => {
    /*
     * Nothing selected.
     */
    if (!selectedMmsi) {
      lastFocusedMmsi.current = null
      return
    }

    /*
     * Do not replay the animation simply because the vessels
     * array got a new reference.
     */
    if (
      lastFocusedMmsi.current === selectedMmsi
    ) {
      return
    }

    const vessel = vessels.find(
      (candidate) =>
        candidate.mmsi === selectedMmsi,
    )

    /*
     * A vessel without coordinates can still be selected
     * in the sidebar, but there is nowhere to move the map.
     */
    if (
      !vessel ||
      !hasValidCoordinates(vessel)
    ) {
      return
    }

    lastFocusedMmsi.current = selectedMmsi

    const target: [number, number] = [
      vessel.lat!,
      vessel.lon!,
    ]

    /*
     * Determine the scale from the COMPLETE investigation
     * range, not from the selected vessel.
     *
     * This makes vessel #1 and vessel #4 use the same
     * investigation scale for the same dataset.
     */
    const targetZoom = getInvestigationZoom(
      map,
      vessels,
      spill,
      drift,
    )

    /*
     * Kill any currently running animation immediately.
     *
     * This is important when the user clicks another vessel
     * before the previous transition has finished.
     */
    map.stop()

    /*
     * flyTo performs the geographic movement and zoom
     * simultaneously from the beginning of the transition.
     *
     * 0.9s is fast enough to feel responsive but long enough
     * to avoid the abrupt "teleport/scale" effect.
     *
     * easeLinearity controls the smoothness of the movement.
     */
    map.flyTo(
      target,
      targetZoom,
      {
        animate: true,
        duration: 0.9,
        easeLinearity: 0.18,
      },
    )

  }, [
    map,
    selectedMmsi,
    vessels,
    spill,
    drift,
  ])

  return null
}


/*
 * Convert estimated spill area into a visual geographic
 * radius for the translucent investigation region.
 */
function spillRadius(
  areaKm2: number,
): number {
  return Math.max(
    800,
    Math.min(
      2200,
      Math.sqrt(areaKm2) * 280,
    ),
  )
}


/*
 * Sharp red triangle used as the primary spill/detection
 * indicator.
 */
function createSpillIcon(): DivIcon {
  return new DivIcon({
    className:
      'map-marker map-marker--spill',

    html: `
      <span
        class="map-marker__spill-triangle"
        aria-hidden="true"
      ></span>
    `,

    iconSize: [22, 22],
    iconAnchor: [11, 11],
  })
}


/*
 * Cyan origin marker.
 */
function createOriginIcon(): DivIcon {
  return new DivIcon({
    className:
      'map-marker map-marker--origin',

    html: `
      <span
        class="map-marker__origin-ring"
        aria-hidden="true"
      ></span>
    `,

    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}


/*
 * Vessel marker.
 *
 * Selected vessels become slightly larger and receive
 * a white border so the focused vessel is unmistakable.
 */
function createVesselIcon(
  color: string,
  borderColor: string,
  selected: boolean,
): DivIcon {
  const size = selected ? 12 : 9
  const half = size / 2

  return new DivIcon({
    className: `
      map-marker
      map-marker--vessel
      ${selected ? 'map-marker--selected' : ''}
    `,

    html: `
      <span
        class="map-marker__vessel-dot"
        style="
          --marker-color: ${color};
          --marker-border: ${borderColor};
          --marker-size: ${size}px;
          --marker-offset: -${half}px;
        "
        aria-hidden="true"
      ></span>
    `,

    iconSize: [size, size],
    iconAnchor: [half, half],
  })
}


export function InvestigationMap({
  spill,
  drift,
  vessels,
  selectedMmsi,
  onSelectVessel,
  currentTime,
}: InvestigationMapProps) {
  const [showLayer, setShowLayer] = useState(true)
  const [showHeatMap, setShowHeatMap] = useState(false)

  // Calculate animated position based on timeline
  const getAnimatedPosition = (baseLat: number, baseLon: number, time: number) => {
    // Simple animation: vessels move slightly based on time
    // In a real implementation, this would use historical position data
    const timeOffset = time / drift.drift_hours
    const animatedLat = baseLat + (timeOffset * 0.01)
    const animatedLon = baseLon + (timeOffset * 0.01)
    return [animatedLat, animatedLon] as [number, number]
  }

  /*
   * Only vessels with valid coordinates are displayed on
   * the map.
   *
   * Vessels without coordinates remain available in the
   * sidebar.
   */
  const mapVessels = useMemo(
    () =>
      vessels.filter(hasValidCoordinates),
    [vessels],
  )


  /*
   * Convert API drift coordinates into the format expected
   * by Leaflet Polyline.
   */
  const driftPath = useMemo(
    () =>
      drift.drift_path.map(
        ([lat, lon]) =>
          [lat, lon] as [number, number],
      ),
    [drift.drift_path],
  )


  /*
   * Icons are static, so create them only once.
   */
  const spillIcon = useMemo(
    () => createSpillIcon(),
    [],
  )

  const originIcon = useMemo(
    () => createOriginIcon(),
    [],
  )


  return (
    <section
      className="panel map-panel"
      aria-label="Investigation map"
    >

      <div className="panel__bar">

        <h2 className="panel__title">
          Spill zone &amp; vessel positions
        </h2>

        <p className="panel__context">
          {formatDriftContext(
            drift.drift_hours,
          )}
        </p>

      </div>


      <div className="map-panel__surface">

        <MapContainer
          className="map-container"
          center={[
            spill.lat,
            spill.lon,
          ]}
          zoom={10}
          scrollWheelZoom
          zoomControl={false}
          attributionControl={false}
        >

          {showLayer && (
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
              opacity={0.14}
            />
          )}

          <MapControls
            showLayer={showLayer}
            onLayerToggle={setShowLayer}
            showHeatMap={showHeatMap}
            onHeatMapToggle={setShowHeatMap}
          />

          <HeatMap
            vessels={mapVessels.map(v => ({ lat: v.lat!, lon: v.lon!, score: v.score }))}
            spill={spill}
            enabled={showHeatMap}
          />


          <SelectedVesselFocus
            selectedMmsi={selectedMmsi}
            vessels={mapVessels}
            spill={spill}
            drift={drift}
          />


          <Polyline
            positions={driftPath}
            pathOptions={{
              color: '#3ec9c9',
              weight: 2,
              dashArray: '6 8',
              opacity: 0.85,
            }}
          />


          <Marker
            position={[
              drift.origin_lat,
              drift.origin_lon,
            ]}
            icon={originIcon}
            keyboard={false}
          >

            <Tooltip
              permanent
              direction="top"
              offset={[0, -8]}
              className="map-tooltip"
            >
              {formatOriginLabel(
                drift.drift_hours,
              )}
            </Tooltip>

          </Marker>


          {/*
           * Geographic estimated spill extent.
           *
           * The circle represents AREA.
           * The triangle below represents the actual
           * detection/incident point.
           */}
          <Circle
            center={[
              spill.lat,
              spill.lon,
            ]}
            radius={spillRadius(
              spill.area_km2,
            )}
            pathOptions={{
              color: '#e85d3a',
              fillColor: '#e85d3a',
              fillOpacity: 0.18,
              weight: 1.5,
              opacity: 0.7,
            }}
          />


          {/*
           * Sharp red incident indicator.
           */}
          <Marker
            position={[
              spill.lat,
              spill.lon,
            ]}
            icon={spillIcon}
            keyboard={false}
          >

            <Tooltip
              permanent
              direction="bottom"
              offset={[0, 10]}
              className="map-tooltip map-tooltip--spill"
            >
              Spill (t₀)
            </Tooltip>

          </Marker>


          {/*
           * Vessel markers.
           */}
          {mapVessels.map((vessel) => {

            const tier =
              getScoreTier(
                vessel.score,
              )

            const colors =
              getScoreColors(tier)

            const isSelected =
              selectedMmsi === vessel.mmsi

            const markerColor =
              colors.marker

            const markerBorder =
              isSelected
                ? '#ffffff'
                : (
                    colors.markerBorder ??
                    colors.marker
                  )

            const icon =
              createVesselIcon(
                markerColor,
                markerBorder,
                isSelected,
              )

            // Use animated position based on timeline
            const animatedPosition = getAnimatedPosition(
              vessel.lat!,
              vessel.lon!,
              currentTime,
            )


            return (
              <Marker
                key={vessel.mmsi}
                position={animatedPosition}
                icon={icon}
                keyboard={false}
                zIndexOffset={
                  isSelected
                    ? 1000
                    : 0
                }
                eventHandlers={{
                  click: () =>
                    onSelectVessel(
                      vessel.mmsi,
                    ),
                }}
              >

                <Tooltip
                  permanent
                  direction="right"
                  offset={[8, 0]}
                  className={`
                    map-tooltip
                    map-tooltip--vessel
                    ${
                      isSelected
                        ? 'map-tooltip--selected'
                        : ''
                    }
                  `}
                >
                  {shortVesselName(
                    vessel.name,
                  )}{' '}
                  ·{' '}
                  {Math.round(
                    vessel.score,
                  )}
                </Tooltip>

              </Marker>
            )
          })}

        </MapContainer>

      </div>


      <MapLegend />

    </section>
  )
}