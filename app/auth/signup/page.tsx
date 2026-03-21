import { SignUpForm } from '@/src/components/forms/SignUpForm'
import Image from 'next/image'

export default function SignUpPage() {
  return (
    <main className="min-h-screen relative flex flex-col items-center justify-center px-4 py-12" style={{ background: '#050E1A' }}>

      {/* Background */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/images/fundo_do_mar.png"
          alt="Fundo do Mar"
          fill
          className="object-cover object-bottom"
          priority
        />
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to bottom, rgba(5,14,26,0.88) 0%, rgba(5,14,26,0.65) 40%, rgba(5,14,26,0.85) 100%)'
        }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00D4FF 2px, #00D4FF 3px)'
        }} />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-6">

        {/* Logo + Title */}
        <div className="text-center">
          <div className="inline-block relative mb-3">
            <div className="absolute inset-0 rounded-full blur-xl opacity-60" style={{ background: 'rgba(0,212,255,0.35)' }} />
            <Image
              src="/images/logo.png"
              alt="WOA Talk"
              width={80}
              height={80}
              className="relative rounded-full border-2 border-cyan-400/60"
              priority
            />
          </div>
          <h1 className="text-2xl font-black tracking-[0.2em] text-white mt-3"
            style={{ textShadow: '0 0 20px rgba(0,212,255,0.5)' }}>WOA TALK</h1>
          <p className="text-xs text-cyan-400/60 tracking-[0.15em] mt-1">CRIE SUA CONTA E COMECE A JORNADA</p>
        </div>

        <SignUpForm />

        {/* Back to home */}
        <p className="text-center">
          <a href="/" className="text-xs text-blue-200/40 hover:text-blue-200/70 tracking-widest transition-colors">
            ← VOLTAR AO INÍCIO
          </a>
        </p>
      </div>
    </main>
  )
}
