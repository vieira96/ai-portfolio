import {
  Document,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';
import { Children, type ReactNode } from 'react';
import type { ResumeData, ResumeTemplateId } from '@/types/resumes/resume.types';
import { formatResumePeriod } from '../data/resume-date';
import { getSkillGroups, skillCategoryLabels } from '../skills/resume-skill-groups';

const styles = StyleSheet.create({
  page: {
    paddingTop: 46,
    paddingBottom: 46,
    paddingHorizontal: 54,
    color: '#172033',
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    lineHeight: 1.45,
  },
  compactPage: {
    paddingTop: 38,
    paddingBottom: 38,
    paddingHorizontal: 48,
    fontSize: 8.5,
  },
  technicalPage: {
    paddingHorizontal: 58,
  },
  header: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#172033',
    paddingBottom: 14,
    alignItems: 'center',
  },
  technicalHeader: {
    alignItems: 'flex-start',
  },
  name: {
    color: '#101827',
    fontSize: 24,
    lineHeight: 1.1,
  },
  compactName: {
    fontSize: 21,
  },
  headline: {
    marginTop: 5,
    color: '#3c4b62',
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },
  contact: {
    marginTop: 5,
    color: '#64748b',
    fontSize: 8,
    textAlign: 'center',
  },
  technicalContact: {
    textAlign: 'left',
  },
  links: {
    marginTop: 2,
    color: '#64748b',
    fontSize: 8,
    textAlign: 'center',
  },
  technicalLinks: {
    textAlign: 'left',
  },
  section: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 0.7,
    borderTopColor: '#cbd5e1',
  },
  firstSection: {
    borderTopWidth: 0,
    paddingTop: 0,
  },
  compactSection: {
    marginTop: 11,
    paddingTop: 11,
  },
  sectionTitle: {
    marginBottom: 7,
    color: '#172033',
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.8,
  },
  body: {
    color: '#334155',
  },
  entry: {
    marginTop: 9,
  },
  entryHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  entryTitle: {
    color: '#172033',
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  entryCompany: {
    color: '#64748b',
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
  },
  period: {
    color: '#64748b',
    fontSize: 8,
  },
  entryDescription: {
    marginTop: 4,
    color: '#334155',
  },
  entryHighlight: {
    marginTop: 3,
    color: '#334155',
  },
  entryMeta: {
    marginTop: 4,
    color: '#64748b',
    fontSize: 8,
  },
  skillGroup: {
    marginTop: 2,
    color: '#334155',
  },
  skillLabel: {
    color: '#172033',
    fontFamily: 'Helvetica-Bold',
  },
});

function SkillGroups({ data }: { data: ResumeData }) {
  const groups = getSkillGroups(data);

  return (
    <View>
      {groups.map((group) => (
        <Text style={styles.skillGroup} key={group.category}>
          <Text style={styles.skillLabel}>{skillCategoryLabels[group.category]}:</Text>{' '}
          {group.skills.map((skill) => skill.name).join(', ')}
        </Text>
      ))}
    </View>
  );
}

function Section({
  children,
  first = false,
  compact = false,
}: {
  children: ReactNode;
  first?: boolean;
  compact?: boolean;
}) {
  return (
    <View
      style={[
        styles.section,
        first ? styles.firstSection : undefined,
        compact ? styles.compactSection : undefined,
      ]}
    >
      {Children.toArray(children)}
    </View>
  );
}

function Experiences({ data }: { data: ResumeData }) {
  return (
    <Section>
      <Text style={styles.sectionTitle} key="experiences-title">
        EXPERIÊNCIA PROFISSIONAL
      </Text>
      {data.experiences.map((experience) => (
        <View style={styles.entry} key={experience.localId} wrap={false}>
          <View style={styles.entryHeading}>
            <View>
              <Text style={styles.entryTitle}>{experience.position}</Text>
              <Text style={styles.entryCompany}>{experience.company}</Text>
            </View>
            <Text style={styles.period}>{formatResumePeriod(experience.startedAt, experience.endedAt)}</Text>
          </View>
          {experience.description && <Text style={styles.entryDescription}>{experience.description}</Text>}
          {experience.technologies.length > 0 && (
            <Text style={styles.entryMeta}>
              {experience.technologies
                .filter((skill) => skill.name.trim())
                .map((skill) => skill.name)
                .join(', ')}
            </Text>
          )}
        </View>
      ))}
    </Section>
  );
}

function Projects({ data }: { data: ResumeData }) {
  return (
    <Section>
      <Text style={styles.sectionTitle} key="projects-title">
        PROJETOS
      </Text>
      {data.projects.map((project) => (
        <View style={styles.entry} key={project.localId} wrap={false}>
          <View style={styles.entryHeading}>
            <Text style={styles.entryTitle}>{project.name}</Text>
            {(project.repositoryUrl || project.demoUrl) && (
              <Link src={project.repositoryUrl || project.demoUrl} style={styles.period}>
                {project.repositoryUrl || project.demoUrl}
              </Link>
            )}
          </View>
          <Text style={styles.entryDescription}>{project.description}</Text>
          {project.technologies.length > 0 && (
            <Text style={styles.entryMeta}>
              {project.technologies
                .filter((skill) => skill.name.trim())
                .map((skill) => skill.name)
                .join(', ')}
            </Text>
          )}
        </View>
      ))}
    </Section>
  );
}

function Education({ data }: { data: ResumeData }) {
  return (
    <Section>
      <Text style={styles.sectionTitle} key="education-title">
        FORMAÇÃO ACADÊMICA
      </Text>
      {data.educations.map((education) => (
        <View style={styles.entry} key={education.localId} wrap={false}>
          <View style={styles.entryHeading}>
            <View>
              <Text style={styles.entryTitle}>{education.course}</Text>
              <Text style={styles.entryCompany}>{education.institution}</Text>
            </View>
            <Text style={styles.period}>{formatResumePeriod(education.startedAt, education.endedAt ?? education.expectedEnd)}</Text>
          </View>
          {education.description && <Text style={styles.entryDescription}>{education.description}</Text>}
        </View>
      ))}
    </Section>
  );
}

export function ResumePdfDocument({
  data,
  templateId,
}: {
  data: ResumeData;
  templateId: ResumeTemplateId;
}) {
  const compact = templateId === 'minimal';
  const technical = templateId === 'modern';
  const sections = [
    data.personal.summary ? 'summary' : null,
    technical && data.skills.length > 0 ? 'skills' : null,
    data.experiences.length > 0 ? 'experiences' : null,
    data.projects.length > 0 ? 'projects' : null,
    data.educations.length > 0 ? 'education' : null,
    !technical && data.skills.length > 0 ? 'skills' : null,
  ].filter((section): section is string => section !== null);

  return (
    <Document title={`${data.personal.name || 'Currículo'} - Currículo ATS`} author={data.personal.name}>
      <Page
        size="A4"
        style={[
          styles.page,
          compact ? styles.compactPage : undefined,
          technical ? styles.technicalPage : undefined,
        ]}
      >
        <View style={[styles.header, technical ? styles.technicalHeader : undefined]}>
          <Text style={[styles.name, compact ? styles.compactName : undefined]}>{data.personal.name || 'Seu nome'}</Text>
          {data.personal.headline && <Text style={styles.headline}>{data.personal.headline}</Text>}
          <Text style={[styles.contact, technical ? styles.technicalContact : undefined]}>
            {[data.personal.email, data.personal.phone, data.personal.location].filter(Boolean).join(' · ')}
          </Text>
          <Text style={[styles.links, technical ? styles.technicalLinks : undefined]}>
            {[data.personal.githubUrl, data.personal.linkedinUrl, data.personal.portfolioUrl].filter(Boolean).join(' · ')}
          </Text>
        </View>

        {sections.map((section, index) => {
          const sectionProps = { first: index === 0, compact };
          if (section === 'summary') {
            return (
              <Section {...sectionProps} key={section}>
                <Text style={styles.sectionTitle} key="summary-title">
                  RESUMO PROFISSIONAL
                </Text>
                <Text style={styles.body} key="summary-body">
                  {data.personal.summary}
                </Text>
              </Section>
            );
          }
          if (section === 'skills') {
            return (
              <Section {...sectionProps} key={section}>
                <Text style={styles.sectionTitle} key="skills-title">
                  COMPETÊNCIAS
                </Text>
                <SkillGroups data={data} key="skills-groups" />
              </Section>
            );
          }
          if (section === 'experiences') return <Experiences data={data} key={section} />;
          if (section === 'projects') return <Projects data={data} key={section} />;
          return <Education data={data} key={section} />;
        })}
      </Page>
    </Document>
  );
}
