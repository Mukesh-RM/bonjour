import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createToken,
  getCookieName,
  getCookieOptions,
  isValidUsername,
} from "@/lib/auth";
import { corsPreflightResponse, errorResponse, handleApiError, jsonResponse } from "@/lib/api-utils";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
});

export async function OPTIONS() {
  return corsPreflightResponse();
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const limit = rateLimit(`login:${ip}`, 10, 60_000);
    if (!limit.success) {
      return errorResponse("Too many login attempts. Try again later.", 429);
    }

    const body = await request.json();
    const { username } = loginSchema.parse(body);

    if (!isValidUsername(username)) {
      return errorResponse("Invalid username. Use user1 or user2.", 401);
    }

    const supabase = getSupabaseAdmin();
    const { data: user, error } = await supabase
      .from("auth_users")
      .select("id, username")
      .eq("username", username)
      .single();

    if (error || !user) {
      return errorResponse("User not found", 404);
    }

    const token = await createToken({
      id: user.id,
      username: user.username as "user1" | "user2",
    });

    const response = jsonResponse({
      user: { id: user.id, username: user.username },
    });

    response.cookies.set(getCookieName(), token, getCookieOptions());

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
