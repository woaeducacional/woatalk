'use client'

import { useEffect, useRef, useState } from 'react'
import type { JourneyContent, MissionGroupDef } from '@/lib/journeyContent'
import { playClick } from '@/lib/sounds'

interface DynamicJourneyFlowProps {
  phaseId: number
}

// ── TTS helper ────────────────────────────────────────────────────────────────
async function speak(text: string): Promise<void> {
  try {
    const res = await fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) })
    if (!res.ok) throw new Error('tts failed')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    await new Promise<void>((resolve) => {
      const audio = new Audio(url)
      audio.onended = () => { URL.revokeObjectURL(url); resolve() }
      audio.onerror = () => { URL.revokeObjectURL(url); resolve() }
      audio.play().catch(() => resolve())
    })
  } catch {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
      await new Promise<void>((resolve) => {
        const u = new SpeechSynthesisUtterance(text)
        u.lang = 'en-US'; u.rate = 0.85
        u.onend = () => resolve(); u.onerror = () => resolve()
        window.speechSynthesis.speak(u)
      })
    }
  }
}

// ── Sub-renderers ─────────────────────────────────────────────────────────────

function Block1View({ content, onComplete }: { content: JourneyContent['block1']; onComplete: () => void }) {
  const [answered, setAnswered] = useState<number | null>(null)
  const [listenIdx, setListenIdx] = useState(0)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [allListened, setAllListened] = useState(false)
  const sentences = content.listenRepeatSentences ?? []

  const handleListen = async () => {
    if (isSpeaking || listenIdx >= sentences.length) return
    setIsSpeaking(true)
    await speak(sentences[listenIdx])
    setIsSpeaking(false)
    const next = listenIdx + 1
    if (next >= sentences.length) setAllListened(true)
    else setListenIdx(next)
  }

  const correctId = content.choiceOptions?.find(o => o.isCorrect)?.id

  return (
    <div className="space-y-6" style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* Video */}
      {content.videoUrl && (
        <div className="rounded-xl overflow-hidden border border-cyan-400/25">
          <p className="px-4 py-2 text-[10px] font-black tracking-widest text-cyan-400/60">🎬 VIDEO INSIGHT</p>
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={content.videoUrl.replace('watch?v=', 'embed/')}
              className="absolute inset-0 w-full h-full"
              allowFullScreen
              title={content.videoTitle}
            />
          </div>
          {content.videoTitle && <p className="px-4 py-2 text-sm text-white/70">{content.videoTitle}</p>}
        </div>
      )}

      {/* Choice question */}
      {content.choiceQuestion && (
        <div className="p-5 rounded-xl border border-purple-400/25" style={{ background: 'rgba(147,51,234,0.06)' }}>
          <p className="text-purple-300 font-black text-xs tracking-widest mb-1">📝 ESCOLHA A CORRETA</p>
          <p className="text-white mb-4">{content.choiceQuestion}</p>
          {content.choiceQuestionPt && <p className="text-white/35 text-xs mb-4">{content.choiceQuestionPt}</p>}
          <div className="space-y-2">
            {(content.choiceOptions ?? []).map(opt => {
              const isSelected = answered === opt.id
              const isCorrect = opt.isCorrect
              return (
                <button
                  key={opt.id}
                  onClick={() => setAnswered(opt.id)}
                  disabled={answered !== null}
                  className="w-full p-3 rounded-lg text-left text-sm font-medium transition-all border"
                  style={{
                    background: answered === null ? 'rgba(255,255,255,0.04)' : isSelected && isCorrect ? 'rgba(34,197,94,0.15)' : isSelected ? 'rgba(239,68,68,0.15)' : isCorrect && answered !== null ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.02)',
                    borderColor: answered === null ? 'rgba(255,255,255,0.1)' : isSelected && isCorrect ? '#22c55e' : isSelected ? '#ef4444' : isCorrect && answered !== null ? '#22c55e' : 'rgba(255,255,255,0.06)',
                    color: answered === null ? 'rgba(191,219,254,0.8)' : isSelected && isCorrect ? '#86efac' : isSelected ? '#fca5a5' : 'rgba(191,219,254,0.5)',
                  }}
                >
                  {isSelected && isCorrect ? '✅ ' : isSelected ? '❌ ' : ''}{opt.text}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Listen & Repeat */}
      {sentences.length > 0 && (
        <div className="p-5 rounded-xl border border-yellow-400/25" style={{ background: 'rgba(250,204,21,0.06)' }}>
          <p className="text-yellow-300 font-black text-xs tracking-widest mb-3">🎧 OUÇA E REPITA</p>
          <p className="text-white text-lg font-semibold mb-4">{sentences[Math.min(listenIdx, sentences.length - 1)]}</p>
          <button
            onClick={handleListen}
            disabled={isSpeaking || allListened}
            className="px-6 py-2.5 rounded-xl font-bold text-white text-sm transition-all hover:scale-105 disabled:opacity-50"
            style={{ background: allListened ? '#666' : 'linear-gradient(135deg,#0066FF,#00D4FF)' }}
          >
            {isSpeaking ? '🔊 Reproduzindo...' : allListened ? '✅ Completo' : `🎧 Ouvir (${listenIdx + 1}/${sentences.length})`}
          </button>
        </div>
      )}

      {(answered !== null || sentences.length === 0) && (
        <button
          onClick={onComplete}
          className="w-full py-3 rounded-xl font-black text-white tracking-widest text-sm transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg,#003AB0,#0066FF)', border: '2px solid #00D4FF' }}
        >
          CONTINUAR →
        </button>
      )}
    </div>
  )
}

function Block2View({ content, onComplete }: { content: JourneyContent['block2']; onComplete: () => void }) {
  const [chosen, setChosen] = useState<string | null>(null)
  const [first, setFirst] = useState<string | null>(null)
  const [second, setSecond] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  return (
    <div className="space-y-6" style={{ animation: 'fadeIn 0.4s ease' }}>
      {content.quote && (
        <div className="p-5 rounded-xl border border-yellow-400/25" style={{ background: 'rgba(250,204,21,0.06)' }}>
          <p className="text-yellow-300 font-black text-xs tracking-widest mb-2">💬 VAMOS REFLETIR</p>
          <p className="text-white text-lg italic">{content.quote}</p>
          {content.quotePt && <p className="text-white/35 text-xs mt-1 italic">{content.quotePt}</p>}
        </div>
      )}

      {content.choicePrompt && (
        <p className="text-blue-200/80 text-center text-sm">{content.choicePrompt}</p>
      )}

      <div className="space-y-2">
        {(content.choices ?? []).map(c => (
          <button
            key={c.id}
            onClick={() => setChosen(c.text)}
            className="w-full p-4 rounded-xl text-left font-medium border transition-all"
            style={{
              background: chosen === c.text ? 'rgba(0,212,255,0.15)' : 'rgba(0,212,255,0.05)',
              borderColor: chosen === c.text ? '#00D4FF' : 'rgba(0,212,255,0.2)',
              color: 'white',
            }}
          >
            <span className="text-cyan-400 font-black mr-2">{c.id})</span> {c.text}
            {c.pt && <p className="text-white/30 text-xs mt-0.5 ml-5">{c.pt}</p>}
          </button>
        ))}
      </div>

      {chosen && content.sentenceTemplate && (
        <div className="p-5 rounded-xl border border-cyan-400/20" style={{ background: 'rgba(0,100,255,0.06)' }}>
          <p className="text-cyan-300 font-black text-xs tracking-widest mb-3">🎤 MONTE SUA FRASE</p>
          <p className="text-blue-200/70 text-sm mb-4">{content.sentenceTemplate || `I love ______ because ______.`}</p>
          {content.firstBlanks?.length > 0 && (
            <>
              <p className="text-cyan-300 text-xs font-bold mb-2">{content.firstBlanksLabel || 'Atividade:'}</p>
              <div className="grid grid-cols-1 gap-2 mb-3">
                {content.firstBlanks.map((b, i) => (
                  <button key={i} onClick={() => setFirst(b.en)} className={`p-2.5 rounded-lg text-sm border transition-all ${first === b.en ? 'bg-cyan-500/25 border-cyan-400 text-white' : 'bg-white/5 border-white/10 text-blue-200/60'}`}>
                    {b.en}
                  </button>
                ))}
              </div>
            </>
          )}
          {content.secondBlanks?.length > 0 && (
            <>
              <p className="text-yellow-300 text-xs font-bold mb-2">{content.secondBlanksLabel || 'Motivo:'}</p>
              <div className="grid grid-cols-1 gap-2 mb-4">
                {content.secondBlanks.map((b, i) => (
                  <button key={i} onClick={() => setSecond(b.en)} className={`p-2.5 rounded-lg text-sm border transition-all ${second === b.en ? 'bg-yellow-500/25 border-yellow-400 text-white' : 'bg-white/5 border-white/10 text-blue-200/60'}`}>
                    {b.en}
                  </button>
                ))}
              </div>
            </>
          )}
          {first && second && !confirmed && (
            <button
              onClick={() => setConfirmed(true)}
              className="w-full py-2.5 rounded-xl font-black text-white text-sm hover:scale-105 transition-all"
              style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}
            >
              ✅ Confirmar
            </button>
          )}
          {confirmed && (
            <div className="p-3 rounded-xl border border-green-400/30 text-center" style={{ background: 'rgba(34,197,94,0.08)' }}>
              <p className="text-white font-semibold">&ldquo;I love {first} because {second}.&rdquo;</p>
            </div>
          )}
        </div>
      )}

      {confirmed && (
        <button
          onClick={onComplete}
          className="w-full py-3 rounded-xl font-black text-white tracking-widest text-sm transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg,#003AB0,#0066FF)', border: '2px solid #00D4FF' }}
        >
          CONTINUAR →
        </button>
      )}
    </div>
  )
}

function Block3View({ content, onComplete }: { content: JourneyContent['block3']; onComplete: () => void }) {
  const [cardIdx, setCardIdx] = useState(0)
  const [showDef, setShowDef] = useState(false)
  const vocab = content.vocabulary ?? []
  const done = cardIdx >= vocab.length

  return (
    <div className="space-y-6" style={{ animation: 'fadeIn 0.4s ease' }}>
      <p className="text-yellow-300 font-black text-xs tracking-widest">📚 VOCABULÁRIO — {vocab.length} palavras</p>

      {!done && (
        <div className="p-6 rounded-xl border border-yellow-400/25 text-center" style={{ background: 'rgba(250,204,21,0.06)', minHeight: 200 }}>
          <p className="text-white text-2xl font-black mb-2">{vocab[cardIdx].word}</p>
          {vocab[cardIdx].translationPt && <p className="text-white/40 text-sm mb-4">{vocab[cardIdx].translationPt}</p>}
          {!showDef ? (
            <button onClick={() => setShowDef(true)} className="px-6 py-2 rounded-lg text-sm font-bold text-cyan-300 border border-cyan-400/30 hover:scale-105 transition-all" style={{ background: 'rgba(0,212,255,0.07)' }}>
              Ver definição
            </button>
          ) : (
            <div className="space-y-3">
              {vocab[cardIdx].definition && <p className="text-blue-200/80 text-sm">{vocab[cardIdx].definition}</p>}
              {vocab[cardIdx].example && <p className="text-white/50 text-xs italic">&ldquo;{vocab[cardIdx].example}&rdquo;</p>}
              <button
                onClick={() => { setCardIdx(i => i + 1); setShowDef(false) }}
                className="mt-2 px-6 py-2 rounded-lg text-sm font-black text-white hover:scale-105 transition-all"
                style={{ background: 'linear-gradient(135deg,#0066FF,#00D4FF)' }}
              >
                {cardIdx + 1 < vocab.length ? 'PRÓXIMA →' : 'CONCLUIR ✅'}
              </button>
            </div>
          )}
          <p className="text-white/20 text-xs mt-4">{cardIdx + 1} / {vocab.length}</p>
        </div>
      )}

      {done && (
        <button
          onClick={onComplete}
          className="w-full py-3 rounded-xl font-black text-white tracking-widest text-sm transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg,#003AB0,#0066FF)', border: '2px solid #00D4FF' }}
        >
          CONTINUAR →
        </button>
      )}
    </div>
  )
}

function Block4View({ content, onComplete }: { content: JourneyContent['block4']; onComplete: () => void }) {
  const [exprIdx, setExprIdx] = useState(0)
  const expressions = content.expressions ?? []
  const done = exprIdx >= expressions.length

  return (
    <div className="space-y-6" style={{ animation: 'fadeIn 0.4s ease' }}>
      <p className="text-pink-300 font-black text-xs tracking-widest">🎤 EXPRESSÕES — {expressions.length} expressões</p>

      {!done && (
        <div className="p-6 rounded-xl border border-pink-400/25" style={{ background: 'rgba(236,72,153,0.06)', minHeight: 180 }}>
          <p className="text-white text-xl font-bold mb-3">{expressions[exprIdx].text}</p>
          {expressions[exprIdx].example && (
            <p className="text-white/50 text-sm italic mb-6">&ldquo;{expressions[exprIdx].example}&rdquo;</p>
          )}
          <button
            onClick={() => setExprIdx(i => i + 1)}
            className="px-6 py-2 rounded-lg text-sm font-black text-white hover:scale-105 transition-all"
            style={{ background: 'linear-gradient(135deg,#be185d,#ec4899)' }}
          >
            {exprIdx + 1 < expressions.length ? 'PRÓXIMA →' : 'CONCLUIR ✅'}
          </button>
          <p className="text-white/20 text-xs mt-4">{exprIdx + 1} / {expressions.length}</p>
        </div>
      )}

      {done && (
        <button
          onClick={onComplete}
          className="w-full py-3 rounded-xl font-black text-white tracking-widest text-sm transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg,#003AB0,#0066FF)', border: '2px solid #00D4FF' }}
        >
          CONTINUAR →
        </button>
      )}
    </div>
  )
}

function Block5View({ content, onComplete }: { content: JourneyContent['block5']; onComplete: () => void }) {
  const [done, setDone] = useState(false)

  return (
    <div className="space-y-6" style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="p-6 rounded-xl border border-cyan-400/25" style={{ background: 'rgba(0,212,255,0.05)' }}>
        <p className="text-cyan-300 font-black text-xs tracking-widest mb-4">🦅 WOA CHALLENGE</p>
        <p className="text-white text-lg font-bold mb-2">{content.promptEn}</p>
        {content.promptPt && <p className="text-white/40 text-sm mb-4">{content.promptPt}</p>}

        {content.topicHints?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {content.topicHints.map((hint, i) => (
              <span key={i} className="px-2 py-1 rounded-full text-xs text-cyan-300 border border-cyan-400/30" style={{ background: 'rgba(0,212,255,0.08)' }}>
                {hint}
              </span>
            ))}
          </div>
        )}

        {content.examplePt && (
          <div className="p-3 rounded-lg border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-white/50 text-xs italic">{content.examplePt}</p>
          </div>
        )}
      </div>

      {!done ? (
        <button
          onClick={() => setDone(true)}
          className="w-full py-3 rounded-xl font-black text-white tracking-widest text-sm transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)', border: '2px solid #a855f7' }}
        >
          🎙️ CONCLUIR DESAFIO
        </button>
      ) : (
        <button
          onClick={onComplete}
          className="w-full py-3 rounded-xl font-black text-white tracking-widest text-sm transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg,#003AB0,#0066FF)', border: '2px solid #00D4FF' }}
        >
          FINALIZAR JORNADA →
        </button>
      )}
    </div>
  )
}

// ── Group list card ───────────────────────────────────────────────────────────

function GroupCard({ group, completed, locked, canStart, onStart }: { group: MissionGroupDef; completed: boolean; locked: boolean; canStart: boolean; onStart: () => void }) {
  return (
    <button
      onClick={onStart}
      disabled={locked}
      className="relative group overflow-hidden rounded-2xl transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 w-full"
    >
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: completed || canStart
            ? `linear-gradient(135deg, ${group.color}20, ${group.color}05)`
            : 'linear-gradient(135deg, #333333, #1a1a1a)',
          filter: locked ? 'grayscale(100%)' : 'none',
        }}
      />
      {/* Border */}
      <div
        className="absolute inset-0 rounded-2xl border-2 transition-all"
        style={{
          borderColor: completed || canStart ? group.color : '#555555',
          boxShadow: completed || canStart ? `0 0 20px ${group.color}40` : 'none',
          filter: locked ? 'grayscale(100%)' : 'none',
        }}
      />
      {/* Content */}
      <div className="relative p-6 space-y-4 h-full flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-4xl">{group.icon}</span>
          </div>
          <h3 className="text-xl font-black" style={{ color: locked ? '#999999' : 'white' }}>
            {group.title}
          </h3>
          <p className="text-sm" style={{ color: locked ? '#666666' : 'rgba(147,197,253,0.7)' }}>
            {group.description}
          </p>
        </div>
        <div className="pt-2 space-y-2">
          {completed && (
            <div className="flex items-center justify-center gap-3">
              <span className="text-xs font-black tracking-wide px-2 py-0.5 rounded-full" style={{ color: '#60a5fa', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(96,165,250,0.35)' }}>
                ⚡ {group.xp} XP
              </span>
              {group.coins > 0 && (
                <span className="text-xs font-black tracking-wide px-2 py-0.5 rounded-full" style={{ color: '#fbbf24', background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.35)' }}>
                  🪙 {group.coins}
                </span>
              )}
            </div>
          )}
          {completed && (
            <div className="text-center py-2 rounded-lg" style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgb(34,197,94)' }}>
              <p className="text-sm font-bold text-green-300">✅ COMPLETO</p>
              <p className="text-xs text-green-400/60 mt-0.5">Toque para refazer</p>
            </div>
          )}
          {locked && (
            <div className="text-center py-2 rounded-lg" style={{ background: 'rgba(100,100,100,0.2)', border: '1px solid #555555' }}>
              <p className="text-sm font-bold text-gray-400">🔒 BLOQUEADO</p>
            </div>
          )}
          {canStart && (
            <div className="text-center py-2 rounded-lg font-bold transition-all" style={{ background: `${group.color}20`, border: `1px solid ${group.color}`, color: group.color }}>
              ➡️ COMEÇAR
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function DynamicJourneyFlow({ phaseId }: DynamicJourneyFlowProps) {
  const [content, setContent] = useState<JourneyContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [completedGroups, setCompletedGroups] = useState<Set<number>>(new Set())
  const [activeGroup, setActiveGroup] = useState<number | null>(null)
  const [phaseComplete, setPhaseComplete] = useState(false)
  const isSaving = useRef(false)

  useEffect(() => {
    fetch(`/api/journey-content/${phaseId}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setContent(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))

    fetch(`/api/mission-groups/${phaseId}/completed`)
      .then(r => r.ok ? r.json() : [])
      .then((ids: number[]) => {
        if (Array.isArray(ids)) {
          setCompletedGroups(new Set(ids))
          if (ids.length >= 5) setPhaseComplete(true)
        }
      })
      .catch(() => {})
  }, [phaseId])

  const saveGroupComplete = async (groupId: number, xp: number, coins: number) => {
    if (isSaving.current) return
    isSaving.current = true
    await fetch('/api/mission-groups/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phaseId, missionGroupId: groupId, totalXp: xp, woaCoins: coins }),
    }).catch(() => {})
    isSaving.current = false
  }

  const handleGroupComplete = async (groupId: number) => {
    const group = content?.mission_groups?.[groupId]
    if (group) await saveGroupComplete(groupId, group.xp, group.coins)
    setCompletedGroups(prev => {
      const next = new Set(prev)
      next.add(groupId)
      return next
    })
    setActiveGroup(null)
    if ((completedGroups.size + 1) >= (content?.mission_groups?.length ?? 5)) {
      setPhaseComplete(true)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
        <p className="text-cyan-300/60 text-sm tracking-widest">CARREGANDO JORNADA...</p>
      </div>
    )
  }

  if (error || !content) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400 text-sm">Conteúdo da jornada não encontrado.</p>
      </div>
    )
  }

  const groups = content.mission_groups ?? []

  // ── Phase complete screen ─────────────────────────────────────────────────
  if (phaseComplete) {
    return (
      <div className="p-10 rounded-3xl text-center border border-green-400/30" style={{ background: 'rgba(34,197,94,0.08)', animation: 'fadeIn 0.5s ease' }}>
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-3xl font-black text-white mb-2">Jornada Completa!</h2>
        <p className="text-blue-200/70 mb-6">{content.title}</p>
        <button onClick={() => window.location.href = '/dashboard'} className="px-8 py-3 rounded-xl font-black text-white tracking-widest text-sm hover:scale-105 transition-all" style={{ background: 'linear-gradient(135deg,#003AB0,#0066FF)', border: '2px solid #00D4FF' }}>
          ← VOLTAR À JORNADA
        </button>
        <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
      </div>
    )
  }

  // ── Active block view ─────────────────────────────────────────────────────
  if (activeGroup !== null) {
    const group = groups[activeGroup]
    const blockRenderers = [
      <Block1View key="b1" content={content.block1} onComplete={() => handleGroupComplete(0)} />,
      <Block2View key="b2" content={content.block2} onComplete={() => handleGroupComplete(1)} />,
      <Block3View key="b3" content={content.block3} onComplete={() => handleGroupComplete(2)} />,
      <Block4View key="b4" content={content.block4} onComplete={() => handleGroupComplete(3)} />,
      <Block5View key="b5" content={content.block5} onComplete={() => handleGroupComplete(4)} />,
    ]

    return (
      <div style={{ animation: 'fadeIn 0.4s ease' }}>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => { playClick(); setActiveGroup(null) }} className="text-xs font-bold tracking-widest px-3 py-1.5 rounded border border-cyan-500/25 text-cyan-300/70 hover:border-cyan-400/50 transition-all">← GRUPOS</button>
          <div>
            <p className="text-xs font-black tracking-widest" style={{ color: group?.color ?? '#00D4FF' }}>{group?.icon} {group?.title?.toUpperCase()}</p>
          </div>
        </div>
        {blockRenderers[activeGroup]}
        <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
      </div>
    )
  }

  // ── Groups list ───────────────────────────────────────────────────────────
  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="mb-8 text-center space-y-2">
        <h2 className="text-3xl font-black text-white" style={{ textShadow: '0 0 20px rgba(0,212,255,0.4)' }}>{content.title}</h2>
        {content.description && <p className="text-cyan-200/70">{content.description}</p>}
      </div>

      <div className="space-y-6">
        {/* Row 1: first 3 cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.slice(0, 3).map((group, idx) => {
            const completed = completedGroups.has(idx)
            const locked = idx > 0 && !completedGroups.has(idx - 1)
            const canStart = !locked && !completed
            return (
              <GroupCard
                key={group.id ?? idx}
                group={group}
                completed={completed}
                locked={locked}
                canStart={canStart}
                onStart={() => { playClick(); setActiveGroup(idx) }}
              />
            )
          })}
        </div>
        {/* Row 2: remaining cards — centered */}
        {groups.length > 3 && (
          <div className="flex gap-6 justify-center">
            {groups.slice(3).map((group, i) => {
              const idx = 3 + i
              const completed = completedGroups.has(idx)
              const locked = idx > 0 && !completedGroups.has(idx - 1)
              const canStart = !locked && !completed
              return (
                <div key={group.id ?? idx} className="w-[calc(33.333%-12px)]" style={{ minWidth: '200px' }}>
                  <GroupCard
                    group={group}
                    completed={completed}
                    locked={locked}
                    canStart={canStart}
                    onStart={() => { playClick(); setActiveGroup(idx) }}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )
}
