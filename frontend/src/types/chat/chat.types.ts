export type ChatMessageStatus = 'pending' | 'done' | 'failed';

export interface ChatMessage {
  id: string;
  question: string;
  answer: string | null;
  status: ChatMessageStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ChatHistoryResponse {
  data: ChatMessage[];
  total: number;
  page: number;
  totalPages: number;
}
