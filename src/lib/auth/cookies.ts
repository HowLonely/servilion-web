export const REFRESH_COOKIE_NAME = "servilion_refresh";

type CookieOptions = {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax" | "strict" | "none";
  path: string;
  maxAge: number;
};

// El refresh token JWT solo debe viajar en una cookie httpOnly, nunca a JS del cliente.
export function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 días
  };
}
