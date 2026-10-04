CREATE TABLE IF NOT EXISTS codes (
 code TEXT PRIMARY KEY,
 scope TEXT NOT NULL CHECK(scope IN ('single','love','career','personality','all')),
 quiz_id TEXT,
 batch_id TEXT NOT NULL,
 created_at INTEGER NOT NULL,
 used_at INTEGER,
 owner_hash TEXT
);
CREATE INDEX IF NOT EXISTS codes_created ON codes(created_at DESC);
CREATE INDEX IF NOT EXISTS codes_used ON codes(used_at);
CREATE INDEX IF NOT EXISTS codes_owner ON codes(owner_hash,scope,quiz_id);
CREATE INDEX IF NOT EXISTS codes_scope ON codes(scope,used_at);
CREATE TABLE IF NOT EXISTS rate_limits (
 key TEXT PRIMARY KEY,
 attempts INTEGER NOT NULL,
 expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS limits_expiry ON rate_limits(expires_at);
