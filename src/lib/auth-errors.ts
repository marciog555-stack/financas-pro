const MESSAGES: Record<string, string> = {
  'invalid login credentials': 'E-mail ou senha inválidos.',
  'email not confirmed': 'E-mail ainda não confirmado. Verifique sua caixa de entrada.',
  'user already registered': 'Já existe uma conta com este e-mail.',
  'password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres.',
  'unable to validate email address: invalid format': 'Formato de e-mail inválido.',
  'email rate limit exceeded':
    'Limite de envio de e-mails atingido. Aguarde alguns minutos e tente novamente.',
  'new password should be different from the old password.':
    'A nova senha deve ser diferente da senha atual.',
  'token has expired or is invalid': 'O link expirou ou é inválido. Solicite um novo.',
  'auth session missing!': 'Sessão de recuperação inválida ou expirada. Solicite um novo link.',
  'signups not allowed for this instance': 'Cadastro desabilitado no momento.',
}

export function translateAuthError(message: string): string {
  const normalized = message.trim().toLowerCase()
  if (MESSAGES[normalized]) return MESSAGES[normalized]

  const rateLimit = message.match(/you can only request this after (\d+) seconds/i)
  if (rateLimit) return `Por segurança, aguarde ${rateLimit[1]} segundos antes de tentar novamente.`

  return 'Ocorreu um erro. Tente novamente em instantes.'
}
