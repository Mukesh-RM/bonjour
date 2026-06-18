import { NextRequest } from "next/server";
import { getOtherUsername, getSessionFromRequest } from "@/lib/auth";
import { corsPreflightResponse, errorResponse, handleApiError, jsonResponse } from "@/lib/api-utils";

export const runtime = "nodejs";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const presenceStore = new Map<string, { online: boolean; lastSeen: string }>();

export async function OPTIONS() {
  return corsPreflightResponse();
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    const otherUsername = getOtherUsername(session.username);
    const supabase = getSupabaseAdmin();

    const { data: otherUser } = await supabase
      .from("auth_users")
      .select("id, username")
      .eq("username", otherUsername)
      .single();

    if (!otherUser) {
      return errorResponse("User not found", 404);
    }

    const presence = presenceStore.get(otherUser.id);

    return jsonResponse({
      online: presence?.online ?? false,
      username: otherUsername,
      lastSeen: presence?.lastSeen ?? null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const online = Boolean(body.online);

    presenceStore.set(session.id, {
      online,
      lastSeen: new Date().toISOString(),
    });

    return jsonResponse({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
