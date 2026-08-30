import { NextRequest, NextResponse } from "next/server";
import { ROLES } from "./modules/auth/server/permissions";

export async function proxy(request: NextRequest) {
  // Fetch the session through Better Auth's route to avoid importing Prisma here.
  const sessionUrl = new URL("/api/auth/get-session", request.url);

  let session = null;
  try {
    const response = await fetch(sessionUrl.toString(), {
      cache: "no-store",
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    });
    if (response.ok) {
      session = await response.json();
    }
  } catch (error) {
    console.error("Error fetching session in proxy", error);
  }

  const url = request.nextUrl.clone();

  const isInternalRoute = url.pathname.startsWith("/internal");
  const isClientRoute = url.pathname.startsWith("/client");
  const isAuthRoute = url.pathname === "/login" || url.pathname === "/";

  if (!session || !session.user) {
    if (isInternalRoute || isClientRoute) {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const userRole = session.user.role;
  const userStatus = session.user.status;

  if (!Object.values(ROLES).includes(userRole) || userStatus !== "ACTIVE") {
    if (isInternalRoute || isClientRoute) {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (isAuthRoute) {
    if (userRole === ROLES.ADMIN || userRole === ROLES.WORKER) {
      url.pathname = "/internal/dashboard";
    } else {
      url.pathname = "/client/dashboard";
    }
    return NextResponse.redirect(url);
  }

  if (isInternalRoute) {
    if (userRole === ROLES.CLIENT) {
      url.pathname = "/client/dashboard";
      return NextResponse.redirect(url);
    }

    if (
      userRole === ROLES.WORKER &&
      (url.pathname.startsWith("/internal/workers") ||
        url.pathname.startsWith("/internal/settings"))
    ) {
      url.pathname = "/internal/dashboard";
      return NextResponse.redirect(url);
    }
  }

  if (isClientRoute && (userRole === ROLES.ADMIN || userRole === ROLES.WORKER)) {
    url.pathname = "/internal/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
