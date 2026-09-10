import { createHash } from 'node:crypto';
import type { ImportJobUseCase } from '../../../application/use-cases/import-job.js';
import type { JobSourceAdapter } from './job-source-adapter.js';
export class Crawler {
  constructor(private readonly importer: ImportJobUseCase) {}
  async run(adapter: JobSourceAdapter) {
    const discovered = await adapter.discoverJobs();
    const results = [] as string[];
    for (const item of discovered) {
      try {
        const raw = await adapter.fetchJob(item);
        const job = await adapter.extractJob(raw);
        const hash = createHash('sha256').update(raw.html.replace(/\s+/g, ' ').trim()).digest('hex');
        const result = await this.importer.execute(
          { ...job, sourceId: adapter.source, rawContentHash: hash },
          raw.html,
          raw.html
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim(),
        );
        results.push(result.action);
        await new Promise((resolve) => setTimeout(resolve, 250));
      } catch {
        results.push('failed');
      }
    }
    return results;
  }
}
