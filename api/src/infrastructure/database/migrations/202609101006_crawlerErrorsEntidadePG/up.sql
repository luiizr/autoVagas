CREATE TABLE crawler_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crawl_run_id uuid REFERENCES crawl_runs (id) ON DELETE SET NULL,
  source text NOT NULL,
  external_id text,
  url text NOT NULL,
  error text NOT NULL,
  stack text,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
