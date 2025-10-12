import { cn } from '@/lib/utils'

interface LoadingProps {
  variant?: 'spinner' | 'dots' | 'pulse'
  size?: 'sm' | 'md' | 'lg'
  text?: string
  fullScreen?: boolean
  className?: string
}

export function Loading({
  variant = 'spinner',
  size = 'md',
  text,
  fullScreen = false,
  className,
}: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  const Container = ({ children }: { children: React.ReactNode }) => (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        fullScreen && 'fixed inset-0 z-50 bg-white/80 backdrop-blur-sm dark:bg-slate-950/80',
        !fullScreen && 'p-4',
        className
      )}
    >
      {children}
    </div>
  )

  if (variant === 'dots') {
    return (
      <Container>
        <div className="flex gap-1">
          <div
            className={cn('animate-bounce rounded-full bg-primary', sizeClasses[size])}
            style={{ animationDelay: '0ms' }}
          />
          <div
            className={cn('animate-bounce rounded-full bg-primary', sizeClasses[size])}
            style={{ animationDelay: '150ms' }}
          />
          <div
            className={cn('animate-bounce rounded-full bg-primary', sizeClasses[size])}
            style={{ animationDelay: '300ms' }}
          />
        </div>
        {text && <p className="text-muted-foreground">{text}</p>}
      </Container>
    )
  }

  if (variant === 'pulse') {
    return (
      <Container>
        <div className={cn('animate-pulse rounded-full bg-primary', sizeClasses[size])} />
        {text && <p className="text-muted-foreground">{text}</p>}
      </Container>
    )
  }

  // Default spinner
  return (
    <Container>
      <div
        className={cn(
          'animate-spin rounded-full border-4 border-primary border-t-transparent',
          sizeClasses[size]
        )}
      />
      {text && <p className="text-muted-foreground">{text}</p>}
    </Container>
  )
}
