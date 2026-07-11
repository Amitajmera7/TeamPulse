/**
 * PostgreSQL queryable surface shared by connection, transactions, and repositories.
 *
 * Milestone 13A — no business logic.
 */

import type { QueryResult, QueryResultRow } from "pg";

/**
 * Minimal SQL executor used by warehouse repositories.
 * Satisfied by `Pool` and `PoolClient` from `pg`.
 */
export interface Queryable {
  query<T extends QueryResultRow = QueryResultRow>(
    queryText: string,
    values?: unknown[]
  ): Promise<QueryResult<T>>;
}
