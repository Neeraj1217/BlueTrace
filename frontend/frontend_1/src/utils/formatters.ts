import type { ScoreTier, VesselEvidence } from '../types'

export function formatCoordinates(lat: number, lon: number): string {
  const latDir = lat >= 0 ? 'N' : 'S'
  const lonDir = lon >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(2)}°${latDir}, ${Math.abs(lon).toFixed(2)}°${lonDir}`
}

export function formatArea(areaKm2: number): string {
  return `${areaKm2.toFixed(areaKm2 >= 10 ? 1 : 2)} km²`
}

export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`
}

export function formatDetectedAt(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso

  const datePart = date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const timePart = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  })
  return `${datePart} · ${timePart} UTC`
}

export function formatLastSeen(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso

  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  })
}

export function formatScore(score: number): string {
  return score % 1 === 0 ? String(score) : score.toFixed(1)
}

export function getScoreTier(score: number): ScoreTier {
  if (score >= 75) return 'high'
  if (score >= 50) return 'medium'
  return 'low'
}

export function shortVesselName(name: string): string {
  return name.replace(/^MV\s+/i, '').trim()
}

export function hasValidCoordinates(vessel: {
  lat?: number
  lon?: number
}): vessel is { lat: number; lon: number } {
  return (
    typeof vessel.lat === 'number' &&
    typeof vessel.lon === 'number' &&
    Number.isFinite(vessel.lat) &&
    Number.isFinite(vessel.lon)
  )
}

const EVIDENCE_LABELS: Record<keyof VesselEvidence, string> = {
  distance: 'Distance',
  timing: 'Timing',
  direction: 'Direction',
  trajectory: 'Trajectory',
  data_quality: 'Data quality',
}

export function getEvidenceLabel(key: keyof VesselEvidence): string {
  return EVIDENCE_LABELS[key]
}

export function formatDriftContext(driftHours: number): string {
  const hours = Number.isInteger(driftHours)
    ? String(driftHours)
    : driftHours.toFixed(1)
  return `t₀ = detection time · t−${hours}h drift back-track`
}

export function formatOriginLabel(driftHours: number): string {
  const hours = Number.isInteger(driftHours)
    ? String(driftHours)
    : driftHours.toFixed(1)
  return `Est. origin (t−${hours}h)`
}

export function generateEvidenceSummary(
  evidence: VesselEvidence,
  note?: string,
): string {
  if (note) return note

  const entries = (
    Object.entries(evidence) as [keyof VesselEvidence, number][]
  ).map(([key, value]) => ({
    key,
    label: getEvidenceLabel(key).toLowerCase(),
    value,
  }))

  const strong = entries.filter((e) => e.value >= 75)
  const weak = entries.filter((e) => e.value < 50)

  if (strong.length === 0 && weak.length === 0) {
    return 'Moderate evidence across all factors; no single dimension stands out.'
  }

  const parts: string[] = []

  if (strong.length > 0) {
    const labels = strong.map((e) => e.label)
    const joined =
      labels.length === 1
        ? labels[0]
        : labels.slice(0, -1).join(', ') + ' and ' + labels[labels.length - 1]
    parts.push(`Strong ${joined} match`)
  }

  if (weak.length > 0) {
    const labels = weak.map((e) => e.label)
    const joined =
      labels.length === 1
        ? labels[0]
        : labels.slice(0, -1).join(', ') + ' and ' + labels[labels.length - 1]
    parts.push(`${joined} alignment is weaker`)
  }

  if (parts.length === 0) {
    return 'Mixed evidence profile; review individual factors below.'
  }

  return parts.join('; ') + '.'
}

export function buildVesselMetadata(vessel: {
  type?: string
  vessel_type?: string
  mmsi?: string
  distance_km?: number
  timestamp?: string
  last_seen_at?: string
}): string {
  const parts: string[] = []

  // Don't include vessel_type in metadata as it's shown separately
  if (vessel.type && !vessel.vessel_type) parts.push(vessel.type)
  if (vessel.mmsi) parts.push(`MMSI ${vessel.mmsi}`)
  if (typeof vessel.distance_km === 'number') {
    parts.push(`${vessel.distance_km.toFixed(1)} km`)
  }
  if (vessel.timestamp) {
    parts.push(`last seen ${formatLastSeen(vessel.timestamp)} UTC`)
  }
  if (vessel.last_seen_at) {
    parts.push(`last seen ${formatLastSeen(vessel.last_seen_at)} UTC`)
  }

  return parts.join(' · ')
}
