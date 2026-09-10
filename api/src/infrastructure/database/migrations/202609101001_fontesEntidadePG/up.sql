CREATE TABLE job_sources (
  id text PRIMARY KEY,
  name text NOT NULL,
  base_url text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO
  job_sources (id, name, base_url)
VALUES
  (
    'jerimum-jobs',
    'Jerimum Jobs',
    'https://jerimumjobs.imd.ufrn.br/'
  );
