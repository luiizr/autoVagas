CREATE TABLE crawl_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id text REFERENCES job_sources (id),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL,
  jobs_discovered integer NOT NULL DEFAULT 0,
  jobs_processed integer NOT NULL DEFAULT 0,
  jobs_created integer NOT NULL DEFAULT 0,
  jobs_updated integer NOT NULL DEFAULT 0,
  jobs_unchanged integer NOT NULL DEFAULT 0,
  jobs_failed integer NOT NULL DEFAULT 0
);
