import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const ACCESS_COOKIE_KEY = "ai_video_ops_preview_access";

function accessEnabled() {
  return process.env.PREVIEW_ACCESS_ENABLED?.toLowerCase() === "true";
}

function expectedPassword() {
  const value = process.env.PREVIEW_ACCESS_PASSWORD?.trim();
  return value && value.length > 0 ? value : null;
}

export function middleware(request: NextRequest) {
  if (!accessEnabled()) {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;
  const isPublicPath =
    pathname === "/access" ||
    pathname.startsWith("/api/access") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public") ||
    pathname.startsWith("/api/health");

  if (isPublicPath) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(ACCESS_COOKIE_KEY)?.value;
  const password = expectedPassword();

  if (password && cookie === password) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/access";
  url.searchParams.set("redirect", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
