import type { ResumeTemplateProps } from '@/types/resumes/resume.types';
import { formatResumePeriod } from '../data/resume-date';
import { getSkillGroups, skillCategoryLabels } from '../skills/resume-skill-groups';

export function ClassicTemplate({ data }: ResumeTemplateProps) {
  const skillGroups = getSkillGroups(data);

  return (
    <article className="resume-document resume-document-classic">
      <header className="resume-document-header">
        <h1>{data.personal.name || 'Seu nome'}</h1>
        <p className="resume-document-headline">{data.personal.headline}</p>
        <p className="resume-document-contact">
          {[data.personal.email, data.personal.phone, data.personal.location]
            .filter(Boolean)
            .join(' · ')}
        </p>
        <p className="resume-document-links">
          {[data.personal.githubUrl, data.personal.linkedinUrl, data.personal.portfolioUrl]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </header>

      {data.personal.summary && (
        <section className="resume-section-summary">
          <h2>Resumo profissional</h2>
          <p>{data.personal.summary}</p>
        </section>
      )}

      {data.experiences.length > 0 && (
        <section className="resume-section-experiences">
          <h2>Experiência profissional</h2>
          {data.experiences.map((experience) => (
            <div className="resume-entry" key={experience.localId}>
              <div className="resume-entry-heading">
                <div>
                  <h3>{experience.position}</h3>
                  <p>{experience.company}</p>
                </div>
                <span>{formatResumePeriod(experience.startedAt, experience.endedAt)}</span>
              </div>
              {experience.description && <p>{experience.description}</p>}
              <p className="resume-entry-meta">
                {experience.technologies
                  .filter((skill) => skill.name.trim())
                  .map((skill) => skill.name)
                  .join(', ')}
              </p>
            </div>
          ))}
        </section>
      )}

      {data.projects.length > 0 && (
        <section className="resume-section-projects">
          <h2>Projetos</h2>
          {data.projects.map((project) => (
            <div className="resume-entry" key={project.localId}>
              <div className="resume-entry-heading">
                <h3>{project.name}</h3>
                <span>{project.repositoryUrl || project.demoUrl}</span>
              </div>
              <p>{project.description}</p>
              <p className="resume-entry-meta">
                {project.technologies
                  .filter((skill) => skill.name.trim())
                  .map((skill) => skill.name)
                  .join(', ')}
              </p>
            </div>
          ))}
        </section>
      )}

      {data.educations.length > 0 && (
        <section className="resume-section-education">
          <h2>Formação acadêmica</h2>
          {data.educations.map((education) => (
            <div className="resume-entry" key={education.localId}>
              <div className="resume-entry-heading">
                <div>
                  <h3>{education.course}</h3>
                  <p>{education.institution}</p>
                </div>
                <span>{formatResumePeriod(education.startedAt, education.endedAt ?? education.expectedEnd)}</span>
              </div>
              {education.description && <p>{education.description}</p>}
            </div>
          ))}
        </section>
      )}

      {skillGroups.length > 0 && (
        <section className="resume-section-skills">
          <h2>Competências</h2>
          <div className="resume-skill-groups">
            {skillGroups.map((group) => (
              <p className="resume-skill-group" key={group.category}>
                <strong>{skillCategoryLabels[group.category]}:</strong>{' '}
                {group.skills.map((skill) => skill.name).join(', ')}
              </p>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
