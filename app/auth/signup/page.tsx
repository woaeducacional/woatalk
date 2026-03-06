import { SignUpForm } from '@/src/components/forms/SignUpForm'

export default function SignUpPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-b from-blue-950 to-blue-900">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-blue-100">🌊 WOA Talk</h1>
          <p className="text-blue-300">Aprenda inglês em uma jornada épica</p>
        </div>

        <SignUpForm />
      </div>
    </main>
  )
}
