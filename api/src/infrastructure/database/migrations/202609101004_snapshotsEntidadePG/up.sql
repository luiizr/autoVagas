CREATE TABLE job_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs (id) ON DELETE CASCADE,
  content_hash char(64) NOT NULL,
  raw_html text NOT NULL,
  raw_text text NOT NULL,
  collected_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, content_hash)
);
