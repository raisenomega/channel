/**
 * HUB by Raisen — Cliente de autenticacion (Supabase Auth via REST)
 * Sin dependencias externas (uso fetch) -> respeta la CSP (sin CDN).
 * El anon key/url se inyectan en runtime via window.__HUB_CONFIG__.
 */
import { Result, err, ok } from "@shared/domain/result.ts";

export interface TenantKey {
  readonly tenantId: string;
  readonly name: string;
  readonly plan: string;
  readonly slug: string;
}

export interface SessionUsuario {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly uid: string;
  readonly email: string;
  readonly tenant: TenantKey | null;
}

export type AuthError =
  | { readonly kind: "config_incompleta" }
  | { readonly kind: "credenciales_invalidas" }
  | { readonly kind: "red"; readonly cause: string }
  | { readonly kind: "desconocido"; readonly cause: string };

interface HubConfig {
  readonly supabaseUrl: string;
  readonly anonKey: string;
}

function config(): HubConfig {
  const g = globalThis as Record<string, unknown>;
  const cfg = g.__HUB_CONFIG__ as HubConfig | undefined;
  return { supabaseUrl: cfg?.supabaseUrl ?? "", anonKey: cfg?.anonKey ?? "" };
}

const TOKEN = "hub.session";

function cabeceras(extra?: Record<string, string>): RequestInit {
  const { anonKey } = config();
  return {
    headers: {
      apikey: anonKey,
      "content-type": "application/json",
      ...extra,
    },
    method: "POST",
  };
}

export const auth = {
  async registrar(email: string, password: string): Promise<Result<SessionUsuario, AuthError>> {
    const { supabaseUrl, anonKey } = config();
    if (!supabaseUrl || !anonKey) return err({ kind: "config_incompleta" });
    try {
      const res = await fetch(`${supabaseUrl}/auth/v1/signup`, {
        ...cabeceras(),
        body: JSON.stringify({ email, password }),
      });
      const body = (await res.json()) as Record<string, unknown>;
      return sessionDe(body, email);
    } catch (e) {
      return err({ kind: "red", cause: String(e) });
    }
  },

  async iniciar(email: string, password: string): Promise<Result<SessionUsuario, AuthError>> {
    const { supabaseUrl, anonKey } = config();
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
    const { supabaseUrl } = config();
    const token = sessionStorage.getItem(TOKEN);
    localStorage.removeItem(TOKEN);
    sessionStorage.removeItem(TOKEN);
    if (!supabaseUrl || !token) return;
    await fetch(`${supabaseUrl}/auth/v1/logout`, {
      ...cabeceras({ authorization: `Bearer ${token}` }),
    });
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

async function sessionDe(body: Record<string, unknown>, email: string): Promise<Result<SessionUsuario, AuthError>> {
  const access = body.access_token as string | undefined;
  const refresh = body.refresh_token as string | undefined;
  const user = body.user as Record<string, unknown> | undefined;
  if (!access || !refresh || !user?.id) return err({ kind: "credenciales_invalidas" });
  return ok({
    accessToken: access,
    refreshToken: refresh,
    uid: user.id as string,
    email: (user.email as string) ?? email,
    tenant: null,
  });
}