import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import 'dayjs/locale/pt-br';

dayjs.extend(customParseFormat);

function parseResumeDate(value: string | null | undefined) {
  if (!value?.trim()) {
    return null;
  }

  const parsed = dayjs(value.slice(0, 10), 'YYYY-MM-DD', true);
  return parsed.isValid() ? parsed : null;
}

export function formatResumeDate(value: string | null | undefined): string {
  const parsed = parseResumeDate(value);
  return parsed ? parsed.locale('pt-br').format('MMM [de] YYYY') : '—';
}

export function formatResumePeriod(
  startedAt: string | null | undefined,
  endedAt: string | null | undefined,
): string {
  return `${formatResumeDate(startedAt)} — ${endedAt === null ? 'Atual' : formatResumeDate(endedAt)}`;
}
