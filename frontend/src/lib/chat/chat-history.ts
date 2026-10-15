import type {
  ChatHistoryResponse,
  ChatMessage,
} from '@/types/chat/chat.types';
import { CHAT_API_BASE_URL } from './chat-api';

export async function fetchChatHistory(
  page: number,
  size: number,
): Promise<ChatHistoryResponse> {
  const response = await fetch(
    `${CHAT_API_BASE_URL}/chat/messages?page=${page}&size=${size}`,
    { credentials: 'include' },
  );
  if (!response.ok) {
    throw new Error(
      `Não foi possível carregar o histórico (${response.status}).`,
    );
  }
  return (await response.json()) as ChatHistoryResponse;
}

// Funde o snapshot do servidor com pares criados localmente (ex: pergunta enviada
// enquanto o GET inicial ainda voava). Servidor primeiro, local depois; em conflito
// de id, vale o local (estado mais fresco). Sem isso, um snapshot tardio apagaria
// o que o visitante acabou de mandar.
export function mergeHistoryMessages(
  server: ChatMessage[],
  local: ChatMessage[],
): ChatMessage[] {
  const localIds = new Set(local.map((message) => message.id));
  return [...server.filter((message) => !localIds.has(message.id)), ...local];
}
