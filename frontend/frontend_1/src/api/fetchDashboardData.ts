import type {
  DashboardResponse,
  RankedVessel,
  VesselEvidence,
} from '../types'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'

const API_URL = `${API_BASE_URL.replace(/\/$/, '')}/api/dashboard`

export async function fetchDashboardData(): Promise<DashboardResponse> {
  try {
    const response = await fetch(API_URL)

    if (!response.ok) {
      throw new Error(
        `Failed to load investigation data (${response.status})`,
      )
    }

    const data = (await response.json()) as Partial<DashboardResponse>

    if (!data?.spill || !data?.drift || !Array.isArray(data?.ranked_vessels)) {
      throw new Error('Invalid investigation data format')
    }

    return {
      spill: data.spill,
      drift: data.drift,
      // Keep the API-provided ranking intact while isolating malformed records
      // before they reach rendering and map libraries.
      ranked_vessels: data.ranked_vessels.filter(isRenderableVessel),
    }
  } catch (error) {
    // Fall back to sample data if API is unavailable
    console.warn('API unavailable, using sample data:', error)
    return loadSampleData()
  }
}

async function loadSampleData(): Promise<DashboardResponse> {
  const response = await fetch('/sample_api_response.json')

  if (!response.ok) {
    throw new Error('Failed to load sample data')
  }

  const data = (await response.json()) as Partial<DashboardResponse>

  if (!data?.spill || !data?.drift || !Array.isArray(data?.ranked_vessels)) {
    throw new Error('Invalid sample data format')
  }

  return {
    spill: data.spill,
    drift: data.drift,
    ranked_vessels: data.ranked_vessels.filter(isRenderableVessel),
  }
}

function isRenderableVessel(value: unknown): value is RankedVessel {
  if (!value || typeof value !== 'object') return false

  const vessel = value as Partial<RankedVessel>

  return (
    typeof vessel.mmsi === 'string' &&
    vessel.mmsi.length > 0 &&
    typeof vessel.name === 'string' &&
    vessel.name.length > 0 &&
    typeof vessel.score === 'number' &&
    Number.isFinite(vessel.score) &&
    hasCompleteEvidence(vessel.evidence)
  )
}

function hasCompleteEvidence(value: unknown): value is VesselEvidence {
  if (!value || typeof value !== 'object') return false

  const evidence = value as Partial<VesselEvidence>

  return (
    typeof evidence.distance === 'number' &&
    Number.isFinite(evidence.distance) &&
    typeof evidence.timing === 'number' &&
    Number.isFinite(evidence.timing) &&
    typeof evidence.direction === 'number' &&
    Number.isFinite(evidence.direction) &&
    typeof evidence.trajectory === 'number' &&
    Number.isFinite(evidence.trajectory) &&
    typeof evidence.data_quality === 'number' &&
    Number.isFinite(evidence.data_quality)
  )
}
