/**
 * HUB by Raisen — Entidad de conexión de red social (Slide 4.2a).
 * ChannelConnection por tenant+platform. C4 ≤75.
 */

export type SocialPlatform =
  | "whatsapp" | "instagram" | "facebook" | "telegram" | "sms" | "x" | "linkedin";

export type ConnectionStatus = "connected" | "awaiting" | "disconnected";

export interface ChannelConnection {
  readonly id: string;
  readonly tenantId: string;
  readonly platform: SocialPlatform;
  readonly zernioAccountId: string | null;
  readonly handle: string | null;
  readonly followersCount: number | null;
  readonly status: ConnectionStatus;
  readonly isPrimary: boolean;
  readonly isPaused: boolean;
  readonly autoPublishAllowed: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export const SOCIAL_PLATFORMS: ReadonlyArray<SocialPlatform> = Object.freeze([
  "whatsapp", "instagram", "facebook", "telegram", "sms", "x", "linkedin",
]);