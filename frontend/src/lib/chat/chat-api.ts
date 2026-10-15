// Base pública da API para chamadas do browser (BACKEND_URL é server-only).
export const CHAT_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
