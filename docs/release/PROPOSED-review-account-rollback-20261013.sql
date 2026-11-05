-- ROLLBACK PROPOSAL ONLY. Requires explicit owner authorization.
-- Restore only the two accounts whose captured pre-change status was active.
-- Do not run automatically or undo unrelated later account-status decisions.
UPDATE users SET status = 'active', updated_at = CURRENT_TIMESTAMP
WHERE status = 'suspended'
  AND ((id = 'f18cd5ee-963f-48f4-8965-9741b6afb516' AND user_type = 'customer')
    OR (id = '34b53bda-1908-49d4-8950-373c39a5eeed' AND user_type = 'supplier'))
  AND LOWER(TRIM(email)) IN ('demo.customer@tirak.com', 'demo.companion@tirak.com',
    'test.customer.tirak@gmail.com', 'test.companion.tirak@gmail.com');
