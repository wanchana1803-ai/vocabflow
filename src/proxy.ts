import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { parseSessionCookieValue } from "@/lib/auth/session-cookie";

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  let effectiveUser = user;
  let effectiveRole: string | null = null;

  if (effectiveUser) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", effectiveUser.id)
      .maybeSingle();
    effectiveRole = profile?.role ?? "user";
  } else {
    // Check fallback dev cookie if Supabase is unconfigured
    const localSession = request.cookies.get("vocabflow_session");
    if (localSession?.value) {
      const parsed = parseSessionCookieValue(localSession.value);
      if (parsed) {
        effectiveUser = parsed.user;
        effectiveRole = parsed.profile.role;
      }
    }
  }

  // 1. Check Admin Routes: /admin and all subpaths
  if (pathname.startsWith("/admin")) {
    if (!effectiveUser) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (effectiveRole !== "admin") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  // 2. Check Account Route: /account requires login
  if (pathname.startsWith("/account")) {
    if (!effectiveUser) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Guest Mode Check: When guest mode is disabled, study routes require authentication
  const allowGuestMode = process.env.NEXT_PUBLIC_ALLOW_GUEST_MODE !== "false";
  if (!allowGuestMode) {
    const protectedUserRoutes = ["/learn", "/review", "/vocabulary", "/progress", "/settings"];
    const isProtected = protectedUserRoutes.some((route) => pathname.startsWith(route));

    if (isProtected && !effectiveUser) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|csv|json)$).*)",
  ],
};
