/**
 * HUB by Raisen — Monitor de errores del frontend (Fase F)
 * Captura errores globales y los registra con contexto. Puerta de entrada
 * para una futura integracion con Sentry cuando exista DSN.
 */
import { logger, LogContext } from "@shared/infrastructure/logger.infrastructure.ts";

export interface MonitorOptions {
  readonly fase: string;
}

interface ErrorEventLike {
  readonly message?: string;
  readonly filename?: string;
  readonly lineno?: number;
}

interface RejectionLike {
  readonly reason?: unknown;
}

function contextDe(base: LogContext, extra: LogContext = {}): LogContext {
  return { ...base, ...extra };
}

export function iniciarMonitor(opts: MonitorOptions): void {
  const base: LogContext = { fase: opts.fase };

  const onError = (event: ErrorEventLike): void => {
    const msg = event.message ?? "error_no_descripto";
    logger.error(msg, contextDe(base, { uid: alcanzarUid() }));
    void event;
  };

  const onRejection = (event: RejectionLike): void => {
    const msg = event.reason instanceof Error
      ? event.reason.message
      : String(event.reason ?? "rejection_desconocida");
    logger.error(msg, contextDe(base, { uid: alcanzarUid() }));
  };

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);
}

function alcanzarUid(): string | undefined {
  const raw = typeof localStorage !== "undefined" ? localStorage.getItem("hub.session") : null;
  if (!raw) return undefined;
  try {
    const j = JSON.parse(raw) as { uid?: string };
    return j.uid;
  } catch {
    return undefined;
  }
}