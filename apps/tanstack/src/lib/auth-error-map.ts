/**
 * HUB by Raisen — M-4: mensajes de error diferenciados signup vs login.
 * Recibe el string de error (AuthResult.message) ya que lib/auth no expone el AuthError crudo.
 * C4 <=75.
 */
export function mapSignupError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("already") || m.includes("registered") || m.includes("duplicate") || m.includes("exists")) {
    return "Este correo ya tiene cuenta. Prueba iniciar sesión.";
  }
  if (m.includes("weak") || m.includes("password") && m.includes("6")) {
    return "Contraseña débil — usa al menos 8 caracteres.";
  }
  return `Error al crear cuenta: ${message}`;
}

export function mapLoginError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials") || m.includes("inválida") || m.includes("invalida")) {
    return "Correo o contraseña incorrectos.";
  }
  if (m.includes("email not confirmed") || m.includes("not confirmed")) {
    return "Confirma tu correo antes de entrar.";
  }
  return `Error al entrar: ${message}`;
}
