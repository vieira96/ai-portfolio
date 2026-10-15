import { Input } from '@/components/ui/shadcn/input';
import { Textarea } from '@/components/ui/shadcn/textarea';
import type { ResumePersonalData } from '@/types/resumes/resume.types';
import {
  Field,
  SectionHeader,
  inputClassName,
  textareaClassName,
} from '../shared/resume-form-controls';

type ResumePersonalFormProps = {
  data: ResumePersonalData;
  onChange: (field: keyof ResumePersonalData, value: string) => void;
};

export function ResumePersonalForm({
  data,
  onChange,
}: ResumePersonalFormProps) {
  return (
    <section className="rounded-2xl border border-line bg-surface/70 p-5">
      <SectionHeader title="Dados de contato" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome">
          <Input
            className={inputClassName}
            value={data.name}
            onChange={(event) => onChange('name', event.target.value)}
          />
        </Field>
        <Field label="Cargo / headline">
          <Input
            className={inputClassName}
            value={data.headline}
            onChange={(event) => onChange('headline', event.target.value)}
          />
        </Field>
        <Field label="E-mail">
          <Input
            className={inputClassName}
            type="email"
            value={data.email}
            onChange={(event) => onChange('email', event.target.value)}
          />
        </Field>
        <Field label="Telefone">
          <Input
            className={inputClassName}
            value={data.phone}
            onChange={(event) => onChange('phone', event.target.value)}
          />
        </Field>
        <Field label="Localização">
          <Input
            className={inputClassName}
            value={data.location}
            onChange={(event) => onChange('location', event.target.value)}
          />
        </Field>
        <Field label="GitHub">
          <Input
            className={inputClassName}
            value={data.githubUrl}
            onChange={(event) => onChange('githubUrl', event.target.value)}
          />
        </Field>
        <Field label="LinkedIn">
          <Input
            className={inputClassName}
            value={data.linkedinUrl}
            onChange={(event) => onChange('linkedinUrl', event.target.value)}
          />
        </Field>
        <Field label="Portfólio">
          <Input
            className={inputClassName}
            value={data.portfolioUrl}
            onChange={(event) => onChange('portfolioUrl', event.target.value)}
          />
        </Field>
      </div>
      <div className="mt-4">
        <Field label="Resumo profissional">
          <Textarea
            className={textareaClassName}
            value={data.summary}
            onChange={(event) => onChange('summary', event.target.value)}
          />
        </Field>
      </div>
    </section>
  );
}
