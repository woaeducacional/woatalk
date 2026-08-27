'use client'

import { useEffect, useState } from 'react'

interface Certificate {
  certificateCode: string
  verificationCode: string
  verificationUrl: string | null
  oceanName: string
  certificateType: string
  level: string | null
  programName: string
  certificateVersion: string
  totalStudyMinutes: number
  totalStudyHours: number
  totalActivities: number
  completedActivities: number
  completionPercentage: number
  totalXp: number
  totalWoaCoins: number
  contentSummary: string | null
  skills: string[]
  learningOutcomes: string[]
  activityTypes: string[]
  issuerName: string
  issuingOrganization: string
  issuedAt: string
  status: string
}

interface Props {
  params: Promise<{ verificationCode: string }>
}

export default function CertificateVerificationPage({ params }: Props) {
  const [certificate, setCertificate] = useState<Certificate | null>(null)
  const [valid, setValid] = useState<boolean | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const { verificationCode } = await params

        const response = await fetch(
          `/api/certificates/verify/${encodeURIComponent(verificationCode)}`,
        )

        const data = await response.json()

        setValid(data.valid === true)
        setCertificate(data.certificate ?? null)

        if (!response.ok) {
          setError(data.error ?? 'Certificado não encontrado.')
        }
      } catch {
        setValid(false)
        setError('Não foi possível validar o certificado.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [params])

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-white/20 border-t-cyan-400 rounded-full animate-spin mx-auto mb-5" />
          <p className="text-white/60">
            Validando certificado...
          </p>
        </div>
      </main>
    )
  }

  if (!valid || !certificate) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="w-full max-w-xl text-center rounded-3xl border border-red-400/20 bg-white/[0.04] p-10">
          <div className="text-6xl mb-6">⚠️</div>

          <h1 className="text-3xl font-black mb-3">
            Certificado não validado
          </h1>

          <p className="text-white/60 mb-8">
            {error || 'O certificado informado não foi encontrado ou não está válido.'}
          </p>

          <div className="text-xs text-white/30">
            WOA Educacional
          </div>
        </div>
      </main>
    )
  }

  const issuedDate = new Date(certificate.issuedAt).toLocaleDateString(
    'pt-BR',
    {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    },
  )

  return (
    <main className="min-h-screen bg-slate-950 text-white px-5 py-10 md:py-16">
      <div className="max-w-4xl mx-auto">

        {/* Cabeçalho */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 text-emerald-300 text-xs font-black tracking-widest uppercase mb-5">
            ✓ Certificado válido
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight">
            Certificação WOA Educacional
          </h1>

          <p className="text-white/50 mt-3">
            Documento oficial de conclusão de Jornada
          </p>
        </div>

        {/* Certificado */}
        <section className="rounded-[2rem] border border-cyan-400/20 bg-gradient-to-br from-cyan-400/[0.08] via-white/[0.03] to-purple-500/[0.08] p-7 md:p-12 shadow-2xl">

          <div className="text-center border-b border-white/10 pb-8">
            <p className="text-xs font-black tracking-[0.3em] uppercase text-cyan-300">
              WOA EDUCACIONAL
            </p>

            <h2 className="text-3xl md:text-4xl font-black mt-4">
              Certificado de Conclusão
            </h2>

            <p className="text-2xl font-bold text-cyan-300 mt-4">
              Oceano {certificate.oceanName}
            </p>

            {certificate.level && (
              <p className="text-white/60 mt-2">
                Nível {certificate.level}
              </p>
            )}
          </div>

          {/* Dados acadêmicos */}
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 py-8">
            <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-5 text-center">
              <p className="text-xs text-white/40 uppercase tracking-wider">
                Aproveitamento
              </p>
              <p className="text-2xl font-black text-emerald-300 mt-2">
                {certificate.completionPercentage}%
              </p>
            </div>

            <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-5 text-center">
              <p className="text-xs text-white/40 uppercase tracking-wider">
                Atividades
              </p>
              <p className="text-2xl font-black mt-2">
                {certificate.completedActivities}/{certificate.totalActivities}
              </p>
            </div>

            <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-5 text-center">
              <p className="text-xs text-white/40 uppercase tracking-wider">
                XP
              </p>
              <p className="text-2xl font-black text-cyan-300 mt-2">
                {certificate.totalXp}
              </p>
            </div>

            <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-5 text-center">
              <p className="text-xs text-white/40 uppercase tracking-wider">
                WOA Coins
              </p>
              <p className="text-2xl font-black text-yellow-300 mt-2">
                {certificate.totalWoaCoins}
              </p>
            </div>
          </div>

          {/* Carga horária */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 mb-6">
            <h3 className="font-black text-lg mb-2">
              Carga horária
            </h3>

            <p className="text-white/60">
              {certificate.totalStudyHours > 0
                ? `${certificate.totalStudyHours} horas de estudo`
                : 'Carga horária ainda não contabilizada pelo sistema.'}
            </p>
          </div>

          {/* Conteúdo */}
          {certificate.contentSummary && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 mb-6">
              <h3 className="font-black text-lg mb-3">
                Conteúdos estudados
              </h3>

              <p className="text-white/60 leading-relaxed">
                {certificate.contentSummary}
              </p>
            </div>
          )}

          {/* Identificação */}
          <div className="border-t border-white/10 pt-7 grid md:grid-cols-2 gap-5 text-sm">
            <div>
              <p className="text-white/40 mb-1">
                Certificado
              </p>
              <p className="font-mono text-cyan-300 break-all">
                {certificate.certificateCode}
              </p>
            </div>

            <div>
              <p className="text-white/40 mb-1">
                Código de verificação
              </p>
              <p className="font-mono text-cyan-300 break-all">
                {certificate.verificationCode}
              </p>
            </div>

            <div>
              <p className="text-white/40 mb-1">
                Data de emissão
              </p>
              <p>
                {issuedDate}
              </p>
            </div>

            <div>
              <p className="text-white/40 mb-1">
                Instituição emissora
              </p>
              <p>
                {certificate.issuingOrganization}
              </p>
            </div>
          </div>
        </section>

        {/* Rodapé */}
        <div className="text-center mt-8 text-xs text-white/30">
          <p>
            Este documento pode ser validado através do código de verificação
            apresentado acima.
          </p>

          <p className="mt-2">
            {certificate.programName} · Versão {certificate.certificateVersion}
          </p>
        </div>

      </div>
    </main>
  )
}
