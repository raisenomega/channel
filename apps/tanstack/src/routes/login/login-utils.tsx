/**
 * HUB by Raisen — Utilidades para pagina de Login.
 */
import type { AuthResult } from "@/lib/auth";

export type Mode = "login" | "register";

export function errorText(r: AuthResult): string {
  return r.ok ? "" : r.message;
}

export function LockIcon() {
  return (
    <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/25">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    </span>
  );
}