/**
 * HUB by Raisen — D-51: estado de sesion REACTIVO (fuente de verdad del shell + apiFetch).
 * Raiz del bug: el shell leia readLocalSession() una sola vez (no reactivo) y la clave custom
 * hub.session solo la escribia login() -> tras signup / reload / refresh quedaba desincronizada
 * con la sesion real del SDK (sb-*) -> nav oculta pese a sesion valida.
 * Fix: suscribir onAuthStateChange (dispara INITIAL_SESSION en reload, TOKEN_REFRESHED al refrescar,
 * SIGNED_IN/OUT) y espejar SIEMPRE a hub.session -> el shell re-renderiza y apiFetch usa token fresco.
 */
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "./supabase";
import { readLocalSession, writeLocalSession, clearLocalSession } from "./auth";

export function useSession(): Session | null {
  const [session, setSession] = useState<Session | null>(() => readLocalSession());
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    const { data } = sb.auth.onAuthStateChange((_event, s) => {
      if (s) { writeLocalSession(s); setSession(s); }
      else { clearLocalSession(); setSession(null); }
    });
    return () => data.subscription.unsubscribe();
  }, []);
  return session;
}
