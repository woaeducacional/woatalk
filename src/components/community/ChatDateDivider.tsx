interface ChatDateDividerProps {
  date: string // formatted date string, e.g. "17 de maio de 2026"
}

export function ChatDateDivider({ date }: ChatDateDividerProps) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
      <span
        className="text-[10px] font-black tracking-widest px-3 py-1 rounded-full shrink-0"
        style={{
          background: 'rgba(5,14,26,0.80)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.35)',
        }}
      >
        {date}
      </span>
      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
    </div>
  )
}
