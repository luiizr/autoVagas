import type { Job } from '../entities/job.js';
export interface JobRepository {
  findBySourceExternalId(sourceId: string, externalId: string): Promise<Job | null>;
  save(job: Job): Promise<Job>;
  touch(id: string, lastSeenAt: Date): Promise<void>;
  createSnapshot(jobId: string, contentHash: string, rawHtml: string, rawText: string): Promise<void>;
  list(filters: { search?: string; limit: number; offset: number }): Promise<Job[]>;
  findById(id: string): Promise<Job | null>;
}
