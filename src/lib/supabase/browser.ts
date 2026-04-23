"use client";

import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  // Validate URL format before creating client
  try {
    new URL(supabaseUrl);
  } catch {
    return null;
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
  );
}
