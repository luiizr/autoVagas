export interface PageContent {
  url: string;
  html: string;
  fetchedAt: Date;
}
export interface PageFetcher {
  fetch(url: string): Promise<PageContent>;
}
export class HttpPageFetcher implements PageFetcher {
  async fetch(url: string): Promise<PageContent> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AutoVagas/2.0 (+contato@autovagas.local)',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`Fonte retornou HTTP ${response.status}.`);
    return { url, html: await response.text(), fetchedAt: new Date() };
  }
}
