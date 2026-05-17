import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ??
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    "Supabase URL ausente. Defina VITE_SUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL).",
  );
}

if (!supabaseKey) {
  throw new Error(
    "Supabase key ausente. Defina VITE_SUPABASE_ANON_KEY (ou NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).",
  );
}

export const createClient = () =>
  createBrowserClient(supabaseUrl, supabaseKey);
