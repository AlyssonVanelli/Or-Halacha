/**
 * Sistema de monitoramento de segurança
 */

interface SecurityEvent {
  timestamp: string
  type:
    | 'XSS_ATTEMPT'
    | 'RATE_LIMIT_EXCEEDED'
    | 'SUSPICIOUS_REQUEST'
    | 'AUTH_FAILURE'
    | 'SQL_INJECTION_ATTEMPT'
  ip: string
  userAgent: string
  details: Record<string, unknown>
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

class SecurityMonitor {
  private events: SecurityEvent[] = []
  private maxEvents = 1000

  logEvent(event: Omit<SecurityEvent, 'timestamp'>) {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    }

    this.events.push(securityEvent)

    // Manter apenas os últimos eventos
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }

    // Em produção, enviar para serviço de monitoramento
    this.sendToMonitoring()
  }

  private sendToMonitoring() {
    // Em produção, integrar com serviços como:
    // - Sentry
    // - DataDog
    // - CloudWatch
    // - LogRocket
  }

  getEvents(type?: SecurityEvent['type']) {
    return type ? this.events.filter(e => e.type === type) : this.events
  }

  getRecentEvents(minutes: number = 60) {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000)
    return this.events.filter(e => new Date(e.timestamp) > cutoff)
  }

  isIPBlocked(ip: string): boolean {
    const recentEvents = this.getRecentEvents(60)
    const ipEvents = recentEvents.filter(e => e.ip === ip)

    // Bloquear IP se mais de 10 eventos críticos em 1 hora
    const criticalEvents = ipEvents.filter(e => e.severity === 'CRITICAL')
    return criticalEvents.length > 10
  }

  getSecurityScore(): number {
    const recentEvents = this.getRecentEvents(24 * 60) // 24 horas
    const criticalEvents = recentEvents.filter(e => e.severity === 'CRITICAL').length
    const highEvents = recentEvents.filter(e => e.severity === 'HIGH').length
    const mediumEvents = recentEvents.filter(e => e.severity === 'MEDIUM').length

    // Score de 0-100 (100 = mais seguro)
    let score = 100
    score -= criticalEvents * 20
    score -= highEvents * 10
    score -= mediumEvents * 5

    return Math.max(0, score)
  }
}

export const securityMonitor = new SecurityMonitor()

/**
 * Funções de conveniência para logging
 */
export function logXSSAttempt(ip: string, userAgent: string, content: string) {
  securityMonitor.logEvent({
    type: 'XSS_ATTEMPT',
    ip,
    userAgent,
    details: { content: content.substring(0, 100) },
    severity: 'HIGH',
  })
}

export function logRateLimitExceeded(ip: string, userAgent: string, endpoint: string) {
  securityMonitor.logEvent({
    type: 'RATE_LIMIT_EXCEEDED',
    ip,
    userAgent,
    details: { endpoint },
    severity: 'MEDIUM',
  })
}

export function logSuspiciousRequest(ip: string, userAgent: string, path: string) {
  securityMonitor.logEvent({
    type: 'SUSPICIOUS_REQUEST',
    ip,
    userAgent,
    details: { path },
    severity: 'MEDIUM',
  })
}

export function logAuthFailure(ip: string, userAgent: string, email?: string) {
  securityMonitor.logEvent({
    type: 'AUTH_FAILURE',
    ip,
    userAgent,
    details: { email: email ? email.substring(0, 3) + '***' : 'unknown' },
    severity: 'LOW',
  })
}

export function logSQLInjectionAttempt(ip: string, userAgent: string, query: string) {
  securityMonitor.logEvent({
    type: 'SQL_INJECTION_ATTEMPT',
    ip,
    userAgent,
    details: { query: query.substring(0, 100) },
    severity: 'CRITICAL',
  })
}
