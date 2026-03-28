/*
  # Form Intelligence Dashboard Schema

  1. New Tables
    - `datasets`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text) - Dataset name
      - `source_type` (text) - 'csv' or 'google_sheets'
      - `raw_data` (jsonb) - Original uploaded data
      - `processed_data` (jsonb) - Processed/normalized data
      - `metadata` (jsonb) - Column names, row count, etc.
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `analyses`
      - `id` (uuid, primary key)
      - `dataset_id` (uuid, references datasets)
      - `analysis_type` (text) - Type of analysis performed
      - `results` (jsonb) - Analysis results and insights
      - `visualizations` (jsonb) - Chart configurations
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

CREATE TABLE IF NOT EXISTS datasets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('csv', 'google_sheets')),
  raw_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  processed_data jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id uuid REFERENCES datasets(id) ON DELETE CASCADE NOT NULL,
  analysis_type text NOT NULL,
  results jsonb NOT NULL DEFAULT '{}'::jsonb,
  visualizations jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own datasets"
  ON datasets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own datasets"
  ON datasets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own datasets"
  ON datasets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own datasets"
  ON datasets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view analyses for their datasets"
  ON analyses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM datasets
      WHERE datasets.id = analyses.dataset_id
      AND datasets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert analyses for their datasets"
  ON analyses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM datasets
      WHERE datasets.id = analyses.dataset_id
      AND datasets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update analyses for their datasets"
  ON analyses FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM datasets
      WHERE datasets.id = analyses.dataset_id
      AND datasets.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM datasets
      WHERE datasets.id = analyses.dataset_id
      AND datasets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete analyses for their datasets"
  ON analyses FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM datasets
      WHERE datasets.id = analyses.dataset_id
      AND datasets.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_datasets_user_id ON datasets(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_dataset_id ON analyses(dataset_id);