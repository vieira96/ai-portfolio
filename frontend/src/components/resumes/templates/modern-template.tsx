import type { ResumeTemplateProps } from '@/types/resumes/resume.types';
import { ClassicTemplate } from './classic-template';

export function ModernTemplate({ data }: ResumeTemplateProps) {
  return (
    <div className="resume-document-modern-wrap resume-document-technical-wrap">
      <ClassicTemplate data={data} />
    </div>
  );
}
