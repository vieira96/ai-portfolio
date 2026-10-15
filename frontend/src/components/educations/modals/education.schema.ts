import { z } from 'zod';

export const educationSchema = z
  .object({
    institution: z
      .string()
      .trim()
      .min(2, 'Instituição precisa de ao menos 2 caracteres.'),
    course: z.string().trim().min(2, 'Curso precisa de ao menos 2 caracteres.'),
    description: z
      .string()
      .trim()
      .min(10, 'Descrição precisa de ao menos 10 caracteres.'),
    startedAt: z.string().min(1, 'Informe o início.'),
    endedAt: z.string().optional().or(z.literal('')),
    expectedEnd: z.string().optional().or(z.literal('')),
  })
  .refine(
    (values) =>
      !values.endedAt ||
      new Date(values.startedAt).getTime() <=
        new Date(values.endedAt).getTime(),
    { message: 'Início precisa ser antes do fim.', path: ['endedAt'] },
  );

export type EducationFormValues = z.infer<typeof educationSchema>;
