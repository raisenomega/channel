/**
 * HUB by Raisen — Operaciones de autenticación (auth object).
 */
import { Result, err } from "@shared/domain/result.ts";
import { logger } from "@shared/infrastructure/logger.infrastructure.ts";
import type { SessionUsuario, AuthError } from "./types";
import { TOKEN, getConfig, cabeceras } from "./config";
import { sessionDe } from "./session";

export const auth = {
  async registrar(email: string, password: string): Promise<Result<SessionUsuario, AuthError>> {
    const { supabaseUrl, anonKey } = getConfig();
    if (!supabaseUrl || !anonKey) return err({ kind: "config_incompleta" });
    try {
      const res = await fetch(`${supabaseUrl}/auth/v1/signup`, {
        ...cabeceras(),
        body: JSON.stringify({ email, password }),
      });
      const body = (await res.json()) as Record<string, unknown>;
      logger.info(`signup_status=${res.status}`, { fase: "FASE_D" });
      if (!res.ok) {
        const code = body.error_code as string | undefined;
        logger.warn(`signup_error_code=${code ?? "desconocido"}`, { fase: "FASE_D" });
        if (code === "email_exists" || code === "user_already_exists") return err({ kind: "email_existe" });
        return err({ kind: "no_autorizado" });
      }
      const user = body.user as Record<string, unknown> | undefined;
      const hasToken = typeof body.access_token === "string" && typeof body.refresh_token === "string";
      if (user?.id && !hasToken) return err({ kind: "correo_no_confirmado" });
      return sessionDe(body, email);
    } catch (e) {
      return err({ kind: "red", cause: String(e) });
    }
  },

  async iniciar(email: string, password: string): Promise<Result<SessionUsuario, AuthError>> {
    const { supabaseUrl, anonKey } = getConfig();
    if (!supabaseUrl || !anonKey) return err({ kind: "config_incompleta" });
    try {
      const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        ...cabeceras(),
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) return err({ kind: "credenciales_invalidas" });
      const body = (await res.json()) as Record<string, unknown>;
      return sessionDe(body, email);
    } catch (e) {
      return err({ kind: "red", cause: String(e) });
    }
  },

  async cerrar(): Promise<void> {
    const { supabaseUrl } = getConfig();
    const token = sessionStorage.getItem(TOKEN);
    localStorage.removeItem(TOKEN);
    sessionStorage.removeItem(TOKEN);
    if (supabaseUrl && token) {
      await fetch(`${supabaseUrl}/auth/v1/logout`, { ...cabeceras({ authorization: `Bearer ${token}` }) });
    }
  },

  guardar(s: SessionUsuario): void {
    localStorage.setItem(TOKEN, JSON.stringify(s));
  },

  leer(): SessionUsuario | null {
    const raw = localStorage.getItem(TOKEN);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SessionUsuario;
    } catch {
      return null;
    }
  },
};