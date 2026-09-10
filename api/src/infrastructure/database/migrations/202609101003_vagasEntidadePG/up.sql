CREATE TABLE jobs (
  id uuid PRIMARY KEY,
  source_id text NOT NULL REFERENCES job_sources (id),
  external_id text NOT NULL,
  source_url text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  company_name text,
  location text,
  work_model text,
  employment_type text,
  seniority text,
  salary_min numeric,
  salary_max numeric,
  weekly_hours integer,
  requirements text[] NOT NULL DEFAULT '{}',
  responsibilities text[] NOT NULL DEFAULT '{}',
  benefits text[] NOT NULL DEFAULT '{}',
  skills text[] NOT NULL DEFAULT '{}',
  published_at timestamptz,
  expires_at timestamptz,
  first_seen_at timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL,
  raw_content_hash char(64) NOT NULL,
  UNIQUE (source_id, external_id)
);

CREATE INDEX jobs_search_idx ON jobs USING gin (
  to_tsvector('portuguese', title || ' ' || description)
);
