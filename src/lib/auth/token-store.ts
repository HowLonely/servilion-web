// Almacena el access token JWT únicamente en memoria (nunca en localStorage).
// Se lee de forma síncrona desde el cliente API (fuera del árbol de React) y
// puede suscribirse desde React vía useSyncExternalStore (ver use-session.ts).

let accessToken: string | null = null;

type Listener = () => void;
const listeners = new Set<Listener>();

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
  listeners.forEach((listener) => listener());
}

export function subscribeAccessToken(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
