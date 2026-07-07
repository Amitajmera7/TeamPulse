import type { Technology } from "./technologies";

/**
 * TeamPulse
 * Developer Master
 *
 * Single source of truth for developer metadata.
 * Used by:
 *
 * - Estimate Resolution Engine
 * - Technology Health
 * - Dashboard
 * - Leaderboard
 * - Future Team Analytics
 */

export interface DeveloperConfig {
  name: string;
  technology: Technology;

  /**
   * Reserved for future versions
   */
  team?: string;
  lead?: string;

  active: boolean;
}

export const DEVELOPERS: DeveloperConfig[] = [
  // =========================
  // Magento Team
  // =========================

  {
    name: "Sagar Nakrani",
    technology: "Magento",
    active: true,
  },
  {
    name: "Hiren Kadivar",
    technology: "Magento",
    active: true,
  },
  {
    name: "Gaurav Prajapati",
    technology: "Magento",
    active: true,
  },
  {
    name: "Pratik Khamar",
    technology: "Magento",
    active: true,
  },
  {
    name: "Nainshi Shah",
    technology: "Magento",
    active: true,
  },
  {
    name: "Ravi Soni",
    technology: "Magento",
    active: true,
  },
  {
    name: "Bhavin Kapadia",
    technology: "Magento",
    active: true,
  },
  {
    name: "naman.mehta",
    technology: "Magento",
    active: true,
  },

  // =========================
  // React Team
  // =========================

  {
    name: "Akanksha Singhal",
    technology: "React JS",
    active: true,
  },
  {
    name: "Raj Chavda",
    technology: "React JS",
    active: true,
  },
  {
    name: "Dhruv Kanani",
    technology: "React JS",
    active: true,
  },
  {
    name: "Priyanka Parekh",
    technology: "React JS",
    active: true,
  },
  {
    name: "Dhammapal Bhausaheb Suradkar",
    technology: "React JS",
    active: true,
  },

  // =========================
  // HTML Team
  // =========================

  {
    name: "Milan Nayak",
    technology: "HTML",
    active: true,
  },
  {
    name: "Akshat S. Shah",
    technology: "HTML",
    active: true,
  },
  {
    name: "Punit",
    technology: "HTML",
    active: true,
  },

  // =========================
  // DT Team
  // =========================

  {
    name: "Suraj Parmar",
    technology: "DT",
    active: true,
  },
  {
    name: "Ronak Vaghasiya",
    technology: "DT",
    active: true,
  },
];