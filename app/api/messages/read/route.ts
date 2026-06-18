import { NextRequest } from "next/server";
import { getOtherUsername, getSessionFromRequest } from "@/lib/auth";

export const runtime = "nodejs";
import { corsPreflightResponse, errorResponse, handleApiError, jsonResponse } from "@/lib/api-utils";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function OPTIONS() {
  return corsPreflightResponse();
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    const supabase = getSupabaseAdmin();
    const otherUsername = getOtherUsername(session.username);

    const { data: otherUser } = await supabase
      .from("auth_users")
      .select("id")
      .eq("username", otherUsername)
      .single();

    if (!otherUser) {
      return errorResponse("User not found", 404);
    }

    const now = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from("messages")
      .update({ read_at: now })
      .eq("recipient_id", session.id)
      .eq("sender_id", otherUser.id)
      .is("read_at", null)
      .eq("is_deleted", false)
      .select("id");

    if (error) {
      throw new Error(error.message);
    }

    return jsonResponse({ marked: updated?.length ?? 0 });
  } catch (error) {
    return handleApiError(error);
  }
}
