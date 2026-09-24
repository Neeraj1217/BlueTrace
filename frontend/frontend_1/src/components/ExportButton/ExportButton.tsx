import type { DashboardResponse } from '../../types'

interface ExportButtonProps {
  data: DashboardResponse
}

export function ExportButton({ data }: ExportButtonProps) {
  const handleExportJSON = () => {
    const jsonString = JSON.stringify(data, null, 2)
    downloadFile(jsonString, 'bluetrace-investigation.json', 'application/json')
  }

  const handleExportCSV = () => {
    const csvContent = generateCSV(data)
    downloadFile(csvContent, 'bluetrace-vessels.csv', 'text/csv')
  }

  return (
    <div className="export-controls">
      <button
        type="button"
        className="export-btn"
        onClick={handleExportJSON}
        aria-label="Export investigation data as JSON"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span>Export JSON</span>
      </button>
      <button
        type="button"
        className="export-btn"
        onClick={handleExportCSV}
        aria-label="Export vessel data as CSV"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span>Export CSV</span>
      </button>
    </div>
  )
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function generateCSV(data: DashboardResponse): string {
  const headers = [
    'Rank',
    'MMSI',
    'Vessel Name',
    'Vessel Type',
    'Score',
    'Distance (km)',
    'Last Seen',
    'Evidence Distance',
    'Evidence Timing',
    'Evidence Direction',
    'Evidence Trajectory',
    'Evidence Data Quality',
  ]

  const rows = data.ranked_vessels.map((vessel, index) => [
    index + 1,
    vessel.mmsi,
    vessel.name,
    vessel.vessel_type || 'N/A',
    vessel.score.toFixed(1),
    vessel.distance_km?.toFixed(1) || 'N/A',
    vessel.last_seen_at || 'N/A',
    vessel.evidence.distance.toFixed(1),
    vessel.evidence.timing.toFixed(1),
    vessel.evidence.direction.toFixed(1),
    vessel.evidence.trajectory.toFixed(1),
    vessel.evidence.data_quality.toFixed(1),
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n')

  return csvContent
}
