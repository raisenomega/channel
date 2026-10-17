/**
 * HUB by Raisen — Botón de logout (H5). Desbloqueo operacional del owner:
 * cierra la sesión de Supabase, limpia storage local y redirige a /login.
 * Fail-safe: aunque signOut o el storage fallen, SIEMPRE redirige. C4 ≤75.
 */
import { useState } from "react";
import { logout } from "@/lib/auth";
import { redirectToLogin } from "@/lib/redirect-on-error";

export function LogoutButton({ label }: { label: string }) {
  const [busy, setBusy] = useState(false);

  async function salir(): Promise<void> {
    setBusy(true);
    try {
      await logout();
    } catch {
      /* signOut remoto falló: igual limpiamos y salimos */
    }
    try {
      window.localStorage.clear();
      window.sessionStorage.clear();
    } catch {
      /* storage bloqueado: el redirect corta la sesión de todas formas */
    }
    redirectToLogin();
  }

  return (
    <button
      type="button"
      className="nav-tool"
      onClick={() => void salir()}
      disabled={busy}
      aria-label={label}
      title={label}
    >
      {busy ? "..." : label}
    </button>
  );
}
