import type { ResumeData, ResumeTemplateId } from '@/types/resumes/resume.types';

function fileName(name: string) {
  const normalized = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return `${normalized || 'curriculo'}-curriculo-ats.pdf`;
}

export async function exportResumePdf(data: ResumeData, templateId: ResumeTemplateId) {
  const [{ pdf }, { ResumePdfDocument }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./resume-pdf-document'),
  ]);
  const blob = await pdf(<ResumePdfDocument data={data} templateId={templateId} />).toBlob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = fileName(data.personal.name);
  anchor.click();
  URL.revokeObjectURL(url);
}
