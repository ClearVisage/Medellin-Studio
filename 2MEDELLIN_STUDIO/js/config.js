
/* MEDELLÍN STUDIO — CONFIGURACIÓN SUPABASE */

const SUPABASE_URL = "https://rkyvobnlyuwitscvhfwn.supabase.co";

const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_jzVNIAqDRUjcsqdbE3aeJw__CNZkUbk";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);