import { useRef, useState } from 'react';
import type { KeyboardEvent, SubmitEvent } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/shadcn/button';
import { Textarea } from '@/components/ui/shadcn/textarea';
import { chatMessageSchema } from './chat.schema';

interface ChatInputProps {
  disabled: boolean;
  onSubmit: (message: string) => void;
}

export function ChatInput({ disabled, onSubmit }: ChatInputProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleChange(next: string) {
    setValue(next);
    if (error) {
      setError(null);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      formRef.current?.requestSubmit();
    }
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = chatMessageSchema.safeParse({ message: value });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Digite uma pergunta.');
      return;
    }
    setError(null);
    onSubmit(parsed.data.message);
    setValue('');
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      className="border-t border-line p-3"
    >
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label htmlFor="chat-message" className="sr-only">
            Digite sua pergunta
          </label>
          <Textarea
            id="chat-message"
            value={value}
            autoFocus
            onChange={(event) => handleChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              disabled ? 'Aguarde a resposta...' : 'Digite sua pergunta...'
            }
            rows={2}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'chat-message-error' : undefined}
          />
          {error ? (
            <p id="chat-message-error" role="alert" className="mt-1 text-xs text-danger">
              {error}
            </p>
          ) : null}
        </div>
        <Button
          type="submit"
          size="icon"
          aria-label="Enviar pergunta"
          disabled={disabled}
          className="size-11 shrink-0"
        >
          <Send />
        </Button>
      </div>
    </form>
  );
}
