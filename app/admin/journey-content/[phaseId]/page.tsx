'use client'

import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import type { JourneyContent, MissionGroupDef } from '@/lib/journeyContent'

/* ─── Shared styles ────────────────────────────────────────── */
const inputCls =
  'w-full p-2.5 rounded-lg bg-white/5 border border-white/20 text-white text-sm placeholder-white/30 focus:border-cyan-400 focus:outline-none transition-colors'
const labelCls = 'block text-[11px] font-bold text-blue-200/70 mb-1 uppercase tracking-wider'
const cardCls = 'p-4 rounded-xl border border-white/10 bg-white/[0.03] space-y-3'
const sectionCls = 'p-6 rounded-xl border border-white/10 bg-white/[0.02] space-y-4'
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

function SectionToggle({
  title,
  icon,
  subtitle,
  open,
  onToggle,
  children,
}: {
  title: string
  icon: string
  subtitle?: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className={sectionCls}>
      <button onClick={onToggle} className="w-full flex items-center justify-between text-left">
        <div>
          <h3 className="text-lg font-black text-white">
            {icon} {title}
          </h3>
          {subtitle && <p className="text-[11px] text-blue-200/40 mt-0.5">{subtitle}</p>}
        </div>
        <span className="text-xl text-white/50">{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="space-y-4 pt-2 border-t border-white/5">{children}</div>}
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

/* ─── Main Page ────────────────────────────────────────────── */

export default function AdminJourneyContentEditor() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const phaseId = parseInt(params.phaseId as string)

  const [content, setContent] = useState<JourneyContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ meta: true })

  useEffect(() => {
    fetch(`/api/journey-content/${phaseId}`)
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then((data: JourneyContent) => {
        setContent(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [phaseId])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050E1A' }}>
        <div className="w-10 h-10 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) {
    router.push('/auth/signin')
    return null
  }

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050E1A' }}>
        <p className="text-red-300">Jornada não encontrada (phase_id={phaseId})</p>
      </div>
    )
  }

  const toggle = (key: string) => setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))

  /* ── State helpers ───────────────────────────────────────── */

  const updateField = <K extends keyof JourneyContent>(key: K, value: JourneyContent[K]) => {
    setContent((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const updateBlock = <K extends keyof JourneyContent>(blockKey: K, field: string, value: unknown) => {
    setContent((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        [blockKey]: { ...(prev[blockKey] as unknown as Record<string, unknown>), [field]: value },
      }
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveMsg('')
    try {
      const res = await fetch(`/api/journey-content/${phaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error ?? 'Erro ao salvar')
      }
      setSaveMsg('✅ Salvo com sucesso!')
    } catch (e: unknown) {
      setSaveMsg(`❌ ${e instanceof Error ? e.message : 'Erro desconhecido'}`)
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMsg(''), 4000)
    }
  }

  const { block1: b1, block2: b2, block3: b3, block4: b4, block5: b5 } = content

  /* ── Section-specific helpers ────────────────────────────── */

  const updateMissionGroup = (idx: number, field: keyof MissionGroupDef, val: string | number) => {
    const groups = [...content.mission_groups]
    groups[idx] = { ...groups[idx], [field]: val }
    updateField('mission_groups', groups)
  }

  const updateChoiceOption = (idx: number, field: string, val: string | boolean) => {
    const opts = [...b1.choiceOptions]
    opts[idx] = { ...opts[idx], [field]: val }
    updateBlock('block1', 'choiceOptions', opts)
  }

  const updateB2Choice = (idx: number, field: string, val: string) => {
    const choices = [...b2.choices]
    choices[idx] = { ...choices[idx], [field]: val }
    updateBlock('block2', 'choices', choices)
  }

  const updateBlankPair = (
    listKey: 'firstBlanks' | 'secondBlanks',
    idx: number,
    lang: 'en' | 'pt',
    val: string,
  ) => {
    const list = [
      ...(content.block2 as unknown as Record<string, { en: string; pt: string }[]>)[listKey],
    ]
    list[idx] = { ...list[idx], [lang]: val }
    updateBlock('block2', listKey, list)
  }

  const updateVocab = (idx: number, field: string, val: string) => {
    const list = [...b3.vocabulary]
    list[idx] = { ...list[idx], [field]: val }
    updateBlock('block3', 'vocabulary', list)
  }

  const updateFill = (idx: number, field: string, val: string | string[]) => {
    const list = [...b3.fillSentences]
    list[idx] = { ...list[idx], [field]: val }
    updateBlock('block3', 'fillSentences', list)
  }

  const updateExpression = (idx: number, field: string, val: string | number) => {
    const list = [...b4.expressions]
    list[idx] = { ...list[idx], [field]: val }
    updateBlock('block4', 'expressions', list)
  }

  const updateCompletion = (expId: number, compIdx: number, field: 'label' | 'full', val: string) => {
    const comps = { ...b4.completions }
    const list = [...(comps[expId] ?? [])]
    list[compIdx] = { ...list[compIdx], [field]: val }
    comps[expId] = list
    updateBlock('block4', 'completions', comps)
  }

  /* ── Render ──────────────────────────────────────────────── */

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: '#050E1A' }}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">✏️ Editar Jornada</h1>
            <p className="text-blue-200/60 text-sm">
              Fase {phaseId} — {content.title}
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 rounded-lg text-sm text-white/60 border border-white/20 hover:bg-white/5"
          >
            ← Voltar
          </button>
        </div>

        {/* Sticky save bar */}
        <div
          className="sticky top-0 z-40 flex items-center justify-between p-4 rounded-xl border border-cyan-400/20 backdrop-blur-md"
          style={{ background: 'rgba(5,14,26,0.95)' }}
        >
          <p className="text-sm text-white/60">{saveMsg || 'Edite os campos e clique em Salvar'}</p>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 rounded-lg font-bold text-white text-sm transition-all hover:scale-105 disabled:opacity-50"
            style={{
              background: saving ? '#555' : 'linear-gradient(135deg, #003AB0, #0066FF)',
            }}
          >
            {saving ? 'Salvando...' : '💾 Salvar'}
          </button>
        </div>

        {/* ═══ Informações Gerais ═══ */}
        <SectionToggle
          title="Informações Gerais"
          icon="📋"
          subtitle="Nome da jornada e blocos de missão"
          open={!!openSections.meta}
          onToggle={() => toggle('meta')}
        >
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Título da Jornada"
              value={content.title}
              onChange={(v) => updateField('title', v)}
              placeholder="Ex: Pacific Ocean"
            />
            <Field
              label="Descrição"
              value={content.description}
              onChange={(v) => updateField('description', v)}
              placeholder="Ex: Self Introduction in English"
            />
          </div>

          <p className="text-xs font-bold text-white/50 mt-4 mb-2">
            Blocos de Missão (cards que o aluno vê)
          </p>
          {content.mission_groups.map((g, i) => (
            <div key={i} className={cardCls}>
              <div className="flex items-center gap-3 mb-1">
                <input
                  className={inputCls + ' !w-16 text-center text-lg'}
                  value={g.icon}
                  onChange={(e) => updateMissionGroup(i, 'icon', e.target.value)}
                />
                <input
                  className={inputCls + ' flex-1'}
                  value={g.title}
                  onChange={(e) => updateMissionGroup(i, 'title', e.target.value)}
                  placeholder="Título do bloco"
                />
                <input
                  className={inputCls + ' !w-20 text-center'}
                  value={g.color}
                  onChange={(e) => updateMissionGroup(i, 'color', e.target.value)}
                  placeholder="#cor"
                />
              </div>
              <input
                className={inputCls}
                value={g.description}
                onChange={(e) => updateMissionGroup(i, 'description', e.target.value)}
                placeholder="Descrição curta"
              />
              <div className="flex gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] text-blue-200/50">XP</label>
                  <input
                    type="number"
                    className={inputCls + ' !w-20 text-center'}
                    value={g.xp}
                    onChange={(e) => updateMissionGroup(i, 'xp', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] text-blue-200/50">Moedas</label>
                  <input
                    type="number"
                    className={inputCls + ' !w-20 text-center'}
                    value={g.coins}
                    onChange={(e) => updateMissionGroup(i, 'coins', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <label className="text-[10px] text-blue-200/40">Prévia:</label>
                  <span
                    className="px-2 py-1 rounded text-xs font-bold"
                    style={{
                      color: g.color,
                      background: g.color + '20',
                      border: `1px solid ${g.color}`,
                    }}
                  >
                    {g.icon} {g.title}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </SectionToggle>

        {/* ═══ Bloco 1 — Video Insight ═══ */}
        <SectionToggle
          title="Bloco 1 — Video Insight"
          icon="🎬"
          subtitle="Vídeo do YouTube + perguntas de compreensão"
          open={!!openSections.b1}
          onToggle={() => toggle('b1')}
        >
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="ID do Vídeo (YouTube)"
              value={b1.videoUrl}
              onChange={(v) => updateBlock('block1', 'videoUrl', v)}
              placeholder="Ex: YGTEXtptvGM"
            />
            <Field
              label="Título do Vídeo"
              value={b1.videoTitle}
              onChange={(v) => updateBlock('block1', 'videoTitle', v)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Pergunta (Inglês)"
              value={b1.choiceQuestion}
              onChange={(v) => updateBlock('block1', 'choiceQuestion', v)}
            />
            <Field
              label="Pergunta (Português)"
              value={b1.choiceQuestionPt}
              onChange={(v) => updateBlock('block1', 'choiceQuestionPt', v)}
            />
          </div>

          <p className="text-xs font-bold text-white/50 mt-2">Opções de resposta</p>
          <p className="text-[10px] text-blue-200/30 -mt-2">
            Ative o toggle nas opções que são respostas corretas
          </p>
          {b1.choiceOptions.map((opt, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-white/30 w-5 text-right shrink-0">{i + 1}.</span>
              <input
                className={inputCls + ' flex-1'}
                value={opt.text}
                onChange={(e) => updateChoiceOption(i, 'text', e.target.value)}
                placeholder="Texto da opção"
              />
              <Toggle
                label="Correta"
                checked={opt.isCorrect}
                onChange={(v) => updateChoiceOption(i, 'isCorrect', v)}
              />
              <button
                onClick={() =>
                  updateBlock(
                    'block1',
                    'choiceOptions',
                    b1.choiceOptions.filter((_, j) => j !== i),
                  )
                }
                className={removeBtnCls}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            onClick={() =>
              updateBlock('block1', 'choiceOptions', [
                ...b1.choiceOptions,
                { id: b1.choiceOptions.length + 1, text: '', isCorrect: false },
              ])
            }
            className={addBtnCls}
          >
            + Adicionar opção
          </button>

          <StringListEditor
            label="Frases para Ouvir e Repetir"
            items={b1.listenRepeatSentences}
            onChange={(v) => updateBlock('block1', 'listenRepeatSentences', v)}
            placeholder="Ex: My name is Lucas."
          />
        </SectionToggle>

        {/* ═══ Bloco 2 — Let's Reflect ═══ */}
        <SectionToggle
          title="Bloco 2 — Let's Reflect"
          icon="✍️"
          subtitle="Citação, escolha de motivação e construção de frase"
          open={!!openSections.b2}
          onToggle={() => toggle('b2')}
        >
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Citação (Inglês)"
              value={b2.quote}
              onChange={(v) => updateBlock('block2', 'quote', v)}
            />
            <Field
              label="Citação (Português)"
              value={b2.quotePt}
              onChange={(v) => updateBlock('block2', 'quotePt', v)}
            />
          </div>
          <Field
            label="Texto da pergunta"
            value={b2.choicePrompt}
            onChange={(v) => updateBlock('block2', 'choicePrompt', v)}
            placeholder="Ex: Por que você quer aprender inglês?"
          />

          <p className="text-xs font-bold text-white/50 mt-2">Opções de motivação</p>
          {b2.choices.map((c, i) => (
            <div key={i} className={cardCls}>
              <ItemHeader
                index={i}
                label={`Opção ${c.id}`}
                onRemove={() =>
                  updateBlock(
                    'block2',
                    'choices',
                    b2.choices.filter((_, j) => j !== i),
                  )
                }
              />
              <div className="flex gap-2 items-center">
                <label className="text-[10px] text-blue-200/50 w-8 shrink-0">Letra</label>
                <input
                  className={inputCls + ' !w-16 text-center'}
                  value={c.id}
                  onChange={(e) => updateB2Choice(i, 'id', e.target.value)}
                />
              </div>
              <Field
                label="Texto (Inglês)"
                value={c.text}
                onChange={(v) => updateB2Choice(i, 'text', v)}
              />
              <Field
                label="Texto (Português)"
                value={c.pt}
                onChange={(v) => updateB2Choice(i, 'pt', v)}
              />
            </div>
          ))}
          <button
            onClick={() =>
              updateBlock('block2', 'choices', [
                ...b2.choices,
                { id: String.fromCharCode(65 + b2.choices.length), text: '', pt: '' },
              ])
            }
            className={addBtnCls}
          >
            + Adicionar opção
          </button>

          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Frase modelo (Inglês)"
              value={b2.modelSentence}
              onChange={(v) => updateBlock('block2', 'modelSentence', v)}
            />
            <Field
              label="Frase modelo (Português)"
              value={b2.modelSentencePt}
              onChange={(v) => updateBlock('block2', 'modelSentencePt', v)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Template da frase (EN)"
              value={b2.sentenceTemplate}
              onChange={(v) => updateBlock('block2', 'sentenceTemplate', v)}
              placeholder="Use {first} e {second} para os espaços"
            />
            <Field
              label="Template da frase (PT)"
              value={b2.sentenceTemplatePt}
              onChange={(v) => updateBlock('block2', 'sentenceTemplatePt', v)}
            />
          </div>

          {/* First blanks */}
          <div>
            <Field
              label="Rótulo do 1º espaço"
              value={b2.firstBlanksLabel}
              onChange={(v) => updateBlock('block2', 'firstBlanksLabel', v)}
            />
            <p className="text-xs font-bold text-white/50 mt-3 mb-2">Opções para o 1º espaço</p>
            {b2.firstBlanks.map((blank, i) => (
              <div key={i} className="flex gap-2 mb-2 items-center">
                <span className="text-xs text-white/30 w-5 text-right shrink-0">{i + 1}.</span>
                <input
                  className={inputCls}
                  value={blank.en}
                  onChange={(e) => updateBlankPair('firstBlanks', i, 'en', e.target.value)}
                  placeholder="Inglês"
                />
                <input
                  className={inputCls}
                  value={blank.pt}
                  onChange={(e) => updateBlankPair('firstBlanks', i, 'pt', e.target.value)}
                  placeholder="Português"
                />
                <button
                  onClick={() =>
                    updateBlock(
                      'block2',
                      'firstBlanks',
                      b2.firstBlanks.filter((_, j) => j !== i),
                    )
                  }
                  className={removeBtnCls}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              onClick={() =>
                updateBlock('block2', 'firstBlanks', [...b2.firstBlanks, { en: '', pt: '' }])
              }
              className={addBtnCls}
            >
              + Adicionar opção
            </button>
          </div>

          {/* Second blanks */}
          <div>
            <Field
              label="Rótulo do 2º espaço"
              value={b2.secondBlanksLabel}
              onChange={(v) => updateBlock('block2', 'secondBlanksLabel', v)}
            />
            <p className="text-xs font-bold text-white/50 mt-3 mb-2">Opções para o 2º espaço</p>
            {b2.secondBlanks.map((blank, i) => (
              <div key={i} className="flex gap-2 mb-2 items-center">
                <span className="text-xs text-white/30 w-5 text-right shrink-0">{i + 1}.</span>
                <input
                  className={inputCls}
                  value={blank.en}
                  onChange={(e) => updateBlankPair('secondBlanks', i, 'en', e.target.value)}
                  placeholder="Inglês"
                />
                <input
                  className={inputCls}
                  value={blank.pt}
                  onChange={(e) => updateBlankPair('secondBlanks', i, 'pt', e.target.value)}
                  placeholder="Português"
                />
                <button
                  onClick={() =>
                    updateBlock(
                      'block2',
                      'secondBlanks',
                      b2.secondBlanks.filter((_, j) => j !== i),
                    )
                  }
                  className={removeBtnCls}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              onClick={() =>
                updateBlock('block2', 'secondBlanks', [...b2.secondBlanks, { en: '', pt: '' }])
              }
              className={addBtnCls}
            >
              + Adicionar opção
            </button>
          </div>

          <Field
            label="Texto de ajuda"
            value={b2.helpText}
            onChange={(v) => updateBlock('block2', 'helpText', v)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Frase boost (Inglês)"
              value={b2.boostSentence}
              onChange={(v) => updateBlock('block2', 'boostSentence', v)}
            />
            <Field
              label="Frase boost (Português)"
              value={b2.boostSentencePt}
              onChange={(v) => updateBlock('block2', 'boostSentencePt', v)}
            />
          </div>
        </SectionToggle>

        {/* ═══ Bloco 3 — Vocabulary ═══ */}
        <SectionToggle
          title="Bloco 3 — Vocabulary"
          icon="📖"
          subtitle="Palavras, exercícios de preencher e frases de memória"
          open={!!openSections.b3}
          onToggle={() => toggle('b3')}
        >
          <p className="text-xs font-bold text-white/50">Vocabulário</p>
          {b3.vocabulary.map((v, i) => (
            <div key={i} className={cardCls}>
              <ItemHeader
                index={i}
                label={v.word || 'Nova palavra'}
                onRemove={() =>
                  updateBlock(
                    'block3',
                    'vocabulary',
                    b3.vocabulary.filter((_, j) => j !== i),
                  )
                }
              />
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Palavra (EN)"
                  value={v.word}
                  onChange={(val) => updateVocab(i, 'word', val)}
                  placeholder="Ex: Introduce"
                />
                <Field
                  label="Tradução (PT)"
                  value={v.translationPt}
                  onChange={(val) => updateVocab(i, 'translationPt', val)}
                  placeholder="Ex: Apresentar"
                />
              </div>
              <Field
                label="Definição (EN)"
                value={v.definition}
                onChange={(val) => updateVocab(i, 'definition', val)}
                placeholder="Ex: To present yourself..."
              />
              <Field
                label="Exemplo de uso"
                value={v.example}
                onChange={(val) => updateVocab(i, 'example', val)}
                placeholder="Ex: Let me introduce myself."
              />
            </div>
          ))}
          <button
            onClick={() =>
              updateBlock('block3', 'vocabulary', [
                ...b3.vocabulary,
                { word: '', definition: '', translationPt: '', example: '' },
              ])
            }
            className={addBtnCls}
          >
            + Adicionar palavra
          </button>

          <p className="text-xs font-bold text-white/50 mt-4">Exercícios de Preencher</p>
          <p className="text-[10px] text-blue-200/30 -mt-2">
            Use ___ no lugar da palavra que o aluno deve completar
          </p>
          {b3.fillSentences.map((f, i) => (
            <div key={i} className={cardCls}>
              <ItemHeader
                index={i}
                label={f.answer || 'Novo exercício'}
                onRemove={() =>
                  updateBlock(
                    'block3',
                    'fillSentences',
                    b3.fillSentences.filter((_, j) => j !== i),
                  )
                }
              />
              <Field
                label="Frase com espaço (___)"
                value={f.sentence}
                onChange={(val) => updateFill(i, 'sentence', val)}
                placeholder="Ex: Let me ___ myself."
              />
              <Field
                label="Resposta correta"
                value={f.answer}
                onChange={(val) => updateFill(i, 'answer', val)}
                placeholder="Ex: introduce"
              />
              <Field
                label="Frase completa"
                value={f.full}
                onChange={(val) => updateFill(i, 'full', val)}
                placeholder="Ex: Let me introduce myself."
              />
              <div>
                <label className={labelCls}>Opções de resposta (3 alternativas)</label>
                <div className="flex gap-2">
                  {(f.options ?? ['', '', '']).map((opt, j) => (
                    <input
                      key={j}
                      className={inputCls}
                      value={opt}
                      placeholder={`Opção ${j + 1}`}
                      onChange={(e) => {
                        const opts = [...(f.options ?? ['', '', ''])]
                        opts[j] = e.target.value
                        updateFill(i, 'options', opts)
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={() =>
              updateBlock('block3', 'fillSentences', [
                ...b3.fillSentences,
                { sentence: '', answer: '', options: ['', '', ''], full: '' },
              ])
            }
            className={addBtnCls}
          >
            + Adicionar exercício
          </button>

          <StringListEditor
            label="Frases para Memorizar (falar de memória)"
            items={b3.memorySentences}
            onChange={(v) => updateBlock('block3', 'memorySentences', v)}
            placeholder="Ex: Let me introduce myself."
          />
        </SectionToggle>

        {/* ═══ Bloco 4 — Practice & Speak ═══ */}
        <SectionToggle
          title="Bloco 4 — Practice & Speak"
          icon="🎤"
          subtitle="Expressões com variações para completar"
          open={!!openSections.b4}
          onToggle={() => toggle('b4')}
        >
          {b4.expressions.map((exp, i) => (
            <div key={i} className={cardCls}>
              <ItemHeader
                index={i}
                label={exp.text || 'Nova expressão'}
                onRemove={() => {
                  const newExps = b4.expressions.filter((_, j) => j !== i)
                  const newComps = { ...b4.completions }
                  delete newComps[exp.id]
                  updateBlock('block4', 'expressions', newExps)
                  updateBlock('block4', 'completions', newComps)
                }}
              />
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Expressão"
                  value={exp.text}
                  onChange={(v) => updateExpression(i, 'text', v)}
                  placeholder="Ex: My name is…"
                />
                <Field
                  label="Exemplo completo"
                  value={exp.example}
                  onChange={(v) => updateExpression(i, 'example', v)}
                  placeholder="Ex: My name is Lucas, and I..."
                />
              </div>

              <p className="text-[10px] font-bold text-blue-200/50 mt-2">
                Variações para completar:
              </p>
              {(b4.completions[exp.id] ?? []).map((comp, ci) => (
                <div key={ci} className="flex gap-2 items-center">
                  <span className="text-[10px] text-white/20 w-4 text-right shrink-0">
                    {ci + 1}.
                  </span>
                  <input
                    className={inputCls + ' flex-1'}
                    value={comp.label}
                    placeholder="Completar com..."
                    onChange={(e) => updateCompletion(exp.id, ci, 'label', e.target.value)}
                  />
                  <input
                    className={inputCls + ' flex-1'}
                    value={comp.full}
                    placeholder="Frase completa"
                    onChange={(e) => updateCompletion(exp.id, ci, 'full', e.target.value)}
                  />
                  <button
                    onClick={() => {
                      const comps = { ...b4.completions }
                      comps[exp.id] = comps[exp.id].filter((_, j) => j !== ci)
                      updateBlock('block4', 'completions', comps)
                    }}
                    className={removeBtnCls}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const comps = { ...b4.completions }
                  comps[exp.id] = [...(comps[exp.id] ?? []), { label: '', full: '' }]
                  updateBlock('block4', 'completions', comps)
                }}
                className={addBtnCls + ' !py-1.5 !text-xs'}
              >
                + Adicionar variação
              </button>
            </div>
          ))}
          <button
            onClick={() => {
              const newId =
                b4.expressions.length > 0
                  ? Math.max(...b4.expressions.map((e) => e.id)) + 1
                  : 0
              updateBlock('block4', 'expressions', [
                ...b4.expressions,
                { id: newId, text: '', example: '' },
              ])
              const comps = { ...b4.completions }
              comps[newId] = []
              updateBlock('block4', 'completions', comps)
            }}
            className={addBtnCls}
          >
            + Adicionar expressão
          </button>
        </SectionToggle>

        {/* ═══ Bloco 5 — WOA Challenge ═══ */}
        <SectionToggle
          title="Bloco 5 — WOA Challenge"
          icon="🦅"
          subtitle="Desafio final de apresentação"
          open={!!openSections.b5}
          onToggle={() => toggle('b5')}
        >
          <Field
            label="Pergunta do desafio (Inglês)"
            value={b5.promptEn}
            onChange={(v) => updateBlock('block5', 'promptEn', v)}
            textarea
            rows={2}
          />
          <Field
            label="Pergunta do desafio (Português)"
            value={b5.promptPt}
            onChange={(v) => updateBlock('block5', 'promptPt', v)}
            textarea
            rows={2}
          />
          <Field
            label="Exemplo de resposta (Português)"
            value={b5.examplePt}
            onChange={(v) => updateBlock('block5', 'examplePt', v)}
            textarea
            rows={4}
            placeholder="Um exemplo de apresentação em português para guiar o aluno"
          />
          <StringListEditor
            label="Tópicos sugeridos"
            items={b5.topicHints}
            onChange={(v) => updateBlock('block5', 'topicHints', v)}
            placeholder="Ex: Seu nome e de onde você é"
          />
        </SectionToggle>

        {/* Bottom save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 rounded-xl font-bold text-white text-lg transition-all hover:scale-[1.02] disabled:opacity-50"
          style={{
            background: saving ? '#555' : 'linear-gradient(135deg, #003AB0, #0066FF)',
            border: '2px solid #00D4FF',
          }}
        >
          {saving ? 'Salvando...' : '💾 Salvar Alterações'}
        </button>
      </div>
    </div>
  )
}
