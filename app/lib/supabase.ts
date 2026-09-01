import { createClient } from "@supabase/supabase-js";

// Do not throw during Next.js build/prerender.
// Real values are provided by Vercel at runtime.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "placeholder";

export const supabase = createClient(url, key);
