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
      default: 'bg-ocean-600 text-white hover:bg-ocean-700 active:bg-ocean-800',
      outline: 'border border-ocean-300 text-ocean-300 hover:bg-ocean-950',
      ghost: 'hover:bg-ocean-900 text-ocean-100',
      secondary: 'bg-ocean-700 text-white hover:bg-ocean-800',
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
