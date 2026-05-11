'use client'

interface ModuleProgressProps {
  moduleId: string
  position: number
  title: string
  isWatched: boolean
  isActive: boolean
  onClick: () => void
}

export default function ModuleProgress({ position, title, isWatched, isActive, onClick }: ModuleProgressProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-3 px-3 py-3 rounded-xl transition-all hover:scale-[1.01]"
      style={{
        background: isActive
          ? 'rgba(0,150,255,0.15)'
          : 'rgba(255,255,255,0.02)',
        border: isActive
          ? '1px solid rgba(0,200,255,0.35)'
          : '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Status icon */}
      <div
        className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black"
        style={
          isWatched
            ? { background: 'rgba(34,197,94,0.2)', border: '1.5px solid #22c55e', color: '#22c55e' }
            : isActive
            ? { background: 'rgba(0,150,255,0.2)', border: '1.5px solid #00AAFF', color: '#00AAFF' }
            : { background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.35)' }
        }
      >
        {isWatched ? '✓' : position}
      </div>

      {/* Title */}
      <span
        className="text-xs font-bold leading-tight line-clamp-2"
        style={{
          color: isActive ? '#00D4FF' : isWatched ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)',
        }}
      >
        {title}
      </span>
    </button>
  )
}
