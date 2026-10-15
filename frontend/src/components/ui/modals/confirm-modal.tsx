'use client';

import { Button } from '@/components/ui/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';

interface ConfirmModalProps {
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'primary' | 'danger';
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({
  title,
  body,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  confirmVariant = 'primary',
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  function handleOpenChange(open: boolean) {
    if (!open) {
      onClose();
    }
  }

  return (
    <Dialog open={true} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl border border-line bg-surface p-6">
        <DialogTitle className="text-lg font-bold text-white">
          {title}
        </DialogTitle>
        <DialogDescription className="mt-2 text-sm text-slate-400">
          {body}
        </DialogDescription>
        <div className="mt-6 flex gap-3">
          <Button
            type="button"
            variant={confirmVariant === 'danger' ? 'destructive' : 'default'}
            onClick={onConfirm}
            className={
              confirmVariant === 'danger'
                ? 'h-auto rounded-full border-danger/40 bg-transparent px-4 py-2.5 text-sm font-bold text-danger hover:border-danger/70 hover:bg-danger/10'
                : 'h-auto rounded-full bg-blue-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-400'
            }
          >
            {confirmLabel}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="h-auto rounded-full border-line bg-transparent px-4 py-2.5 text-sm font-bold text-slate-300 hover:border-blue-400/40 hover:bg-transparent hover:text-white"
          >
            {cancelLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
