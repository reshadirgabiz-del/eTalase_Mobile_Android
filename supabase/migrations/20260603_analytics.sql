-- Analytics: page views and custom events

CREATE TABLE IF NOT EXISTS analytics_pageviews (
  id             UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id     TEXT         NOT NULL,
  user_id        TEXT,
  path           TEXT         NOT NULL,
  referrer_path  TEXT,
  store_id       UUID,
  duration_ms    INTEGER,
  user_agent     TEXT,
  created_at     TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_pageviews_session   ON analytics_pageviews (session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_pageviews_path      ON analytics_pageviews (path);
CREATE INDEX IF NOT EXISTS idx_analytics_pageviews_user      ON analytics_pageviews (user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_pageviews_created   ON analytics_pageviews (created_at);

CREATE TABLE IF NOT EXISTS analytics_events (
  id           UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id   TEXT         NOT NULL,
  user_id      TEXT,
  event_name   TEXT         NOT NULL,
  properties   JSONB        DEFAULT '{}',
  path         TEXT         NOT NULL,
  store_id     UUID,
  created_at   TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_session    ON analytics_events (session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name       ON analytics_events (event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user       ON analytics_events (user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created    ON analytics_events (created_at);
