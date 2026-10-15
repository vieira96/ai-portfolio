import { X } from 'lucide-react';
import type { KeyboardEvent, ReactNode } from 'react';
import { Button } from '@/components/ui/shadcn/button';

interface ChatPanelProps {
  onClose: () => void;
  children: ReactNode;
}

export function ChatPanel({ onClose, children }: ChatPanelProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') {
      onClose();
    }
  }

  return (
    <section
      id="chat-panel"
      role="dialog"
      aria-label="Chat com IA"
      onKeyDown={handleKeyDown}
      className="fixed right-4 bottom-20 z-40 flex h-[60dvh] w-[calc(100vw-2rem)] max-w-[400px] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-xl sm:right-6 sm:bottom-24 sm:h-[70dvh]"
    >
      <header className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-100">Chat com IA</h2>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Fechar chat"
          onClick={onClose}
        >
          <X />
        </Button>
      </header>
      {children}
    </section>
  );
}
