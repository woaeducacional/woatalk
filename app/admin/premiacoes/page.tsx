'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface ChallengeConfig {
  id?: string
  daily_reward: string
  weekly_reward: string
  monthly_reward: string
  monthly_winner_name: string
  monthly_winner_badge: string
  monthly_winner_note: string
  winner_confirmed: boolean
  first_place_prize: string
  second_place_prize: string
  third_place_prize: string
  campaign_start_date: string
  campaign_end_date: string
}

export default function AdminPremiacoes() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [config, setConfig] = useState<ChallengeConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  // Form state
  const [firstPrize, setFirstPrize] = useState('')
  const [secondPrize, setSecondPrize] = useState('')
  const [thirdPrize, setThirdPrize] = useState('')
  const [campaignStart, setCampaignStart] = useState('')
  const [campaignEnd, setCampaignEnd] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchConfig()
    }
  }, [status])

  async function fetchConfig() {
    try {
      const res = await fetch('/api/admin/challenge-config')
      if (res.ok) {
        const data = await res.json()
        setConfig(data)
        setFirstPrize(data.first_place_prize || '')
        setSecondPrize(data.second_place_prize || '')
        setThirdPrize(data.third_place_prize || '')
        
        // Format dates for input fields
        const startDate = new Date(data.campaign_start_date)
        const endDate = new Date(data.campaign_end_date)
        
        setCampaignStart(startDate.toISOString().split('T')[0])
        setCampaignEnd(endDate.toISOString().split('T')[0])
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error)
      setMessageType('error')
      setMessage('Erro ao carregar configuração')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setMessage('')

    try {
      const startDateTime = new Date(campaignStart)
      const endDateTime = new Date(campaignEnd)

      const res = await fetch('/api/admin/challenge-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...config,
          first_place_prize: firstPrize,
          second_place_prize: secondPrize,
          third_place_prize: thirdPrize,
          campaign_start_date: startDateTime.toISOString(),
          campaign_end_date: endDateTime.toISOString(),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setConfig(data.config)
        setFirstPrize(data.config.first_place_prize || '')
        setSecondPrize(data.config.second_place_prize || '')
        setThirdPrize(data.config.third_place_prize || '')
        
        // Update dates in preview
        const startDate = new Date(data.config.campaign_start_date)
        const endDate = new Date(data.config.campaign_end_date)
        setCampaignStart(startDate.toISOString().split('T')[0])
        setCampaignEnd(endDate.toISOString().split('T')[0])
        
        setMessageType('success')
        setMessage('✅ Premiações atualizadas com sucesso!')
      } else {
        const error = await res.json()
        setMessageType('error')
        setMessage(error.error || 'Erro ao salvar')
      }
    } catch (error) {
      console.error('Erro:', error)
      setMessageType('error')
      setMessage('Erro ao salvar configuração')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050E1A' }}>
        <div className="w-10 h-10 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    )
  }

  if (session?.user?.role !== 'admin') {
    router.push('/dashboard')
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050E1A' }}>
        <div className="w-10 h-10 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div style={{ background: '#050E1A', minHeight: '100vh', paddingTop: '20px', paddingBottom: '40px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <Link href="/admin/bonificacao" style={{ color: '#00D4FF', textDecoration: 'none', fontSize: '14px' }}>
            ← Voltar
          </Link>
          <h1 style={{ color: '#FFFFFF', fontSize: '32px', fontWeight: 'bold', marginTop: '12px' }}>
            🏆 Gerenciar Premiações
          </h1>
          <p style={{ color: '#A0AEC0', marginTop: '8px' }}>
            Configure as premiações para 1º, 2º e 3º lugar e o período da campanha
          </p>
        </div>

        {/* Message */}
        {message && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '24px',
              backgroundColor: messageType === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
              color: messageType === 'success' ? '#22c55e' : '#ef4444',
              border: `1px solid ${messageType === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            }}
          >
            {message}
          </div>
        )}

        {/* Main Content - Two Columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Left Column - Form */}
          <div
            style={{
              backgroundColor: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(0, 212, 255, 0.2)',
              borderRadius: '12px',
              padding: '24px',
            }}
          >
            <h2 style={{ color: '#FFFFFF', fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>
              📝 Informações da Campanha
            </h2>

            {/* Campaign Period */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ color: '#CBD5E1', fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                📅 Data de Início
              </label>
              <input
                type="date"
                value={campaignStart}
                onChange={(e) => setCampaignStart(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#1E293B',
                  border: '1px solid rgba(0, 212, 255, 0.3)',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ color: '#CBD5E1', fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                📅 Data de Término
              </label>
              <input
                type="date"
                value={campaignEnd}
                onChange={(e) => setCampaignEnd(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#1E293B',
                  border: '1px solid rgba(0, 212, 255, 0.3)',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <hr style={{ borderColor: 'rgba(0, 212, 255, 0.15)', margin: '24px 0' }} />

            <h3 style={{ color: '#FFFFFF', fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
              🥇 Premiações
            </h3>

            {/* First Place */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: '#FFD700', fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                🥇 1º Lugar
              </label>
              <textarea
                value={firstPrize}
                onChange={(e) => setFirstPrize(e.target.value)}
                placeholder="Ex: Notebook Dell Inspiron 15"
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '10px 12px',
                  backgroundColor: '#1E293B',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Second Place */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: '#C0C0C0', fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                🥈 2º Lugar
              </label>
              <textarea
                value={secondPrize}
                onChange={(e) => setSecondPrize(e.target.value)}
                placeholder="Ex: Mouse Logitech MX Master"
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '10px 12px',
                  backgroundColor: '#1E293B',
                  border: '1px solid rgba(192, 192, 192, 0.3)',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Third Place */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ color: '#CD7F32', fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                🥉 3º Lugar
              </label>
              <textarea
                value={thirdPrize}
                onChange={(e) => setThirdPrize(e.target.value)}
                placeholder="Ex: Teclado Mecânico Corsair"
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '10px 12px',
                  backgroundColor: '#1E293B',
                  border: '1px solid rgba(205, 127, 50, 0.3)',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: saving ? 'rgba(100, 116, 139, 0.5)' : 'rgba(0, 212, 255, 0.2)',
                border: `2px solid ${saving ? 'rgba(100, 116, 139, 0.3)' : '#00D4FF'}`,
                borderRadius: '8px',
                color: '#00D4FF',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1,
                transition: 'all 0.3s ease',
              }}
              onMouseOver={(e) => {
                if (!saving) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(0, 212, 255, 0.3)'
                }
              }}
              onMouseOut={(e) => {
                if (!saving) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(0, 212, 255, 0.2)'
                }
              }}
            >
              {saving ? 'Salvando...' : '💾 Salvar Premiações'}
            </button>
          </div>

          {/* Right Column - Preview */}
          <div
            style={{
              backgroundColor: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              borderRadius: '12px',
              padding: '24px',
            }}
          >
            <h2 style={{ color: '#FFFFFF', fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>
              👁️ Pré-visualização
            </h2>

            {/* Period Display */}
            <div
              style={{
                backgroundColor: 'rgba(0, 212, 255, 0.08)',
                border: '1px solid rgba(0, 212, 255, 0.2)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '24px',
              }}
            >
              <p style={{ color: '#00D4FF', fontSize: '12px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
                ⏰ PERÍODO DA CAMPANHA
              </p>
              <p style={{ color: '#FFFFFF', fontSize: '14px', margin: 0 }}>
                {campaignStart && campaignEnd
                  ? `${new Date(campaignStart).toLocaleDateString('pt-BR')} até ${new Date(campaignEnd).toLocaleDateString('pt-BR')}`
                  : 'Selecione as datas'}
              </p>
            </div>

            {/* Prize Display */}
            <div style={{ display: 'grid', gap: '12px' }}>
              {/* First Place */}
              <div
                style={{
                  backgroundColor: 'rgba(255, 215, 0, 0.08)',
                  border: '2px solid rgba(255, 215, 0, 0.3)',
                  borderRadius: '8px',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '24px', marginRight: '8px' }}>🥇</span>
                  <span style={{ color: '#FFD700', fontSize: '14px', fontWeight: 'bold' }}>1º LUGAR</span>
                </div>
                <p
                  style={{
                    color: '#FFFFFF',
                    fontSize: '14px',
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    minHeight: '40px',
                  }}
                >
                  {firstPrize || '(Não definido)'}
                </p>
              </div>

              {/* Second Place */}
              <div
                style={{
                  backgroundColor: 'rgba(192, 192, 192, 0.08)',
                  border: '2px solid rgba(192, 192, 192, 0.3)',
                  borderRadius: '8px',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '24px', marginRight: '8px' }}>🥈</span>
                  <span style={{ color: '#C0C0C0', fontSize: '14px', fontWeight: 'bold' }}>2º LUGAR</span>
                </div>
                <p
                  style={{
                    color: '#FFFFFF',
                    fontSize: '14px',
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    minHeight: '40px',
                  }}
                >
                  {secondPrize || '(Não definido)'}
                </p>
              </div>

              {/* Third Place */}
              <div
                style={{
                  backgroundColor: 'rgba(205, 127, 50, 0.08)',
                  border: '2px solid rgba(205, 127, 50, 0.3)',
                  borderRadius: '8px',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '24px', marginRight: '8px' }}>🥉</span>
                  <span style={{ color: '#CD7F32', fontSize: '14px', fontWeight: 'bold' }}>3º LUGAR</span>
                </div>
                <p
                  style={{
                    color: '#FFFFFF',
                    fontSize: '14px',
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    minHeight: '40px',
                  }}
                >
                  {thirdPrize || '(Não definido)'}
                </p>
              </div>
            </div>

            {/* Info */}
            <div
              style={{
                marginTop: '24px',
                padding: '12px',
                backgroundColor: 'rgba(100, 116, 139, 0.15)',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#94A3B8',
              }}
            >
              <strong>💡 Dica:</strong> Estas informações aparecerão em destaque no dashboard dos usuários para motivá-los a participar.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
