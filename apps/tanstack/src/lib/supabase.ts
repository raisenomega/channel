/**
 * HUB by Raisen — Barrel de Supabase.
 */
export { getSupabaseUrl, getAnonKey, getSupabase } from "./supabase/config";
export { supabaseAuthHeaders, supabaseRestBase } from "./supabase/rest-base";
export { restGet, restPost, restPatch } from "./supabase/rest-operations";
export type { RestResult, RestError, RestRes } from "./supabase/types";