import * as cheerio from 'cheerio';
import type { ExtractionResult } from '../../../domain/entities/job.js';
const sectionKey = (heading: string) =>
  /requisit|qualifica|pre.?requis|o que buscamos/i.test(heading)
    ? 'requirements'
    : /benef[ií]ci|o que oferecemos/i.test(heading)
      ? 'benefits'
      : /responsab|atividades|o que voc[eê] far[aá]/i.test(heading)
        ? 'responsibilities'
        : null;
export class GenericJobExtractor {
  extract(html: string) {
    const $ = cheerio.load(html);
    const jsonLd = $('script[type="application/ld+json"]')
      .toArray()
      .flatMap((node) => {
        try {
          const value = JSON.parse($(node).text());
          return Array.isArray(value) ? value : [value];
        } catch {
          return [];
        }
      })
      .find(
        (item) =>
          item['@type'] === 'JobPosting' ||
          item['@graph']?.some((entry: Record<string, unknown>) => entry['@type'] === 'JobPosting'),
      );
    const posting =
      jsonLd?.['@type'] === 'JobPosting'
        ? jsonLd
        : jsonLd?.['@graph']?.find((entry: Record<string, unknown>) => entry['@type'] === 'JobPosting');
    const title =
      posting?.title || $('h1').first().text().trim() || $('meta[property="og:title"]').attr('content') || '';
    const description =
      posting?.description ||
      $('main,article').first().text().replace(/\s+/g, ' ').trim() ||
      $('body').text().replace(/\s+/g, ' ').trim();
    const sections: Record<string, string[]> = { requirements: [], benefits: [], responsibilities: [] };
    $('h2,h3,h4').each((_, heading) => {
      const key = sectionKey($(heading).text());
      if (!key) return;
      const content: string[] = [];
      $(heading)
        .nextUntil('h2,h3,h4')
        .find('li,p')
        .each((__, item) => {
          const text = $(item).text().replace(/\s+/g, ' ').trim();
          if (text) content.push(text);
        });
      sections[key].push(...content);
    });
    return {
      title: String(title)
        .replace(/<[^>]+>/g, '')
        .trim(),
      description: String(description)
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim(),
      sections,
      structured: posting,
    };
  }
  result<T>(value: T | null, source: string, confidence: number): ExtractionResult<T> {
    return { value, source, confidence };
  }
}
