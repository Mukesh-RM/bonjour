import { NextResponse } from "next/server";
import { getCookieName } from "@/lib/auth";
import { corsPreflightResponse, jsonResponse } from "@/lib/api-utils";

export const runtime = "nodejs";

export async function OPTIONS() {
  return corsPreflightResponse();
}

export async function POST() {
  const response = jsonResponse({ success: true });
  response.cookies.set(getCookieName(), "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
