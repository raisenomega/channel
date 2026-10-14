/**
 * HUB by Raisen — Construye la sesión de usuario desde el body de respuesta.
 */
import { Result, err, ok } from "@shared/domain/result.ts";
import type { SessionUsuario, AuthError } from "./types";

export async function sessionDe(body: Record<string, unknown>, email: string): Promise<Result<SessionUsuario, AuthError>> {
  const access = body.access_token as string | undefined;
  const refresh = body.refresh_token as string | undefined;
  const user = body.user as Record<string, unknown> | undefined;
  if (!access || !refresh || !user?.id) return err({ kind: "credenciales_invalidas" });
  return ok({
    accessToken: access,
    refreshToken: refresh,
    uid: user.id as string,
    email: (user.email as string) ?? email,
    tenant: null,
  });
}