'use client'

interface BadgeUnlockedModalProps {
  title: string
  challenge: string
  icon: string
  onClose: () => void
}

export function BadgeUnlockedModal({ title, challenge, icon, onClose }: BadgeUnlockedModalProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div
          className="relative w-full max-w-xs rounded-3xl overflow-hidden text-center"
          style={{
            background: 'linear-gradient(160deg, rgba(40,0,80,0.98) 0%, rgba(10,0,30,0.99) 100%)',
            border: '1px solid rgba(168,85,247,0.5)',
            boxShadow: '0 0 80px rgba(168,85,247,0.35), 0 24px 60px rgba(0,0,0,0.8)',
            animation: 'badgeModalPop 0.4s cubic-bezier(0.34,1.56,0.64,1)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top glow line */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg,transparent,#a855f7,#c084fc,transparent)' }}
          />

          {/* Particle shimmer background */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle at 30% 20%, #a855f7 0%, transparent 50%), radial-gradient(circle at 70% 80%, #7c3aed 0%, transparent 50%)',
            }}
          />

          <div className="relative px-8 pt-8 pb-8 space-y-5">
            {/* Label */}
            <p
              className="text-[10px] font-black tracking-[0.35em] uppercase"
              style={{ color: 'rgba(192,132,252,0.7)' }}
            >
              CONQUISTA DESBLOQUEADA
            </p>

            {/* Icon ring */}
            <div className="flex justify-center">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(168,85,247,0.35), rgba(109,40,217,0.2))',
                  border: '2px solid rgba(168,85,247,0.6)',
                  boxShadow: '0 0 40px rgba(168,85,247,0.5), inset 0 0 20px rgba(168,85,247,0.15)',
                  animation: 'badgeIconPulse 2s ease-in-out infinite',
                }}
              >
                {icon}
              </div>
            </div>

            {/* Titles */}
            <div>
              <h2
                className="text-xl font-black text-white mb-1"
                style={{ textShadow: '0 0 20px rgba(168,85,247,0.6)' }}
              >
                {title}
              </h2>
              <p className="text-sm" style={{ color: 'rgba(216,180,254,0.65)' }}>
                {challenge}
              </p>
            </div>

            {/* Rarity chip */}
            <div className="flex justify-center">
              <span
                className="text-[10px] font-black tracking-widest px-3 py-1 rounded-full"
                style={{
                  background: 'rgba(168,85,247,0.2)',
                  border: '1px solid rgba(168,85,247,0.45)',
                  color: '#c084fc',
                }}
              >
                🏅 BADGE COMUM
              </span>
            </div>

            {/* CTA */}
            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-xl font-black tracking-widest text-white transition-all hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                boxShadow: '0 0 24px rgba(168,85,247,0.45)',
              }}
            >
              SHOW! 🚀
            </button>
          </div>

          {/* Bottom glow line */}
          <div
            className="absolute bottom-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg,transparent,#a855f7,#c084fc,transparent)' }}
          />
        </div>
      </div>

      <style>{`
        @keyframes badgeModalPop {
          from { transform: scale(0.7); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
        @keyframes badgeIconPulse {
          0%, 100% { box-shadow: 0 0 30px rgba(168,85,247,0.4), inset 0 0 20px rgba(168,85,247,0.1); }
          50%       { box-shadow: 0 0 55px rgba(168,85,247,0.7), inset 0 0 30px rgba(168,85,247,0.25); }
        }
      `}</style>
    </>
  )
}
