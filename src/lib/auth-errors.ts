const MESSAGES: Record<string, string> = {
  'Invalid login credentials': 'E-mail ou senha inválidos.',
  'Email not confirmed': 'E-mail ainda não confirmado. Verifique sua caixa de entrada.',
  'User already registered': 'Já existe uma conta com este e-mail.',
  'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres.',
  'Unable to validate email address: invalid format': 'Formato de e-mail inválido.',
  'Email rate limit exceeded': 'Muitas tentativas. Aguarde um momento e tente novamente.',
  'New password should be different from the old password.':
    'A nova senha deve ser diferente da senha atual.',
  'Token has expired or is invalid': 'O link expirou ou é inválido. Solicite um novo.',
  'Auth session missing!': 'Sessão de recuperação inválida ou expirada. Solicite um novo link.',
  'Signups not allowed for this instance': 'Cadastro desabilitado no momento.',
}

export function translateAuthError(message: string): string {
  if (MESSAGES[message]) return MESSAGES[message]

  const rateLimit = message.match(/you can only request this after (\d+) seconds/i)
  if (rateLimit) return `Por segurança, aguarde ${rateLimit[1]} segundos antes de tentar novamente.`

  return 'Ocorreu um erro. Tente novamente em instantes.'
}
