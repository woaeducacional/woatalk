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
      default: 'bg-blue-700 text-white hover:bg-blue-800 active:bg-blue-900',
      outline: 'border border-blue-400 text-blue-400 hover:bg-blue-950',
      ghost: 'hover:bg-blue-900 text-blue-100',
      secondary: 'bg-orange-600 text-white hover:bg-orange-700',
    }

    const sizes = {
      default: 'h-10 px-4 py-2 text-sm font-medium',
      sm: 'h-8 px-3 text-xs font-medium',
      lg: 'h-12 px-6 text-base font-semibold',
    }

    return (
      <button
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        disabled={loading || disabled}
        {...props}
      >
        {loading ? '...' : props.children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
