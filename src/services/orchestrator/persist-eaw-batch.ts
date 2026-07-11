/**
 * Persists a validated EngineeringWarehouseModel in one atomic PostgreSQL transaction.
 *
 * Sprint 5C — no analytics logic.
 */

import {
  createPostgresWarehouseRepositories,
  withWarehouseTransaction,
  type EngineeringWarehouseModel,
} from "@/services/engineering-warehouse";

export interface PersistEawBatchResult {
  readonly batchId: string;
  readonly issues: number;
  readonly allocations: number;
  readonly worklogs: number;
}

/**
 * Writes SyncBatch + issues + allocations + worklogs inside a single transaction.
 *
 * On any error the transaction rolls back and nothing is committed.
 */
export async function persistEngineeringWarehouseBatch(
  model: EngineeringWarehouseModel
): Promise<PersistEawBatchResult> {
  const { syncBatch, issues, allocations, worklogs } = model;

  console.log(
    `[EAW] Persist EAW starting batchId=${syncBatch.batchId} issues=${issues.length} allocations=${allocations.length} worklogs=${worklogs.length}`
  );

  try {
    await withWarehouseTransaction(async (tx) => {
      const repos = createPostgresWarehouseRepositories(tx);

      await repos.syncBatches.saveBatch(syncBatch);
      await repos.issues.saveBatch(syncBatch.batchId, issues);
      await repos.allocations.saveBatch(syncBatch.batchId, allocations);
      await repos.worklogs.saveBatch(syncBatch.batchId, worklogs);
    });

    console.log(
      `[EAW] Commit Success batchId=${syncBatch.batchId}`
    );

    return {
      batchId: syncBatch.batchId,
      issues: issues.length,
      allocations: allocations.length,
      worklogs: worklogs.length,
    };
  } catch (error) {
    console.log(
      `[EAW] Rollback batchId=${syncBatch.batchId} reason=${
        error instanceof Error ? error.message : String(error)
      }`
    );
    throw error;
  }
}
