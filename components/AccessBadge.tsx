'use client'

import { CheckCircle, Lock } from 'lucide-react'

interface AccessBadgeProps {
  accessibleCount: number
  totalCount: number
  hasAllAccess: boolean
  className?: string
}

export function AccessBadge({ 
  accessibleCount, 
  totalCount, 
  hasAllAccess, 
  className = "" 
}: AccessBadgeProps) {
  const getBadgeContent = () => {
    if (hasAllAccess) {
      return {
        text: 'Acesso Completo',
        icon: <CheckCircle className="h-3 w-3" />,
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800'
      }
    } else if (accessibleCount > 0) {
      return {
        text: `${accessibleCount}/${totalCount} Tratados`,
        icon: <CheckCircle className="h-3 w-3" />,
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-800'
      }
    } else {
      return {
        text: 'Sem Acesso',
        icon: <Lock className="h-3 w-3" />,
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-600'
      }
    }
  }

  const badge = getBadgeContent()

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${badge.bgColor} ${badge.textColor} ${className}`}>
      {badge.icon}
      <span className="ml-1">{badge.text}</span>
    </span>
  )
}

interface AccessInfo {
  totalDivisions: number
  accessibleDivisions: number
  hasAllAccess: boolean
}

interface DynamicAccessBadgeProps {
  accessInfo: AccessInfo | null
  fallbackText?: string
  className?: string
}

export function DynamicAccessBadge({ 
  accessInfo, 
  fallbackText = "Acesso Completo",
  className = ""
}: DynamicAccessBadgeProps) {
  if (!accessInfo) {
    return (
      <span className={`inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 ${className}`}>
        <CheckCircle className="h-3 w-3 mr-1" />
        {fallbackText}
      </span>
    )
  }

  return (
    <AccessBadge
      accessibleCount={accessInfo.accessibleDivisions}
      totalCount={accessInfo.totalDivisions}
      hasAllAccess={accessInfo.hasAllAccess}
      className={className}
    />
  )
}
