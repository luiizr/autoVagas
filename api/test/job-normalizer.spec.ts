import { describe, expect, it } from 'vitest';
import { employmentType, workModel } from '../src/infrastructure/scraping/core/job-normalizer.js';
describe('normalização de vaga', () => {
  it('normaliza trabalho remoto e CLT', () => {
    expect(workModel('100% remoto')).toBe('REMOTE');
    expect(employmentType('Contrato CLT')).toBe('CLT');
  });
});
