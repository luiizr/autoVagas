import { randomUUID } from 'node:crypto';
import type { Job } from '../../domain/entities/job.js';
import type { JobRepository } from '../../domain/repositories/job-repository.js';
export class ImportJobUseCase {
  constructor(private readonly jobs: JobRepository) {}
  async execute(input: Omit<Job, 'id' | 'firstSeenAt' | 'lastSeenAt'>, rawHtml: string, rawText: string) {
    const previous = await this.jobs.findBySourceExternalId(input.sourceId, input.externalId);
    const now = new Date();
    if (previous?.rawContentHash === input.rawContentHash) {
      await this.jobs.touch(previous.id, now);
      return { action: 'unchanged' as const, job: previous };
    }
    const job: Job = {
      ...input,
      id: previous?.id ?? randomUUID(),
      firstSeenAt: previous?.firstSeenAt ?? now,
      lastSeenAt: now,
    };
    const saved = await this.jobs.save(job);
    await this.jobs.createSnapshot(saved.id, input.rawContentHash, rawHtml, rawText);
    return { action: previous ? ('updated' as const) : ('created' as const), job: saved };
  }
}
