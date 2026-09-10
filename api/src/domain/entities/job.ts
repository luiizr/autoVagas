export type WorkModel = 'REMOTE' | 'HYBRID' | 'ONSITE';
export type EmploymentType = 'CLT' | 'PJ' | 'INTERNSHIP' | 'SCHOLARSHIP' | 'TEMPORARY' | 'OTHER';
export type Seniority = 'INTERN' | 'JUNIOR' | 'MID' | 'SENIOR' | 'SPECIALIST' | 'UNKNOWN';

export interface Job {
  id: string;
  sourceId: string;
  externalId: string;
  sourceUrl: string;
  title: string;
  description: string;
  companyName?: string;
  location?: string;
  workModel?: WorkModel;
  employmentType?: EmploymentType;
  seniority?: Seniority;
  salaryMin?: number;
  salaryMax?: number;
  weeklyHours?: number;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  skills: string[];
  publishedAt?: Date;
  expiresAt?: Date;
  firstSeenAt: Date;
  lastSeenAt: Date;
  rawContentHash: string;
}

export type ExtractedJob = Omit<Job, 'id' | 'sourceId' | 'firstSeenAt' | 'lastSeenAt' | 'rawContentHash'>;
export interface ExtractionResult<T> {
  value: T | null;
  confidence: number;
  source: string;
}
export interface ExtractedSection {
  heading: string;
  content: string[];
}
