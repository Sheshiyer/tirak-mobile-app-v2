-- PROPOSAL ONLY. Owner approval + fresh verified backup required.
-- Expected changes: exactly 2. Preserve all booking and other-user history.
UPDATE users
SET status = 'suspended', updated_at = CURRENT_TIMESTAMP
WHERE status = 'active'
  AND (
    (id = 'f18cd5ee-963f-48f4-8965-9741b6afb516' AND user_type = 'customer')
    OR (id = '34b53bda-1908-49d4-8950-373c39a5eeed' AND user_type = 'supplier')
  )
  AND LOWER(TRIM(email)) IN (
    'demo.customer@tirak.com', 'demo.companion@tirak.com',
    'test.customer.tirak@gmail.com', 'test.companion.tirak@gmail.com'
  );
