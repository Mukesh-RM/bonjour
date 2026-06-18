import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCookieName, verifyToken } from "@/lib/auth";

const publicPaths = ["/login", "/api/auth/login", "/api/health"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (request.method === "OPTIONS") {
    return NextResponse.next();
  }

  if (
    publicPaths.some((path) => pathname === path) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(getCookieName())?.value;

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = await verifyToken(token);

  if (!payload) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.set(getCookieName(), "", { maxAge: 0, path: "/" });
    return response;
  }

  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/chat", request.url));
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/chat", request.url));
  }

  const response = NextResponse.next();
  response.headers.set("x-user-id", payload.sub);
  response.headers.set("x-username", payload.username);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
