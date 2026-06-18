import { NextRequest } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth";

export const runtime = "nodejs";
import {
  corsPreflightResponse,
  errorResponse,
  handleApiError,
  jsonResponse,
  parseBody,
} from "@/lib/api-utils";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { formatMessage } from "@/lib/messages";
import { MessageWithSender } from "@/lib/types";

const editSchema = z.object({
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(4000, "Message too long"),
});

export async function OPTIONS() {
  return corsPreflightResponse();
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    const ip = getClientIp(request);
    const limit = rateLimit(`edit:${session.id}:${ip}`, 20, 60_000);
    if (!limit.success) {
      return errorResponse("Rate limit exceeded", 429);
    }

    const body = await request.json();
    const { content } = parseBody(editSchema, body);

    const supabase = getSupabaseAdmin();

    const { data: existing } = await supabase
      .from("messages")
      .select("id, sender_id, is_deleted")
      .eq("id", params.id)
      .single();

    if (!existing) {
      return errorResponse("Message not found", 404);
    }

    if (existing.sender_id !== session.id) {
      return errorResponse("Forbidden", 403);
    }

    if (existing.is_deleted) {
      return errorResponse("Cannot edit deleted message", 400);
    }

    const { data: message, error } = await supabase
      .from("messages")
      .update({
        content: content.trim(),
        edited_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select(
        `
        id,
        sender_id,
        recipient_id,
        content,
        is_deleted,
        edited_at,
        read_at,
        created_at,
        sender:auth_users!messages_sender_id_fkey(id, username)
      `
      )
      .single();

    if (error || !message) {
      throw new Error(error?.message ?? "Failed to edit message");
    }

    const formatted = formatMessage(message);

    return jsonResponse({ message: formatted });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    const ip = getClientIp(request);
    const limit = rateLimit(`delete:${session.id}:${ip}`, 20, 60_000);
    if (!limit.success) {
      return errorResponse("Rate limit exceeded", 429);
    }

    const supabase = getSupabaseAdmin();

    const { data: existing } = await supabase
      .from("messages")
      .select("id, sender_id, is_deleted")
      .eq("id", params.id)
      .single();

    if (!existing) {
      return errorResponse("Message not found", 404);
    }

    if (existing.sender_id !== session.id) {
      return errorResponse("Forbidden", 403);
    }

    if (existing.is_deleted) {
      return errorResponse("Message already deleted", 400);
    }

    const { data: message, error } = await supabase
      .from("messages")
      .update({ is_deleted: true })
      .eq("id", params.id)
      .select(
        `
        id,
        sender_id,
        recipient_id,
        content,
        is_deleted,
        edited_at,
        read_at,
        created_at,
        sender:auth_users!messages_sender_id_fkey(id, username)
      `
      )
      .single();

    if (error || !message) {
      throw new Error(error?.message ?? "Failed to delete message");
    }

    const formatted = formatMessage(message);

    return jsonResponse({ message: formatted });
  } catch (error) {
    return handleApiError(error);
  }
}
