"use client";

import { useEffect, useId, useRef, useState } from "react";
import { LoaderCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/shadcn/dialog";
import {
  requestWritingAssistance,
  type WritingAssistanceFieldType,
} from "@/lib/ai/writing-assistance";

type RequestState = "idle" | "loading" | "success" | "error" | "stale";

interface WritingAssistanceProps {
  fieldType: WritingAssistanceFieldType;
  fieldLabel: string;
  value: string;
  onApply: (suggestion: string) => void;
}

export function WritingAssistance({
  fieldType,
  fieldLabel,
  value,
  onApply,
}: WritingAssistanceProps) {
  const [open, setOpen] = useState(false);
  const [requestState, setRequestState] = useState<RequestState>("idle");
  const [suggestion, setSuggestion] = useState("");
  const [requestValue, setRequestValue] = useState("");
  const contentId = useId();
  const latestValue = useRef(value);
  const requestId = useRef(0);

  useEffect(() => {
    latestValue.current = value;
  }, [value]);

  function closeDialog(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      requestId.current += 1;
      setRequestState("idle");
      setSuggestion("");
      setRequestValue("");
    }
  }

  async function generateSuggestion(text: string) {
    const currentRequestId = ++requestId.current;
    setRequestValue(text);
    setSuggestion("");
    setRequestState("loading");

    try {
      const result = await requestWritingAssistance(fieldType, text);
      if (requestId.current !== currentRequestId) {
        return;
      }
      if (latestValue.current !== text) {
        setRequestState("stale");
        return;
      }
      setSuggestion(result);
      setRequestState("success");
    } catch {
      if (requestId.current === currentRequestId) {
        setRequestState("error");
      }
    }
  }

  function openAndGenerate() {
    setOpen(true);
    void generateSuggestion(value);
  }

  function applySuggestion() {
    if (latestValue.current !== requestValue) {
      setRequestState("stale");
      setSuggestion("");
      return;
    }
    onApply(suggestion);
    closeDialog(false);
  }

  const disabled = value.trim().length === 0;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-2"
        disabled={disabled}
        onClick={openAndGenerate}
      >
        <Sparkles aria-hidden="true" />
        Aprimorar texto com IA
      </Button>

      <Dialog open={open} onOpenChange={closeDialog}>
        <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto border-line bg-surface text-slate-100">
          <DialogTitle className="text-lg font-semibold">
            Sugestão de escrita
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Revise a sugestão para {fieldLabel}. Ela só será aplicada se você
            escolher usá-la.
          </DialogDescription>

          <div aria-live="polite" className="min-h-24">
            {requestState === "loading" && (
              <div className="flex items-center gap-3 py-6 text-sm text-slate-300">
                <LoaderCircle
                  className="size-4 animate-spin"
                  aria-hidden="true"
                />
                Preparando uma sugestão…
              </div>
            )}
            {requestState === "success" && (
              <div className="grid gap-3">
                <section aria-labelledby={`${contentId}-current-label`}>
                  <h3
                    id={`${contentId}-current-label`}
                    className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400"
                  >
                    Texto atual
                  </h3>
                  <p className="whitespace-pre-wrap rounded-lg border border-line bg-background/60 p-4 text-sm leading-6">
                    {requestValue}
                  </p>
                </section>
                <section aria-labelledby={`${contentId}-suggestion-label`}>
                  <h3
                    id={`${contentId}-suggestion-label`}
                    className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400"
                  >
                    Sugestão
                  </h3>
                  <p className="whitespace-pre-wrap rounded-lg border border-line bg-background/60 p-4 text-sm leading-6">
                    {suggestion}
                  </p>
                </section>
              </div>
            )}
            {requestState === "error" && (
              <p className="py-6 text-sm text-red-300" role="alert">
                Não foi possível gerar uma sugestão. Seu texto continua intacto.
              </p>
            )}
            {requestState === "stale" && (
              <p className="py-6 text-sm text-amber-200" role="status">
                O campo foi editado durante a solicitação. Gere uma nova
                sugestão para o texto atualizado.
              </p>
            )}
          </div>

          <DialogFooter className="border-line bg-transparent">
            {(requestState === "error" || requestState === "stale") && (
              <Button
                type="button"
                variant="outline"
                onClick={() => void generateSuggestion(latestValue.current)}
                disabled={value.trim().length === 0}
              >
                Tentar novamente
              </Button>
            )}
            {requestState === "success" && (
              <Button type="button" onClick={applySuggestion}>
                Usar sugestão
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => closeDialog(false)}
            >
              Manter texto atual
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
