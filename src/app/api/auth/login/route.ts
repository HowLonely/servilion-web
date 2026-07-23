import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { REFRESH_COOKIE_NAME, refreshCookieOptions } from "@/lib/auth/cookies";

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json();

  const backendRes = await fetch(`${process.env.DJANGO_API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await backendRes.json();
  if (!backendRes.ok) {
    return NextResponse.json(data, { status: backendRes.status });
  }

  const cookieStore = await cookies();
  cookieStore.set(REFRESH_COOKIE_NAME, data.refresh, refreshCookieOptions());

  return NextResponse.json({ access: data.access, user: data.user });
}
