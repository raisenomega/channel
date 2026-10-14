import type { Session } from "@supabase/supabase-js";

export function datosDeSesion(session: Session | null): {
  email: string;
  tenant: string;
  plan: string;
} {
  if (!session?.user?.email) {
    return { email: "\u2014", tenant: "\u2014", plan: "\u2014" };
  }
  const meta = session.user.user_metadata ?? {};
  const tenant: string =
    (meta.tenant_name as string | undefined) ??
    (meta.tenant as string | undefined) ??
    "\u2014";
  const plan: string =
    (meta.plan as string | undefined) ??
    (meta.tenant_plan as string | undefined) ??
    "Ecosystem";
  return {
    email: session.user.email,
    tenant,
    plan,
  };
}