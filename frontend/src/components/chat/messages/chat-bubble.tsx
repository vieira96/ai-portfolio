import { Bot, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/shadcn/button';
import type { ChatMessage } from '@/types/chat/chat.types';

interface ChatBubbleProps {
  message: ChatMessage;
  onRetry?: (question: string) => void;
}

function TypingDots() {
  return (
    <span className="flex items-center gap-1 py-1" aria-label="IA digitando">
      <span className="size-1.5 animate-pulse rounded-full bg-slate-400" />
      <span className="size-1.5 animate-pulse rounded-full bg-slate-400 [animation-delay:150ms]" />
      <span className="size-1.5 animate-pulse rounded-full bg-slate-400 [animation-delay:300ms]" />
    </span>
  );
}

export function ChatBubble({ message, onRetry }: ChatBubbleProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3 py-2 text-sm whitespace-pre-wrap text-primary-foreground">
          {message.question}
        </p>
      </div>
      <div className="flex items-start gap-2">
        <span
          aria-hidden="true"
          className="shrink-0 rounded-full border border-line bg-surface p-1.5"
        >
          <Bot className="size-4 text-accent" />
        </span>
        <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-line bg-surface px-3 py-2 text-sm whitespace-pre-wrap text-slate-100">
          {message.status === 'pending' || message.answer === null ? (
            message.status === 'failed' ? (
              <span className="text-slate-300">
                Não foi possível responder. Tente novamente.
              </span>
            ) : (
              <TypingDots />
            )
          ) : (
            message.answer
          )}
        </div>
      </div>
      {message.status === 'failed' && onRetry ? (
        <div className="pl-10">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onRetry(message.question)}
          >
            <RotateCcw />
            Tentar de novo
          </Button>
        </div>
      ) : null}
    </div>
  );
}
