/**
 * HUB by Raisen — Auth headers y base URL REST.
 */
import { readLocalSession, clearLocalSession } from "../auth";
import { getSupabaseUrl, getAnonKey } from "./config";

function decodeJwt(token: string): { exp?: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1] ?? "";
    const padded = base64.replace(/-/g, "+").replace(/_/g, "/");
    const payload = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(payload) as { exp?: number };
  } catch {
    return null;
  }
}

export function supabaseAuthHeaders(): Record<string, string> | null {
  const session = readLocalSession();
  const anonKey = getAnonKey();
  if (!session?.access_token || !anonKey) return null;
  const payload = decodeJwt(session.access_token);
  if (payload && payload.exp) {
    const expMs = payload.exp * 1000;
    if (expMs < Date.now() + 5000) {
      clearLocalSession();
      return null;
    }
  }
  return {
    apikey: anonKey,
    authorization: `Bearer ${session.access_token}`,
    accept: "application/json",
  };
}

export function supabaseRestBase(): string | null {
  const url = getSupabaseUrl();
  if (!url) return null;
  return `${url}/rest/v1`;
}