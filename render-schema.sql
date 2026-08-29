CREATE TABLE IF NOT EXISTS challenges (
  id SERIAL PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reporter_key TEXT NOT NULL,
  support_count INTEGER NOT NULL DEFAULT 0,
  teams INTEGER NOT NULL DEFAULT 0,
  urgency TEXT NOT NULL DEFAULT 'Open for ideas',
  latitude TEXT,
  longitude TEXT,
  photo_data TEXT,
  photo_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS challenges_status_created_idx ON challenges (status, created_at);
CREATE INDEX IF NOT EXISTS challenges_reporter_created_idx ON challenges (reporter_key, created_at);

CREATE TABLE IF NOT EXISTS support_votes (
  id SERIAL PRIMARY KEY,
  challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  voter_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS support_votes_challenge_voter_idx ON support_votes (challenge_id, voter_key);

CREATE TABLE IF NOT EXISTS solution_proposals (
  id SERIAL PRIMARY KEY,
  challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  institution TEXT NOT NULL,
  summary TEXT NOT NULL,
  approach TEXT NOT NULL,
  member_count INTEGER NOT NULL DEFAULT 1,
  submitter_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS solutions_challenge_status_idx ON solution_proposals (challenge_id, status);

CREATE TABLE IF NOT EXISTS industry_offers (
  id SERIAL PRIMARY KEY,
  challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  organization TEXT NOT NULL,
  support_type TEXT NOT NULL,
  message TEXT NOT NULL,
  submitter_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS offers_challenge_status_idx ON industry_offers (challenge_id, status);

CREATE TABLE IF NOT EXISTS challenge_updates (
  id SERIAL PRIMARY KEY,
  challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'Update',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS updates_challenge_created_idx ON challenge_updates (challenge_id, created_at);
