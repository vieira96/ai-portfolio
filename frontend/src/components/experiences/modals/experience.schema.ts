import { z } from 'zod';

export const experienceSchema = z
  .object({
    company: z.string().trim().min(2, 'Empresa precisa de ao menos 2 caracteres.'),
    position: z.string().trim().min(2, 'Cargo precisa de ao menos 2 caracteres.'),
    description: z
      .string()
      .trim()
      .min(10, 'Descrição precisa de ao menos 10 caracteres.'),
    startedAt: z.string().min(1, 'Informe o início.'),
    endedAt: z.string().optional().or(z.literal('')),
  })
  .refine(
    (values) =>
      !values.endedAt ||
      new Date(values.startedAt).getTime() <=
        new Date(values.endedAt).getTime(),
    { message: 'Início precisa ser antes do fim.', path: ['endedAt'] },
  );

export type ExperienceFormValues = z.infer<typeof experienceSchema>;
