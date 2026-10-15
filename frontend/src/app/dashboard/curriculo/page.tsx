import { loadResumeInitialData } from '@/components/resumes/data/resume-api-loader';
import { ResumeEditor } from '@/components/resumes/editor/resume-editor';

export default async function ResumePage() {
  const initialData = await loadResumeInitialData();

  return <ResumeEditor initialData={initialData} />;
}
