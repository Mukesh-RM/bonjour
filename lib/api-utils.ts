import { NextResponse } from "next/server";
import { ZodError, ZodSchema } from "zod";

export function jsonResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function errorResponse(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function parseBody<T>(schema: ZodSchema<T>, body: unknown): T {
  return schema.parse(body);
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    const message = error.errors.map((e) => e.message).join(", ");
    return errorResponse(message, 400);
  }

  if (error instanceof Error) {
    if (error.message.includes("Missing Supabase")) {
      return errorResponse("Server configuration error", 500);
    }
    return errorResponse(error.message, 500);
  }

  return errorResponse("Internal server error", 500);
}

export function corsPreflightResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}
