import { useRef } from 'react'

interface TimelineProps {
  duration: number // in hours
  currentTime: number
  onTimeChange: (time: number) => void
  isPlaying: boolean
  onPlayPause: () => void
  onSpeedChange: (speed: number) => void
  speed: number
}

export function Timeline({
  duration,
  currentTime,
  onTimeChange,
  isPlaying,
  onPlayPause,
  onSpeedChange,
  speed,
}: TimelineProps) {
  const sliderRef = useRef<HTMLInputElement>(null)

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    onTimeChange(value)
  }

  const formatTime = (hours: number) => {
    const h = Math.floor(hours)
    const m = Math.floor((hours - h) * 60)
    return `${h}h ${m}m`
  }

  const speeds = [0.5, 1, 2, 4]
  const currentSpeedIndex = speeds.indexOf(speed)

  const handleSpeedChange = () => {
    const nextIndex = (currentSpeedIndex + 1) % speeds.length
    onSpeedChange(speeds[nextIndex])
  }

  return (
    <div className="timeline">
      <div className="timeline__controls">
        <button
          type="button"
          className="timeline__play-btn"
          onClick={onPlayPause}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
        </button>

        <div className="timeline__slider-container">
          <input
            ref={sliderRef}
            type="range"
            min="0"
            max={duration}
            step={0.1}
            value={currentTime}
            onChange={handleSliderChange}
            className="timeline__slider"
            aria-label="Timeline"
          />
          <div className="timeline__labels">
            <span className="timeline__label">t₀</span>
            <span className="timeline__label timeline__label--current">
              {formatTime(currentTime)}
            </span>
            <span className="timeline__label">t-{formatTime(duration)}</span>
          </div>
        </div>

        <button
          type="button"
          className="timeline__speed-btn"
          onClick={handleSpeedChange}
          aria-label="Change playback speed"
        >
          {speed}x
        </button>
      </div>

      <div className="timeline__progress">
        <div
          className="timeline__progress-bar"
          style={{ width: `${(currentTime / duration) * 100}%` }}
        />
      </div>
    </div>
  )
}
