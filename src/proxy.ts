import { NextResponse, type NextRequest } from "next/server";

import { REFRESH_COOKIE_NAME } from "@/lib/auth/cookies";

// Guardia optimista basada en la presencia de la cookie httpOnly de refresh.
// No reemplaza la autorización real (que sigue validando el backend), solo
// evita que se sirva UI protegida sin una sesión potencialmente válida.
export function proxy(request: NextRequest): NextResponse {
  const hasSession = request.cookies.has(REFRESH_COOKIE_NAME);
  const { pathname } = request.nextUrl;
  const isLoginPage = pathname.startsWith("/login");

  if (!hasSession && !isLoginPage) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (hasSession && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
