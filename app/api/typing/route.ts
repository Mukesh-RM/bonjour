import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { corsPreflightResponse, errorResponse, handleApiError, jsonResponse } from "@/lib/api-utils";

export const runtime = "nodejs";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const typingStore = new Map<string, { isTyping: boolean; updatedAt: number }>();

export async function OPTIONS() {
  return corsPreflightResponse();
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    const now = Date.now();
    const entries: { userId: string; isTyping: boolean }[] = [];

    for (const [userId, data] of Array.from(typingStore.entries())) {
      if (userId === session.id) continue;
      if (now - data.updatedAt > 3000) {
        typingStore.delete(userId);
        continue;
      }
      if (data.isTyping) {
        entries.push({ userId, isTyping: true });
      }
    }

    return jsonResponse({ typing: entries.length > 0 });
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
    const limit = rateLimit(`typing:${session.id}:${ip}`, 60, 60_000);
    if (!limit.success) {
      return errorResponse("Rate limit exceeded", 429);
    }

    const body = await request.json();
    const isTyping = Boolean(body.isTyping);

    typingStore.set(session.id, {
      isTyping,
      updatedAt: Date.now(),
    });

    return jsonResponse({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

setInterval(() => {
  const now = Date.now();
  Array.from(typingStore.entries()).forEach(([userId, data]) => {
    if (now - data.updatedAt > 5000) {
      typingStore.delete(userId);
    }
  });
}, 10_000);
