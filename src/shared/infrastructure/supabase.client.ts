import { createClient } from "@supabase/supabase-js";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

if (!supabaseUrl || !supabaseKey) {
  console.error("[HUB] ERROR: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas.");
  console.error("[HUB] Crear .env.development desde .env.example y cargar con: source .env.development");
  Deno.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: "public" },
  global: {
    headers: {
      "x-tenant-id": "",
      "x-app-name": "hub-by-raisen",
    },
  },
  auth: {
    persistSession: false,
    autoRefreshToken: true,
  },
});