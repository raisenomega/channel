/**
 * HUB by Raisen — fetch con timeout (AbortController). Evita que una llamada colgada (proveedor LLM/STT
 * lento o sin respuesta) deje una promesa viva para siempre -> acumulacion -> fuga de memoria / OOM del
 * proceso. Al vencer el timeout aborta y fetch lanza un AbortError (esAbort lo detecta). C4 <=75. Sin any.
 */
export async function fetchConTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(to);
  }
}

export function esAbort(e: unknown): boolean {
  return (e as { name?: string } | null)?.name === "AbortError";
}
