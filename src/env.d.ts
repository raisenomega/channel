/**
 * HUB by Raisen — Declaracion minima del runtime Deno para typecheck.
 * El modulo @supabase/supabase-js lo provee la dependencia real (node_modules).
 */

declare namespace Deno {
  const env: {
    get(name: string): string | undefined;
  };
  function exit(code?: number): never;
}