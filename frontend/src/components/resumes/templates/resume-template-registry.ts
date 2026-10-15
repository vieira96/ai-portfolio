import type {
  ResumeTemplateDefinition,
  ResumeTemplateId,
} from '@/types/resumes/resume.types';
import { ClassicTemplate, MinimalTemplate, ModernTemplate } from './index';

export const resumeTemplateRegistry: Record<
  ResumeTemplateId,
  ResumeTemplateDefinition
> = {
  classic: {
    id: 'classic',
    name: 'ATS Clássico',
    description: 'Recomendado para ATS: uma coluna, texto simples e seções padrão.',
    component: ClassicTemplate,
  },
  modern: {
    id: 'modern',
    name: 'ATS Técnico',
    description: 'Prioriza competências e projetos para vagas de tecnologia.',
    component: ModernTemplate,
  },
  minimal: {
    id: 'minimal',
    name: 'ATS Compacto',
    description: 'Mais conteúdo por página, sem perder a leitura linear.',
    component: MinimalTemplate,
  },
};
