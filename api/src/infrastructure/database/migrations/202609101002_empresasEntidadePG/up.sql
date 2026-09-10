CREATE TABLE companies (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  website text,
  created_at timestamptz NOT NULL DEFAULT now()
);
