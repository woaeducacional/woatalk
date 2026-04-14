'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useState } from 'react'
import type {
  JourneyContent,
  MissionGroupDef,
  Block1Content,
  Block2Content,
  Block3Content,
  Block4Content,
  Block5Content,
} from '@/lib/journeyContent'

/* ─── Shared styles (same as editor) ──────────────────────── */
const inputCls =
  'w-full p-2.5 rounded-lg bg-white/5 border border-white/20 text-white text-sm placeholder-white/30 focus:border-cyan-400 focus:outline-none transition-colors'
const labelCls = 'block text-[11px] font-bold text-blue-200/70 mb-1 uppercase tracking-wider'
const cardCls = 'p-4 rounded-xl border border-white/10 bg-white/[0.03] space-y-3'
const addBtnCls =
  'w-full py-2.5 rounded-lg border-2 border-dashed border-white/20 text-white/40 text-sm font-bold hover:border-cyan-400/50 hover:text-cyan-300 transition-all'
const removeBtnCls =
  'px-2 py-1 rounded text-[10px] font-bold text-red-300/70 hover:text-red-300 hover:bg-red-500/10 transition-all'

/* ─── Reusable components ──────────────────────────────────── */

function Field({
  label,
  value,
  onChange,
  textarea,
  rows,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  textarea?: boolean
  rows?: number
  placeholder?: string
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {textarea ? (
        <textarea
          className={inputCls + ' resize-y'}
          rows={rows ?? 3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <input
          className={inputCls}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  )
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div
        className={`w-10 h-5 rounded-full relative transition-colors ${checked ? 'bg-green-500' : 'bg-white/20'}`}
        onClick={() => onChange(!checked)}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}
        />
      </div>
      <span className="text-xs text-blue-200/70">{label}</span>
    </label>
  )
}

function StringListEditor({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string
  items: string[]
  onChange: (items: string[]) => void
  placeholder?: string
}) {
  return (
    <div className="space-y-2">
      <label className={labelCls}>{label}</label>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <span className="text-xs text-white/30 mt-2 w-5 text-right shrink-0">{i + 1}.</span>
          <input
            className={inputCls}
            value={item}
            placeholder={placeholder}
            onChange={(e) => {
              const copy = [...items]
              copy[i] = e.target.value
              onChange(copy)
            }}
          />
          <button
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className={removeBtnCls + ' shrink-0 mt-0.5'}
          >
            ✕
          </button>
        </div>
      ))}
      <button onClick={() => onChange([...items, ''])} className={addBtnCls}>
        + Adicionar item
      </button>
    </div>
  )
}

function ItemHeader({
  index,
  label,
  onRemove,
}: {
  index: number
  label: string
  onRemove: () => void
}) {
  return (
    <div className="flex items-center justify-between mb-1">
      <span className="text-xs font-bold text-cyan-300/70">
        #{index + 1} — {label}
      </span>
      <button onClick={onRemove} className={removeBtnCls}>
        ✕ Remover
      </button>
    </div>
  )
}

/* ─── Step labels ──────────────────────────────────────────── */

const STEPS = [
  { label: 'Fase', icon: '🌊' },
  { label: 'Grupos', icon: '🎯' },
  { label: 'Vídeo', icon: '🎬' },
  { label: 'Reflexão', icon: '💭' },
  { label: 'Vocabulário', icon: '📚' },
  { label: 'Expressões', icon: '💬' },
  { label: 'Desafio', icon: '🏆' },
  { label: 'Publicar', icon: '🚀' },
]

/* ─── Default data ─────────────────────────────────────────── */

const defaultMissionGroups: MissionGroupDef[] = Array.from({ length: 5 }, (_, i) => ({
  id: i,
  icon: ['🎬', '💭', '📚', '💬', '🏆'][i],
  title: ['Video Insight', "Let's Reflect", 'Vocabulary', 'Practice & Speak', 'WOA Challenge'][i],
  description: '',
  color: ['#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'][i],
  xp: [20, 30, 40, 30, 50][i],
  coins: [5, 10, 15, 10, 20][i],
}))

const defaultBlock1: Block1Content = {
  videoUrl: '',
  videoTitle: '',
  choiceQuestion: '',
  choiceQuestionPt: '',
  choiceOptions: [
    { id: 1, text: '', isCorrect: true },
    { id: 2, text: '', isCorrect: false },
    { id: 3, text: '', isCorrect: false },
  ],
  listenRepeatSentences: [''],
}

const defaultBlock2: Block2Content = {
  quote: '',
  quotePt: '',
  choicePrompt: '',
  choices: [
    { id: 'a', text: '', pt: '' },
    { id: 'b', text: '', pt: '' },
    { id: 'c', text: '', pt: '' },
  ],
  modelSentence: '',
  modelSentencePt: '',
  sentenceTemplate: '',
  sentenceTemplatePt: '',
  firstBlanksLabel: '',
  secondBlanksLabel: '',
  firstBlanks: [{ en: '', pt: '' }],
  secondBlanks: [{ en: '', pt: '' }],
  helpText: '',
  boostSentence: '',
  boostSentencePt: '',
}

const defaultBlock3: Block3Content = {
  vocabulary: [{ word: '', definition: '', translationPt: '', example: '' }],
  fillSentences: [{ sentence: '', answer: '', options: ['', '', ''], full: '' }],
  memorySentences: [''],
}

const defaultBlock4: Block4Content = {
  expressions: [{ id: 1, text: '', example: '' }],
  completions: { 1: [{ label: '', full: '' }] },
}

const defaultBlock5: Block5Content = {
  promptEn: '',
  promptPt: '',
  examplePt: '',
  topicHints: [''],
}

/* ─── Phase metadata type ──────────────────────────────────── */
interface PhaseMeta {
  title: string
  description: string
}

/* ═══════════════════════════════════════════════════════════════
   MAIN WIZARD COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function NewJourneyWizard() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  // Phase metadata
  const [phase, setPhase] = useState<PhaseMeta>({
    title: '',
    description: '',
  })

  // Content
  const [missionGroups, setMissionGroups] = useState<MissionGroupDef[]>(defaultMissionGroups)
  const [block1, setBlock1] = useState<Block1Content>(defaultBlock1)
  const [block2, setBlock2] = useState<Block2Content>(defaultBlock2)
  const [block3, setBlock3] = useState<Block3Content>(defaultBlock3)
  const [block4, setBlock4] = useState<Block4Content>(defaultBlock4)
  const [block5, setBlock5] = useState<Block5Content>(defaultBlock5)

  /* ── Auth guard ──────────────────────────────────────────── */

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050E1A' }}>
        <div className="w-10 h-10 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    )
  }

  if (!session || session.user?.role !== 'admin') {
    router.push('/auth/signin')
    return null
  }

  /* ── Navigation ──────────────────────────────────────────── */

  const canNext = () => {
    if (step === 0) return phase.title.trim().length > 0
    return true
  }

  const next = () => {
    if (step < STEPS.length - 1 && canNext()) setStep(step + 1)
  }
  const prev = () => {
    if (step > 0) setStep(step - 1)
  }

  /* ── Save ────────────────────────────────────────────────── */

  const handlePublish = async () => {
    setSaving(true)
    setSaveMsg('')
    try {
      // Determine next phase_id by fetching existing journeys
      const listRes = await fetch('/api/admin/levels')
      const listData = listRes.ok ? await listRes.json() : { levels: [] }
      const existingIds: number[] = (listData.levels ?? []).map((l: { id: number }) => l.id)
      // phase_id 1 = Pacific Ocean (hardcoded), phase_id 2 = Atlantic Ocean (hardcoded)
      // Admin-created journeys must start from 3 to avoid conflicts
      const newPhaseId = Math.max(...existingIds, 2) + 1

      // Save journey content (upsert on phase_id)
      const contentPayload: JourneyContent = {
        phase_id: newPhaseId,
        title: phase.title,
        description: phase.description,
        mission_groups: missionGroups,
        block1,
        block2,
        block3,
        block4,
        block5,
      }

      const contentRes = await fetch(`/api/journey-content/${newPhaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contentPayload),
      })
      if (!contentRes.ok) {
        const d = await contentRes.json().catch(() => ({}))
        throw new Error(d.error ?? 'Erro ao salvar conteúdo')
      }

      setSaveMsg('✅ Jornada criada com sucesso!')
      setTimeout(() => router.push('/admin'), 1500)
    } catch (e: unknown) {
      setSaveMsg(`❌ ${e instanceof Error ? e.message : 'Erro desconhecido'}`)
    } finally {
      setSaving(false)
    }
  }

  /* ── Block helpers ───────────────────────────────────────── */

  const updateB1 = (field: string, value: unknown) =>
    setBlock1((prev) => ({ ...prev, [field]: value }))

  const updateB2 = (field: string, value: unknown) =>
    setBlock2((prev) => ({ ...prev, [field]: value }))

  const updateB3 = (field: string, value: unknown) =>
    setBlock3((prev) => ({ ...prev, [field]: value }))

  const updateB4 = (field: string, value: unknown) =>
    setBlock4((prev) => ({ ...prev, [field]: value }))

  /* ── Step content renderers ──────────────────────────────── */

  const renderStep0 = () => (
    <div className="space-y-4">
      <p className="text-blue-200/50 text-sm">
        Defina os metadados da nova jornada. Estes dados identificam a jornada no sistema.
      </p>
      <Field
        label="Título da Jornada (ex: Pacific Ocean)"
        value={phase.title}
        onChange={(v) => setPhase({ ...phase, title: v })}
        placeholder="Pacific Ocean"
      />
      <Field
        label="Descrição"
        value={phase.description}
        onChange={(v) => setPhase({ ...phase, description: v })}
        textarea
        placeholder="Nesta jornada você vai aprender a se apresentar em inglês..."
      />
    </div>
  )

  const renderStep1 = () => (
    <div className="space-y-4">
      <p className="text-blue-200/50 text-sm">
        Configure os 5 grupos de missão. Cada grupo corresponde a um bloco de atividade.
      </p>
      {missionGroups.map((mg, i) => (
        <div key={i} className={cardCls}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{mg.icon}</span>
            <span className="text-xs font-bold text-cyan-300/70">Grupo {i + 1}</span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <Field
              label="Título"
              value={mg.title}
              onChange={(v) => {
                const g = [...missionGroups]
                g[i] = { ...g[i], title: v }
                setMissionGroups(g)
              }}
              placeholder="Video Insight"
            />
          </div>
          <Field
            label="Descrição"
            value={mg.description}
            onChange={(v) => {
              const g = [...missionGroups]
              g[i] = { ...g[i], description: v }
              setMissionGroups(g)
            }}
            placeholder="Assista ao vídeo e responda..."
          />
          <div className="grid grid-cols-3 gap-3">
            <Field
              label="Cor (hex)"
              value={mg.color}
              onChange={(v) => {
                const g = [...missionGroups]
                g[i] = { ...g[i], color: v }
                setMissionGroups(g)
              }}
              placeholder="#06b6d4"
            />
            <div>
              <label className={labelCls}>XP</label>
              <input
                type="number"
                className={inputCls}
                value={mg.xp}
                onChange={(e) => {
                  const g = [...missionGroups]
                  g[i] = { ...g[i], xp: parseInt(e.target.value) || 0 }
                  setMissionGroups(g)
                }}
              />
            </div>
            <div>
              <label className={labelCls}>Coins</label>
              <input
                type="number"
                className={inputCls}
                value={mg.coins}
                onChange={(e) => {
                  const g = [...missionGroups]
                  g[i] = { ...g[i], coins: parseInt(e.target.value) || 0 }
                  setMissionGroups(g)
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-4">
      <p className="text-blue-200/50 text-sm">
        Bloco 1 — O aluno assiste a um vídeo e responde perguntas de compreensão.
      </p>
      <Field
        label="URL do Vídeo (YouTube ID ou URL completa)"
        value={block1.videoUrl}
        onChange={(v) => updateB1('videoUrl', v)}
        placeholder="dQw4w9WgXcQ"
      />
      <Field
        label="Título do Vídeo"
        value={block1.videoTitle}
        onChange={(v) => updateB1('videoTitle', v)}
        placeholder="Introduction to Self Presentation"
      />
      <div className="border-t border-white/10 pt-4">
        <Field
          label="Pergunta de Compreensão (EN)"
          value={block1.choiceQuestion}
          onChange={(v) => updateB1('choiceQuestion', v)}
          placeholder="What is the main topic of the video?"
        />
        <div className="mt-3">
          <Field
            label="Pergunta de Compreensão (PT)"
            value={block1.choiceQuestionPt}
            onChange={(v) => updateB1('choiceQuestionPt', v)}
            placeholder="Qual é o tema principal do vídeo?"
          />
        </div>
      </div>
      <div className="border-t border-white/10 pt-4">
        <label className={labelCls}>Opções de resposta</label>
        <div className="space-y-2 mt-2">
          {block1.choiceOptions.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-white/30 w-5 text-right shrink-0">{String.fromCharCode(65 + i)}.</span>
              <input
                className={inputCls}
                value={opt.text}
                onChange={(e) => {
                  const opts = [...block1.choiceOptions]
                  opts[i] = { ...opts[i], text: e.target.value }
                  updateB1('choiceOptions', opts)
                }}
                placeholder={`Opção ${String.fromCharCode(65 + i)}`}
              />
              <Toggle
                label="Correta"
                checked={opt.isCorrect}
                onChange={(v) => {
                  const opts = [...block1.choiceOptions]
                  opts[i] = { ...opts[i], isCorrect: v }
                  updateB1('choiceOptions', opts)
                }}
              />
              {block1.choiceOptions.length > 2 && (
                <button
                  onClick={() => updateB1('choiceOptions', block1.choiceOptions.filter((_, j) => j !== i))}
                  className={removeBtnCls}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {block1.choiceOptions.length < 6 && (
            <button
              onClick={() =>
                updateB1('choiceOptions', [
                  ...block1.choiceOptions,
                  { id: block1.choiceOptions.length + 1, text: '', isCorrect: false },
                ])
              }
              className={addBtnCls}
            >
              + Adicionar opção
            </button>
          )}
        </div>
      </div>
      <StringListEditor
        label="Frases para Listen & Repeat"
        items={block1.listenRepeatSentences}
        onChange={(v) => updateB1('listenRepeatSentences', v)}
        placeholder="My name is Oliver."
      />
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-4">
      <p className="text-blue-200/50 text-sm">
        Bloco 2 — Reflexão. O aluno lê uma citação, reflete e constrói frases.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Citação (EN)" value={block2.quote} onChange={(v) => updateB2('quote', v)} placeholder="Every journey begins with a single step." />
        <Field label="Citação (PT)" value={block2.quotePt} onChange={(v) => updateB2('quotePt', v)} placeholder="Toda jornada começa com um único passo." />
      </div>
      <Field
        label="Prompt de Motivação"
        value={block2.choicePrompt}
        onChange={(v) => updateB2('choicePrompt', v)}
        placeholder="What motivates you to learn English?"
      />

      {/* Choices */}
      <div className="border-t border-white/10 pt-4">
        <label className={labelCls}>Opções de motivação</label>
        <div className="space-y-2 mt-2">
          {block2.choices.map((ch, i) => (
            <div key={i} className={cardCls}>
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label={`Opção ${ch.id.toUpperCase()} — EN`}
                  value={ch.text}
                  onChange={(v) => {
                    const c = [...block2.choices]
                    c[i] = { ...c[i], text: v }
                    updateB2('choices', c)
                  }}
                />
                <Field
                  label="PT"
                  value={ch.pt}
                  onChange={(v) => {
                    const c = [...block2.choices]
                    c[i] = { ...c[i], pt: v }
                    updateB2('choices', c)
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Model sentence */}
      <div className="border-t border-white/10 pt-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Frase Modelo (EN)" value={block2.modelSentence} onChange={(v) => updateB2('modelSentence', v)} placeholder="I want to learn English because..." />
          <Field label="Frase Modelo (PT)" value={block2.modelSentencePt} onChange={(v) => updateB2('modelSentencePt', v)} placeholder="Eu quero aprender inglês porque..." />
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <Field label="Template de Frase (EN)" value={block2.sentenceTemplate} onChange={(v) => updateB2('sentenceTemplate', v)} placeholder="I ___ English because ___" />
          <Field label="Template de Frase (PT)" value={block2.sentenceTemplatePt} onChange={(v) => updateB2('sentenceTemplatePt', v)} placeholder="Eu ___ inglês porque ___" />
        </div>
      </div>

      {/* Blanks */}
      <div className="border-t border-white/10 pt-4">
        <Field label="Label 1° espaço em branco" value={block2.firstBlanksLabel} onChange={(v) => updateB2('firstBlanksLabel', v)} placeholder="Verbo" />
        <div className="mt-2 space-y-2">
          {block2.firstBlanks.map((b, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="text-xs text-white/30 mt-2 w-5 text-right shrink-0">{i + 1}.</span>
              <div className="grid grid-cols-2 gap-2 flex-1">
                <input className={inputCls} value={b.en} placeholder="EN" onChange={(e) => {
                  const list = [...block2.firstBlanks]; list[i] = { ...list[i], en: e.target.value }; updateB2('firstBlanks', list)
                }} />
                <input className={inputCls} value={b.pt} placeholder="PT" onChange={(e) => {
                  const list = [...block2.firstBlanks]; list[i] = { ...list[i], pt: e.target.value }; updateB2('firstBlanks', list)
                }} />
              </div>
              <button onClick={() => updateB2('firstBlanks', block2.firstBlanks.filter((_, j) => j !== i))} className={removeBtnCls + ' mt-1'}>✕</button>
            </div>
          ))}
          <button onClick={() => updateB2('firstBlanks', [...block2.firstBlanks, { en: '', pt: '' }])} className={addBtnCls}>+ Adicionar opção</button>
        </div>
      </div>

      <div className="border-t border-white/10 pt-4">
        <Field label="Label 2° espaço em branco" value={block2.secondBlanksLabel} onChange={(v) => updateB2('secondBlanksLabel', v)} placeholder="Motivo" />
        <div className="mt-2 space-y-2">
          {block2.secondBlanks.map((b, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="text-xs text-white/30 mt-2 w-5 text-right shrink-0">{i + 1}.</span>
              <div className="grid grid-cols-2 gap-2 flex-1">
                <input className={inputCls} value={b.en} placeholder="EN" onChange={(e) => {
                  const list = [...block2.secondBlanks]; list[i] = { ...list[i], en: e.target.value }; updateB2('secondBlanks', list)
                }} />
                <input className={inputCls} value={b.pt} placeholder="PT" onChange={(e) => {
                  const list = [...block2.secondBlanks]; list[i] = { ...list[i], pt: e.target.value }; updateB2('secondBlanks', list)
                }} />
              </div>
              <button onClick={() => updateB2('secondBlanks', block2.secondBlanks.filter((_, j) => j !== i))} className={removeBtnCls + ' mt-1'}>✕</button>
            </div>
          ))}
          <button onClick={() => updateB2('secondBlanks', [...block2.secondBlanks, { en: '', pt: '' }])} className={addBtnCls}>+ Adicionar opção</button>
        </div>
      </div>

      <div className="border-t border-white/10 pt-4 space-y-3">
        <Field label="Texto de Ajuda" value={block2.helpText} onChange={(v) => updateB2('helpText', v)} textarea placeholder="Dica para o aluno..." />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Boost Sentence (EN)" value={block2.boostSentence} onChange={(v) => updateB2('boostSentence', v)} placeholder="You are doing great!" />
          <Field label="Boost Sentence (PT)" value={block2.boostSentencePt} onChange={(v) => updateB2('boostSentencePt', v)} placeholder="Você está indo muito bem!" />
        </div>
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-4">
      <p className="text-blue-200/50 text-sm">
        Bloco 3 — Vocabulário. Palavras, exercícios de completar e frases para memorização.
      </p>

      {/* Vocabulary words */}
      <div className="space-y-3">
        <label className={labelCls}>Palavras</label>
        {block3.vocabulary.map((v, i) => (
          <div key={i} className={cardCls}>
            <ItemHeader index={i} label="Palavra" onRemove={() => updateB3('vocabulary', block3.vocabulary.filter((_, j) => j !== i))} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Palavra (EN)" value={v.word} onChange={(val) => {
                const list = [...block3.vocabulary]; list[i] = { ...list[i], word: val }; updateB3('vocabulary', list)
              }} placeholder="greetings" />
              <Field label="Tradução (PT)" value={v.translationPt} onChange={(val) => {
                const list = [...block3.vocabulary]; list[i] = { ...list[i], translationPt: val }; updateB3('vocabulary', list)
              }} placeholder="saudações" />
            </div>
            <Field label="Definição" value={v.definition} onChange={(val) => {
              const list = [...block3.vocabulary]; list[i] = { ...list[i], definition: val }; updateB3('vocabulary', list)
            }} placeholder="Words used to say hello" />
            <Field label="Exemplo" value={v.example} onChange={(val) => {
              const list = [...block3.vocabulary]; list[i] = { ...list[i], example: val }; updateB3('vocabulary', list)
            }} placeholder="Hello! Nice to meet you." />
          </div>
        ))}
        <button
          onClick={() => updateB3('vocabulary', [...block3.vocabulary, { word: '', definition: '', translationPt: '', example: '' }])}
          className={addBtnCls}
        >
          + Adicionar palavra
        </button>
      </div>

      {/* Fill sentences */}
      <div className="border-t border-white/10 pt-4 space-y-3">
        <label className={labelCls}>Exercícios de Completar</label>
        {block3.fillSentences.map((f, i) => (
          <div key={i} className={cardCls}>
            <ItemHeader index={i} label="Exercício" onRemove={() => updateB3('fillSentences', block3.fillSentences.filter((_, j) => j !== i))} />
            <Field label="Frase (use ___ para o espaço)" value={f.sentence} onChange={(val) => {
              const list = [...block3.fillSentences]; list[i] = { ...list[i], sentence: val }; updateB3('fillSentences', list)
            }} placeholder="My ___ is Oliver." />
            <Field label="Resposta correta" value={f.answer} onChange={(val) => {
              const list = [...block3.fillSentences]; list[i] = { ...list[i], answer: val }; updateB3('fillSentences', list)
            }} placeholder="name" />
            <Field label="Frase completa" value={f.full} onChange={(val) => {
              const list = [...block3.fillSentences]; list[i] = { ...list[i], full: val }; updateB3('fillSentences', list)
            }} placeholder="My name is Oliver." />
            <div>
              <label className={labelCls}>Opções (separadas)</label>
              <div className="flex gap-2 mt-1">
                {f.options.map((o, oi) => (
                  <input
                    key={oi}
                    className={inputCls + ' flex-1'}
                    value={o}
                    placeholder={`Opção ${oi + 1}`}
                    onChange={(e) => {
                      const list = [...block3.fillSentences]
                      const opts = [...list[i].options]
                      opts[oi] = e.target.value
                      list[i] = { ...list[i], options: opts }
                      updateB3('fillSentences', list)
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
        <button
          onClick={() =>
            updateB3('fillSentences', [
              ...block3.fillSentences,
              { sentence: '', answer: '', options: ['', '', ''], full: '' },
            ])
          }
          className={addBtnCls}
        >
          + Adicionar exercício
        </button>
      </div>

      {/* Memory sentences */}
      <div className="border-t border-white/10 pt-4">
        <StringListEditor
          label="Frases para Memorização"
          items={block3.memorySentences}
          onChange={(v) => updateB3('memorySentences', v)}
          placeholder="Nice to meet you!"
        />
      </div>
    </div>
  )

  const renderStep5 = () => (
    <div className="space-y-4">
      <p className="text-blue-200/50 text-sm">
        Bloco 4 — Expressões e prática. Crie expressões com variações para completar.
      </p>

      {block4.expressions.map((exp, i) => (
        <div key={i} className={cardCls}>
          <ItemHeader
            index={i}
            label="Expressão"
            onRemove={() => {
              const newExps = block4.expressions.filter((_, j) => j !== i)
              const newComps = { ...block4.completions }
              delete newComps[exp.id]
              updateB4('expressions', newExps)
              updateB4('completions', newComps)
            }}
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Expressão"
              value={exp.text}
              onChange={(v) => {
                const list = [...block4.expressions]
                list[i] = { ...list[i], text: v }
                updateB4('expressions', list)
              }}
              placeholder="How are you?"
            />
            <Field
              label="Exemplo de uso"
              value={exp.example}
              onChange={(v) => {
                const list = [...block4.expressions]
                list[i] = { ...list[i], example: v }
                updateB4('expressions', list)
              }}
              placeholder="How are you doing today?"
            />
          </div>

          {/* Completions for this expression */}
          <div className="pl-4 border-l-2 border-cyan-400/20 space-y-2 mt-2">
            <label className={labelCls}>Variações de Completar</label>
            {(block4.completions[exp.id] ?? []).map((comp, ci) => (
              <div key={ci} className="flex gap-2 items-start">
                <div className="grid grid-cols-2 gap-2 flex-1">
                  <input
                    className={inputCls}
                    value={comp.label}
                    placeholder="Label (ex: formal)"
                    onChange={(e) => {
                      const comps = { ...block4.completions }
                      const list = [...(comps[exp.id] ?? [])]
                      list[ci] = { ...list[ci], label: e.target.value }
                      comps[exp.id] = list
                      updateB4('completions', comps)
                    }}
                  />
                  <input
                    className={inputCls}
                    value={comp.full}
                    placeholder="Frase completa"
                    onChange={(e) => {
                      const comps = { ...block4.completions }
                      const list = [...(comps[exp.id] ?? [])]
                      list[ci] = { ...list[ci], full: e.target.value }
                      comps[exp.id] = list
                      updateB4('completions', comps)
                    }}
                  />
                </div>
                <button
                  onClick={() => {
                    const comps = { ...block4.completions }
                    comps[exp.id] = (comps[exp.id] ?? []).filter((_, j) => j !== ci)
                    updateB4('completions', comps)
                  }}
                  className={removeBtnCls + ' mt-1'}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                const comps = { ...block4.completions }
                comps[exp.id] = [...(comps[exp.id] ?? []), { label: '', full: '' }]
                updateB4('completions', comps)
              }}
              className={addBtnCls}
            >
              + Variação
            </button>
          </div>
        </div>
      ))}
      <button
        onClick={() => {
          const newId = block4.expressions.length > 0 ? Math.max(...block4.expressions.map((e) => e.id)) + 1 : 1
          updateB4('expressions', [...block4.expressions, { id: newId, text: '', example: '' }])
          updateB4('completions', { ...block4.completions, [newId]: [{ label: '', full: '' }] })
        }}
        className={addBtnCls}
      >
        + Adicionar expressão
      </button>
    </div>
  )

  const renderStep6 = () => (
    <div className="space-y-4">
      <p className="text-blue-200/50 text-sm">
        Bloco 5 — Desafio final. O aluno fala livremente sobre um tema.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Prompt (EN)" value={block5.promptEn} onChange={(v) => setBlock5({ ...block5, promptEn: v })} textarea placeholder="Talk about yourself for 30 seconds" />
        <Field label="Prompt (PT)" value={block5.promptPt} onChange={(v) => setBlock5({ ...block5, promptPt: v })} textarea placeholder="Fale sobre você por 30 segundos" />
      </div>
      <Field
        label="Exemplo de resposta (PT)"
        value={block5.examplePt}
        onChange={(v) => setBlock5({ ...block5, examplePt: v })}
        textarea
        rows={4}
        placeholder="Olá! Meu nome é Oliver. Eu sou do Brasil..."
      />
      <StringListEditor
        label="Dicas de Tópicos"
        items={block5.topicHints}
        onChange={(v) => setBlock5({ ...block5, topicHints: v })}
        placeholder="Your name and where you're from"
      />
    </div>
  )

  const renderStep7 = () => {
    const summaryCard = (icon: string, title: string, items: string[]) => (
      <div className={cardCls}>
        <h4 className="text-sm font-bold text-white">
          {icon} {title}
        </h4>
        <ul className="space-y-1">
          {items.map((item, i) => (
            <li key={i} className="text-xs text-blue-200/50 flex gap-2">
              <span className="text-green-400">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    )

    return (
      <div className="space-y-4">
        <p className="text-blue-200/50 text-sm">
          Confira o resumo da jornada antes de publicar.
        </p>

        {summaryCard('🌊', `Jornada: ${phase.title}`, [
          `Descrição: ${phase.description ? phase.description.slice(0, 80) + '...' : '(vazia)'}`,
        ])}

        {summaryCard('🎯', 'Grupos de Missão', missionGroups.map((g) => `${g.icon} ${g.title} — ${g.xp} XP, ${g.coins} coins`))}

        {summaryCard('🎬', 'Bloco 1 — Vídeo', [
          `Vídeo: ${block1.videoTitle || block1.videoUrl || '(vazio)'}`,
          `Pergunta: ${block1.choiceQuestion || '(vazio)'}`,
          `${block1.choiceOptions.length} opções, ${block1.listenRepeatSentences.filter(Boolean).length} frases repeat`,
        ])}

        {summaryCard('💭', 'Bloco 2 — Reflexão', [
          `Quote: ${block2.quote ? block2.quote.slice(0, 50) + '...' : '(vazio)'}`,
          `${block2.choices.length} motivações, ${block2.firstBlanks.length} + ${block2.secondBlanks.length} blanks`,
        ])}

        {summaryCard('📚', 'Bloco 3 — Vocabulário', [
          `${block3.vocabulary.length} palavras`,
          `${block3.fillSentences.length} exercícios de completar`,
          `${block3.memorySentences.filter(Boolean).length} frases de memorização`,
        ])}

        {summaryCard('💬', 'Bloco 4 — Expressões', [
          `${block4.expressions.length} expressões`,
          `${Object.values(block4.completions).flat().length} variações total`,
        ])}

        {summaryCard('🏆', 'Bloco 5 — Desafio', [
          `Prompt: ${block5.promptEn || '(vazio)'}`,
          `${block5.topicHints.filter(Boolean).length} dicas de tópico`,
        ])}

        {/* Publish button */}
        <div className="pt-4 border-t border-white/10">
          <button
            onClick={handlePublish}
            disabled={saving}
            className="w-full py-4 rounded-xl font-black text-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? '⏳ Criando jornada...' : '🚀 Criar Jornada'}
          </button>
          {saveMsg && (
            <p className={`text-center text-sm mt-3 font-bold ${saveMsg.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>
              {saveMsg}
            </p>
          )}
        </div>
      </div>
    )
  }

  const stepRenderers = [renderStep0, renderStep1, renderStep2, renderStep3, renderStep4, renderStep5, renderStep6, renderStep7]

  /* ── Main render ─────────────────────────────────────────── */

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: '#050E1A' }}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">✨ Nova Jornada</h1>
            <p className="text-blue-200/60 text-sm">
              Passo {step + 1} de {STEPS.length} — {STEPS[step].icon} {STEPS[step].label}
            </p>
          </div>
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 rounded-lg text-sm text-white/60 border border-white/20 hover:bg-white/5 transition-all"
          >
            ← Voltar
          </button>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => (
            <button
              key={i}
              onClick={() => i <= step && setStep(i)}
              className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg transition-all ${
                i === step
                  ? 'bg-cyan-500/20 border border-cyan-400/40'
                  : i < step
                    ? 'bg-green-500/10 border border-green-400/20 cursor-pointer hover:bg-green-500/20'
                    : 'bg-white/[0.02] border border-white/5'
              }`}
            >
              <span className="text-base">{i < step ? '✅' : s.icon}</span>
              <span
                className={`text-[9px] font-bold tracking-wider ${
                  i === step ? 'text-cyan-300' : i < step ? 'text-green-300/70' : 'text-white/30'
                }`}
              >
                {s.label}
              </span>
            </button>
          ))}
        </div>

        {/* Step content */}
        <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
          <h2 className="text-lg font-black text-white mb-4">
            {STEPS[step].icon} {STEPS[step].label}
          </h2>
          {stepRenderers[step]()}
        </div>

        {/* Navigation */}
        {step < STEPS.length - 1 && (
          <div className="flex justify-between">
            <button
              onClick={prev}
              disabled={step === 0}
              className="px-6 py-2.5 rounded-xl font-bold text-sm text-white/60 border border-white/20 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              ← Anterior
            </button>
            <button
              onClick={next}
              disabled={!canNext()}
              className="px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Próximo →
            </button>
          </div>
        )}
        {step === STEPS.length - 1 && (
          <div className="flex justify-start">
            <button
              onClick={prev}
              className="px-6 py-2.5 rounded-xl font-bold text-sm text-white/60 border border-white/20 hover:bg-white/5 transition-all"
            >
              ← Anterior
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
