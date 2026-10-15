'use client';

import { useEffect, useState } from 'react';

interface ImagePickerProps {
  accept?: string;
  label?: string;
  currentImageUrl?: string;
  onSelect: (file: File | null) => void;
}

export function ImagePicker({
  accept = 'image/*',
  label = 'Escolher foto',
  currentImageUrl,
  onSelect,
}: ImagePickerProps) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  function handleSelect(file: File | undefined) {
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
    if (!file) {
      onSelect(null);
      return;
    }
    setPreview(URL.createObjectURL(file));
    onSelect(file);
  }

  function handleRemove() {
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
    onSelect(null);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-4">
        {preview ? (
          <div className="relative shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Pré-visualização"
              className="h-20 w-20 rounded-full border border-line object-cover"
            />
            <button
              type="button"
              aria-label="Remover seleção"
              onClick={handleRemove}
              className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-slate-300 transition hover:bg-zinc-700 hover:text-white"
            >
              X
            </button>
          </div>
        ) : currentImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentImageUrl}
            alt="Imagem atual"
            className="h-20 w-20 shrink-0 rounded-full border border-line object-cover"
          />
        ) : (
          <span
            aria-label="Sem imagem"
            className="h-20 w-20 shrink-0 rounded-full border border-dashed border-line"
          />
        )}
        <label className="cursor-pointer rounded-full border border-line px-4 py-1.5 text-center text-xs font-bold text-slate-300 transition hover:border-blue-400/40 hover:text-white">
          {label}
          <input
            type="file"
            accept={accept}
            className="sr-only"
            onChange={(event) => void handleSelect(event.target.files?.[0])}
          />
        </label>
      </div>
    </div>
  );
}
