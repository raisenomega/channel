/**
 * HUB by Raisen — Tipos de automatizacion.
 */

export interface RowAutomationRule {
  id: string;
  name: string;
  trigger_event: string;
  action_type: string;
  action_config: Record<string, unknown> | null;
  enabled: boolean;
  created_at: string;
}