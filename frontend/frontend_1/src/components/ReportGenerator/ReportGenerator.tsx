import { useState } from 'react'
import type { DashboardResponse } from '../../types'
import { formatArea, formatConfidence, formatCoordinates, formatDetectedAt } from '../../utils/formatters'

interface ReportGeneratorProps {
  data: DashboardResponse
  onClose: () => void
}

type ReportType = 'executive' | 'technical' | 'legal'

export function ReportGenerator({ data, onClose }: ReportGeneratorProps) {
  const [reportType, setReportType] = useState<ReportType>('executive')
  const [isGenerating, setIsGenerating] = useState(false)

  const generateReport = () => {
    setIsGenerating(true)

    setTimeout(() => {
      const reportContent = generateReportContent(data, reportType)
      printReport(reportContent)
      setIsGenerating(false)
    }, 500)
  }

  return (
    <div className="report-generator">
      <div className="report-generator__header">
        <h2 className="report-generator__title">Generate Investigation Report</h2>
        <button
          type="button"
          className="report-generator__close"
          onClick={onClose}
          aria-label="Close report generator"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="report-generator__content">
        <div className="report-generator__section">
          <h3 className="report-generator__section-title">Report Type</h3>
          <div className="report-generator__types">
            <ReportTypeOption
              title="Executive Summary"
              description="High-level overview for stakeholders and decision-makers"
              selected={reportType === 'executive'}
              onSelect={() => setReportType('executive')}
            />
            <ReportTypeOption
              title="Technical Analysis"
              description="Detailed evidence analysis for investigators and analysts"
              selected={reportType === 'technical'}
              onSelect={() => setReportType('technical')}
            />
            <ReportTypeOption
              title="Legal Evidence"
              description="Comprehensive documentation for legal proceedings"
              selected={reportType === 'legal'}
              onSelect={() => setReportType('legal')}
            />
          </div>
        </div>

        <div className="report-generator__section">
          <h3 className="report-generator__section-title">Report Preview</h3>
          <div className="report-generator__preview">
            <ReportPreview data={data} type={reportType} />
          </div>
        </div>

        <div className="report-generator__actions">
          <button
            type="button"
            className="report-generator__btn report-generator__btn--secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="report-generator__btn report-generator__btn--primary"
            onClick={generateReport}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ReportTypeOption({
  title,
  description,
  selected,
  onSelect,
}: {
  title: string
  description: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      className={`report-type-option ${selected ? 'report-type-option--selected' : ''}`}
      onClick={onSelect}
    >
      <div className="report-type-option__header">
        <div className={`report-type-option__radio ${selected ? 'report-type-option__radio--checked' : ''}`} />
        <span className="report-type-option__title">{title}</span>
      </div>
      <p className="report-type-option__description">{description}</p>
    </button>
  )
}

function ReportPreview({ data, type }: { data: DashboardResponse; type: ReportType }) {
  const content = generateReportContent(data, type)

  return (
    <div className="report-preview">
      <div className="report-preview__content" dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  )
}

function generateReportContent(data: DashboardResponse, type: ReportType): string {
  const { spill, drift, ranked_vessels } = data

  const baseStyles = `
    <style>
      body { font-family: 'Arial', sans-serif; margin: 0; padding: 20px; color: #333; }
      .report-header { border-bottom: 2px solid #1a5f7a; padding-bottom: 20px; margin-bottom: 20px; }
      .report-title { font-size: 24px; font-weight: bold; color: #1a5f7a; margin: 0; }
      .report-subtitle { font-size: 14px; color: #666; margin: 5px 0 0; }
      .report-section { margin-bottom: 24px; }
      .section-title { font-size: 16px; font-weight: bold; color: #1a5f7a; margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 6px; }
      .data-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
      .data-label { font-weight: 500; color: #555; }
      .data-value { color: #333; }
      .vessel-table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      .vessel-table th, .vessel-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      .vessel-table th { background-color: #f5f5f5; font-weight: 600; }
      .high-score { color: #e85d3a; font-weight: 600; }
      .medium-score { color: #d4a032; font-weight: 600; }
      .evidence-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-top: 8px; }
      .evidence-item { text-align: center; padding: 8px; background: #f9f9f9; border-radius: 4px; }
      .evidence-label { font-size: 10px; color: #666; margin-bottom: 4px; }
      .evidence-value { font-size: 14px; font-weight: 600; }
      .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; }
    </style>
  `

  const spillSection = `
    <div class="report-section">
      <h3 class="section-title">Spill Information</h3>
      <div class="data-row">
        <span class="data-label">Detection Time:</span>
        <span class="data-value">${formatDetectedAt(spill.detected_at)}</span>
      </div>
      <div class="data-row">
        <span class="data-label">Location:</span>
        <span class="data-value">${formatCoordinates(spill.lat, spill.lon)}</span>
      </div>
      <div class="data-row">
        <span class="data-label">Estimated Area:</span>
        <span class="data-value">${formatArea(spill.area_km2)}</span>
      </div>
      <div class="data-row">
        <span class="data-label">Confidence:</span>
        <span class="data-value">${formatConfidence(spill.confidence)}</span>
      </div>
      ${spill.note ? `<div class="data-row"><span class="data-label">Note:</span><span class="data-value">${spill.note}</span></div>` : ''}
    </div>
  `

  const driftSection = `
    <div class="report-section">
      <h3 class="section-title">Drift Analysis</h3>
      <div class="data-row">
        <span class="data-label">Drift Period:</span>
        <span class="data-value">${drift.drift_hours} hours</span>
      </div>
      <div class="data-row">
        <span class="data-label">Estimated Origin:</span>
        <span class="data-value">${formatCoordinates(drift.origin_lat, drift.origin_lon)}</span>
      </div>
      ${drift.assumptions ? `
        <div class="data-row">
          <span class="data-label">Wind Speed:</span>
          <span class="data-value">${drift.assumptions.wind_speed_mps} m/s</span>
        </div>
        <div class="data-row">
          <span class="data-label">Wind Direction:</span>
          <span class="data-value">${drift.assumptions.wind_direction_from_deg}°</span>
        </div>
        <div class="data-row">
          <span class="data-label">Current Speed:</span>
          <span class="data-value">${drift.assumptions.current_speed_mps} m/s</span>
        </div>
      ` : ''}
      ${drift.note ? `<div class="data-row"><span class="data-label">Note:</span><span class="data-value">${drift.note}</span></div>` : ''}
    </div>
  `

  const vesselSection = `
    <div class="report-section">
      <h3 class="section-title">Ranked Vessels (${ranked_vessels.length})</h3>
      <table class="vessel-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Vessel Name</th>
            <th>MMSI</th>
            <th>Type</th>
            <th>Score</th>
            <th>Distance (km)</th>
          </tr>
        </thead>
        <tbody>
          ${ranked_vessels.map((vessel, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${vessel.name}</td>
              <td>${vessel.mmsi}</td>
              <td>${vessel.vessel_type || 'N/A'}</td>
              <td class="${vessel.score >= 75 ? 'high-score' : vessel.score >= 50 ? 'medium-score' : ''}">${vessel.score.toFixed(1)}</td>
              <td>${vessel.distance_km?.toFixed(1) || 'N/A'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `

  const topVessels = ranked_vessels.slice(0, 3)
  const detailedEvidenceSection = `
    <div class="report-section">
      <h3 class="section-title">Top Vessels - Detailed Evidence</h3>
      ${topVessels.map((vessel, index) => `
        <div style="margin-bottom: 16px;">
          <h4 style="margin: 0 0 8px; font-size: 14px; font-weight: 600;">#${index + 1} ${vessel.name} (Score: ${vessel.score.toFixed(1)})</h4>
          <div class="evidence-grid">
            <div class="evidence-item">
              <div class="evidence-label">Distance</div>
              <div class="evidence-value">${vessel.evidence.distance.toFixed(1)}</div>
            </div>
            <div class="evidence-item">
              <div class="evidence-label">Timing</div>
              <div class="evidence-value">${vessel.evidence.timing.toFixed(1)}</div>
            </div>
            <div class="evidence-item">
              <div class="evidence-label">Direction</div>
              <div class="evidence-value">${vessel.evidence.direction.toFixed(1)}</div>
            </div>
            <div class="evidence-item">
              <div class="evidence-label">Trajectory</div>
              <div class="evidence-value">${vessel.evidence.trajectory.toFixed(1)}</div>
            </div>
            <div class="evidence-item">
              <div class="evidence-label">Data Quality</div>
              <div class="evidence-value">${vessel.evidence.data_quality.toFixed(1)}</div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `

  let content = ''

  if (type === 'executive') {
    content = `
      ${baseStyles}
      <div class="report-header">
        <h1 class="report-title">Blue Trace Investigation Report</h1>
        <p class="report-subtitle">Executive Summary - Maritime Spill Analysis</p>
        <p class="report-subtitle">Generated: ${new Date().toLocaleString()}</p>
      </div>
      ${spillSection}
      ${driftSection}
      <div class="report-section">
        <h3 class="section-title">Key Findings</h3>
        <p><strong>Top Suspect:</strong> ${ranked_vessels[0]?.name || 'None'} (Score: ${ranked_vessels[0]?.score.toFixed(1) || 'N/A'})</p>
        <p><strong>Total Vessels Analyzed:</strong> ${ranked_vessels.length}</p>
        <p><strong>High-Association Vessels:</strong> ${ranked_vessels.filter(v => v.score >= 75).length}</p>
      </div>
      ${vesselSection}
      <div class="footer">
        <p>This report was generated by Blue Trace maritime spill investigation system.</p>
        <p>For detailed technical analysis, please refer to the Technical Analysis report.</p>
      </div>
    `
  } else if (type === 'technical') {
    content = `
      ${baseStyles}
      <div class="report-header">
        <h1 class="report-title">Blue Trace Technical Analysis</h1>
        <p class="report-subtitle">Detailed Evidence Analysis - Maritime Spill Investigation</p>
        <p class="report-subtitle">Generated: ${new Date().toLocaleString()}</p>
      </div>
      ${spillSection}
      ${driftSection}
      ${detailedEvidenceSection}
      ${vesselSection}
      <div class="report-section">
        <h3 class="section-title">Statistical Summary</h3>
        <div class="data-row">
          <span class="data-label">Average Score:</span>
          <span class="data-value">${(ranked_vessels.reduce((sum, v) => sum + v.score, 0) / ranked_vessels.length).toFixed(1)}</span>
        </div>
        <div class="data-row">
          <span class="data-label">Score Range:</span>
          <span class="data-value">${Math.min(...ranked_vessels.map(v => v.score)).toFixed(1)} - ${Math.max(...ranked_vessels.map(v => v.score)).toFixed(1)}</span>
        </div>
      </div>
      <div class="footer">
        <p>This technical analysis report contains detailed evidence breakdowns for all vessels.</p>
        <p>Generated by Blue Trace maritime spill investigation system.</p>
      </div>
    `
  } else {
    content = `
      ${baseStyles}
      <div class="report-header">
        <h1 class="report-title">Blue Trace Legal Evidence Report</h1>
        <p class="report-subtitle">Comprehensive Documentation for Legal Proceedings</p>
        <p class="report-subtitle">Generated: ${new Date().toLocaleString()}</p>
      </div>
      <div class="report-section">
        <h3 class="section-title">Disclaimer</h3>
        <p>This report contains technical analysis and should be reviewed by qualified maritime experts and legal counsel before use in any legal proceedings.</p>
      </div>
      ${spillSection}
      ${driftSection}
      ${detailedEvidenceSection}
      ${vesselSection}
      <div class="report-section">
        <h3 class="section-title">Data Sources and Methodology</h3>
        <p><strong>Satellite Data:</strong> Analysis of satellite imagery for spill detection and area estimation.</p>
        <p><strong>Weather Data:</strong> Incorporation of wind and current data for drift modeling.</p>
        <p><strong>AIS Data:</strong> Automatic Identification System data for vessel tracking and analysis.</p>
        <p><strong>Scoring Methodology:</strong> Multi-factor evidence scoring considering distance, timing, direction, trajectory, and data quality.</p>
      </div>
      <div class="footer">
        <p>This legal evidence report is intended for informational purposes only.</p>
        <p>Generated by Blue Trace maritime spill investigation system.</p>
        <p>Contact: Blue Trace Investigation Team</p>
      </div>
    `
  }

  return content
}

function printReport(content: string) {
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(content)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }
}
