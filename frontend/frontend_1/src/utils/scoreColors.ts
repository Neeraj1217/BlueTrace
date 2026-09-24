import type { ScoreTier } from '../types'

export interface ScoreColors {
  text: string
  bar: string
  marker: string
  markerBorder?: string
}

const SCORE_COLORS: Record<ScoreTier, ScoreColors> = {
  high: {
    text: 'var(--score-high)',
    bar: 'var(--score-high)',
    marker: '#e85d3a',
    markerBorder: '#ff7a55',
  },
  medium: {
    text: 'var(--score-medium)',
    bar: 'var(--score-medium)',
    marker: '#d4a032',
    markerBorder: '#e8b84a',
  },
  low: {
    text: 'var(--score-low)',
    bar: 'var(--score-low)',
    marker: '#5a7a8f',
    markerBorder: '#7a9aaf',
  },
}

export function getScoreColors(tier: ScoreTier): ScoreColors {
  return SCORE_COLORS[tier]
}

export function getMarkerRadius(score: number): number {
  if (score >= 75) return 9
  if (score >= 50) return 7
  return 5
}
