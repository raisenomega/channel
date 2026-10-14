/**
 * HUB by Raisen — Tipos de respuesta REST.
 */

export interface RestResult<T> {
  ok: true; value: T;
}

export interface RestError {
  ok: false; kind: "no_autorizado" | "red" | "config_incompleta"; cause?: string;
}

export type RestRes<T> = RestResult<T> | RestError;