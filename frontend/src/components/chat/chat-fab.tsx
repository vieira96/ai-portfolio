'use client';

import { Bot, X } from 'lucide-react';
import type { Ref } from 'react';
import { Button } from '@/components/ui/shadcn/button';

interface ChatFabProps {
  expanded: boolean;
  onToggle: () => void;
  fabRef?: Ref<HTMLButtonElement>;
}

export function ChatFab({ expanded, onToggle, fabRef }: ChatFabProps) {
  return (
    <Button
      ref={fabRef}
      type="button"
      size="icon"
      aria-expanded={expanded}
      aria-controls="chat-panel"
      aria-label={expanded ? 'Fechar chat com IA' : 'Abrir chat com IA'}
      onClick={onToggle}
      className="fixed right-4 bottom-4 z-40 mb-[env(safe-area-inset-bottom)] size-11 rounded-full shadow-lg sm:right-6 sm:bottom-6"
    >
      {expanded ? <X /> : <Bot />}
    </Button>
  );
}
