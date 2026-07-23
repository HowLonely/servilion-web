import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { REFRESH_COOKIE_NAME, refreshCookieOptions } from "@/lib/auth/cookies";

export async function POST(): Promise<NextResponse> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;

  if (!refreshToken) {
    return NextResponse.json({ detail: "No autenticado." }, { status: 401 });
  }

  const backendRes = await fetch(`${process.env.DJANGO_API_URL}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: refreshToken }),
  });

  const data = await backendRes.json();
  if (!backendRes.ok) {
    cookieStore.delete(REFRESH_COOKIE_NAME);
    return NextResponse.json(data, { status: backendRes.status });
  }

  cookieStore.set(REFRESH_COOKIE_NAME, data.refresh, refreshCookieOptions());
  return NextResponse.json({ access: data.access, user: data.user });
}
