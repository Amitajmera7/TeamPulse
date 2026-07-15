import type { AnalyticsSnapshot } from "@/services/snapshot";
import { getWarehouseQueryable } from "@/services/engineering-warehouse/persistence/connection";
import type { Queryable } from "@/services/engineering-warehouse/persistence/queryable";

import type { StoredAnalyticsSnapshot } from "./types";

const INSERT_SQL = `
INSERT INTO analytics_snapshot
(
    batch_id,
    generated_at,
    reporting_month,
    version,
    snapshot
)
VALUES ($1,$2,$3,$4,$5)
`;

const SELECT_LATEST_SQL = `
SELECT
    batch_id,
    generated_at,
    reporting_month,
    version,
    snapshot
FROM analytics_snapshot
ORDER BY generated_at DESC
LIMIT 1
`;

export class PostgresAnalyticsSnapshotRepository {
  constructor(
    private readonly db: Queryable = getWarehouseQueryable()
  ) {}

  async save(
    batchId: string,
    snapshot: AnalyticsSnapshot
  ): Promise<void> {
    await this.db.query(INSERT_SQL, [
      batchId,
      snapshot.generatedAt,
      snapshot.reportingPeriod.month,
      snapshot.version,
      snapshot,
    ]);
  }

  async getLatest(): Promise<StoredAnalyticsSnapshot | null> {
    const result =
      await this.db.query<StoredAnalyticsSnapshot>(
        SELECT_LATEST_SQL
      );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }
}