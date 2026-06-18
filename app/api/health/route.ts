import { getEnvStatus } from "@/lib/env";
import { corsPreflightResponse, jsonResponse } from "@/lib/api-utils";

export const runtime = "nodejs";

export async function OPTIONS() {
  return corsPreflightResponse();
}

export async function GET() {
  const envStatus = getEnvStatus();
  return jsonResponse({
    ok: envStatus.ok,
    missing: envStatus.ok ? [] : envStatus.missing,
  });
}
