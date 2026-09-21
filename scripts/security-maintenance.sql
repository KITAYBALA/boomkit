-- Run as a trusted database operator. Keep settlement receipts: deleting them permits replay.
-- Only expired rate-limit buckets are disposable.
BEGIN;
DELETE FROM public.action_limits WHERE resets_at<now()-interval '7 days';
DELETE FROM public.rate_limits WHERE reset_time<now()-interval '7 days';
COMMIT;
