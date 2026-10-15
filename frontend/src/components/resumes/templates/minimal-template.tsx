import type { ResumeTemplateProps } from '@/types/resumes/resume.types';
import { ClassicTemplate } from './classic-template';

export function MinimalTemplate({ data }: ResumeTemplateProps) {
  return (
    <div className="resume-document-minimal-wrap">
      <ClassicTemplate data={data} />
    </div>
  );
}
