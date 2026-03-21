'use client'

import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { playClick } from '@/lib/sounds'
import type { JourneyCheckpoint } from '@/lib/journey'




function OptionsInput({ value, onChange, inputClass }: { value: string; onChange: (v: string) => void; inputClass: string }) {
  const parts = value.split('|')
  return (
    <div className="grid grid-cols-3 gap-2">
      {([0, 1, 2] as const).map(i => (
        <input
          key={i}
          className={inputClass}
          value={parts[i] ?? ''}
          placeholder={['Opção A', 'Opção B', 'Opção C'][i]}
          onChange={e => {
            const next = [...parts]
            while (next.length < 3) next.push('')
            next[i] = e.target.value
            onChange(next.join('|'))
          }}
        />
      ))}
    </div>
  )
}

function emptyCheckpoint(phaseId: number, cpNum: number): JourneyCheckpoint {
  return {
    id: 0, phase_id: phaseId, checkpoint_number: cpNum, theme_name: '',
    resource_type: 'audio', resource_url: '',
    q1_en: '', q1_pt: '', q1_options: '', q1_answer: '',
    complete_en: '', complete_pt: '', complete_options: '', complete_answer: '',
    speak1: '',
    q2_en: '', q2_pt: '', q2_options: '', q2_answer: '',
    q3_en: '', q3_pt: '', q3_options: '', q3_answer: '',
    speak2: '', order_sentence: '', speak3: '',
  }
}

export default function AdminJourneyEditor() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const phaseId = parseInt(params.phaseId as string)

  const [checkpoints, setCheckpoints] = useState<JourneyCheckpoint[]>([])
  const [phaseInfo, setPhaseInfo] = useState<{ name: string; icon_path: string | null; lesson_title: string | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<number | null>(null)
  const [saved, setSaved] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [openCp, setOpenCp] = useState<number | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
  }, [status, router])

  useEffect(() => {
    if (!phaseId || status !== 'authenticated') return
    setLoading(true)
    fetch(`/api/admin/journey/${phaseId}`)
      .then(r => r.ok ? r.json() : { checkpoints: [] })
      .then(data => {
        const existing: JourneyCheckpoint[] = data.checkpoints ?? []
        const full: JourneyCheckpoint[] = []
        for (let i = 1; i <= 10; i++) {
          full.push(existing.find(c => c.checkpoint_number === i) ?? emptyCheckpoint(phaseId, i))
        }
        setCheckpoints(full)
        if (data.phase) setPhaseInfo(data.phase)
      })
      .catch(() => setCheckpoints(Array.from({ length: 10 }, (_, i) => emptyCheckpoint(phaseId, i + 1))))
      .finally(() => setLoading(false))
  }, [phaseId, status])

  const isAdmin = session?.user?.role === 'admin'

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050E1A' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
          <p className="text-cyan-300/60 text-sm tracking-widest">CARREGANDO EDITOR...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050E1A' }}>
        <p className="text-red-400 text-sm">Acesso negado — apenas administradores.</p>
      </div>
    )
  }

  const updateField = (cpIdx: number, field: keyof JourneyCheckpoint, value: string) => {
    setCheckpoints(prev => {
      const copy = [...prev]
      copy[cpIdx] = { ...copy[cpIdx], [field]: value }
      return copy
    })
  }

  const handleSave = async (cpIdx: number) => {
    const cp = checkpoints[cpIdx]
    setSaving(cp.checkpoint_number)
    setError('')
    setSaved(null)
    try {
      const res = await fetch(`/api/admin/journey/${phaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cp),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error ?? 'Erro ao salvar')
      }
      const result = await res.json()
      const updatedCp = result.checkpoint as JourneyCheckpoint
      setCheckpoints(prev => {
        const copy = [...prev]
        copy[cpIdx] = updatedCp
        return copy
      })
      setSaved(cp.checkpoint_number)
      setTimeout(() => setSaved(null), 2000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally {
      setSaving(null)
    }
  }



  const inputClass = "w-full px-3 py-2 rounded-lg text-sm text-white bg-transparent border border-white/20 outline-none focus:border-cyan-400/60 transition-colors placeholder-white/30"
  const labelClass = "text-[10px] font-black tracking-widest text-cyan-400/70 uppercase mb-1"

  return (
    <main className="min-h-screen relative" style={{ background: '#050E1A' }}>
      <div className="fixed inset-0 z-0">
        <Image src="/images/fundo_do_mar.png" alt="Fundo do Mar" fill className="object-cover object-bottom" priority />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(5,14,26,0.95) 0%, rgba(5,14,26,0.85) 50%, rgba(5,14,26,0.95) 100%)' }} />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 border-b border-cyan-400/20 backdrop-blur-md" style={{ background: 'rgba(5,14,26,0.80)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => { playClick(); router.push('/journey') }} className="relative w-9 h-9 hover:scale-110 transition-transform">
              <div className="absolute inset-0 rounded-full blur-lg bg-cyan-400/30" />
              <Image src="/images/logo.png" alt="WOA Talk" fill className="relative rounded-full border-2 border-cyan-400/50 object-cover" />
            </button>
            <div>
              <h1 className="text-base font-black tracking-[0.18em] text-white" style={{ textShadow: '0 0 12px rgba(0,212,255,0.5)' }}>EDITOR DE JORNADA</h1>
              <p className="text-[10px] text-cyan-400/50 tracking-widest">FASE {phaseId} · 10 CHECKPOINTS · 100 MISSÕES</p>
            </div>
          </div>
          <button onClick={() => { playClick(); router.push('/journey') }} className="text-xs font-bold tracking-widest px-4 py-2 rounded border border-cyan-500/25 text-cyan-300/70 hover:border-cyan-400/50 hover:text-cyan-300 transition-all">
            VOLTAR
          </button>
        </header>

        {error && (
          <div className="max-w-4xl mx-auto w-full px-4 pt-4">
            <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm">{error}</div>
          </div>
        )}

        {/* Checkpoint list */}
        <div className="max-w-4xl mx-auto w-full px-4 py-8">
          <div className="rounded-2xl overflow-hidden" style={{ border: '2px solid rgba(0,212,255,0.25)', background: 'rgba(5,14,26,0.40)' }}>
            {/* Phase header frame */}
            <div className="flex items-center gap-5 px-8 py-6" style={{ background: 'linear-gradient(135deg, rgba(0,36,120,0.6), rgba(0,102,255,0.3))', borderBottom: '1px solid rgba(0,212,255,0.2)' }}>
              {phaseInfo?.icon_path && (
                <div className="relative w-16 h-16 shrink-0">
                  <Image src={phaseInfo.icon_path} alt={phaseInfo.name} fill className="object-contain" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-black text-white tracking-wider" style={{ textShadow: '0 0 16px rgba(0,212,255,0.4)' }}>
                  {phaseInfo?.name ?? `Fase ${phaseId}`}
                </h2>
                {phaseInfo?.lesson_title && (
                  <p className="text-xs text-cyan-300/60 tracking-widest mt-1">{phaseInfo.lesson_title}</p>
                )}
              </div>
            </div>

            {/* Checkpoints */}
            <div className="p-4 space-y-4">
          {checkpoints.map((cp, cpIdx) => {
            const isOpen = openCp === cp.checkpoint_number
            return (
              <div key={cp.checkpoint_number} className="rounded-xl overflow-hidden backdrop-blur-md" style={{ background: 'rgba(5,14,26,0.65)', border: isOpen ? '1px solid rgba(0,212,255,0.3)' : '1px solid rgba(255,255,255,0.08)' }}>
                {/* Accordion header */}
                <button
                  onClick={() => { playClick(); setOpenCp(isOpen ? null : cp.checkpoint_number) }}
                  className="w-full flex items-center justify-between px-6 py-4 text-left transition-colors hover:bg-white/5"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-black text-white/30">{String(cp.checkpoint_number).padStart(2, '0')}</span>
                    <div>
                      <h3 className="text-sm font-black text-white tracking-wider">{cp.theme_name || `Checkpoint ${cp.checkpoint_number}`}</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {saved === cp.checkpoint_number && <span className="text-xs text-green-400 font-bold">Salvo</span>}
                    <span className="text-white/40 text-lg">{isOpen ? '^' : 'v'}</span>
                  </div>
                </button>

                {/* Accordion body */}
                {isOpen && (
                  <div className="px-6 pb-6 space-y-6 border-t border-white/10 pt-4">
                    {/* Theme */}
                    <div>
                      <p className={labelClass}>Nome do Tema</p>
                      <input className={inputClass} value={cp.theme_name ?? ''} onChange={e => updateField(cpIdx, 'theme_name', e.target.value)} placeholder="Ex: Hobbies & Interests" />
                    </div>

                    {/* M1: Resource */}
                    <fieldset className="space-y-3 p-4 rounded-lg" style={{ background: 'rgba(0,67,187,0.1)', border: '1px solid rgba(0,67,187,0.2)' }}>
                      <legend className="text-xs font-black tracking-widest text-blue-300 px-2">MISSÃO 1 — RECURSO</legend>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className={labelClass}>Tipo</p>
                          <div className="flex rounded-lg overflow-hidden border border-white/20">
                            {(['video', 'audio'] as const).map(t => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => updateField(cpIdx, 'resource_type', t)}
                                className="flex-1 py-2 text-sm font-semibold transition-colors"
                                style={cp.resource_type === t
                                  ? { background: 'rgba(0,212,255,0.2)', color: '#00D4FF', borderColor: 'transparent' }
                                  : { background: 'transparent', color: 'rgba(255,255,255,0.4)' }}
                              >
                                {t === 'video' ? 'Vídeo (YouTube)' : 'Áudio'}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className={labelClass}>URL</p>
                          <input className={inputClass} value={cp.resource_url} onChange={e => updateField(cpIdx, 'resource_url', e.target.value)} placeholder="https://youtube.com/watch?v=... ou /audio/..." />
                        </div>
                      </div>
                    </fieldset>

                    {/* M2: Difficulty — fixed, no editable fields */}
                    <div className="p-3 rounded-lg flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span className="text-xs text-white/50">MISSÃO 2 — AVALIAÇÃO DE DIFICULDADE (fixa, não editável)</span>
                    </div>

                    {/* M3: Question 1 */}
                    <fieldset className="space-y-3 p-4 rounded-lg" style={{ background: 'rgba(0,67,187,0.1)', border: '1px solid rgba(0,67,187,0.2)' }}>
                      <legend className="text-xs font-black tracking-widest text-blue-300 px-2">MISSÃO 3 — PERGUNTA 1</legend>
                      <div>
                        <p className={labelClass}>Pergunta (EN)</p>
                        <input className={inputClass} value={cp.q1_en} onChange={e => updateField(cpIdx, 'q1_en', e.target.value)} placeholder="What sport does the man like?" />
                      </div>
                      <div>
                        <p className={labelClass}>Tradução (PT)</p>
                        <input className={inputClass} value={cp.q1_pt ?? ''} onChange={e => updateField(cpIdx, 'q1_pt', e.target.value)} placeholder="Qual esporte o homem gosta?" />
                      </div>
                      <div>
                        <p className={labelClass}>Opções</p>
                        <OptionsInput value={cp.q1_options} onChange={v => updateField(cpIdx, 'q1_options', v)} inputClass={inputClass} />
                      </div>
                      <div>
                        <p className={labelClass}>Resposta correta</p>
                        <input className={inputClass} value={cp.q1_answer} onChange={e => updateField(cpIdx, 'q1_answer', e.target.value)} placeholder="Soccer" />
                      </div>
                    </fieldset>

                    {/* M4: Complete */}
                    <fieldset className="space-y-3 p-4 rounded-lg" style={{ background: 'rgba(0,67,187,0.1)', border: '1px solid rgba(0,67,187,0.2)' }}>
                      <legend className="text-xs font-black tracking-widest text-blue-300 px-2">MISSÃO 4 — COMPLETAR FRASE</legend>
                      <div>
                        <p className={labelClass}>Frase com ___ (EN)</p>
                        <input className={inputClass} value={cp.complete_en} onChange={e => updateField(cpIdx, 'complete_en', e.target.value)} placeholder="I really like to ___ soccer" />
                      </div>
                      <div>
                        <p className={labelClass}>Tradução (PT)</p>
                        <input className={inputClass} value={cp.complete_pt ?? ''} onChange={e => updateField(cpIdx, 'complete_pt', e.target.value)} placeholder="Eu gosto de ___ futebol" />
                      </div>
                      <div>
                        <p className={labelClass}>Opções</p>
                        <OptionsInput value={cp.complete_options} onChange={v => updateField(cpIdx, 'complete_options', v)} inputClass={inputClass} />
                      </div>
                      <div>
                        <p className={labelClass}>Resposta correta</p>
                        <input className={inputClass} value={cp.complete_answer} onChange={e => updateField(cpIdx, 'complete_answer', e.target.value)} placeholder="play" />
                      </div>
                    </fieldset>

                    {/* M5: Speak 1 */}
                    <fieldset className="space-y-3 p-4 rounded-lg" style={{ background: 'rgba(0,67,187,0.1)', border: '1px solid rgba(0,67,187,0.2)' }}>
                      <legend className="text-xs font-black tracking-widest text-blue-300 px-2">MISSÃO 5 — FALAR 1</legend>
                      <div>
                        <p className={labelClass}>Frase para falar</p>
                        <input className={inputClass} value={cp.speak1} onChange={e => updateField(cpIdx, 'speak1', e.target.value)} placeholder="I really like to play soccer" />
                      </div>
                    </fieldset>

                    {/* M6: Question 2 */}
                    <fieldset className="space-y-3 p-4 rounded-lg" style={{ background: 'rgba(0,67,187,0.1)', border: '1px solid rgba(0,67,187,0.2)' }}>
                      <legend className="text-xs font-black tracking-widest text-blue-300 px-2">MISSÃO 6 — PERGUNTA 2</legend>
                      <div>
                        <p className={labelClass}>Pergunta (EN)</p>
                        <input className={inputClass} value={cp.q2_en} onChange={e => updateField(cpIdx, 'q2_en', e.target.value)} />
                      </div>
                      <div>
                        <p className={labelClass}>Tradução (PT)</p>
                        <input className={inputClass} value={cp.q2_pt ?? ''} onChange={e => updateField(cpIdx, 'q2_pt', e.target.value)} />
                      </div>
                      <div>
                        <p className={labelClass}>Opções</p>
                        <OptionsInput value={cp.q2_options} onChange={v => updateField(cpIdx, 'q2_options', v)} inputClass={inputClass} />
                      </div>
                      <div>
                        <p className={labelClass}>Resposta correta</p>
                        <input className={inputClass} value={cp.q2_answer} onChange={e => updateField(cpIdx, 'q2_answer', e.target.value)} />
                      </div>
                    </fieldset>

                    {/* M7: Question 3 */}
                    <fieldset className="space-y-3 p-4 rounded-lg" style={{ background: 'rgba(0,67,187,0.1)', border: '1px solid rgba(0,67,187,0.2)' }}>
                      <legend className="text-xs font-black tracking-widest text-blue-300 px-2">MISSÃO 7 — PERGUNTA 3</legend>
                      <div>
                        <p className={labelClass}>Pergunta (EN)</p>
                        <input className={inputClass} value={cp.q3_en} onChange={e => updateField(cpIdx, 'q3_en', e.target.value)} />
                      </div>
                      <div>
                        <p className={labelClass}>Tradução (PT)</p>
                        <input className={inputClass} value={cp.q3_pt ?? ''} onChange={e => updateField(cpIdx, 'q3_pt', e.target.value)} />
                      </div>
                      <div>
                        <p className={labelClass}>Opções</p>
                        <OptionsInput value={cp.q3_options} onChange={v => updateField(cpIdx, 'q3_options', v)} inputClass={inputClass} />
                      </div>
                      <div>
                        <p className={labelClass}>Resposta correta</p>
                        <input className={inputClass} value={cp.q3_answer} onChange={e => updateField(cpIdx, 'q3_answer', e.target.value)} />
                      </div>
                    </fieldset>

                    {/* M8: Speak 2 */}
                    <fieldset className="space-y-3 p-4 rounded-lg" style={{ background: 'rgba(0,67,187,0.1)', border: '1px solid rgba(0,67,187,0.2)' }}>
                      <legend className="text-xs font-black tracking-widest text-blue-300 px-2">MISSÃO 8 — FALAR 2</legend>
                      <div>
                        <p className={labelClass}>Frase para falar</p>
                        <input className={inputClass} value={cp.speak2} onChange={e => updateField(cpIdx, 'speak2', e.target.value)} />
                      </div>
                    </fieldset>

                    {/* M9: Order */}
                    <fieldset className="space-y-3 p-4 rounded-lg" style={{ background: 'rgba(0,67,187,0.1)', border: '1px solid rgba(0,67,187,0.2)' }}>
                      <legend className="text-xs font-black tracking-widest text-blue-300 px-2">MISSÃO 9 — ORDENAR</legend>
                      <div>
                        <p className={labelClass}>Sentença correta (palavras serão embaralhadas)</p>
                        <input className={inputClass} value={cp.order_sentence} onChange={e => updateField(cpIdx, 'order_sentence', e.target.value)} placeholder="I really like to play soccer" />
                      </div>
                    </fieldset>

                    {/* M10: Speak 3 */}
                    <fieldset className="space-y-3 p-4 rounded-lg" style={{ background: 'rgba(0,67,187,0.1)', border: '1px solid rgba(0,67,187,0.2)' }}>
                      <legend className="text-xs font-black tracking-widest text-blue-300 px-2">MISSÃO 10 — FALAR 3</legend>
                      <div>
                        <p className={labelClass}>Frase para falar</p>
                        <input className={inputClass} value={cp.speak3} onChange={e => updateField(cpIdx, 'speak3', e.target.value)} />
                      </div>
                    </fieldset>

                    {/* Save button */}
                    <button
                      onClick={() => { playClick(); handleSave(cpIdx) }}
                      disabled={saving === cp.checkpoint_number}
                      className="w-full font-black tracking-widest text-sm py-3 rounded-lg text-white transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #CC4A00, #FF6B35)', border: '2px solid #FF6B35', boxShadow: '0 0 15px rgba(255,107,53,0.3)' }}
                    >
                      {saving === cp.checkpoint_number ? 'SALVANDO...' : `SALVAR CHECKPOINT ${cp.checkpoint_number}`}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
