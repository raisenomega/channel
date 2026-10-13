import { Result, ok, err } from "../../shared/domain/result.ts";
import { SchedulerJobState, calcularProximaEjecucion } from "../domain/scheduler.entity.ts";

export interface CronJobRegistrado {
  readonly job: SchedulerJobState;
  readonly handle: () => Promise<void>;
}

export type RegistryError = {
  readonly kind: "job_duplicado";
  readonly id: string;
};

/**
 * Registro de jobs de cron a nivel de infraestructura.
 * Solo estructura: agrega y lista jobs. No los ejecuta.
 */
export class CronRegistry {
  private readonly jobs = new Map<string, CronJobRegistrado>();

  agregar(
    job: SchedulerJobState,
    handle: () => Promise<void>,
  ): Result<void, RegistryError> {
    if (this.jobs.has(job.id)) return err({ kind: "job_duplicado", id: job.id });

    this.jobs.set(job.id, { job, handle });
    return ok(undefined);
  }

  listar(): readonly CronJobRegistrado[] {
    return Array.from(this.jobs.values());
  }

  resolver(id: string): Result<CronJobRegistrado, RegistryError> {
    const registrado = this.jobs.get(id);
    if (!registrado) return err({ kind: "job_duplicado", id });
    return ok(registrado);
  }

  /**
   * Recalcula la proxima ejecucion de un job a partir de su ultima/actual.
   * Devuelve una copia actualizada del estado sin persistir efectos.
   */
  recalcularSiguiente(
    job: SchedulerJobState,
    ahoraMs: number,
  ): Promise<Result<SchedulerJobState, never>> {
    const previo = this.jobs.get(job.id);
    const handle = previo?.handle ?? (async () => {});
    const actualizado: SchedulerJobState = Object.freeze({
      ...job,
      ultimaEjecucion: ahoraMs,
      proximaEjecucion: calcularProximaEjecucion(ahoraMs, job.cadenciaMs),
    });
    this.jobs.set(job.id, { job: actualizado, handle });
    return Promise.resolve(ok(actualizado));
  }
}