import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { getLoginDestination } from "./lib/login-redirect";
import { ROLES } from "./modules/auth/server/permissions";

// Optimistic check: only looks at the session cookie. Role and status are
// validated by requireAuth in the /internal and /client layouts, so the proxy
// doesn't call the backend on every request (prefetches, HEAD probes, etc.).
export async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hasSessionCookie = Boolean(getSessionCookie(request));

  const isInternalRoute = url.pathname.startsWith("/internal");
  const isClientRoute = url.pathname.startsWith("/client");
  const isAuthRoute = url.pathname === "/login" || url.pathname === "/";

  if (isInternalRoute || isClientRoute) {
    if (hasSessionCookie) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-portal-return-to", `${url.pathname}${url.search}`);
      return NextResponse.next({ request: { headers: requestHeaders } });
    }
    const destination = `${url.pathname}${url.search}`;
    url.pathname = "/login";
    url.search = new URLSearchParams({ next: destination }).toString();
    return NextResponse.redirect(url);
  }

  // Only a real page visit to / or /login needs the role, to send the user to
  // their dashboard.
  if (!isAuthRoute || !hasSessionCookie || request.method !== "GET") {
    return NextResponse.next();
  }

  let session = null;
  try {
    const response = await fetch(new URL("/api/auth/get-session", request.url), {
      cache: "no-store",
      headers: { cookie: request.headers.get("cookie") || "" },
    });
    if (response.ok) session = await response.json();
  } catch (error) {
    console.error("Error fetching session in proxy", error);
  }

  const userRole = session?.user?.role;
  if (!Object.values(ROLES).includes(userRole) || session.user.status !== "ACTIVE") {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL(getLoginDestination(url.search, userRole), request.url));
}
