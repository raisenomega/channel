/**
 * HUB by Raisen — Tipos de dashboard.
 */

export interface DashboardStats {
  readonly total: number;
  readonly porCanal: Readonly<Record<string, number>>;
  readonly sinAsignar: number;
  readonly abiertas: number;
  readonly hasChannelsConnected: boolean;
}