'use client'

import type { WOAPlayMaterial } from '@/lib/woaplay'

interface MaterialsListProps {
  materials: WOAPlayMaterial[]
}

function fileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  if (ext === 'pdf') return '📄'
  if (['doc', 'docx'].includes(ext)) return '📝'
  if (['mp3', 'wav', 'aac'].includes(ext)) return '🎧'
  if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) return '🖼️'
  return '📎'
}

export default function MaterialsList({ materials }: MaterialsListProps) {
  if (!materials || materials.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="text-white font-black text-sm tracking-[0.12em] uppercase">
        Arquivos para Download
      </h3>
      <div className="space-y-2">
        {materials.map((mat) => (
          <div
            key={mat.id}
            className="flex items-center justify-between gap-3 p-4 rounded-xl transition-all hover:scale-[1.01]"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-2xl flex-shrink-0">{fileIcon(mat.file_name)}</span>
              <div className="min-w-0">
                <p className="text-cyan-300 text-sm font-bold truncate">{mat.file_name}</p>
                <p className="text-white/30 text-xs">Baixe ou visualize o arquivo</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* View */}
              <a
                href={mat.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg transition-all hover:scale-110"
                style={{ color: '#3B82F6' }}
                title="Visualizar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              </a>
              {/* Download */}
              <a
                href={mat.file_url}
                download={mat.file_name}
                className="p-2 rounded-lg transition-all hover:scale-110"
                style={{ color: '#3B82F6' }}
                title="Baixar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
