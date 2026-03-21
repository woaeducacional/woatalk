import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, ...props }, ref) => (
    <div className="w-full">
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-lg border px-3 py-2 text-sm text-cyan-50 placeholder:text-blue-200/40 focus:outline-none focus:ring-2 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all',
          error ? 'border-red-500/60 focus:ring-red-500/60' : 'border-cyan-500/25 focus:ring-cyan-400/50 focus:border-cyan-400/50',
          className
        )}
        style={{ background: 'rgba(0,212,255,0.05)' }}
        ref={ref}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  )
)

Input.displayName = 'Input'

export { Input }
