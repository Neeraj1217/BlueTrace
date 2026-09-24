export interface SpillData {
  lat: number
  lon: number
  area_km2: number
  confidence: number
  detected_at: string
  note?: string
}

export interface DriftAssumptions {
  wind_speed_mps?: number
  wind_direction_from_deg?: number
  current_speed_mps?: number
  current_direction_to_deg?: number
}

export interface DriftData {
  origin_lat: number
  origin_lon: number
  drift_path: [number, number][]
  drift_hours: number
  assumptions?: DriftAssumptions
  note?: string
}

export interface VesselEvidence {
  distance: number
  timing: number
  direction: number
  trajectory: number
  data_quality: number
}

export interface RankedVessel {
  mmsi: string
  name: string
  score: number
  evidence: VesselEvidence
  lat?: number
  lon?: number
  type?: string
  vessel_type?: string
  distance_km?: number
  timestamp?: string
  last_seen_at?: string
  note?: string
  historical_positions?: HistoricalPosition[]
}

export interface HistoricalPosition {
  lat: number
  lon: number
  timestamp: string
}

export interface DashboardResponse {
  spill: SpillData
  drift: DriftData
  ranked_vessels: RankedVessel[]
}

export type ScoreTier = 'high' | 'medium' | 'low'
