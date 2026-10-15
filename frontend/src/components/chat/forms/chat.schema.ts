import { z } from 'zod';

export const chatMessageSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Digite uma pergunta.')
    .max(2000, 'Pergunta com no máximo 2000 caracteres.'),
});

export type ChatMessageValues = z.infer<typeof chatMessageSchema>;
