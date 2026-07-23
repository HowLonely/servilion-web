import createClient from "openapi-fetch";

import { getAccessToken } from "@/lib/auth/token-store";
import { refreshAccessToken } from "@/lib/auth/refresh";

import type { paths } from "./schema";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const token = getAccessToken();
  const headers = new Headers(init?.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(input, { ...init, headers });
  if (response.status !== 401 || !token) return response;

  const newToken = await refreshAccessToken();
  if (!newToken) return response;

  const retryHeaders = new Headers(init?.headers);
  retryHeaders.set("Authorization", `Bearer ${newToken}`);
  return fetch(input, { ...init, headers: retryHeaders });
}

export const api = createClient<paths>({ baseUrl, fetch: authFetch });
