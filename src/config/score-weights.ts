/**
 * TeamPulse
 * Engineering Score Configuration
 *
 * Defines the weight of every KPI contributing
 * to the overall Engineering Score.
 *
 * Total must always equal 100.
 */

/**
 * IMPORTANT
 *
 * These weights represent business decisions,
 * not engineering decisions.
 *
 * Changes should be approved by Product
 * before implementation.
 */

export const SCORE_WEIGHTS = {
    deliveryHealth: 25,
    productivity: 25,
    quality: 20,
    contribution: 15,
    resourceUtilization: 10,
    deliveryRisk: 5,
  } as const;
  
  /**
   * Returns the total configured weight.
   * Useful for validation and future admin configuration.
   */
  export function getTotalScoreWeight(): number {
    return Object.values(SCORE_WEIGHTS).reduce(
      (sum, weight) => sum + weight,
      0
    );
  }
  
  /**
   * Validates that Engineering Score
   * weights always total 100%.
   */
  export function validateScoreWeights(): boolean {
    return getTotalScoreWeight() === 100;
  }