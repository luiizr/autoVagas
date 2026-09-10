import type { Job } from '../../../domain/entities/job.js';
import type { JobRepository } from '../../../domain/repositories/job-repository.js';
import { pool } from '../pool.js';
const map = (r: Record<string, unknown>): Job => ({
  id: String(r.id),
  sourceId: String(r.source_id),
  externalId: String(r.external_id),
  sourceUrl: String(r.source_url),
  title: String(r.title),
  description: String(r.description),
  companyName: r.company_name as string | undefined,
  location: r.location as string | undefined,
  workModel: r.work_model as Job['workModel'],
  employmentType: r.employment_type as Job['employmentType'],
  seniority: r.seniority as Job['seniority'],
  salaryMin: r.salary_min as number | undefined,
  salaryMax: r.salary_max as number | undefined,
  weeklyHours: r.weekly_hours as number | undefined,
  requirements: (r.requirements as string[]) || [],
  responsibilities: (r.responsibilities as string[]) || [],
  benefits: (r.benefits as string[]) || [],
  skills: (r.skills as string[]) || [],
  publishedAt: r.published_at ? new Date(String(r.published_at)) : undefined,
  expiresAt: r.expires_at ? new Date(String(r.expires_at)) : undefined,
  firstSeenAt: new Date(String(r.first_seen_at)),
  lastSeenAt: new Date(String(r.last_seen_at)),
  rawContentHash: String(r.raw_content_hash),
});
export class PostgresJobRepository implements JobRepository {
  async findBySourceExternalId(sourceId: string, externalId: string) {
    const r = await pool.query('SELECT * FROM jobs WHERE source_id=$1 AND external_id=$2', [
      sourceId,
      externalId,
    ]);
    return r.rows[0] ? map(r.rows[0]) : null;
  }
  async save(j: Job) {
    const r = await pool.query(
      `INSERT INTO jobs (id,source_id,external_id,source_url,title,description,company_name,location,work_model,employment_type,seniority,salary_min,salary_max,weekly_hours,requirements,responsibilities,benefits,skills,published_at,expires_at,first_seen_at,last_seen_at,raw_content_hash) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23) ON CONFLICT (source_id,external_id) DO UPDATE SET source_url=EXCLUDED.source_url,title=EXCLUDED.title,description=EXCLUDED.description,company_name=EXCLUDED.company_name,location=EXCLUDED.location,work_model=EXCLUDED.work_model,employment_type=EXCLUDED.employment_type,seniority=EXCLUDED.seniority,salary_min=EXCLUDED.salary_min,salary_max=EXCLUDED.salary_max,weekly_hours=EXCLUDED.weekly_hours,requirements=EXCLUDED.requirements,responsibilities=EXCLUDED.responsibilities,benefits=EXCLUDED.benefits,skills=EXCLUDED.skills,published_at=EXCLUDED.published_at,expires_at=EXCLUDED.expires_at,last_seen_at=EXCLUDED.last_seen_at,raw_content_hash=EXCLUDED.raw_content_hash RETURNING *`,
      [
        j.id,
        j.sourceId,
        j.externalId,
        j.sourceUrl,
        j.title,
        j.description,
        j.companyName ?? null,
        j.location ?? null,
        j.workModel ?? null,
        j.employmentType ?? null,
        j.seniority ?? null,
        j.salaryMin ?? null,
        j.salaryMax ?? null,
        j.weeklyHours ?? null,
        j.requirements,
        j.responsibilities,
        j.benefits,
        j.skills,
        j.publishedAt ?? null,
        j.expiresAt ?? null,
        j.firstSeenAt,
        j.lastSeenAt,
        j.rawContentHash,
      ],
    );
    return map(r.rows[0]);
  }
  async touch(id: string, lastSeenAt: Date) {
    await pool.query('UPDATE jobs SET last_seen_at=$2 WHERE id=$1', [id, lastSeenAt]);
  }
  async createSnapshot(jobId: string, hash: string, html: string, text: string) {
    await pool.query(
      'INSERT INTO job_snapshots (job_id,content_hash,raw_html,raw_text) VALUES ($1,$2,$3,$4) ON CONFLICT (job_id,content_hash) DO NOTHING',
      [jobId, hash, html, text],
    );
  }
  async list(f: { search?: string; limit: number; offset: number }) {
    const r = await pool.query(
      'SELECT * FROM jobs WHERE ($1::text IS NULL OR title ILIKE $2 OR description ILIKE $2) ORDER BY published_at DESC NULLS LAST,last_seen_at DESC LIMIT $3 OFFSET $4',
      [f.search ?? null, `%${f.search ?? ''}%`, f.limit, f.offset],
    );
    return r.rows.map(map);
  }
  async findById(id: string) {
    const r = await pool.query('SELECT * FROM jobs WHERE id=$1', [id]);
    return r.rows[0] ? map(r.rows[0]) : null;
  }
}
