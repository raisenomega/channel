/**
 * HUB by Raisen — Sistema B (cerebro de decision): procesa UNA conversacion quieta -> reglas (no repetir el
 * episodio salvo repaso semanal, max intentos, muy vieja, umbral %, tope diario) -> si vale, persiste el
 * borrador de cierre. Orquestador PURO sobre puertos (testeable sin DB ni IA). No auto-envia. C4 <=75. Sin any.
 */
import type { QuietConv } from "./followup-scanner.ts";
import type { ClosingDraftProducer, ThreadMsg, ClosingDraft } from "./closing-draft.producer.ts";

export interface StrategicDeps {
  readonly leerHilo: (convId: string) => Promise<readonly ThreadMsg[]>;
  readonly estadoSeguimiento: (convId: string) => Promise<{ intentos: number; ultimoBorradorAt: string | null }>;
  readonly contextoNegocio: (tenantId: string) => Promise<string>;
  readonly cerrador: ClosingDraftProducer;
  readonly persistir: (conv: QuietConv, d: ClosingDraft) => Promise<void>;
  readonly bajoTope: (tenantId: string) => Promise<boolean>; // false si ya alcanzo el tope diario
  readonly umbralConfianza: number; // % minimo (ej. 50)
  readonly maxIntentos: number;     // intentos por conversacion (ej. 2: 5h + semanal)
  readonly maxDiasViejo: number;    // ignora hilos mas viejos (ej. 30)
  readonly diasRepaso: number;      // dias para el 2do intento semanal (ej. 7)
}

const DIA_MS = 86_400_000;

export class StrategicDraftService {
  constructor(private readonly d: StrategicDeps) {}

  async procesar(conv: QuietConv): Promise<string> {
    const edad = conv.lastMessageAt ? (Date.now() - new Date(conv.lastMessageAt).getTime()) / DIA_MS : 9999;
    if (edad > this.d.maxDiasViejo) return "muy_viejo";
    const est = await this.d.estadoSeguimiento(conv.id);
    if (est.intentos >= this.d.maxIntentos) return "max_intentos";
    if (est.ultimoBorradorAt && conv.lastMessageAt && est.ultimoBorradorAt > conv.lastMessageAt) {
      const dias = (Date.now() - new Date(est.ultimoBorradorAt).getTime()) / DIA_MS;
      if (dias < this.d.diasRepaso) return "espera_repaso"; // ya hubo nudge este episodio; aun no toca el semanal
    }
    const thread = await this.d.leerHilo(conv.id);
    if (thread.length === 0) return "hilo_vacio";
    const r = await this.d.cerrador.producir(thread, await this.d.contextoNegocio(conv.tenantId));
    if (!r.ok) return "cerrador_fallo";
    if (!r.value.worth || r.value.confidence < this.d.umbralConfianza) return `descartado(worth=${r.value.worth},conf=${r.value.confidence})`;
    if (!(await this.d.bajoTope(conv.tenantId))) return "tope_diario";
    await this.d.persistir(conv, r.value);
    return `borrador_creado(conf=${r.value.confidence})`;
  }
}
