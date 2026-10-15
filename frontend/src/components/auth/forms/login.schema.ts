import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email('Informe um email válido.'),
  password: z
    .string()
    .min(8, 'Senha precisa de ao menos 8 caracteres.'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
