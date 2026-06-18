import { NextRequest } from "next/server";
import { z } from "zod";
import { getOtherUsername, getSessionFromRequest } from "@/lib/auth";

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

const sendSchema = z.object({
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(4000, "Message too long"),
});

const querySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

export async function OPTIONS() {
  return corsPreflightResponse();
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const { limit, offset } = querySchema.parse({
      limit: searchParams.get("limit") ?? undefined,
      offset: searchParams.get("offset") ?? undefined,
    });

    const supabase = getSupabaseAdmin();
    const otherUsername = getOtherUsername(session.username);

    const { data: users } = await supabase
      .from("auth_users")
      .select("id, username")
      .in("username", [session.username, otherUsername]);

    const otherUser = users?.find((u) => u.username === otherUsername);
    if (!otherUser) {
      return errorResponse("Recipient not found", 404);
    }

    const { data: messages, error, count } = await supabase
      .from("messages")
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
      `,
        { count: "exact" }
      )
      .or(
        `and(sender_id.eq.${session.id},recipient_id.eq.${otherUser.id}),and(sender_id.eq.${otherUser.id},recipient_id.eq.${session.id})`
      )
      .eq("is_deleted", false)
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(error.message);
    }

    const formatted: MessageWithSender[] = (messages ?? []).map((m) =>
      formatMessage(m)
    );

    return jsonResponse({ messages: formatted, total: count ?? 0 });
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

    const ip = getClientIp(request);
    const limit = rateLimit(`messages:${session.id}:${ip}`, 30, 60_000);
    if (!limit.success) {
      return errorResponse("Rate limit exceeded. Slow down.", 429);
    }

    const body = await request.json();
    const { content } = parseBody(sendSchema, body);

    const supabase = getSupabaseAdmin();
    const otherUsername = getOtherUsername(session.username);

    const { data: recipient } = await supabase
      .from("auth_users")
      .select("id")
      .eq("username", otherUsername)
      .single();

    if (!recipient) {
      return errorResponse("Recipient not found", 404);
    }

    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        sender_id: session.id,
        recipient_id: recipient.id,
        content: content.trim(),
      })
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
      throw new Error(error?.message ?? "Failed to send message");
    }

    const formatted = formatMessage(message);

    return jsonResponse({ message: formatted }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
