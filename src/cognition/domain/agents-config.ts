/**
 * HUB by Raisen — Config S7 de los agentes por negocio (dominio puro). Cada capacidad en `can` = una firma
 * aprobada del dueno (autoriza al agente a hacerlo solo). review = tipos que el dueno fuerza a revision aun
 * en autonomo (vacio por defecto). hours=null -> 24/7. Default AUTONOMO: responde a TODO (confidence 0, review
 * off); el dueno sube el liston si quiere. A2 cero imports. C4 <=75.
 */
export interface AgentsHours { readonly days: readonly number[]; readonly start: string; readonly end: string; }
export interface AgentsCan { readonly reply: boolean; readonly quote: boolean; readonly invoice: boolean; readonly order: boolean; readonly charge: boolean; readonly appointment: boolean; }
export interface AgentsReview { readonly opportunities: boolean; readonly complaints: boolean; readonly newContacts: boolean; }

export interface AgentsConfig {
  readonly confidence: number;      // 0-10; bajo esto -> siempre a Borradores
  readonly can: AgentsCan;          // capacidades autorizadas (firma del dueno)
  readonly review: AgentsReview;    // siempre a revision humana
  readonly hours: AgentsHours | null;
  readonly dailyCap: number;
  readonly channels: readonly string[];
}

export const DEFAULT_CONFIG: AgentsConfig = {
  confidence: 0,
  can: { reply: true, quote: false, invoice: false, order: false, charge: false, appointment: false },
  review: { opportunities: false, complaints: false, newContacts: false },
  hours: null,
  dailyCap: 1000,
  channels: ["whatsapp", "instagram", "facebook"],
};

export function mergeConfig(raw: unknown): AgentsConfig {
  const r = (raw ?? {}) as Partial<AgentsConfig>;
  const d = DEFAULT_CONFIG;
  return {
    confidence: typeof r.confidence === "number" ? Math.max(0, Math.min(10, r.confidence)) : d.confidence,
    can: { ...d.can, ...(r.can ?? {}) },
    review: { ...d.review, ...(r.review ?? {}) },
    hours: r.hours ?? null,
    dailyCap: typeof r.dailyCap === "number" ? r.dailyCap : d.dailyCap,
    channels: Array.isArray(r.channels) ? r.channels : d.channels,
  };
}
