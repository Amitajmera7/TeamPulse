/**
 * PostgreSQL transaction abstraction for atomic warehouse batch commits.
 *
 * Milestone 13A — infrastructure only.
 *
 * Usage (future Milestone 13B / orchestrator wiring):
 *   await withWarehouseTransaction(async (tx) => {
 *     const batches = new PostgresSyncBatchRepository(tx);
 *     const issues = new PostgresEngineeringIssueRepository(tx);
 *     ...
 *   });
 */

import type { PoolClient } from "pg";

import { getWarehousePool } from "./connection";
import type { Queryable } from "./queryable";

export type WarehouseTransactionClient = PoolClient & Queryable;

/**
 * Runs {@link work} inside a PostgreSQL transaction.
 *
 * Commits on success; rolls back on any thrown error.
 * Does not contain analytics or ingest business logic.
 */
export async function withWarehouseTransaction<T>(
  work: (client: WarehouseTransactionClient) => Promise<T>
): Promise<T> {
  const pool = getWarehousePool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Prefer the original error; rollback failure is secondary.
    }
    throw error;
  } finally {
    client.release();
  }
}
