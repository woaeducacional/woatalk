'use client'

import { useState, useRef } from 'react'
import { randomUUID } from 'crypto'
import type { WOAPlayModule } from '@/lib/woaplay'

interface ModuleFormProps {
  initial?: Partial<WOAPlayModule>
  onSave: (mod: WOAPlayModule) => void
  onCancel: () => void
  nextPosition: number
}

export default function ModuleForm({ initial, onSave, onCancel, nextPosition }: ModuleFormProps) {
  const [title, setTitle] = useState(initial?.video_title ?? '')
  const [url, setUrl] = useState(initial?.video_url ?? '')
  const [hasPractice, setHasPractice] = useState(initial?.has_practice_video ?? false)
  const [practiceUrl, setPracticeUrl] = useState(initial?.practice_video_url ?? '')

  function handleSave() {
    if (!title.trim() || !url.trim()) return
    const mod: WOAPlayModule = {
      id: initial?.id ?? `mod-${Date.now()}`,
      position: initial?.position ?? nextPosition,
      video_title: title.trim(),
      video_url: url.trim(),
      has_practice_video: hasPractice,
      practice_video_url: hasPractice ? practiceUrl.trim() : undefined,
      materials: initial?.materials ?? [],
    }
    onSave(mod)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-6 space-y-5"
        style={{ background: '#0B1629', border: '1px solid rgba(0,212,255,0.25)', boxShadow: '0 0 60px rgba(0,150,255,0.15)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-white font-black tracking-widest text-sm">
            {initial?.id ? 'EDITAR MÓDULO' : 'NOVO MÓDULO'}
          </h2>
          <button onClick={onCancel} className="text-white/30 hover:text-white/70 text-lg transition-colors">✕</button>
        </div>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-[10px] font-black tracking-widest text-cyan-400/60 mb-1.5">TÍTULO DO VÍDEO</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Videoaula 01 – O Alfabeto"
              className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/20 outline-none focus:ring-1 focus:ring-cyan-400/50 transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>

          {/* Video URL */}
          <div>
            <label className="block text-[10px] font-black tracking-widest text-cyan-400/60 mb-1.5">URL DO VÍDEO (YouTube)</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/embed/..."
              className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/20 outline-none focus:ring-1 focus:ring-cyan-400/50 transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>

          {/* Practice Video Toggle */}
          <div
            className="flex items-center justify-between p-4 rounded-xl cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
            onClick={() => setHasPractice(!hasPractice)}
          >
            <div>
              <p className="text-white text-sm font-bold">Vídeo de Prática</p>
              <p className="text-white/30 text-xs">Este módulo tem um vídeo extra para praticar</p>
            </div>
            <div
              className="w-10 h-6 rounded-full transition-all flex-shrink-0 relative"
              style={{ background: hasPractice ? '#00AAFF' : 'rgba(255,255,255,0.1)' }}
            >
              <div
                className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                style={{ left: hasPractice ? '22px' : '2px' }}
              />
            </div>
          </div>

          {/* Practice Video URL */}
          {hasPractice && (
            <div>
              <label className="block text-[10px] font-black tracking-widest text-orange-400/60 mb-1.5">URL DO VÍDEO DE PRÁTICA</label>
              <input
                value={practiceUrl}
                onChange={(e) => setPracticeUrl(e.target.value)}
                placeholder="https://www.youtube.com/embed/..."
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/20 outline-none focus:ring-1 focus:ring-orange-400/50 transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,120,0,0.25)' }}
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-xs font-black tracking-widest transition-all hover:scale-[1.02]"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
          >
            CANCELAR
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || !url.trim()}
            className="flex-1 py-2.5 rounded-xl text-xs font-black tracking-widest text-white transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #0055FF, #00AAFF)', boxShadow: '0 0 20px rgba(0,150,255,0.3)' }}
          >
            SALVAR MÓDULO
          </button>
        </div>
      </div>
    </div>
  )
}
