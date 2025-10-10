export const SUPPORT_MESSAGES = {
  MIN_LENGTH: 'A mensagem deve ter pelo menos 10 caracteres',
  MAX_LENGTH: 'A mensagem deve ter no máximo 2000 caracteres',
  SUCCESS: {
    TITLE: 'Mensagem enviada com sucesso!',
    DESCRIPTION: 'Nossa equipe responderá em breve no seu e-mail cadastrado.',
  },
  ERROR: {
    TITLE: 'Erro ao enviar mensagem',
    DESCRIPTION: 'Por favor, tente novamente mais tarde.',
  },
  PLACEHOLDER: 'Descreva sua dúvida ou problema em detalhes...',
  GREETING: 'Olá, {email}! Como podemos ajudar?',
} as const

export const SUPPORT_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
} as const

export const SUPPORT_CONFIG = {
  MAX_MESSAGE_LENGTH: 2000,
  MIN_MESSAGE_LENGTH: 10,
} as const
