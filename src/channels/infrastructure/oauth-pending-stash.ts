/**
 * HUB by Raisen — O-4: stash IN-MEMORY de tokens pendientes del select_page FB (tempToken +
 * connectToken + userProfile). SERVER-SIDE ONLY: los tokens NUNCA van al navegador. Keyed por
 * (userId, tenantId, platform) — el pending-pages (request con JWT) deriva userId del JWT y debe
 * coincidir con el userId firmado en el state (defensa-en-profundidad). TTL 15min. C4 <=75.
 * DEBT-FB-STASH-MULTIWORKER: in-memory asume 1 worker (igual que OMEGA). Multi-worker -> fila DB efimera.
 */
const TTL_MS = 900_000;
interface Entry { readonly tempToken: string; readonly connectToken: string; readonly userProfile: unknown; readonly expiresAt: number; }
const store = new Map<string, Entry>();
const key = (userId: string, tenantId: string, platform: string): string => `${userId}:${tenantId}:${platform}`;

function evict(now: number): void {
  for (const [k, v] of store) if (now >= v.expiresAt) store.delete(k);
}

export function stashPending(userId: string, tenantId: string, platform: string, tempToken: string, connectToken: string, userProfile: unknown): void {
  const now = Date.now();
  store.set(key(userId, tenantId, platform), { tempToken, connectToken, userProfile, expiresAt: now + TTL_MS });
  evict(now);
}

export function getPending(userId: string, tenantId: string, platform: string): { tempToken: string; connectToken: string; userProfile: unknown } | null {
  const e = store.get(key(userId, tenantId, platform));
  if (!e) return null;
  if (Date.now() >= e.expiresAt) { store.delete(key(userId, tenantId, platform)); return null; }
  return { tempToken: e.tempToken, connectToken: e.connectToken, userProfile: e.userProfile };
}

export function clearPending(userId: string, tenantId: string, platform: string): void {
  store.delete(key(userId, tenantId, platform));
}
