/**
 * Traduz mensagens de erro do Supabase para português
 */
export function translateAuthError(errorMessage: string): string {
  const errorTranslations: Record<string, string> = {
    // Erros de credenciais
    'Invalid login credentials': 'Credenciais inválidas. Verifique seu email e senha.',
    'Invalid email or password': 'Email ou senha inválidos. Verifique suas credenciais.',
    'Email not confirmed': 'Email não confirmado. Verifique sua caixa de entrada.',
    'Invalid credentials': 'Credenciais inválidas. Verifique seu email e senha.',

    // Erros de email
    'User not found': 'Usuário não encontrado. Verifique seu email.',
    'Email address not registered': 'Email não cadastrado. Verifique seu email ou cadastre-se.',
    'Invalid email format': 'Formato de email inválido.',
    'Email already registered': 'Este email já está cadastrado.',

    // Erros de senha
    'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres.',
    'Password is too weak': 'A senha é muito fraca. Use uma senha mais forte.',
    'Password does not match': 'As senhas não coincidem.',

    // Erros de conta
    'Account is disabled': 'Conta desabilitada. Entre em contato com o suporte.',
    'Account is locked': 'Conta bloqueada. Entre em contato com o suporte.',
    'Too many requests': 'Muitas tentativas. Tente novamente em alguns minutos.',
    'Rate limit exceeded': 'Limite de tentativas excedido. Tente novamente mais tarde.',

    // Erros de rede/servidor
    'Network error': 'Erro de conexão. Verifique sua internet e tente novamente.',
    'Server error': 'Erro do servidor. Tente novamente em alguns minutos.',
    'Service unavailable': 'Serviço indisponível. Tente novamente mais tarde.',
    'Request timeout': 'Tempo limite excedido. Tente novamente.',

    // Erros genéricos
    'An unexpected error occurred': 'Ocorreu um erro inesperado. Tente novamente.',
    'Something went wrong': 'Algo deu errado. Tente novamente.',
    'Authentication failed': 'Falha na autenticação. Verifique suas credenciais.',
    'Session expired': 'Sessão expirada. Faça login novamente.',
    'Token expired': 'Token expirado. Faça login novamente.',
    'Access denied': 'Acesso negado. Verifique suas permissões.',

    // Erros específicos do Supabase
    'supabase.auth.signInWithPassword': 'Erro ao fazer login. Verifique suas credenciais.',
    'supabase.auth.signUp': 'Erro ao criar conta. Tente novamente.',
    'supabase.auth.signOut': 'Erro ao fazer logout. Tente novamente.',
    'supabase.auth.resetPasswordForEmail': 'Erro ao enviar email de recuperação. Tente novamente.',

    // Erros de cadastro específicos
    'User already registered': 'Este email já está cadastrado. Tente fazer login.',
    'User already exists': 'Este email já está cadastrado. Tente fazer login.',
    'Email already exists': 'Este email já está cadastrado. Tente fazer login.',
    'User with this email already exists': 'Este email já está cadastrado. Tente fazer login.',
    'Signup is disabled': 'Cadastro está temporariamente desabilitado.',
    'Email rate limit exceeded': 'Muitos emails enviados. Tente novamente mais tarde.',
    'Signup requires a valid password': 'Senha inválida. Use uma senha mais forte.',
    'Unable to validate email address: invalid format': 'Formato de email inválido.',
    'Database error saving new user': 'Erro interno. Tente novamente em alguns minutos.',
    'duplicate key value violates unique constraint':
      'Este email já está cadastrado. Tente fazer login.',
    'already registered': 'Este email já está cadastrado. Tente fazer login.',
    'already exists': 'Este email já está cadastrado. Tente fazer login.',
  }

  // Busca tradução exata
  if (errorTranslations[errorMessage]) {
    return errorTranslations[errorMessage]
  }

  // Busca tradução parcial (case insensitive)
  const lowerErrorMessage = errorMessage.toLowerCase()
  for (const [englishError, portugueseError] of Object.entries(errorTranslations)) {
    if (lowerErrorMessage.includes(englishError.toLowerCase())) {
      return portugueseError
    }
  }

  // Se não encontrar tradução, retorna mensagem genérica
  return 'Ocorreu um erro inesperado. Tente novamente.'
}

/**
 * Traduz erros de autenticação especificamente
 */
export function translateAuthErrorForLogin(error: Error | null): string {
  if (!error) return 'Ocorreu um erro inesperado. Tente novamente.'

  return translateAuthError(error.message)
}

/**
 * Traduz erros de carregamento de dados do Supabase
 */
export function translateDataError(error: unknown): string {
  if (!error) return 'Erro desconhecido ao carregar dados.'

  // Se é um objeto de erro do Supabase
  if (error && typeof error === 'object' && 'message' in error) {
    const errorTranslations: Record<string, string> = {
      // Erros de conexão
      'Failed to fetch': 'Erro de conexão. Verifique sua internet e tente novamente.',
      'Network request failed': 'Falha na conexão de rede. Tente novamente.',
      'Connection timeout': 'Tempo limite de conexão excedido. Tente novamente.',

      // Erros de autenticação
      'JWT expired': 'Sessão expirada. Faça login novamente.',
      'Invalid JWT': 'Token inválido. Faça login novamente.',
      'Not authenticated': 'Não autenticado. Faça login para continuar.',

      // Erros de permissão
      'Permission denied': 'Permissão negada. Você não tem acesso a este conteúdo.',
      'Row Level Security policy violation': 'Política de segurança violada. Acesso negado.',
      'Insufficient permissions': 'Permissões insuficientes. Entre em contato com o suporte.',

      // Erros de dados
      'No rows found': 'Nenhum dado encontrado.',
      'Multiple rows returned': 'Múltiplos registros encontrados. Contate o suporte.',
      'Invalid input': 'Dados inválidos fornecidos.',
      'Data validation failed': 'Falha na validação dos dados.',

      // Erros de banco de dados
      'Database connection failed': 'Falha na conexão com o banco de dados.',
      'Query timeout': 'Tempo limite da consulta excedido.',
      'Foreign key constraint': 'Violação de integridade referencial.',
      'Unique constraint violation': 'Violação de restrição única.',

      // Erros genéricos do Supabase
      supabase_error: 'Erro interno do banco de dados.',
      postgres_error: 'Erro do banco de dados PostgreSQL.',
      'relation does not exist': 'Tabela não encontrada no banco de dados.',
      'column does not exist': 'Coluna não encontrada na tabela.',
    }

    // Busca tradução exata
    if (errorTranslations[error.message as string]) {
      return errorTranslations[error.message as string]
    }

    // Busca tradução parcial
    const lowerErrorMessage = (error.message as string).toLowerCase()
    for (const [englishError, portugueseError] of Object.entries(errorTranslations)) {
      if (lowerErrorMessage.includes(englishError.toLowerCase())) {
        return portugueseError
      }
    }

    return `Erro ao carregar dados: ${error.message}`
  }

  // Se é um objeto vazio ou sem propriedades úteis
  if (typeof error === 'object' && Object.keys(error).length === 0) {
    return 'Erro interno ao carregar dados. Tente recarregar a página.'
  }

  // Se é uma string
  if (typeof error === 'string') {
    return translateAuthError(error)
  }

  // Fallback genérico
  return 'Erro inesperado ao carregar dados. Tente novamente.'
}

/**
 * Log de erro detalhado para debugging
 */
export function logDetailedError(context: string, error: unknown, additionalData?: unknown): void {
  if (additionalData) {
  }
}
