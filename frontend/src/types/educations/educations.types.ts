export type EducationDegree =
  | 'GRADUACAO'
  | 'POS'
  | 'TECNICO'
  | 'CURSO_LIVRE'
  | 'CERTIFICACAO';

export interface Education {
  id: string;
  institution: string;
  course: string;
  degree: EducationDegree | null;
  description: string | null;
  startedAt: string;
  endedAt: string | null;
  expectedEnd: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EducationsPage {
  data: Education[];
  total: number;
  page: number;
  totalPages: number;
}
