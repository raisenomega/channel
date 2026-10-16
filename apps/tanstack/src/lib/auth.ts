import { getSupabase } from "./supabase";
import type { Session, AuthError } from "@supabase/supabase-js";

export type AuthResult =
  | { ok: true; session: Session | null }
  | { ok: false; message: string };

const STORAGE_KEY = "hub.session";

export function readLocalSession(): Session | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

/** Hotfix G: persistir una sesion refrescada (nuevo JWT con app_metadata.tenant_id). */
export function writeLocalSession(session: Session): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearLocalSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.sessionStorage.removeItem(STORAGE_KEY);
}

function messageOf(err: AuthError | null): string {
  return err?.message ?? "La combinación de credenciales es inválida.";
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const sb = getSupabase();
  if (!sb) return { ok: false, message: "Autenticación no configurada" };
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, message: messageOf(error) };
  if (data.session) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data.session));
  }
  return { ok: true, session: data.session };
}

export async function registerUser(email: string, password: string): Promise<AuthResult> {
  const sb = getSupabase();
  if (!sb) return { ok: false, message: "Autenticación no configurada" };
  const { data, error } = await sb.auth.signUp({ email, password });
  if (error) return { ok: false, message: messageOf(error) };
  return { ok: true, session: data.session };
}

export async function logout(): Promise<AuthResult> {
  clearLocalSession();
  const sb = getSupabase();
  if (!sb) return { ok: true, session: null };
  const { error } = await sb.auth.signOut();
  if (error) return { ok: false, message: messageOf(error) };
  return { ok: true, session: null };
}
