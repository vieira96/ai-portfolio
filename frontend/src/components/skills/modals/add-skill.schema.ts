import { z } from 'zod';

export const addSkillSchema = z.object({
  name: z.string().trim().min(2, 'Nome precisa de ao menos 2 caracteres.'),
  category: z.enum(['BACKEND', 'FRONTEND', 'DADOS', 'DEVOPS', 'IA', 'METODOLOGIAS', 'MENSAGERIA', 'TESTES']),
});

export type AddSkillValues = z.infer<typeof addSkillSchema>;
