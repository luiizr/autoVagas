import type { EmploymentType, Seniority, WorkModel } from '../../../domain/entities/job.js';
const normalized = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
export const workModel = (value: string): WorkModel | undefined =>
  /remot|home office/.test(normalized(value))
    ? 'REMOTE'
    : /hibrid/.test(normalized(value))
      ? 'HYBRID'
      : /presencial|on.?site/.test(normalized(value))
        ? 'ONSITE'
        : undefined;
export const employmentType = (value: string): EmploymentType | undefined =>
  /\bclt\b/.test(normalized(value))
    ? 'CLT'
    : /\bpj\b/.test(normalized(value))
      ? 'PJ'
      : /estagio/.test(normalized(value))
        ? 'INTERNSHIP'
        : /bolsa/.test(normalized(value))
          ? 'SCHOLARSHIP'
          : /tempor/.test(normalized(value))
            ? 'TEMPORARY'
            : undefined;
export const seniority = (value: string): Seniority =>
  /estagi/.test(normalized(value))
    ? 'INTERN'
    : /junior|jr\.?/.test(normalized(value))
      ? 'JUNIOR'
      : /pleno|mid/.test(normalized(value))
        ? 'MID'
        : /senior|sr\.?/.test(normalized(value))
          ? 'SENIOR'
          : /especialista/.test(normalized(value))
            ? 'SPECIALIST'
            : 'UNKNOWN';
