import { SignUpForm } from '@/src/components/forms/SignUpForm'
import Image from 'next/image'

export default function SignUpPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-b from-blue-950 to-blue-900">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <Image 
              src="/images/logo.png" 
              alt="WOA Talk Logo" 
              width={180} 
              height={180}
              priority
            />
          </div>
        </div>

        <SignUpForm />
      </div>
    </main>
  )
}
