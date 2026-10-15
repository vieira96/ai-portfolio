import { CHAT_API_BASE_URL } from './chat-api';

export type SendChatMessageResult =
  | { kind: 'created'; id: string; status: 'pending'; createdAt: string }
  | { kind: 'invalid'; answer: string };

export async function sendChatMessage(
  message: string,
): Promise<SendChatMessageResult> {
  const response = await fetch(`${CHAT_API_BASE_URL}/chat/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ message }),
  });
  if (response.status === 200) {
    const body = (await response.json()) as { answer: string };
    return { kind: 'invalid', answer: body.answer };
  }
  if (!response.ok) {
    throw new Error('Não foi possível enviar. Tente novamente.');
  }
  const created = (await response.json()) as {
    id: string;
    status: 'pending';
    createdAt: string;
  };
  return { kind: 'created', ...created };
}
