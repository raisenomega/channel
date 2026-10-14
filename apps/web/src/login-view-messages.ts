/**
 * HUB by Raisen — Mapeo de errores de auth a mensaje de UI.
 */
import type { AuthError } from "./auth-client.ts";

export function mensajeDeError(e: AuthError): string {
  switch (e.kind) {
    case "correo_no_confirmado":
      return "Revisa tu correo y confirma la cuenta antes de entrar.";
    case "email_existe":
      return "Ese email ya esta registrado. Inicia sesion.";
    case "credenciales_invalidas":
      return "Credenciales invalidas. Verifica email y contrasena.";
    case "config_incompleta":
      return "Configuracion de autenticacion incompleta.";
    case "red":
      return "Error de conexion. Intenta de nuevo.";
    default:
      return "Error al autenticar. Intenta de nuevo.";
  }
}