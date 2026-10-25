/**
 * HUB by Raisen — Sistema B rebanada 2b (cerebro de decision): procesa UNA conversacion quieta -> aplica
 * las reglas (no repetir el episodio, max intentos, muy vieja, umbral de %) -> si vale, persiste el borrador
 * de cierre. Orquestador PURO sobre puertos (testeable sin DB ni IA real). No auto-envia. C4 <=75. Sin any.
 */
import type { QuietConv } from "./followup-scanner.ts";
import type { ClosingDraftProducer, ThreadMsg, ClosingDraft } from "./closing-draft.producer.ts";

export interface StrategicDeps {
  readonly leerHilo: (convId: string) => Promise<readonly ThreadMsg[]>;
  readonly estadoSeguimiento: (convId: string) => Promise<{ intentos: number; ultimoBorradorAt: string | null }>;
  readonly contextoNegocio: (tenantId: string) => Promise<string>;
  readonly cerrador: ClosingDraftProducer;
  readonly persistir: (conv: QuietConv, d: ClosingDraft) => Promise<void>;
  readonly umbralConfianza: number; // % minimo para generar (ej. 50)
  readonly maxIntentos: number;     // intentos por conversacion (ej. 2: 5h + semanal)
  readonly maxDiasViejo: number;    // ignora hilos mas viejos que esto (ej. 30)
}

const DIA_MS = 86_400_000;

export class StrategicDraftService {
  constructor(private readonly d: StrategicDeps) {}

  async procesar(conv: QuietConv): Promise<string> {
    const edadDias = conv.lastMessageAt ? (Date.now() - new Date(conv.lastMessageAt).getTime()) / DIA_MS : 9999;
    if (edadDias > this.d.maxDiasViejo) return "muy_viejo";
    const est = await this.d.estadoSeguimiento(conv.id);
    if (est.intentos >= this.d.maxIntentos) return "max_intentos";
    if (est.ultimoBorradorAt && conv.lastMessageAt && est.ultimoBorradorAt > conv.lastMessageAt) return "ya_nudge_este_episodio";
    const thread = await this.d.leerHilo(conv.id);
    if (thread.length === 0) return "hilo_vacio";
    const r = await this.d.cerrador.producir(thread, await this.d.contextoNegocio(conv.tenantId));
    if (!r.ok) return "cerrador_fallo";
    if (!r.value.worth || r.value.confidence < this.d.umbralConfianza) return `descartado(worth=${r.value.worth},conf=${r.value.confidence})`;
    await this.d.persistir(conv, r.value);
    return `borrador_creado(conf=${r.value.confidence})`;
  }
}
