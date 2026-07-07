/**
 * TeamPulse
 * Technology Master
 *
 * This file defines all supported engineering technologies.
 * Every developer, estimate field and dashboard calculation
 * references this file.
 */

export const TECHNOLOGIES = [
    "Magento",
    "React JS",
    "HTML",
    "DT",
  ] as const;
  
  export type Technology = (typeof TECHNOLOGIES)[number];