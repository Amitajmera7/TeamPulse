/**
 * PostgreSQL connection abstraction for the Engineering Analytics Warehouse.
 *
 * Milestone 13A — infrastructure only. No business logic, no auto-connect on import
 * beyond lazy pool creation when {@link getWarehousePool} is first called.
 *
 * Required env: DATABASE_URL
 * Optional: DATABASE_POOL_MAX, DATABASE_POOL_IDLE_TIMEOUT_MS, DATABASE_CONNECTION_TIMEOUT_MS
 */

import { Pool, type PoolConfig } from "pg";

import type { Queryable } from "./queryable";

let pool: Pool | null = null;

/**
 * Reads pool configuration from environment variables.
 *
 * @throws if `DATABASE_URL` is missing or empty.
 */
export function getWarehousePoolConfig(): PoolConfig {
  const connectionString = process.env.DATABASE_URL?.trim();

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is required for Engineering Analytics Warehouse PostgreSQL persistence."
    );
  }

  const config: PoolConfig = {
    connectionString,
  };

  const max = process.env.DATABASE_POOL_MAX;
  if (max) {
    config.max = Number(max);
  }

  const idle = process.env.DATABASE_POOL_IDLE_TIMEOUT_MS;
  if (idle) {
    config.idleTimeoutMillis = Number(idle);
  }

  const connectionTimeout = process.env.DATABASE_CONNECTION_TIMEOUT_MS;
  if (connectionTimeout) {
    config.connectionTimeoutMillis = Number(connectionTimeout);
  }

  return config;
}

/**
 * Returns the shared warehouse connection pool (lazy singleton).
 *
 * Callers must not run migrations through this helper (Milestone 13A).
 */
export function getWarehousePool(): Pool {
  if (!pool) {
    pool = new Pool(getWarehousePoolConfig());
  }

  return pool;
}

/**
 * Default {@link Queryable} for repositories outside an explicit transaction.
 */
export function getWarehouseQueryable(): Queryable {
  return getWarehousePool();
}

/**
 * Ends the shared pool (tests / graceful shutdown).
 */
export async function closeWarehousePool(): Promise<void> {
  if (!pool) {
    return;
  }

  const current = pool;
  pool = null;
  await current.end();
}

/**
 * Replaces the shared pool (tests). Pass null to clear.
 */
export function setWarehousePoolForTests(next: Pool | null): void {
  pool = next;
}
