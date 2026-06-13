/* ============================================================
   PUNKU — Cliente Supabase (SOLO server-side)  ·  specs 05, 06
   ------------------------------------------------------------
   Usa la service_role key, que bypassa RLS. Por eso este módulo JAMÁS debe
   importarse desde un componente cliente: solo desde API routes / store server.
   Si las variables no están, hasSupabase() = false y el sistema cae al almacén
   en memoria (la demo nunca se cae).
   ============================================================ */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function hasSupabase(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

let _client: SupabaseClient | null = null;

/** Cliente admin (service_role). Solo backend. */
export function supabaseAdmin(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.SUPABASE_SERVICE_ROLE_KEY as string,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
  }
  return _client;
}
