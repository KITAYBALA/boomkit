-- Read-only diagnostic for migration 025. No passwords or email addresses are returned.
-- Resolve ownership of each collision before renaming or deleting any account.
WITH identities AS (
  SELECT id, username,
    CASE WHEN username IS NOT NULL
      THEN count(*) OVER (PARTITION BY lower(username)) ELSE 0 END AS username_matches,
    CASE WHEN email IS NOT NULL AND email <> ''
      THEN count(*) OVER (PARTITION BY lower(email)) ELSE 0 END AS email_matches
  FROM public.users
)
SELECT id, username, username_matches, email_matches
FROM identities
WHERE username_matches > 1 OR email_matches > 1
ORDER BY lower(username), id;
