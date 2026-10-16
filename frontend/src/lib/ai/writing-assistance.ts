export const writingAssistanceFieldTypes = [
  "bio",
  "headline",
  "experienceDescription",
  "projectDescription",
] as const;

export type WritingAssistanceFieldType =
  (typeof writingAssistanceFieldTypes)[number];

export async function requestWritingAssistance(
  fieldType: WritingAssistanceFieldType,
  text: string,
): Promise<string> {
  const response = await fetch("/api/ai/writing-assistance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fieldType, text }),
  });

  const result: unknown = await response.json().catch(() => null);
  if (
    !response.ok ||
    typeof result !== "object" ||
    result === null ||
    !("suggestion" in result) ||
    typeof result.suggestion !== "string" ||
    result.suggestion.trim().length === 0
  ) {
    throw new Error("Não foi possível gerar uma sugestão. Tente novamente.");
  }

  return result.suggestion;
}
