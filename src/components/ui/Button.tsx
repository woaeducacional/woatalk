import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg'
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', loading, disabled, ...props }, ref) => {
    const variants = {
      default: 'text-white border border-cyan-400/60 hover:opacity-90 active:scale-95 font-black tracking-widest',
      outline: 'border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/10',
      ghost: 'text-cyan-100 hover:bg-cyan-500/10',
      secondary: 'text-white border border-orange-400/60 hover:opacity-90 font-bold tracking-widest',
    }

    const variantStyles: Record<string, React.CSSProperties> = {
      default: { background: 'linear-gradient(135deg, #003AB0 0%, #0066FF 100%)', boxShadow: '0 0 20px rgba(0,102,255,0.35)' },
      outline: {},
      ghost: {},
      secondary: { background: 'linear-gradient(135deg, #CC4A00 0%, #FF6B35 100%)', boxShadow: '0 0 16px rgba(255,107,53,0.35)' },
    }

    const sizes = {
      default: 'h-11 px-4 py-2 text-sm',
      sm: 'h-8 px-3 text-xs',
      lg: 'h-12 px-6 text-base',
    }

    return (
      <button
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        style={variantStyles[variant]}
        ref={ref}
        disabled={loading || disabled}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            Carregando...
          </span>
        ) : props.children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
