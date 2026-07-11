# TeamPulse Engineering Metrics Specification

Version: 1.0

Status: Draft

Owner: TeamPulse

Last Updated:

---

# Purpose

This document defines every engineering metric used by TeamPulse.

It is the single source of truth for:

• Dashboard
• AI Insights
• Executive Brief
• Leaderboards
• Engineering Score
• Future integrations

The implementation must always follow this document.

---

# Metric Lifecycle

Jira

↓

Engineering Interpretation Engine

↓

Work Item Evaluation

↓

Developer Metrics

↓

Technology Metrics

↓

Engineering Score

↓

Dashboard

↓

AI Insights

---

# Metric 1

## Execution Efficiency

### Purpose

Measure how closely a developer executes engineering work against planned estimates.

Execution Efficiency measures delivery predictability.

It does not measure quality.

It does not measure contribution.

It does not measure utilization.

---

### Inputs

ResolvedEstimate

ResolvedWorklogs

Technology

Issue Type

---

### Exclusions

Do not calculate when:

• estimate missing

• worklogs missing

These become Engineering Data Quality issues.

---

### Estimate Resolution

Standard Engineering Work

Magento

React

HTML

DT

↓

Original Estimate

CR / RE

↓

Technology Estimate Field

---

### Estimate Allocation

Standard Tasks

Allocated Estimate

=

Original Estimate

×

Developer Worklog Hours

÷

Total Worklog Hours

CR / RE

Allocated Estimate

=

Technology Estimate

×

Developer Technology Worklog Hours

÷

Total Technology Worklog Hours

---

### Variance

Variance %

=

((Actual Hours − Allocated Estimate)

÷

Allocated Estimate)

×

100

---

### Dynamic Tolerance

| Allocated Estimate | Tolerance |
|-------------------|-----------|
| 0–8h | ±5% |
| 8–40h | ±10% |
| 40–100h | ±12% |
| >100h | ±15% |

---

### Scoring

Within tolerance

↓

100

Outside tolerance

↓

Continuous linear reduction

Minimum Score

20

Maximum Score

100

---

### Output

ExecutionEfficiencyResult

Contains

• allocatedEstimate

• actualHours

• variancePercentage

• tolerancePercentage

• efficiencyScore

• rating

---

### Business Principles

Execution Efficiency measures estimate adherence only.

It never includes:

• QA Bugs

• UAT Bugs

• Recovery Effort

• Contribution

Those metrics are calculated independently.

---

# Metric 2

## Delivery Quality

### Purpose

Measure engineering stability.

---

### Inputs

QA Bugs

UAT Bugs

Developer Worklogs

Technology Mapping

---

### Rules

QA Bug penalty begins when QA Bug is created.

Bug closure does not affect Quality.

Recovery effort is measured separately.

---

### Allocation

Quality penalties are allocated proportionally using the original feature worklog distribution.

---

### Reopened Bugs

Count once.

---

### Bugs without Worklogs

Ignored.

---

### Severity

Ignored in Version 1.

---

### Output

QualityResult

Contains

• score

• qaBugCount

• uatBugCount

• recoveryHours

• proportionalPenalty

---

# Metric 3

## Business Contribution

Status: Draft

Purpose

Measure delivered engineering value.

(To be completed in Sprint 3B Milestone 7.)

---

# Metric 4

## Engineering Data Quality

Status: Draft

Purpose

Measure reliability of engineering analytics.

Tracks

• Missing Estimates

• Missing Worklogs

• Missing Technology Mapping

• Missing Configuration

These issues never reduce Engineering Performance.

---

# Aggregation Layer

## Developer Evaluation

Status: Active (Sprint 3B Milestone 8A)

### Purpose

Aggregate all implemented task-evaluation engine results into a single developer-scoped evaluation for a reporting period.

### Contains

• Execution Efficiency (`ExecutionEfficiencyResult`)

• Delivery Quality (`QualityResult`)

• Recovery (`RecoveryResult`)

• Business Contribution (`ContributionResult`)

### Rules

• Engine outputs remain intact — never flatten into primitives.

• Recovery remains visible and does not affect Engineering Score.

• Reporting Period must be included.

• Technology comes from team mapping; missing mapping must not invent a value.

### Output

`DeveloperEvaluation`

---

## Developer Profile

Status: Active (Sprint 3B Milestone 8B)

### Purpose

Canonical developer object used throughout TeamPulse.

### Contains

• `evaluation` — Developer Evaluation

• `engineeringScore` — full-precision score or null (No Data)

• `status` — Healthy | Good | Needs Attention | Critical | No Data

• `rank` — dense rank among peers (null until ranking applied)

### Rules

• Developers with no completed work still appear with status "No Data".

• Engineering Score uses only implemented KPIs with dynamic weight normalization.

• Recovery remains visible and does not affect Engineering Score.

### Output

`DeveloperProfile`

---

## Engineering Score (Developer)

Status: Active (Sprint 3B Milestone 8B)

### Purpose

Primary developer performance score for the reporting period.

Engineering Score measures engineering execution and delivery performance. It does not measure business impact, customer value, or feature priority.

### Implemented KPIs

| KPI | Raw Weight | Source |
|-----|------------|--------|
| Execution | 25 | `efficiencyScore` when resolved |
| Quality | 25 | `qualityScore` when resolved |
| Contribution | 20 | Contribution Score from delivered hours |

### Dynamic Normalization

For available KPIs only:

`normalized(k) = rawWeight(k) / sum(rawWeights of available KPIs)`

Never hardcode normalized percentages. Missing KPIs are ignored (not zero).

### Contribution Score

```
Contribution Score = min(
  DeliveredEngineeringHours / ExpectedEngineeringCapacityHours × 100,
  100
)
```

Expected Engineering Capacity Hours = 160 (configuration).

### Engineering Score Formula

```
Engineering Score = Σ (componentScore × normalizedWeight)
```

Full precision is stored. UI rounding is deferred.

### Status Bands

| Score | Status |
|-------|--------|
| ≥ 90 | Healthy |
| 75 – 89.99 | Good |
| 60 – 74.99 | Needs Attention |
| < 60 | Critical |
| No completed work / no KPIs | No Data |

### Ranking

Dense ranking by Engineering Score (equal scores share rank; next distinct score is consecutive).

### Configuration

`ENGINEERING_SCORE_CONFIG` in `src/services/developer-profile/config.ts`

---

## Technology Profile

Status: Active (Sprint 3C Milestone 9)

### Purpose

Aggregate Developer Profiles into a technology-discipline profile for Magento, React JS, HTML, and DT.

### Contains

• `technology`

• `developerCount` — mapped developers from Team Mapping (source of truth)

• `engineeringHealth` — weighted Engineering Score

• `execution` — weighted Execution Efficiency

• `quality` — weighted Delivery Quality

• `engineeringValueDeliveredHours` — sum of Delivered Engineering Hours

• `recoveryHours` / `recoveryPercentage`

• `status` — Healthy | Stable | Monitor | Critical | No Data

• `rank` — dense rank among technologies

### Weighting

Technology Health, Execution, and Quality use weighted averages.

Weight = Engineering Value Delivered (Delivered Engineering Hours).

Do not use Story Count or Worklog Hours.

Missing developer scores are ignored (never treated as zero).

Developer metrics come from Developer Profiles. Developer count comes from Team Mapping.

### Recovery Percentage

```
Recovery Percentage =
  Technology Recovery Hours / Total Recovery Hours × 100
```

### Status Bands

| Score | Status |
|-------|--------|
| ≥ 90 | Healthy |
| 75 – 89.99 | Stable |
| 60 – 74.99 | Monitor |
| < 60 | Critical |
| null (no engineering value) | No Data |

### Ranking

Dense ranking by Technology Health DESC, then Engineering Value Delivered DESC.

### Output

`TechnologyProfile`

---

# Engineering Principles

## Principle 1

Individual worklogs are the source of truth.

---

## Principle 2

Engineering performance and Engineering Data Quality are independent.

---

## Principle 3

Developers are never penalized for missing planning data.

---

## Principle 4

Every TeamPulse metric must be explainable.

Every score should be reproducible using stored inputs.

---

## Principle 5

Dashboard values are derived.

Raw Jira data is never displayed directly.

---

# Future Enhancements

• Production Bugs

• Bug Severity

• Story Complexity

• Story Risk

• Code Review Metrics

• GitHub Integration

• SonarQube Integration

• AI Prediction Models