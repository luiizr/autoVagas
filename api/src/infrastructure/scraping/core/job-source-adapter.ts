import type { ExtractedJob } from '../../../domain/entities/job.js';
export interface DiscoveredJob {
  externalId: string;
  url: string;
}
export interface RawJob {
  discovered: DiscoveredJob;
  html: string;
}
export interface JobSourceAdapter {
  source: string;
  discoverJobs(): Promise<DiscoveredJob[]>;
  fetchJob(job: DiscoveredJob): Promise<RawJob>;
  extractJob(raw: RawJob): Promise<ExtractedJob>;
}
