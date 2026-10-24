/**
 * HUB by Raisen — Contexto de plataforma para Victor (B2 canales + B3 humanos que atienden). Lo sabe
 * HUB (no lo escribe el dueno). Horario/SLA ya vienen del contexto del negocio (no se duplican). C4 <=75.
 */
export interface PlatformContext {
  readonly channels: readonly string[];     // canales conectados (B2)
  readonly humanAgents: readonly string[];  // humanos activos que atienden, para escalar (B3)
}

export function buildPlatformFacts(p: PlatformContext): readonly string[] {
  const f: string[] = [];
  f.push(p.channels.length ? `Canales conectados: ${p.channels.join(", ")}` : "Canales conectados: ninguno aun");
  f.push(p.humanAgents.length ? `Humanos que atienden (a ellos escalas): ${p.humanAgents.join(", ")}` : "Humanos que atienden: ninguno configurado aun");
  return Object.freeze(f);
}
