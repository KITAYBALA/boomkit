-- Allow anonymous users to insert questions into the bank
-- This is necessary because guests playing games contribute their AI-fetched sets to the global bank
CREATE POLICY "Allow anonymous inserts" ON public.question_bank
FOR INSERT WITH CHECK (true);

-- Ensure all users can read from the bank
DROP POLICY IF EXISTS "Anyone can read questions" ON public.question_bank;
CREATE POLICY "Anyone can read questions" ON public.question_bank
FOR SELECT USING (true);
