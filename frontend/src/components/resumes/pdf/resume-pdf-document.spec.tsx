import { pdf } from '@react-pdf/renderer';
import { describe, expect, it } from 'vitest';
import { resumeFixture } from '../data/resume-fixture';
import { ResumePdfDocument } from './resume-pdf-document';

describe('ResumePdfDocument', () => {
  it('generates a non-empty PDF blob with the selected template', async () => {
    const blob = await pdf(
      <ResumePdfDocument data={resumeFixture} templateId="classic" />,
    ).toBlob();

    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(0);
  });

  it('prioritizes the GitHub repository URL over the demo URL', async () => {
    const project = resumeFixture.projects[0];
    const repositoryUrl = 'https://github.com/user/project';
    const demoUrl = 'https://demo.example.com/project';
    const data = {
      ...resumeFixture,
      projects: [{ ...project, repositoryUrl, demoUrl }],
    };

    const blob = await pdf(
      <ResumePdfDocument data={data} templateId="classic" />,
    ).toBlob();
    const pdfText = await blob.text();

    expect(pdfText).toContain(repositoryUrl);
    expect(pdfText).not.toContain(demoUrl);
  });
});
