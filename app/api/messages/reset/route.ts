import { NextRequest } from "next/server";
import { getOtherUsername, getSessionFromRequest } from "@/lib/auth";
import { corsPreflightResponse, errorResponse, handleApiError, jsonResponse } from "@/lib/api-utils";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

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

    const { error } = await supabase
      .from("messages")
      .delete()
      .or(
        `and(sender_id.eq.${session.id},recipient_id.eq.${otherUser.id}),and(sender_id.eq.${otherUser.id},recipient_id.eq.${session.id})`
      );

    if (error) {
      throw new Error(error.message);
    }

    return jsonResponse({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
