'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { calcLevel } from '@/lib/level'
import { playClick } from '@/lib/sounds'

interface UserProfile {
  id: string
  name: string
  nickname?: string
  phone?: string
  bio?: string
  country?: string
  language?: string
  gender?: string
  avatar_url?: string
  xp_total?: number
  streak_count?: number
  badges?: string
}

export function ClientProfileContent({ profile }: { profile: UserProfile }) {
  const [badgesModalOpen, setBadgesModalOpen] = useState(false)

  const badgeMap: Record<string, {emoji: string, name: string}> = {
    'first_step': { emoji: '👣', name: 'Primeiro Passo' },
    'coral': { emoji: '🪸', name: 'Coral Badge' },
    'explorer': { emoji: '🧭', name: 'Explorador' },
    'ocean_master': { emoji: '👑', name: 'Mestre dos Oceanos' },
    'master': { emoji: '👑', name: 'Mestre' },
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #050E1A 0%, #0a1929 50%, #050E1A 100%)' }}>
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00D4FF 2px, #00D4FF 3px)' }} />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 py-4 border-b border-cyan-400/20 backdrop-blur-md" style={{ background: 'rgba(5,14,26,0.72)' }}>
          <div className="flex items-center gap-3">
            <Link href="/community" className="relative w-8 sm:w-10 h-8 sm:h-10 hover:scale-110 transition-transform">
              <div className="absolute inset-0 rounded-full blur-lg bg-cyan-400/30" />
              <Image src="/images/logo.png" alt="WOA Talk" fill className="relative rounded-full border-2 border-cyan-400/50 object-cover" />
            </Link>
            <div>
              <h1 className="text-sm sm:text-base font-black tracking-[0.18em] text-white" style={{ textShadow: '0 0 12px rgba(0,212,255,0.5)' }}>PERFIL</h1>
              <p className="text-[10px] text-cyan-400/50 tracking-widest">{profile.nickname || 'USUÁRIO'}</p>
            </div>
          </div>
          <Link
            href="/community"
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded text-xs sm:text-sm border border-cyan-400/30 text-cyan-300/70 font-bold tracking-widest hover:border-cyan-400/60 hover:text-cyan-300 transition-all"
          >
            ← VOLTAR
          </Link>
        </header>

        {/* Main content */}
        <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 space-y-8">
          {/* Avatar section */}
          <div className="text-center">
            <div className="relative inline-block">
              <div
                className="relative w-24 sm:w-32 h-24 sm:h-32 rounded-full"
                style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,102,255,0.1))' }}
              >
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt="Avatar"
                    fill
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full">
                    <svg className="w-12 sm:w-16 h-12 sm:h-16 text-cyan-400/40" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                <div style={{ border: '2px solid rgba(0,212,255,0.3)' }} className="absolute inset-0 rounded-full" />
              </div>
            </div>
            <p className="text-xs text-blue-200/50 mt-3">{profile.name}</p>
          </div>

          {/* Stats section */}
          {profile.xp_total !== undefined && (
            <div className="rounded-2xl backdrop-blur-sm border-2 p-6 sm:p-8" style={{ 
              background: 'linear-gradient(135deg, rgba(100,200,255,0.12), rgba(150,100,255,0.08))',
              borderColor: 'rgba(0,212,255,0.25)',
              boxShadow: '0 8px 32px rgba(0,212,255,0.08), inset 0 1px 1px rgba(255,255,255,0.1)'
            }}>
              <h3 className="text-sm font-black text-cyan-300/70 mb-6 tracking-widest uppercase" style={{ textShadow: '0 0 8px rgba(0,212,255,0.3)' }}>⚔️ STATS</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Level Card */}
                <div className="rounded-xl p-5 text-center relative overflow-hidden group cursor-pointer transition-all hover:scale-105" style={{ 
                  background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,215,0,0.08))',
                  border: '2px solid rgba(255,215,0,0.3)',
                  boxShadow: '0 0 16px rgba(255,215,0,0.15), inset 0 1px 1px rgba(255,255,255,0.05)'
                }}>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(255,215,0,0.1), transparent 80%)' }} />
                  <div className="relative">
                    <div className="text-4xl sm:text-5xl font-black mb-1" style={{ color: '#FFD700', textShadow: '0 0 12px rgba(255,215,0,0.5)' }}>
                      {calcLevel(profile.xp_total).level}
                    </div>
                    <p className="text-xs text-yellow-200/70 tracking-widest uppercase font-black">Nível</p>
                    <p className="text-[11px] text-yellow-200/50 mt-2">{profile.xp_total.toLocaleString()} XP</p>
                  </div>
                </div>

                {/* Streak Card */}
                <div className="rounded-xl p-5 text-center relative overflow-hidden group cursor-pointer transition-all hover:scale-105" style={{ 
                  background: 'linear-gradient(135deg, rgba(255,107,53,0.15), rgba(255,107,53,0.08))',
                  border: '2px solid rgba(255,107,53,0.3)',
                  boxShadow: '0 0 16px rgba(255,107,53,0.15), inset 0 1px 1px rgba(255,255,255,0.05)'
                }}>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(255,107,53,0.1), transparent 80%)' }} />
                  <div className="relative">
                    <div className="text-4xl sm:text-5xl font-black mb-1" style={{ color: '#FF6B35', textShadow: '0 0 12px rgba(255,107,53,0.5)' }}>
                      {profile.streak_count || 0}
                    </div>
                    <p className="text-xs text-orange-200/70 tracking-widest uppercase font-black">Streak</p>
                    <p className="text-[11px] text-orange-200/50 mt-2">dias consecutivos 🔥</p>
                  </div>
                </div>

                {/* Badges Modal Card */}
                <button
                  onClick={() => { playClick(); setBadgesModalOpen(true) }}
                  className="rounded-xl overflow-hidden relative group cursor-pointer transition-all hover:scale-105" 
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(168,85,247,0.08))',
                    border: '2px solid rgba(168,85,247,0.3)',
                    boxShadow: '0 0 16px rgba(168,85,247,0.15), inset 0 1px 1px rgba(255,255,255,0.05)'
                  }}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(168,85,247,0.1), transparent 80%)' }} />
                  <div className="p-5 text-center relative z-10">
                    <div className="text-4xl sm:text-5xl font-black mb-1" style={{ color: '#A855F7', textShadow: '0 0 12px rgba(168,85,247,0.5)' }}>
                      {profile.badges ? profile.badges.split(',').filter(b => b.trim()).length : 0}
                    </div>
                    <p className="text-xs text-purple-200/70 tracking-widest uppercase font-black">Badges</p>
                    <p className="text-[11px] text-purple-200/50 mt-2">conquistadas</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* User info card (read-only) */}
          <div className="rounded-2xl backdrop-blur-md border border-cyan-400/20 p-6 sm:p-8" style={{ background: 'rgba(5,14,26,0.65)' }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Name */}
              <div className="sm:col-span-1">
                <label className="block text-xs font-black text-blue-200/70 mb-2 tracking-wider uppercase">Nome Completo</label>
                <div className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm">
                  {profile.name}
                </div>
              </div>

              {/* Nickname */}
              {profile.nickname && (
                <div className="sm:col-span-1">
                  <label className="block text-xs font-black text-blue-200/70 mb-2 tracking-wider uppercase">Nick Name</label>
                  <div className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm">
                    {profile.nickname}
                  </div>
                </div>
              )}

              {/* Gender */}
              {profile.gender && (
                <div className="sm:col-span-1">
                  <label className="block text-xs font-black text-blue-200/70 mb-2 tracking-wider uppercase">Gênero</label>
                  <div className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm capitalize">
                    {profile.gender === 'masculino' ? 'Masculino' : profile.gender === 'feminino' ? 'Feminino' : profile.gender === 'nao-binario' ? 'Não binário' : profile.gender === 'outro' ? 'Outro' : profile.gender}
                  </div>
                </div>
              )}

              {/* Country */}
              {profile.country && (
                <div className="sm:col-span-1">
                  <label className="block text-xs font-black text-blue-200/70 mb-2 tracking-wider uppercase">País</label>
                  <div className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm">
                    {profile.country}
                  </div>
                </div>
              )}

              {/* Language */}
              {profile.language && (
                <div className="sm:col-span-1">
                  <label className="block text-xs font-black text-blue-200/70 mb-2 tracking-wider uppercase">Idioma</label>
                  <div className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm">
                    {profile.language === 'pt-BR' ? 'Português (Brasil)' : profile.language === 'pt-PT' ? 'Português (Portugal)' : profile.language === 'en' ? 'English' : profile.language === 'es' ? 'Español' : profile.language}
                  </div>
                </div>
              )}

              {/* Phone */}
              {profile.phone && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-black text-blue-200/70 mb-2 tracking-wider uppercase">Telefone</label>
                  <div className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm">
                    {profile.phone}
                  </div>
                </div>
              )}

              {/* Bio */}
              {profile.bio && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-black text-blue-200/70 mb-2 tracking-wider uppercase">Descrição / Bio</label>
                  <div className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm whitespace-pre-wrap">
                    {profile.bio}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <footer className="py-6 text-center border-t border-cyan-400/10 mt-12">
          <p className="text-[11px] text-blue-200/30 tracking-[0.2em]">WOA TALK © 2026 — SUA JORNADA ÉPICA NO INGLÊS</p>
        </footer>

        {/* Badges Modal */}
        {badgesModalOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0, 0, 0, 0.6)' }}
            onClick={() => setBadgesModalOpen(false)}
          >
            <div 
              className="w-full max-w-md rounded-2xl backdrop-blur-md border-2 p-6 sm:p-8 animate-in fade-in zoom-in-95"
              style={{ 
                background: 'linear-gradient(135deg, rgba(100,200,255,0.12), rgba(150,100,255,0.08))',
                borderColor: 'rgba(0,212,255,0.25)',
                boxShadow: '0 8px 32px rgba(0,212,255,0.2), inset 0 1px 1px rgba(255,255,255,0.1)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-purple-200/90" style={{ textShadow: '0 0 12px rgba(168,85,247,0.5)' }}>
                  🏅 BADGES CONQUISTADAS
                </h2>
                <button
                  onClick={() => setBadgesModalOpen(false)}
                  className="text-purple-200/50 hover:text-purple-200 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Badges List */}
              <div className="max-h-96 overflow-y-auto space-y-3">
                {profile.badges && profile.badges.trim() ? (
                  profile.badges.split(',').map((badge, idx) => {
                    const badgeInfo = badgeMap[badge.trim().toLowerCase()] || { emoji: '🏅', name: badge.trim() }
                    return (
                      <div 
                        key={idx} 
                        className="flex items-center gap-4 px-4 py-3 rounded-lg transform transition-all hover:scale-105 hover:shadow-lg"
                        style={{ 
                          background: 'rgba(168,85,247,0.15)', 
                          border: '1px solid rgba(168,85,247,0.3)',
                          boxShadow: '0 0 12px rgba(168,85,247,0.1)'
                        }}
                      >
                        <span className="text-3xl">{badgeInfo.emoji}</span>
                        <div className="flex-1">
                          <p className="text-sm font-black text-purple-200/90">{badgeInfo.name}</p>
                          <p className="text-xs text-purple-200/50 mt-1">Badge #{idx + 1}</p>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-12">
                    <p className="text-purple-200/50 text-sm">Nenhuma badge conquistada ainda</p>
                    <p className="text-purple-200/30 text-xs mt-2">Complete atividades para ganhar badges!</p>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={() => setBadgesModalOpen(false)}
                className="w-full mt-6 py-3 rounded-lg font-black tracking-widest text-sm transition-all hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(168,85,247,0.15))',
                  color: '#A855F7',
                  border: '1px solid rgba(168,85,247,0.4)',
                }}
              >
                FECHAR
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
