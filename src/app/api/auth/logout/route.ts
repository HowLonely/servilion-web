import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { REFRESH_COOKIE_NAME } from "@/lib/auth/cookies";

export async function POST(): Promise<NextResponse> {
  const cookieStore = await cookies();
  cookieStore.delete(REFRESH_COOKIE_NAME);
  return new NextResponse(null, { status: 204 });
}
