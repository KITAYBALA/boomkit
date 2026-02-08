-- Add custom_id column to question_bank table for static question deduplication
ALTER TABLE public.question_bank 
ADD COLUMN IF NOT EXISTS custom_id TEXT;

-- Create a unique index on custom_id to ensure uniqueness and fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_question_bank_custom_id 
ON public.question_bank(custom_id);
