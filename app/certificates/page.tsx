'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Certificate {
  id: string
  certificate_code: string
  verification_code: string
  ocean_name: string
  level: string | null
  total_study_hours: number
  total_activities: number
  completed_activities: number
  completion_percentage: number
  total_xp: number
  total_woa_coins: number
  issued_at: string
  next_eligible_issuance_at: string | null
  status: string
}

const OCEANS = [
  { id: 1, name: 'Pacífico', icon: '🌊' },
  { id: 2, name: 'Atlântico', icon: '🌎' },
  { id: 3, name: 'Índico', icon: '🌅' },
  { id: 4, name: 'Ártico', icon: '❄️' },
]

export default function CertificatesPage() {
  const router = useRouter()

  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [issuing, setIssuing] = useState<number | null>(null)
  const [message, setMessage] = useState('')

  async function loadCertificates() {
    try {
      const res = await fetch('/api/certificates')
      if (!res.ok) throw new Error()

      const data = await res.json()
      setCertificates(data.certificates ?? [])
    } catch {
      setCertificates([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCertificates()
  }, [])

  async function issueCertificate(phaseId: number) {
    setIssuing(phaseId)
    setMessage('')

    try {
      const res = await fetch('/api/certificates/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phaseId }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error ?? 'Não foi possível emitir o certificado.')
        return
      }

      await loadCertificates()

      if (data.certificate?.verificationCode) {
        router.push(
          `/certificates/verify/${encodeURIComponent(
            data.certificate.verificationCode,
          )}`,
        )
      }
    } catch {
      setMessage('Erro ao solicitar o certificado.')
    } finally {
      setIssuing(null)
    }
  }

  function latestCertificate(phaseId: number) {
    const ocean = OCEANS.find(o => o.id === phaseId)

    return certificates.find(
      c => c.ocean_name === ocean?.name,
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white px-5 py-10">
      <div className="max-w-5xl mx-auto">

        <button
          onClick={() => router.push('/dashboard')}
          className="mb-8 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.04] text-white/60 text-sm"
        >
          ← Voltar
        </button>

        <header className="mb-10">
          <p className="text-cyan-400 text-xs font-black tracking-[0.3em] uppercase">
            WOA Educacional
          </p>

          <h1 className="text-4xl md:text-5xl font-black mt-2">
            Meus Certificados
          </h1>

          <p className="text-white/50 mt-3 max-w-2xl">
            Acompanhe suas certificações por Oceano e emita seus certificados
            quando cumprir todos os requisitos da Jornada.
          </p>
        </header>

        {message && (
          <div className="mb-6 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-yellow-200 text-sm">
            {message}
          </div>
        )}

        {loading ? (
          <div className="text-white/50">
            Carregando certificados...
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {OCEANS.map(ocean => {
              const certificate = latestCertificate(ocean.id)

              return (
                <section
                  key={ocean.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-3xl mb-3">
                        {ocean.icon}
                      </div>

                      <h2 className="text-2xl font-black">
                        Oceano {ocean.name}
                      </h2>

                      <p className="text-white/40 text-sm mt-1">
                        Certificação de Jornada
                      </p>
                    </div>

                    {certificate?.status === 'issued' && (
                      <span className="text-xs font-black text-emerald-300 bg-emerald-400/10 border border-emerald-400/20 px-3 py-2 rounded-full">
                        CERTIFICADO
                      </span>
                    )}
                  </div>

                  {certificate ? (
                    <div className="mt-7 space-y-4">

                      <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-xl bg-white/[0.04] p-3">
                          <p className="text-[10px] text-white/40">
                            APROVEITAMENTO
                          </p>
                          <p className="font-black text-emerald-300 mt-1">
                            {certificate.completion_percentage}%
                          </p>
                        </div>

                        <div className="rounded-xl bg-white/[0.04] p-3">
                          <p className="text-[10px] text-white/40">
                            XP
                          </p>
                          <p className="font-black text-cyan-300 mt-1">
                            {certificate.total_xp}
                          </p>
                        </div>

                        <div className="rounded-xl bg-white/[0.04] p-3">
                          <p className="text-[10px] text-white/40">
                            COINS
                          </p>
                          <p className="font-black text-yellow-300 mt-1">
                            {certificate.total_woa_coins}
                          </p>
                        </div>
                      </div>

                      <p className="text-xs text-white/40">
                        Emitido em{' '}
                        {new Date(certificate.issued_at).toLocaleDateString(
                          'pt-BR',
                        )}
                      </p>

                      <div className="grid sm:grid-cols-2 gap-3">
                        <button
                          onClick={() =>
                            router.push(
                              `/certificates/verify/${encodeURIComponent(
                                certificate.verification_code,
                              )}`,
                            )
                          }
                          className="w-full rounded-xl py-3 bg-cyan-400 text-slate-950 font-black text-sm hover:bg-cyan-300"
                        >
                          VER CERTIFICADO
                        </button>

                        <a
                          href={`/api/certificates/${encodeURIComponent(
                            certificate.id,
                          )}/pdf`}
                          className="w-full rounded-xl py-3 border border-yellow-400/30 bg-yellow-400/10 text-yellow-300 font-black text-sm text-center hover:bg-yellow-400/20"
                        >
                          BAIXAR PDF
                        </a>
                      </div>

                    </div>
                  ) : (
                    <div className="mt-7">
                      <p className="text-sm text-white/40 mb-5">
                        Certificado ainda não emitido.
                      </p>

                      <button
                        onClick={() => issueCertificate(ocean.id)}
                        disabled={issuing === ocean.id}
                        className="w-full rounded-xl py-3 border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 font-black text-sm disabled:opacity-50"
                      >
                        {issuing === ocean.id
                          ? 'VERIFICANDO...'
                          : 'SOLICITAR CERTIFICADO'}
                      </button>
                    </div>
                  )}
                </section>
              )
            })}
          </div>
        )}

        <footer className="mt-10 text-center text-xs text-white/30">
          WOA Educacional · Sistema Oficial de Certificações
        </footer>

      </div>
    </main>
  )
}
