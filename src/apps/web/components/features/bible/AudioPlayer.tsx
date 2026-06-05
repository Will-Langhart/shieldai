import React, { useRef, useState, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, Loader2 } from 'lucide-react'

interface AudioPlayerProps {
  src: string
  label?: string
}

function fmt(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export function AudioPlayer({ src, label }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // Reset when src changes
  useEffect(() => {
    setPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    setLoading(true)
    setError(false)
  }, [src])

  const toggle = () => {
    const a = audioRef.current
    if (!a) return
    if (playing) { a.pause(); setPlaying(false) }
    else { a.play().catch(() => setError(true)); setPlaying(true) }
  }

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const a = audioRef.current
    if (!a) return
    a.currentTime = parseFloat(e.target.value)
    setCurrentTime(a.currentTime)
  }

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0

  if (error) return null

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-shield-panel/60 border border-shield-edge rounded-lg">
      {/* Play/pause */}
      <button
        onClick={toggle}
        disabled={loading}
        className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-shield-brand/15 hover:bg-shield-brand/25 text-shield-brand transition-colors disabled:opacity-40"
      >
        {loading
          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
          : playing
            ? <Pause className="h-3.5 w-3.5" />
            : <Play className="h-3.5 w-3.5 translate-x-[1px]" />}
      </button>

      {/* Label */}
      {label && <span className="text-xs text-shield-muted flex-shrink-0 hidden sm:block">{label}</span>}

      {/* Seek bar */}
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <span className="text-[10px] text-shield-muted flex-shrink-0 w-8 text-right">{fmt(currentTime)}</span>
        <div className="relative flex-1 h-1 bg-shield-edge rounded-full">
          <div className="absolute left-0 top-0 h-full bg-shield-brand rounded-full" style={{ width: `${pct}%` }} />
          <input
            type="range" min={0} max={duration || 0} step={0.5}
            value={currentTime}
            onChange={seek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <span className="text-[10px] text-shield-muted flex-shrink-0 w-8">{fmt(duration)}</span>
      </div>

      {/* Mute */}
      <button
        onClick={() => { setMuted(m => !m); if (audioRef.current) audioRef.current.muted = !muted }}
        className="flex-shrink-0 text-shield-muted hover:text-shield-fg transition-colors"
      >
        {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
      </button>

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={src}
        onLoadedMetadata={e => { setDuration((e.target as HTMLAudioElement).duration); setLoading(false) }}
        onTimeUpdate={e => setCurrentTime((e.target as HTMLAudioElement).currentTime)}
        onEnded={() => setPlaying(false)}
        onError={() => { setError(true); setLoading(false) }}
        preload="metadata"
      />
    </div>
  )
}
