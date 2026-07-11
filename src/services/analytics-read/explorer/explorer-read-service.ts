/**
 * Engineering Explorer read service.
 */

import { buildExplorerReadModel } from "./build-explorer-read-model";
import {
  getExplorerDeveloperDetail,
  getExplorerProjectDetail,
  getExplorerTechnologyDetail,
} from "./explorer-detail";
import type { ExplorerReadModel } from "./types";

export async function getExplorerReadModel(): Promise<ExplorerReadModel> {
  return buildExplorerReadModel();
}

export {
  getExplorerDeveloperDetail,
  getExplorerTechnologyDetail,
  getExplorerProjectDetail,
};
