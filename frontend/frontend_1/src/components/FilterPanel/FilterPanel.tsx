import { useState } from 'react'
import type { RankedVessel } from '../../types'

interface FilterPanelProps {
  vessels: RankedVessel[]
  onFilterChange: (filteredVessels: RankedVessel[]) => void
  onClose: () => void
}

interface FilterState {
  searchQuery: string
  scoreRange: [number, number]
  vesselTypes: string[]
  distanceRange: [number, number]
  timeWindow: string
}

export function FilterPanel({ vessels, onFilterChange, onClose }: FilterPanelProps) {
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    scoreRange: [0, 100],
    vesselTypes: [],
    distanceRange: [0, 100],
    timeWindow: 'all',
  })

  const vesselTypes = Array.from(new Set(vessels.map(v => v.vessel_type).filter((type): type is string => Boolean(type))))

  const applyFilters = () => {
    let filtered = [...vessels]

    // Search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      filtered = filtered.filter(v =>
        v.name.toLowerCase().includes(query) ||
        v.mmsi.toLowerCase().includes(query) ||
        (v.note && v.note.toLowerCase().includes(query))
      )
    }

    // Score range
    filtered = filtered.filter(v =>
      v.score >= filters.scoreRange[0] && v.score <= filters.scoreRange[1]
    )

    // Vessel types
    if (filters.vesselTypes.length > 0) {
      filtered = filtered.filter(v =>
        v.vessel_type && filters.vesselTypes.includes(v.vessel_type)
      )
    }

    // Distance range
    if (filters.distanceRange[1] < 100) {
      filtered = filtered.filter(v =>
        v.distance_km !== undefined &&
        v.distance_km >= filters.distanceRange[0] &&
        v.distance_km <= filters.distanceRange[1]
      )
    }

    onFilterChange(filtered)
  }

  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, searchQuery: value }))
  }

  const handleScoreRangeChange = (min: number, max: number) => {
    setFilters(prev => ({ ...prev, scoreRange: [min, max] }))
  }

  const handleVesselTypeToggle = (type: string) => {
    setFilters(prev => ({
      ...prev,
      vesselTypes: prev.vesselTypes.includes(type)
        ? prev.vesselTypes.filter(t => t !== type)
        : [...prev.vesselTypes, type]
    }))
  }

  const handleDistanceRangeChange = (min: number, max: number) => {
    setFilters(prev => ({ ...prev, distanceRange: [min, max] }))
  }

  const applyFilterPresets = (preset: string) => {
    switch (preset) {
      case 'high-priority':
        setFilters(prev => ({ ...prev, scoreRange: [75, 100] }))
        break
      case 'recent':
        setFilters(prev => ({ ...prev, timeWindow: '24h' }))
        break
      case 'tankers':
        setFilters(prev => ({ ...prev, vesselTypes: ['Tanker'] }))
        break
      case 'all':
        setFilters({
          searchQuery: '',
          scoreRange: [0, 100],
          vesselTypes: [],
          distanceRange: [0, 100],
          timeWindow: 'all',
        })
        break
    }
  }

  const resetFilters = () => {
    setFilters({
      searchQuery: '',
      scoreRange: [0, 100],
      vesselTypes: [],
      distanceRange: [0, 100],
      timeWindow: 'all',
    })
    onFilterChange(vessels)
  }

  return (
    <div className="filter-panel">
      <div className="filter-panel__header">
        <h2 className="filter-panel__title">Filters & Search</h2>
        <button
          type="button"
          className="filter-panel__close"
          onClick={onClose}
          aria-label="Close filters"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="filter-panel__content">
        {/* Quick Presets */}
        <div className="filter-panel__section">
          <h3 className="filter-panel__section-title">Quick Filters</h3>
          <div className="filter-panel__presets">
            <button
              type="button"
              className="filter-panel__preset"
              onClick={() => applyFilterPresets('high-priority')}
            >
              High Priority
            </button>
            <button
              type="button"
              className="filter-panel__preset"
              onClick={() => applyFilterPresets('recent')}
            >
              Recent Sightings
            </button>
            <button
              type="button"
              className="filter-panel__preset"
              onClick={() => applyFilterPresets('tankers')}
            >
              Tankers Only
            </button>
            <button
              type="button"
              className="filter-panel__preset filter-panel__preset--reset"
              onClick={() => applyFilterPresets('all')}
            >
              Reset All
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="filter-panel__section">
          <h3 className="filter-panel__section-title">Search</h3>
          <input
            type="text"
            className="filter-panel__search"
            placeholder="Search vessels by name, MMSI, or notes..."
            value={filters.searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            aria-label="Search vessels"
          />
        </div>

        {/* Score Range */}
        <div className="filter-panel__section">
          <h3 className="filter-panel__section-title">Score Range</h3>
          <div className="filter-panel__range">
            <div className="filter-panel__range-inputs">
              <input
                type="number"
                min="0"
                max="100"
                value={filters.scoreRange[0]}
                onChange={(e) => handleScoreRangeChange(Number(e.target.value), filters.scoreRange[1])}
                className="filter-panel__range-input"
                aria-label="Minimum score"
              />
              <span className="filter-panel__range-separator">-</span>
              <input
                type="number"
                min="0"
                max="100"
                value={filters.scoreRange[1]}
                onChange={(e) => handleScoreRangeChange(filters.scoreRange[0], Number(e.target.value))}
                className="filter-panel__range-input"
                aria-label="Maximum score"
              />
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={filters.scoreRange[0]}
              onChange={(e) => handleScoreRangeChange(Number(e.target.value), filters.scoreRange[1])}
              className="filter-panel__slider"
              aria-label="Minimum score slider"
            />
            <input
              type="range"
              min="0"
              max="100"
              value={filters.scoreRange[1]}
              onChange={(e) => handleScoreRangeChange(filters.scoreRange[0], Number(e.target.value))}
              className="filter-panel__slider"
              aria-label="Maximum score slider"
            />
          </div>
        </div>

        {/* Vessel Types */}
        {vesselTypes.length > 0 && (
          <div className="filter-panel__section">
            <h3 className="filter-panel__section-title">Vessel Type</h3>
            <div className="filter-panel__types">
              {vesselTypes.map(type => (
                <label key={type} className="filter-panel__type">
                  <input
                    type="checkbox"
                    checked={filters.vesselTypes.includes(type as string)}
                    onChange={() => handleVesselTypeToggle(type as string)}
                    className="filter-panel__checkbox"
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Distance Range */}
        <div className="filter-panel__section">
          <h3 className="filter-panel__section-title">Distance from Spill (km)</h3>
          <div className="filter-panel__range">
            <div className="filter-panel__range-inputs">
              <input
                type="number"
                min="0"
                max="100"
                value={filters.distanceRange[0]}
                onChange={(e) => handleDistanceRangeChange(Number(e.target.value), filters.distanceRange[1])}
                className="filter-panel__range-input"
                aria-label="Minimum distance"
              />
              <span className="filter-panel__range-separator">-</span>
              <input
                type="number"
                min="0"
                max="100"
                value={filters.distanceRange[1]}
                onChange={(e) => handleDistanceRangeChange(filters.distanceRange[0], Number(e.target.value))}
                className="filter-panel__range-input"
                aria-label="Maximum distance"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="filter-panel__actions">
          <button
            type="button"
            className="filter-panel__btn filter-panel__btn--secondary"
            onClick={resetFilters}
          >
            Reset
          </button>
          <button
            type="button"
            className="filter-panel__btn filter-panel__btn--primary"
            onClick={applyFilters}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  )
}
