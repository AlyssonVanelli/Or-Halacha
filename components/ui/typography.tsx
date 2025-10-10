import React from 'react'
import { cn } from '@/lib/utils'

interface TypographyProps {
  children: React.ReactNode
  className?: string
  as?: keyof JSX.IntrinsicElements
}

// Display - Para títulos principais
export function Display({ children, className, as: Component = 'h1' }: TypographyProps) {
  return <Component className={cn('text-display', className)}>{children}</Component>
}

// Heading 1 - Para títulos de seção
export function Heading1({ children, className, as: Component = 'h1' }: TypographyProps) {
  return <Component className={cn('text-heading-1', className)}>{children}</Component>
}

// Heading 2 - Para subtítulos
export function Heading2({ children, className, as: Component = 'h2' }: TypographyProps) {
  return <Component className={cn('text-heading-2', className)}>{children}</Component>
}

// Heading 3 - Para títulos de card
export function Heading3({ children, className, as: Component = 'h3' }: TypographyProps) {
  return <Component className={cn('text-heading-3', className)}>{children}</Component>
}

// Heading 4 - Para títulos pequenos
export function Heading4({ children, className, as: Component = 'h4' }: TypographyProps) {
  return <Component className={cn('text-heading-4', className)}>{children}</Component>
}

// Body Large - Para texto principal destacado
export function BodyLarge({ children, className, as: Component = 'p' }: TypographyProps) {
  return <Component className={cn('text-body-large', className)}>{children}</Component>
}

// Body - Para texto padrão
export function Body({ children, className, as: Component = 'p' }: TypographyProps) {
  return <Component className={cn('text-body', className)}>{children}</Component>
}

// Body Small - Para texto secundário
export function BodySmall({ children, className, as: Component = 'p' }: TypographyProps) {
  return <Component className={cn('text-body-small', className)}>{children}</Component>
}

// Caption - Para texto de apoio
export function Caption({ children, className, as: Component = 'span' }: TypographyProps) {
  return <Component className={cn('text-caption', className)}>{children}</Component>
}

// Label - Para labels de formulário
export function Label({ children, className, as: Component = 'label' }: TypographyProps) {
  return <Component className={cn('text-label', className)}>{children}</Component>
}

// Button - Para texto de botões
export function ButtonText({ children, className, as: Component = 'span' }: TypographyProps) {
  return <Component className={cn('text-button', className)}>{children}</Component>
}

// Button Small - Para texto de botões pequenos
export function ButtonSmall({ children, className, as: Component = 'span' }: TypographyProps) {
  return <Component className={cn('text-button-small', className)}>{children}</Component>
}

// Hebrew - Para texto em hebraico
export function Hebrew({ children, className, as: Component = 'p' }: TypographyProps) {
  return <Component className={cn('text-hebrew', className)}>{children}</Component>
}

// Quote - Para citações
export function Quote({ children, className, as: Component = 'blockquote' }: TypographyProps) {
  return <Component className={cn('text-quote', className)}>{children}</Component>
}

// Citation - Para citações pequenas
export function Citation({ children, className, as: Component = 'cite' }: TypographyProps) {
  return <Component className={cn('text-citation', className)}>{children}</Component>
}

// Code - Para código inline
export function Code({ children, className, as: Component = 'code' }: TypographyProps) {
  return <Component className={cn('text-code', className)}>{children}</Component>
}

// Code Block - Para blocos de código
export function CodeBlock({ children, className, as: Component = 'pre' }: TypographyProps) {
  return <Component className={cn('text-code-block', className)}>{children}</Component>
}
