const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000';

export function backendUrl(path: string): string {
  return `${BACKEND_URL}${path}`;
}

export async function backendFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(backendUrl(path), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
}
