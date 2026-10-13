/**
 * HUB by Raisen — Logging estructurado (shared infrastructure)
 * Funciona en backend (Deno/Node) y frontend (navegador). Sin dependencias
 * externas (respeta C5 y CSP). Niveles: debug, info, warn, error.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  readonly fase?: string;
  readonly tenantId?: string;
  readonly uid?: string;
  readonly causa?: string;
}

export interface LogEntry {
  readonly ts: string;
  readonly level: LogLevel;
  readonly msg: string;
}

function timestamp(): string {
  return new Date().toISOString();
}

function render(entry: LogEntry, context: LogContext): string {
  const base = `${entry.ts} [${entry.level}] ${entry.msg}`;
  const extra: string[] = [];
  if (context.fase) extra.push(`fase=${context.fase}`);
  if (context.tenantId) extra.push(`tenant=${context.tenantId}`);
  if (context.uid) extra.push(`uid=${context.uid}`);
  if (context.causa) extra.push(`causa=${context.causa}`);
  return extra.length ? `${base} (${extra.join(" ")})` : base;
}

function emit(level: LogLevel, line: string): void {
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export function registrar(level: LogLevel, msg: string, context: LogContext = {}): void {
  const entry: LogEntry = { ts: timestamp(), level, msg };
  emit(level, render(entry, context));
}

export const logger = Object.freeze({
  debug: (msg: string, context?: LogContext): void => registrar("debug", msg, context),
  info: (msg: string, context?: LogContext): void => registrar("info", msg, context),
  warn: (msg: string, context?: LogContext): void => registrar("warn", msg, context),
  error: (msg: string, context?: LogContext): void => registrar("error", msg, context),
});