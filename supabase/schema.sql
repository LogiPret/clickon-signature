-- Supabase SQL Schema for Contract Signatures
-- Run this in your Supabase SQL Editor to create the table

-- Create the contract_signatures table
CREATE TABLE IF NOT EXISTS contract_signatures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  street_address TEXT NOT NULL,
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  acceptance_text TEXT NOT NULL,
  accepted_contract BOOLEAN NOT NULL DEFAULT FALSE,
  ip_address TEXT,
  user_agent TEXT,
  signed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_contract_signatures_email ON contract_signatures(email);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_contract_signatures_created_at ON contract_signatures(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE contract_signatures ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous users to insert new signatures
CREATE POLICY "Allow anonymous inserts" ON contract_signatures
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Only authenticated users (admin) can read signatures
CREATE POLICY "Allow authenticated reads" ON contract_signatures
  FOR SELECT
  TO authenticated
  USING (true);

-- Optional: Add a function to validate email format
CREATE OR REPLACE FUNCTION is_valid_email(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql;

-- Optional: Add a check constraint for email validation
ALTER TABLE contract_signatures
  ADD CONSTRAINT valid_email CHECK (is_valid_email(email));

-- Comment on table
COMMENT ON TABLE contract_signatures IS 'Stores electronic contract signatures with legal compliance data';
