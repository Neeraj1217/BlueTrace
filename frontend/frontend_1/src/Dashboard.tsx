import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchDashboardData } from './api/fetchDashboardData'
import type { DashboardResponse, RankedVessel } from './types'
import { Header } from './components/Header/Header'
import { InvestigationMap } from './components/InvestigationMap/InvestigationMap'
import { VesselPanel } from './components/VesselPanel/VesselPanel'
import { AnalyticsPanel } from './components/AnalyticsPanel/AnalyticsPanel'
import { Timeline } from './components/Timeline/Timeline'
import { VesselComparison } from './components/VesselComparison/VesselComparison'
import { FilterPanel } from './components/FilterPanel/FilterPanel'
import { ReportGenerator } from './components/ReportGenerator/ReportGenerator'
import sarImagery from '../sample_sar.png'

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: DashboardResponse }

export function Dashboard() {
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' })
  const [expandedMmsi, setExpandedMmsi] = useState<string | null>(null)
  const [highlightedMmsi, setHighlightedMmsi] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [showComparison, setShowComparison] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filteredVessels, setFilteredVessels] = useState<RankedVessel[]>([])
  const [showReportGenerator, setShowReportGenerator] = useState(false)
  const animationRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number | null>(null)

  const loadData = useCallback(async () => {
    setLoadState({ status: 'loading' })
    try {
      const data = await fetchDashboardData()
      setLoadState({ status: 'ready', data })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load investigation data'
      setLoadState({ status: 'error', message })
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    if (loadState.status === 'ready') {
      setFilteredVessels(loadState.data.ranked_vessels)
    }
  }, [loadState])

  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      lastTimeRef.current = null
      return
    }

    const animate = (timestamp: number) => {
      if (lastTimeRef.current === null) lastTimeRef.current = timestamp

      const deltaTime = (timestamp - lastTimeRef.current) / 1000
      lastTimeRef.current = timestamp
      setCurrentTime((previousTime) => {
        const duration = loadState.status === 'ready' ? loadState.data.drift.drift_hours : 6
        return Math.min(previousTime + deltaTime * playbackSpeed * 0.1, duration)
      })
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current)
    }
  }, [isPlaying, playbackSpeed, loadState])

  const handleToggleVessel = useCallback((mmsi: string) => {
    setExpandedMmsi((current) => (current === mmsi ? null : mmsi))
    setHighlightedMmsi(mmsi)
  }, [])

  const handleMapSelectVessel = useCallback((mmsi: string) => {
    setExpandedMmsi(mmsi)
    setHighlightedMmsi(mmsi)
  }, [])

  const handleFilterChange = useCallback((filtered: RankedVessel[]) => {
    setFilteredVessels(filtered)
  }, [])

  if (loadState.status === 'loading') {
    return <div className="app-shell"><div className="state-message">Loading investigation data...</div></div>
  }

  if (loadState.status === 'error') {
    return (
      <div className="app-shell">
        <div className="state-message state-message--error">
          <p>{loadState.message}</p>
          <button type="button" className="state-message__retry" onClick={() => void loadData()}>Retry</button>
        </div>
      </div>
    )
  }

  const { data } = loadState
  const { spill, drift, ranked_vessels } = data

  return (
    <div className="app-shell">
      <Header spill={spill} drift={drift} data={data} onFilterClick={() => setShowFilters(true)} onReportClick={() => setShowReportGenerator(true)} />
      <main className="dashboard-main">
        <div className="map-wrapper">
          <InvestigationMap spill={spill} drift={drift} vessels={filteredVessels} selectedMmsi={highlightedMmsi} onSelectVessel={handleMapSelectVessel} currentTime={currentTime} />
          <Timeline duration={drift.drift_hours} currentTime={currentTime} onTimeChange={setCurrentTime} isPlaying={isPlaying} onPlayPause={() => setIsPlaying((playing) => !playing)} onSpeedChange={setPlaybackSpeed} speed={playbackSpeed} />
        </div>
        <div className="dashboard-sidebar">
          <VesselPanel vessels={filteredVessels} expandedMmsi={expandedMmsi} highlightedMmsi={highlightedMmsi} onToggleVessel={handleToggleVessel} onCompareClick={() => setShowComparison(true)} />
          <section className="panel sar-imagery" aria-labelledby="sar-imagery-title">
            <div className="panel__bar">
              <h2 id="sar-imagery-title" className="panel__title">SAR IMAGERY</h2>
            </div>
            <div className="sar-imagery__content">
              <img
                className="sar-imagery__image"
                src={sarImagery}
                alt="Synthetic aperture radar imagery of the investigation area"
              />
            </div>
          </section>
        </div>
      </main>
      <AnalyticsPanel vessels={filteredVessels} spill={spill} />
      {showComparison && <VesselComparison vessels={ranked_vessels} onClose={() => setShowComparison(false)} />}
      {showFilters && <FilterPanel vessels={ranked_vessels} onFilterChange={handleFilterChange} onClose={() => setShowFilters(false)} />}
      {showReportGenerator && <ReportGenerator data={data} onClose={() => setShowReportGenerator(false)} />}
    </div>
  )
}
