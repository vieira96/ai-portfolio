import { z } from 'zod';

const trimmedUrl = (message: string) =>
  z.preprocess(
    (value) => (typeof value === 'string' ? value.trim() : value),
    z.url(message).optional().or(z.literal('')),
  );

const optionalUrl = trimmedUrl('Informe uma URL válida.');

export const profileSchema = z.object({
  name: z.string().trim().min(3, 'Nome precisa de ao menos 3 caracteres.'),
  phone: z.string().trim().max(30, 'Telefone deve ter no máximo 30 caracteres.'),
  headline: z.string().trim().optional().or(z.literal('')),
  bio: z.string().trim().optional().or(z.literal('')),
  location: z.string().trim().optional().or(z.literal('')),
  githubUrl: optionalUrl,
  linkedinUrl: optionalUrl,
  portfolioUrl: optionalUrl,
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
