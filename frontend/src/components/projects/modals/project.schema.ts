import { z } from 'zod';

const trimmedUrl = (message: string) =>
  z.preprocess(
    (value) => (typeof value === 'string' ? value.trim() : value),
    z.url(message).optional().or(z.literal('')),
  );

export const projectSchema = z.object({
  name: z.string().trim().min(2, 'Nome precisa de ao menos 2 caracteres.'),
  description: z
    .string()
    .trim()
    .min(10, 'Descrição precisa de ao menos 10 caracteres.'),
  repositoryUrl: trimmedUrl('Informe uma URL válida.'),
  demoUrl: trimmedUrl('Informe uma URL válida.'),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;
