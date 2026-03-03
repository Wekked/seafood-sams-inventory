-- Add supplier column to items table
ALTER TABLE items ADD COLUMN IF NOT EXISTS supplier TEXT DEFAULT '';

-- Verify
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'items' AND column_name = 'supplier';
