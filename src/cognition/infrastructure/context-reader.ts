/**
 * HUB by Raisen — Lector UNICO del contexto con MEMORIA (lo usan los agentes de respuesta, Victor y Sistema B).
 * Lee el contexto del negocio COMPLETO byte a byte, lo guarda en memoria PERSISTENTE y lo reusa; solo relee a
 * los 15 dias (re-verifica por cambios, NO pierde memoria) o al invalidar (guardar contexto). C4 <=75. Sin any.
 */
import { leerContexto } from "./context.repo.ts";
import { buildFacts } from "../domain/business-facts.ts";
import { leerCatalogo } from "./platform-context.repo.ts";
import { leerMemoria, memoriaVencida, guardarMemoria } from "./context-memory.query.ts";

export interface ContextoNegocio { readonly brandVoice: string; readonly catalogContext: string; }

export async function contextoMemorizado(tenantId: string): Promise<ContextoNegocio> {
  const catalog = await leerCatalogo(tenantId); // catalogo SIEMPRE fresco: el SKU cambia sin guardar Contexto (antes: cache stale 15d)
  const catalogContext = catalog.length ? catalog.join("; ") : "(catalogo vacio)";
  const mem = await leerMemoria(tenantId);
  if (mem && !memoriaVencida(mem.refreshedAt)) return { brandVoice: mem.brandVoice, catalogContext };
  const facts = buildFacts(await leerContexto(tenantId)); // contexto COMPLETO byte a byte (sin tope)
  const brandVoice = facts.length ? facts.join(" | ") : "(contexto del negocio aun vacio)";
  await guardarMemoria(tenantId, brandVoice, catalogContext); // brandVoice persistente 15d; el catalogo ya no se sirve de cache
  return { brandVoice, catalogContext };
}
