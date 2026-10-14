/**
 * HUB by Raisen — Helpers del cliente de agente.
 */

export function toResult<T>(fn: () => Promise<T>): Promise<
  { ok: true; value: T } | { ok: false; error: Error }
> {
  return fn().then(
    (value) => ({ ok: true as const, value }),
    (error: unknown) => ({ ok: false as const, error: error instanceof Error ? error : new Error(String(error)) }),
  );
}

export function unwrapError(
  res: { ok: false; kind: string; cause?: string },
): Error {
  if (res.kind === "config_incompleta") {
    return new Error("Supabase no configurado (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)");
  }
  return new Error(res.cause ?? `Error Supabase: ${res.kind}`);
}

export function countBy<T>(rows: T[], key: keyof T): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const val = row[key];
    if (val !== null && val !== undefined) {
      const k = String(val);
      counts[k] = (counts[k] ?? 0) + 1;
    }
  }
  return counts;
}

export function topKey(counts: Record<string, number>): string | null {
  let top: string | null = null;
  let max = 0;
  for (const [k, v] of Object.entries(counts)) {
    if (v > max) {
      max = v;
      top = k;
    }
  }
  return top;
}