import { passwordsConfigured } from "@/lib/passwords";

export function getEnvStatus(): { ok: true } | { ok: false; missing: string[] } {
  const missing: string[] = [];

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    missing.push("SUPABASE_SERVICE_ROLE_KEY");
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    missing.push("JWT_SECRET (min 32 characters)");
  }
  if (!passwordsConfigured()) {
    missing.push("USER1_PASSWORD and USER2_PASSWORD");
  }

  if (missing.length > 0) {
    return { ok: false, missing };
  }

  return { ok: true };
}
