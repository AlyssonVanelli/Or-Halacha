'use client'

import { XCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

interface ErrorMessageProps {
  title: string
  description?: string
  variant?: 'error' | 'warning' | 'info'
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function ErrorMessage({
  title,
  description,
  variant = 'error',
  action,
  className,
}: ErrorMessageProps) {
  const icons = {
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
  }

  const Icon = icons[variant]

  const colors = {
    error: 'bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-50',
    warning: 'bg-yellow-50 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-50',
    info: 'bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-50',
  }

  const iconColors = {
    error: 'text-red-500 dark:text-red-400',
    warning: 'text-yellow-500 dark:text-yellow-400',
    info: 'text-blue-500 dark:text-blue-400',
  }

  return (
    <div className={cn('rounded-lg p-4', colors[variant], className)}>
      <div className="flex items-start gap-3">
        <Icon className={cn('mt-0.5 h-5 w-5', iconColors[variant])} />
        <div className="flex-1">
          <h3 className="font-semibold">{title}</h3>
          {description && <p className="mt-1 text-sm opacity-90">{description}</p>}
          {action && (
            <Button
              variant="link"
              className={cn('mt-2 h-auto p-0', iconColors[variant])}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
