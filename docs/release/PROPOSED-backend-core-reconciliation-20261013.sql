-- PROPOSAL ONLY: rehearsed on a local empty copy of live schema metadata.
-- Requires reviewed backup and explicit live migration/deployment approval.
-- Does not delete users or bookings, enable payments, or update the migration ledger automatically.

-- 020_core_onboarding_lifecycle.sql
ALTER TABLE supplier_onboarding_applications ADD COLUMN idempotency_key_hash TEXT;

-- 020_core_onboarding_lifecycle.sql
ALTER TABLE supplier_onboarding_applications ADD COLUMN payload_digest TEXT;

-- 020_core_onboarding_lifecycle.sql
ALTER TABLE supplier_onboarding_applications ADD COLUMN status_token_hash TEXT;

-- 020_core_onboarding_lifecycle.sql
ALTER TABLE supplier_onboarding_applications ADD COLUMN application_data TEXT;

-- 020_core_onboarding_lifecycle.sql
ALTER TABLE supplier_onboarding_applications ADD COLUMN email_normalized TEXT;

-- 020_core_onboarding_lifecycle.sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_supplier_onboarding_idempotency
  ON supplier_onboarding_applications (idempotency_key_hash)
  WHERE idempotency_key_hash IS NOT NULL;

-- 020_core_onboarding_lifecycle.sql
CREATE INDEX IF NOT EXISTS idx_supplier_onboarding_email_norm
  ON supplier_onboarding_applications (email_normalized);

-- 020_core_onboarding_lifecycle.sql
CREATE INDEX IF NOT EXISTS idx_supplier_onboarding_status_token
  ON supplier_onboarding_applications (status_token_hash)
  WHERE status_token_hash IS NOT NULL;

-- 021_evidence_interest_cohort.sql
CREATE TABLE IF NOT EXISTS supplier_onboarding_evidence (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES supplier_onboarding_applications(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('id_front', 'id_back', 'selfie', 'portfolio')),
  r2_key TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(application_id, kind)
);

-- 021_evidence_interest_cohort.sql
CREATE INDEX IF NOT EXISTS idx_evidence_application
  ON supplier_onboarding_evidence (application_id);

-- 021_evidence_interest_cohort.sql
CREATE TABLE IF NOT EXISTS interest_entries (
  id TEXT PRIMARY KEY,
  email_normalized TEXT NOT NULL,
  name TEXT,
  source TEXT,
  idempotency_key_hash TEXT,
  payload_digest TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 021_evidence_interest_cohort.sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_interest_idempotency
  ON interest_entries (idempotency_key_hash)
  WHERE idempotency_key_hash IS NOT NULL;

-- 021_evidence_interest_cohort.sql
CREATE INDEX IF NOT EXISTS idx_interest_email
  ON interest_entries (email_normalized);

-- 021_evidence_interest_cohort.sql
CREATE TABLE IF NOT EXISTS core_qa_accounts (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'traveler', 'guide')),
  source_application_id TEXT REFERENCES supplier_onboarding_applications(id) ON DELETE CASCADE,
  enrolled_by TEXT REFERENCES users(id) ON DELETE RESTRICT,
  enrolled_at TEXT NOT NULL DEFAULT (datetime('now')),
  revoked_at TEXT,
  CHECK (
    (role = 'guide' AND source_application_id IS NOT NULL AND enrolled_by IS NOT NULL)
    OR (role IN ('admin', 'traveler') AND source_application_id IS NULL AND enrolled_by IS NULL)
  ),
  PRIMARY KEY (user_id, role)
);

-- 021_evidence_interest_cohort.sql
CREATE INDEX IF NOT EXISTS idx_qa_accounts_active
  ON core_qa_accounts (user_id)
  WHERE revoked_at IS NULL;

-- 021_evidence_interest_cohort.sql
CREATE INDEX IF NOT EXISTS idx_qa_source_application
  ON core_qa_accounts (source_application_id)
  WHERE source_application_id IS NOT NULL;

-- 021_evidence_interest_cohort.sql
CREATE INDEX IF NOT EXISTS idx_qa_enrolled_by
  ON core_qa_accounts (enrolled_by)
  WHERE enrolled_by IS NOT NULL;

-- 021_evidence_interest_cohort.sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_qa_unique_application_guide
  ON core_qa_accounts (source_application_id, role)
  WHERE source_application_id IS NOT NULL AND role = 'guide' AND revoked_at IS NULL;

-- 021_evidence_interest_cohort.sql
ALTER TABLE supplier_onboarding_applications ADD COLUMN invitation_delivery_status TEXT DEFAULT 'unknown';

-- 022_core_booking_idempotency.sql
CREATE TABLE IF NOT EXISTS booking_idempotency (
  user_id     TEXT NOT NULL REFERENCES users(id),
  key_hash    TEXT NOT NULL,              
  booking_id  TEXT NOT NULL REFERENCES bookings(id),
  payload     TEXT NOT NULL,              
  payload_digest TEXT NOT NULL,           
  status      TEXT NOT NULL DEFAULT 'committed' CHECK (status IN ('committed', 'pending')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at  TEXT NOT NULL,              
  PRIMARY KEY (user_id, key_hash)
);

-- 022_core_booking_idempotency.sql
CREATE INDEX IF NOT EXISTS idx_booking_idempotency_user
  ON booking_idempotency(user_id, created_at);

-- 022_core_booking_idempotency.sql
CREATE INDEX IF NOT EXISTS idx_booking_idempotency_booking
  ON booking_idempotency(booking_id);

-- 022_core_booking_idempotency.sql
CREATE INDEX IF NOT EXISTS idx_booking_idempotency_expires
  ON booking_idempotency(expires_at);

-- 024_core_api_repairs.sql
ALTER TABLE supplier_profiles ADD COLUMN interests TEXT;

-- 025_core_booking_mobile_fields.sql
ALTER TABLE bookings ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'pending'
  CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded'));

-- 025_core_booking_mobile_fields.sql
ALTER TABLE bookings ADD COLUMN location TEXT;

-- 026_core_notification_prerequisites.sql
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data TEXT,
  read BOOLEAN NOT NULL DEFAULT FALSE CHECK (read IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 026_core_notification_prerequisites.sql
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
