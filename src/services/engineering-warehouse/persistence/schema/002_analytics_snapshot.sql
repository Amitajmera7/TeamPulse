-- Analytics Snapshot Archive
-- Stores immutable completed Analytics Snapshots.
-- Used by Dashboard, Explorer and Historical Analytics.

CREATE TABLE IF NOT EXISTS analytics_snapshot (
    snapshot_id UUID PRIMARY KEY,

    generated_at TIMESTAMPTZ NOT NULL,

    reporting_month TEXT NOT NULL,

    version TEXT NOT NULL,

    snapshot JSONB NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_snapshot_generated_at
ON analytics_snapshot (generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_snapshot_reporting_month
ON analytics_snapshot (reporting_month);