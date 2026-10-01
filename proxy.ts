import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const AUTH_COOKIE = "codelaunch_auth";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return secret;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(AUTH_COOKIE)?.value;

  let isAuthenticated = false;
  let userRole: string | null = null;

  // ------------------------------------------------------------
  // VERIFY TOKEN
  // ------------------------------------------------------------

  if (token) {
    try {
      const decoded = jwt.verify(
        token,
        getJwtSecret()
      ) as jwt.JwtPayload;

      if (decoded?.id && decoded?.email && decoded?.role) {
        isAuthenticated = true;
        userRole = String(decoded.role);
      }
    } catch {
      // Token expired / invalid
      isAuthenticated = false;
    }
  }

  // ------------------------------------------------------------
  // PUBLIC ROUTES
  // ------------------------------------------------------------

  const publicRoutes = [
    "/certificate/verify",
  ];

  const isPublicRoute = publicRoutes.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(`${route}/`)
  );

  // ------------------------------------------------------------
  // API ROUTES
  // ------------------------------------------------------------

  // Do not protect API routes here.
  //
  // Individual API routes should perform their own
  // authentication/authorization.
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // ------------------------------------------------------------
  // STATIC / NEXT INTERNAL ROUTES
  // ------------------------------------------------------------

  if (
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname.match(/\.(.*)$/)
  ) {
    return NextResponse.next();
  }

  // ------------------------------------------------------------
  // PUBLIC CERTIFICATE VERIFICATION
  // ------------------------------------------------------------

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // ------------------------------------------------------------
  // AUTHENTICATED USER TRYING TO ACCESS LANDING PAGE
  // ------------------------------------------------------------

  if (pathname === "/" && isAuthenticated) {
    if (
      userRole === "ADMIN" ||
      userRole === "SUPER_ADMIN"
    ) {
      return NextResponse.redirect(
        new URL("/admin", request.url)
      );
    }

    return NextResponse.redirect(
      new URL("/dashboard", request.url)
    );
  }

  // ------------------------------------------------------------
  // ADMIN ROUTES
  // ------------------------------------------------------------

  if (pathname.startsWith("/admin")) {
    if (!isAuthenticated) {
      return NextResponse.redirect(
        new URL("/", request.url)
      );
    }

    if (
      userRole !== "ADMIN" &&
      userRole !== "SUPER_ADMIN"
    ) {
      return NextResponse.redirect(
        new URL("/dashboard", request.url)
      );
    }

    return NextResponse.next();
  }

  // ------------------------------------------------------------
  // USER DASHBOARD
  // ------------------------------------------------------------

  if (pathname.startsWith("/dashboard")) {
    if (!isAuthenticated) {
      return NextResponse.redirect(
        new URL("/", request.url)
      );
    }

    return NextResponse.next();
  }

  // ------------------------------------------------------------
  // AUTHENTICATED USER ACCESSING AUTH PAGES
  // ------------------------------------------------------------

  const authPages = [
    "/login",
    "/signup",
    "/register",
  ];

  const isAuthPage = authPages.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(`${route}/`)
  );

  if (isAuthPage && isAuthenticated) {
    if (
      userRole === "ADMIN" ||
      userRole === "SUPER_ADMIN"
    ) {
      return NextResponse.redirect(
        new URL("/admin", request.url)
      );
    }

    return NextResponse.redirect(
      new URL("/dashboard", request.url)
    );
  }

  // ------------------------------------------------------------
  // DEFAULT
  // ------------------------------------------------------------

  return NextResponse.next();
}

// ------------------------------------------------------------
// MATCHER
// ------------------------------------------------------------

export const config = {
  matcher: [
    /*
     * Run Proxy on application routes.
     *
     * Exclude:
     * - API routes
     * - Next.js internals
     * - static files
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};