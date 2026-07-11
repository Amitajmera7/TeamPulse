/**
 * Technology Aggregation Engine — public module entry.
 *
 * Sprint 3C Milestone 9 aggregates Developer Profiles into Technology Profiles.
 *
 * Does not modify metric engines, dashboard services, or ExecutiveDashboard.
 */

export {
  buildTechnologyProfile,
  buildTechnologyProfiles,
  calculateRecoveryPercentage,
  collectExecutionEntries,
  collectHealthEntries,
  collectQualityEntries,
  getDeliveredEngineeringHours,
  getMappedDeveloperCount,
  getRecoveryHours,
  groupProfilesByTechnology,
  sumEngineeringValueDelivered,
  sumRecoveryHours,
} from "./build-technology-profile";
export { assignTechnologyDenseRanks } from "./ranking";
export {
  resolveTechnologyStatus,
  TECHNOLOGY_STATUS_THRESHOLDS,
} from "./status";
export { weightedAverage } from "./weighted-average";

export type {
  BuildTechnologyProfilesInput,
  TechnologyName,
  TechnologyProfile,
  TechnologyStatus,
  WeightedValue,
} from "./types";
export { TECHNOLOGY_NAMES } from "./types";
