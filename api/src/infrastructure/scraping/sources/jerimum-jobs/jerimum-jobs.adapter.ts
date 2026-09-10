import { createHash } from 'node:crypto';
import type { ExtractedJob } from '../../../../domain/entities/job.js';
import { GenericJobExtractor } from '../../core/generic-job-extractor.js';
import type { DiscoveredJob, JobSourceAdapter, RawJob } from '../../core/job-source-adapter.js';
import type { PageFetcher } from '../../core/page-fetcher.js';
import { workModel, employmentType, seniority } from '../../core/job-normalizer.js';
export class JerimumJobsAdapter implements JobSourceAdapter {
  readonly source = 'jerimum-jobs';
  private readonly extractor = new GenericJobExtractor();
  constructor(
    private readonly fetcher: PageFetcher,
    private readonly listingUrl = 'https://jerimumjobs.imd.ufrn.br/',
  ) {}
  async discoverJobs(): Promise<DiscoveredJob[]> {
    const page = await this.fetcher.fetch(this.listingUrl);
    const matches = [...page.html.matchAll(/href=["']([^"']*(?:vaga|job|oportunidade)[^"']*)["']/gi)];
    return [
      ...new Map(
        matches.map((match) => {
          const url = new URL(match[1], page.url).toString();
          const externalId =
            url.match(/(?:vaga|job|oportunidade)\/(?:[^/]+-)?([\w-]+)/i)?.[1] ??
            createHash('sha256').update(url).digest('hex').slice(0, 24);
          return [url, { externalId, url }];
        }),
      ).values(),
    ];
  }
  async fetchJob(job: DiscoveredJob): Promise<RawJob> {
    return { discovered: job, html: (await this.fetcher.fetch(job.url)).html };
  }
  async extractJob(raw: RawJob): Promise<ExtractedJob> {
    const extracted = this.extractor.extract(raw.html);
    const text = `${extracted.title} ${extracted.description}`;
    return {
      externalId: raw.discovered.externalId,
      sourceUrl: raw.discovered.url,
      title: extracted.title,
      description: extracted.description,
      companyName:
        typeof extracted.structured?.hiringOrganization === 'object'
          ? extracted.structured.hiringOrganization.name
          : undefined,
      location:
        typeof extracted.structured?.jobLocation === 'object'
          ? extracted.structured.jobLocation.address?.addressLocality
          : undefined,
      workModel: workModel(text),
      employmentType: employmentType(String(extracted.structured?.employmentType ?? text)),
      seniority: seniority(text),
      requirements: extracted.sections.requirements,
      benefits: extracted.sections.benefits,
      responsibilities: extracted.sections.responsibilities,
      skills: [],
      publishedAt: extracted.structured?.datePosted ? new Date(extracted.structured.datePosted) : undefined,
      expiresAt: extracted.structured?.validThrough ? new Date(extracted.structured.validThrough) : undefined,
    };
  }
}
